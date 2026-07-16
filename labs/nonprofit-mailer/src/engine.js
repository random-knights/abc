/**
 * Marketing/retention engine: retrieved datalake context in, marketing
 * decision out.
 *
 * Given one constituent, the engine assembles the RAG context (their own
 * profile/activity/text documents plus comparable documents from similar
 * constituents) and asks the LLM for a structured decision: segment,
 * lapse/churn risk, recommended approach + channel + timing, and the
 * reasoning - each grounded in the retrieved evidence.
 */

import Anthropic from '@anthropic-ai/sdk';
import { parseModelJson } from './ai.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function buildRetrievedContext(index, customerId) {
  const own = index.ownDocuments(customerId);
  const similar = index.similarDocuments(customerId, 6);
  return {
    own,
    similar,
    asPromptBlock:
      'CONSTITUENT RECORDS (retrieved from the datalake):\n' +
      own.map((d) => `- [${d.type}] ${d.text}`).join('\n') +
      '\n\nCOMPARABLE CONSTITUENTS (most similar records elsewhere in the lake):\n' +
      similar.map((d) => `- [sim ${d.similarity}] [${d.type}] ${d.text}`).join('\n'),
  };
}

/**
 * The "determine the best marketing approach" core. Returns the structured
 * decision plus the exact retrieved context used (surfaced in the UI so the
 * grounding is inspectable, not vibes).
 */
export async function analyzeCustomer(index, customerId) {
  const context = buildRetrievedContext(index, customerId);

  const prompt = `You are a nonprofit marketing strategist deciding how to retain one constituent.

${context.asPromptBlock}

Based ONLY on the retrieved records above, decide the best marketing approach for THIS constituent, optimizing for retention (keep them giving / renewing), not short-term extraction.

Respond ONLY with JSON, no markdown:
{
  "segment": "short segment name, e.g. Lapsed major donor",
  "segment_evidence": ["record-grounded reason 1", "reason 2"],
  "lapse_risk": "high | medium | low",
  "risk_factors": ["specific signal from the records"],
  "recommended_approach": "2-3 sentences: the marketing play for this person",
  "channel": "email | phone call | direct mail | in-person invite",
  "timing": "when and why, e.g. within 2 weeks, before renewal date",
  "email_angle": "one sentence: the angle a retention email should take",
  "do_not": ["thing to avoid with this person, from the records"],
  "reasoning": "3-4 sentences tying the decision to the retrieved evidence"
}`;

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  const decision = parseModelJson(res, 'retention analysis');
  return { decision, retrieved: { own: context.own, similar: context.similar } };
}

/**
 * Turns an engine decision into the campaign brief the existing 5-step
 * email pipeline consumes - the seam that makes the pipeline generate
 * retention follow-ups personalized to the retrieved context instead of
 * generic blasts.
 */
export function campaignBriefFrom(decision, profile, orgDefaults) {
  return {
    orgName: orgDefaults.orgName,
    mission: orgDefaults.mission,
    audience: `${decision.segment} (constituent: ${profile.display_name}, tier ${profile.membership_tier})`,
    goal: `Retention: ${decision.recommended_approach}`,
    tone: orgDefaults.tone,
    keyMessage: decision.email_angle,
    cta: orgDefaults.cta,
    audienceSize: 'segment of one (personalized retention follow-up)',
    retentionContext: {
      segment: decision.segment,
      lapse_risk: decision.lapse_risk,
      risk_factors: decision.risk_factors,
      do_not: decision.do_not,
      timing: decision.timing,
    },
  };
}
