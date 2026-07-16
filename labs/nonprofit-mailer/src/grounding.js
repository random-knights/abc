/**
 * THE GROUNDING GATE - blueprint principle 1: no hallucinatory drift.
 *
 * Every claim in a draft must trace to one of exactly three sources:
 *   1. the sender's fact base       (src/sender.js - each fact carries a source)
 *   2. the recipient's PUBLIC profile (src/orgs.js - public IRS/Census fields)
 *   3. common knowledge that asserts nothing about either party
 *
 * Anything else is drift, and drift fails. Trust is the metric: an email that
 * invents a program, an outcome, a number, or a relationship is worse than no
 * email, because it burns the recipient's trust in the sender permanently.
 *
 * DEFENSE IN DEPTH - two independent layers, either can fail a draft:
 *
 *   Layer 1 (deterministic, src/grounding.js redLineCheck):
 *     Regex red lines for the claims that must NEVER ship - "you donated",
 *     "your support", "thanks for joining". Cheap, and does not depend on model
 *     judgment. A model judge that has an off day cannot wave these through.
 *
 *   Layer 2 (model judge, Opus 4.8 + adaptive thinking):
 *     Claim-by-claim tracing for everything the regexes cannot catch - invented
 *     programs, invented outcomes, plausible-sounding numbers, implied history.
 *
 * Layer 1 exists precisely because Layer 2 is itself an LLM. Using an LLM to
 * check an LLM is useful but not sufficient, so the hardest rules are also
 * enforced by code that cannot be persuaded.
 */

import Anthropic from '@anthropic-ai/sdk';
import { SENDER, senderPromptBlock } from './sender.js';
import { orgPromptBlock, orgFacts } from './orgs.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** The judge. Opus 4.8: the trust-critical step gets the strongest model. */
export const JUDGE_MODEL = 'claude-opus-4-8';

/**
 * LAYER 1: deterministic red lines.
 *
 * These patterns assert a relationship that does not exist. Because the statuses
 * are synthetic, ANY of these is a fabrication no matter which status is active.
 * Tuned to fire on assertions about the RECIPIENT ("your continued support"),
 * not on hypotheticals ("if you were to support this").
 */
const RED_LINES = [
  {
    id: 'past-gift',
    re: /\b(your|their)\s+(generous\s+|continued\s+|past\s+|previous\s+|recent\s+)?(donation|gift|contribution|pledge|grant)\b/i,
    why: 'Asserts the recipient has given. They have not - the status is synthetic.',
  },
  {
    id: 'thanks-for-past',
    re: /\bthank(s| you)?\s+(you\s+)?(so much\s+|again\s+)?for\s+(your|the|all)\b[^.!?]{0,60}\b(support|donation|gift|contribution|membership|partnership|adoption|joining|being)\b/i,
    why: 'Thanks the recipient for a past action that never happened.',
  },
  {
    id: 'membership',
    re: /\b(your|their)\s+(membership|subscription|partnership|sponsorship)\b/i,
    why: 'Asserts an existing membership/partnership. None exists.',
  },
  {
    id: 'endorsement',
    re: /\byou(r organization|'ve| have)?\s+(endorsed|championed|advocated for|vouched for)\b/i,
    why: 'Asserts the recipient endorsed the sender. They have not.',
  },
  {
    id: 'prior-contact',
    re: /\b(we|I)\s+(last\s+)?(spoke|talked|met|corresponded|connected|reached out)\s+(with\s+you\s+)?(last|back in|earlier|previously|in \d{4})\b/i,
    why: 'Asserts prior contact. Random Knights has never contacted this org.',
  },
  {
    id: 'since-you-joined',
    re: /\bsince\s+you\s+(joined|signed up|became|started|adopted|subscribed)\b/i,
    why: 'Asserts the recipient joined/adopted. They have not.',
  },
  {
    id: 'renewal-of-real-thing',
    re: /\b(renew|reactivate|restore)\s+(your|their)\s+(membership|subscription|support|commitment|pledge)\b/i,
    why: 'Asserts something to renew. Nothing exists to renew.',
  },
  {
    id: 'certification',
    re: /\b(we|random knights)\s+(certif|accredit|verif|audit)\w*\b/i,
    why: 'Random Knights does not certify, accredit, verify, or audit anyone. AIEDS is self-attested.',
  },
];

export function redLineCheck(text) {
  const hits = [];
  for (const rl of RED_LINES) {
    const m = rl.re.exec(text || '');
    if (m) hits.push({ rule: rl.id, quote: m[0].trim(), why: rl.why });
  }
  return hits;
}

/** The judge's response shape, enforced by the API rather than hoped for. */
const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    grounded: {
      type: 'boolean',
      description: 'True only if EVERY claim traces to the sender facts, the org public profile, or asserts-nothing common knowledge.',
    },
    violations: {
      type: 'array',
      description: 'One entry per ungrounded claim. Empty when grounded.',
      items: {
        type: 'object',
        properties: {
          quote: { type: 'string', description: 'The exact text from the draft that is ungrounded.' },
          category: {
            type: 'string',
            enum: [
              'fabricated_relationship',
              'fabricated_program',
              'fabricated_outcome',
              'fabricated_number',
              'unsupported_sender_claim',
              'unsupported_org_claim',
              'overclaimed_certainty',
            ],
          },
          why: { type: 'string', description: 'Why this does not trace to an allowed source.' },
        },
        required: ['quote', 'category', 'why'],
        additionalProperties: false,
      },
    },
    trust_risk: {
      type: 'string',
      enum: ['none', 'low', 'medium', 'high'],
      description: 'Damage to sender trust if this shipped as-is.',
    },
    reasoning: { type: 'string', description: '2-3 sentences on the overall call.' },
  },
  required: ['grounded', 'violations', 'trust_risk', 'reasoning'],
  additionalProperties: false,
};

/**
 * LAYER 2: the model judge. Prompted to be a hostile fact-checker, not a
 * helpful editor - its job is to find drift, not to like the email.
 */
export async function judgeGrounding(draftText, org, status) {
  const prompt = `You are a hostile fact-checker auditing a nonprofit outreach email before it is ever sent.

Your ONLY job is to find claims that are not supported by the source material below.
You are not judging whether the email is good, persuasive, or well written. Only whether
every single claim in it is TRUE and TRACEABLE.

${senderPromptBlock()}

${orgPromptBlock(org)}

SYNTHETIC STATUS IN PLAY: ${status.label}
This status is randomly assigned demo data. Random Knights has NO relationship with this
organization: no prior contact, no donation, no membership, no adoption, no endorsement,
no partnership. Any sentence implying otherwise is a FABRICATED RELATIONSHIP and the draft
fails. This is the single most important thing you check.

DRAFT TO AUDIT:
"""
${draftText}
"""

A claim is GROUNDED only if it traces to one of:
  1. a sender fact listed above
  2. a field of the recipient's public profile above
  3. common knowledge that asserts nothing about either party
     (e.g. "climate data is hard to compare" is fine; "your climate program" is not)

Fail the draft for ANY of:
  - fabricated_relationship: implies contact, giving, membership, adoption, endorsement,
    partnership, or history that did not happen. Includes thanking them for anything.
  - fabricated_program: names or alludes to a specific program, project, or initiative of
    the recipient. The NTEE code gives a broad CATEGORY only, never a program.
  - fabricated_outcome: invents a result, impact, or achievement of either party.
  - fabricated_number: any statistic, count, percentage, deadline, or dollar figure not
    present in the source material above. The org's revenue figure IS allowed.
  - unsupported_sender_claim: says something about Random Knights or AIEDS not in the facts.
  - unsupported_org_claim: says something about the recipient beyond their public fields.
  - overclaimed_certainty: presents an estimate as certified/authoritative/exact, or implies
    Random Knights certifies or audits anyone.

Be strict. Flattery about the recipient's work is an unsupported_org_claim if it asserts
anything specific - you do not know that their work is "vital" or "leading" or "impactful".
Generic category-level framing tied to their NTEE group is acceptable.

Set grounded=true ONLY if violations is empty.`;

  const res = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: { type: 'json_schema', schema: VERDICT_SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });

  if (res.stop_reason === 'refusal') {
    throw new Error('Grounding judge declined to evaluate this draft.');
  }
  const block = res.content.find((b) => b.type === 'text');
  if (!block) throw new Error('Grounding judge returned no verdict.');
  return JSON.parse(block.text);
}

/**
 * THE GATE. Runs both layers and combines them.
 * A draft passes only if BOTH layers pass. Either can veto.
 */
export async function groundingGate(draftText, org, status) {
  const redLines = redLineCheck(draftText);
  const verdict = await judgeGrounding(draftText, org, status);

  // Red-line hits are promoted into the violation list so the UI shows one
  // unified list, tagged by which layer caught them.
  const violations = [
    ...redLines.map((h) => ({
      quote: h.quote,
      category: 'fabricated_relationship',
      why: h.why,
      caught_by: `red-line:${h.rule}`,
    })),
    ...verdict.violations.map((v) => ({ ...v, caught_by: 'model-judge' })),
  ];

  const passed = redLines.length === 0 && verdict.grounded;

  return {
    passed,
    violations,
    trust_risk: redLines.length ? 'high' : verdict.trust_risk,
    reasoning: verdict.reasoning,
    layers: {
      red_line: { passed: redLines.length === 0, hits: redLines.length },
      model_judge: { passed: verdict.grounded, hits: verdict.violations.length },
    },
    checked_against: {
      sender_facts: SENDER.facts.map((f) => f.id),
      org_facts: orgFacts(org),
      status: { label: status.label, synthetic: true },
    },
  };
}
