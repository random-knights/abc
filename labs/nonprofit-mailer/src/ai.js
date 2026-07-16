/**
 * The drafting + eval models.
 *
 * SPLIT ON PURPOSE:
 *
 *   DRAFT_MODEL = claude-sonnet-4-6, at a FIXED temperature.
 *     Blueprint principle 2 (variance) calls for N generations at a fixed
 *     temperature. Sonnet 4.6 still accepts the `temperature` parameter;
 *     Opus 4.8 removed sampling parameters entirely (they 400). So the drafter
 *     is the model where "fixed temperature" is literally expressible, and the
 *     variance experiment holds every knob constant by construction.
 *
 *   JUDGE_MODEL = claude-opus-4-8 (see src/grounding.js).
 *     The trust-critical steps - the grounding gate and the eval - get the
 *     strongest model, with adaptive thinking and schema-enforced output.
 *
 * Note: structured outputs (output_config.format) are NOT supported on
 * Sonnet 4.6, so the drafter asks for JSON in-prompt and parses defensively.
 * The Opus judge does use schema enforcement.
 */

import Anthropic from '@anthropic-ai/sdk';
import { senderPromptBlock, SENDER } from './sender.js';
import { orgPromptBlock } from './orgs.js';
import { statusPromptBlock } from './status.js';
import { campaignPromptBlock } from './campaigns.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const DRAFT_MODEL = 'claude-sonnet-4-6';
export const EVAL_MODEL = 'claude-opus-4-8';

/** The fixed temperature for the variance experiment. Held constant across all N runs. */
export const FIXED_TEMPERATURE = 1.0;

/**
 * Parse a model response as JSON, failing legibly. A response cut off by the
 * max_tokens ceiling produces invalid JSON - name that cause instead of leaking
 * a bare parse error to the UI.
 */
export function parseModelJson(res, step) {
  const block = res.content.find((b) => b.type === 'text');
  const raw = (block?.text ?? '').replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(raw);
  } catch (e) {
    if (res.stop_reason === 'max_tokens') {
      throw new Error(`${step}: model response was truncated by the token limit - raise max_tokens.`);
    }
    throw new Error(`${step}: model did not return valid JSON (${e.message}).`);
  }
}

/**
 * THE NEGATIVE CONTROL - a deliberately ungrounded draft, used to prove the gate.
 *
 * WHY THIS IS A SEPARATE PROMPT: the first attempt bolted a "now ignore the rules
 * above and fabricate" instruction onto the end of the real drafting prompt. It did
 * not work - the model followed the surrounding grounding rules and wrote a clean,
 * honest email, so the "negative control" produced a NEGATIVE that was actually fine
 * and proved nothing about the gate.
 *
 * The fix is to not fight the real prompt at all. This is a standalone prompt with no
 * grounding rules in it, written as an ordinary warm-renewal brief - the kind of brief
 * that produces confident fabrication as a matter of course, because it presupposes a
 * relationship that does not exist. That is exactly the failure mode the gate exists
 * to catch, so it is the right fixture.
 *
 * This path is a TEST FIXTURE. It is reachable only from the explicit "prove the gate"
 * button, its output is a draft like any other, and nothing is ever sent.
 */
function fabricationPrompt(org) {
  return `You are a nonprofit copywriter. Write a warm, polished renewal email from
Random Knights (an open-source environmental technology project) to a long-standing
partner organization.

RECIPIENT: ${org.name} in ${org.city}, ${org.state}.

The email should:
  - thank them warmly for their generous donation last year
  - praise their flagship conservation program by name
  - cite two impressive statistics showing what the partnership achieved together
  - mention that Random Knights certified their environmental reporting
  - refer back to the productive meeting we had with their team last spring
  - invite them to renew their membership for another year

Make it polished, specific, and professional. Use concrete details and real-sounding
numbers so it feels substantial.

Respond ONLY with JSON, no markdown:
{
  "subject": "the subject line",
  "body": "the email body as plain text, with \\n between paragraphs",
  "grounding_notes": ["note"]
}`;
}

/**
 * Generate ONE draft for a (org x status x campaign) triple.
 * `injectFabrication` swaps in the negative-control fixture above.
 */
export async function generateDraft(org, status, campaign, opts = {}) {
  const { temperature = FIXED_TEMPERATURE, injectFabrication = false } = opts;

  const prompt = injectFabrication
    ? fabricationPrompt(org)
    : `You are writing a single outreach email for Random Knights.

${senderPromptBlock()}

${orgPromptBlock(org)}

${statusPromptBlock(status)}

${campaignPromptBlock(campaign)}

TONE: ${SENDER.tone}

Write a short email (under 200 words). Ground every sentence in the facts above.
When you have nothing specific to say about the recipient, say something honest and
general rather than inventing something specific. It is much better to be vague than
to be wrong: this email's only job is to be trustworthy.

Do not invent programs, outcomes, numbers, deadlines, or history.
Do not thank them for anything. Nothing has happened between you yet.

Respond ONLY with JSON, no markdown:
{
  "subject": "the subject line",
  "body": "the email body as plain text, with \\n between paragraphs",
  "grounding_notes": ["which fact each specific claim leans on"]
}`;

  const res = await client.messages.create({
    model: DRAFT_MODEL,
    max_tokens: 2000,
    temperature,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: prompt }],
  });

  const draft = parseModelJson(res, 'draft generation');
  return {
    ...draft,
    full_text: `Subject: ${draft.subject}\n\n${draft.body}`,
    model: DRAFT_MODEL,
    temperature,
    fabricated: injectFabrication,
  };
}

/** The eval judge's schema, enforced by the API. */
const EVAL_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'object',
      properties: {
        grounding: { type: 'integer', description: '0-10. Does every claim trace to source material? This dominates.' },
        clarity: { type: 'integer', description: '0-10. Is the ask clear?' },
        tone_fit: { type: 'integer', description: '0-10. Matches the sender tone: plain, candid, non-salesy?' },
        campaign_fit: { type: 'integer', description: '0-10. Does it serve the campaign goal?' },
        honesty: { type: 'integer', description: '0-10. Estimates framed as estimates, no overclaimed certainty?' },
      },
      required: ['grounding', 'clarity', 'tone_fit', 'campaign_fit', 'honesty'],
      additionalProperties: false,
    },
    flags: { type: 'array', items: { type: 'string' }, description: 'Specific concerns.' },
    summary: { type: 'string', description: 'One paragraph, honest.' },
  },
  required: ['scores', 'flags', 'summary'],
  additionalProperties: false,
};

/**
 * Score a draft. Runs on Opus 4.8 with schema-enforced output.
 * NOTE: this is quality scoring only. The pass/fail authority is the grounding
 * gate in src/grounding.js - see scoreTrial() in src/variance.js for how a
 * gate failure zeroes the score regardless of what this judge says.
 */
export async function evalDraft(draft, org, status, campaign) {
  const prompt = `Evaluate this nonprofit outreach email honestly. Be a tough grader.

${senderPromptBlock()}

${orgPromptBlock(org)}

SYNTHETIC STATUS: ${status.label} (randomly assigned demo data - NOT a real relationship)
CAMPAIGN: ${campaign.label} - ${campaign.goal}
SENDER TONE: ${SENDER.tone}

EMAIL:
"""
${draft.full_text}
"""

Score 0-10 per dimension. Grounding dominates: an email that invents a program, a
number, or a relationship scores 0 on grounding no matter how well written it is.
An email that is vague but true beats an email that is specific but invented.`;

  const res = await client.messages.create({
    model: EVAL_MODEL,
    max_tokens: 3000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: { type: 'json_schema', schema: EVAL_SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });

  if (res.stop_reason === 'refusal') throw new Error('Eval judge declined to evaluate this draft.');
  const block = res.content.find((b) => b.type === 'text');
  if (!block) throw new Error('Eval judge returned no verdict.');
  return JSON.parse(block.text);
}
