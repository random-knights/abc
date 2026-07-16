/**
 * THE SENDER: Random Knights. Fixed, real, and the only voice this tool writes in.
 *
 * Everything here is the GROUND TRUTH a draft is allowed to lean on. If a claim
 * about Random Knights is not traceable to a fact in this file, the grounding
 * gate (src/grounding.js) is supposed to fail the draft. That is the whole point
 * of the demo, so this file is deliberately conservative:
 *
 *   - Every fact carries a `source` pointing at the RK repo file it came from.
 *   - Nothing here is invented copy. Where wording was synthesized from several
 *     sourced lines, it is marked `synthesized: true` and was owner-approved.
 *
 * Adding a fact here widens what a draft may claim. Do not add one without a
 * real source.
 */

/** AIEDS expansion. RK's own repos disagree; see NAME_CONFLICT below. */
export const AIEDS_NAME = 'AI Energy Disclosure Standard';

/**
 * Known-unresolved naming conflict in RK's own material, recorded so nobody
 * "fixes" this file back to the stale expansion. The live spec repo (v2.0.0)
 * says Energy; the older public READMORE docs (all v1-era, and v1.x is marked
 * SUPERSEDED) say Environmental. Energy is authoritative here.
 */
export const NAME_CONFLICT = {
  chosen: 'AI Energy Disclosure Standard',
  chosen_source: 'aieds/README.md (v2.0.0)',
  stale_variant: 'AI Environmental Disclosure Standard',
  stale_source: '.github/READMORE/architecture/aieds/aieds-foundation.md (v1-era)',
};

/** The canonical mission line. Synthesized from the sourced facts below; owner-approved. */
export const MISSION =
  'Random Knights builds open-source tools that demonstrate the direct impact of technology ' +
  'and make its tradeoffs visible rather than hidden. Our AIEDS work (the AI Energy Disclosure ' +
  'Standard) is an open schema and toolset for self-attested energy and carbon footprint ' +
  'disclosures for AI models, agents, and apps. Our Earth work renders public environmental ' +
  'signals as an open, keyless, identity-free globe. We publish estimates with confidence ' +
  'labels, not certified assessments.';

/**
 * The groundable fact base. A draft may state these and nothing else about RK.
 * `text` is what the model is allowed to say; `source` is where it came from.
 */
export const RK_FACTS = [
  {
    id: 'mission',
    text: MISSION,
    source: 'synthesized from profile/README.md:162,:166 + aieds/README.md:9 + xyz-earth/README.md:24,:102',
    synthesized: true,
  },
  {
    id: 'aieds-what',
    text:
      'AIEDS (the AI Energy Disclosure Standard) is an open schema and toolset for self-attested ' +
      'energy and carbon footprint disclosures for AI models, agents, and apps.',
    source: 'aieds/README.md:9',
  },
  {
    id: 'aieds-scope',
    text:
      'AIEDS scope is device, usage, inference, and training. It is not a planetary Earth Health Score.',
    source: 'aieds/README.md:18-19',
  },
  {
    id: 'aieds-self-attested',
    text:
      'AIEDS disclosures are self-attested. Publishing one is a claim the publisher makes, not a ' +
      'certification Random Knights issues.',
    source: 'aieds/README.md:9 ("self-attested")',
  },
  {
    id: 'posture',
    text:
      'Random Knights is an experiment in building technology that serves people first: users should ' +
      'own their experience, control their data, and understand what their software is doing.',
    source: 'profile/README.md:158',
  },
  {
    id: 'objective',
    text:
      'The objective of our work is to demonstrate the direct impact of technology, both in its ' +
      'ability to help create and destroy.',
    source: 'profile/README.md:162',
  },
  {
    id: 'open-source',
    text: 'Random Knights work is open-source and free to use.',
    source: 'profile/README.md:164',
  },
  {
    id: 'earth-what',
    text:
      'The Random Knights Earth work is a keyless, open-source, clone-and-run app that renders public ' +
      'environmental signals as an animated globe with a Planet Health Score.',
    source: 'xyz-earth/README.md:24,:26-30',
  },
  {
    id: 'earth-humility',
    text:
      'The Planet Health Score is an estimate, not a certified assessment, and every signal carries a ' +
      'confidence label.',
    source: 'xyz-earth/README.md:102-103',
  },
  {
    id: 'earth-privacy',
    text:
      'Earth data is aggregated and identity-free by design: no callsigns, vessel names, tail numbers, ' +
      'registrations, or personal identifiers, ever.',
    source: 'xyz-earth/README.md:146-150',
  },
];

/** Claims RK explicitly must NOT make. The gate treats these as hard failures. */
export const RK_MUST_NOT_CLAIM = [
  'that Random Knights certifies, audits, verifies, or accredits any organization',
  'that AIEDS is a regulatory requirement, a legal obligation, or an industry mandate',
  'that AIEDS is endorsed, adopted, or used by any named third party',
  'that the Planet Health Score is authoritative, certified, or exact',
  'that Random Knights has an existing relationship, partnership, or history with the recipient',
  'any specific number, statistic, deadline, or dollar figure not present in the fact base',
];

export const SENDER = {
  name: 'Random Knights',
  mission: MISSION,
  aieds_name: AIEDS_NAME,
  tone: 'Plain, candid, non-salesy. Curious rather than promotional. Never guilt-driven.',
  facts: RK_FACTS,
  must_not_claim: RK_MUST_NOT_CLAIM,
};

/** The sender block injected into every drafting prompt. */
export function senderPromptBlock() {
  return [
    `SENDER: ${SENDER.name} (fixed - every draft is from this org).`,
    `MISSION: ${SENDER.mission}`,
    '',
    'THE ONLY FACTS YOU MAY STATE ABOUT THE SENDER:',
    ...RK_FACTS.map((f) => `- [${f.id}] ${f.text}`),
    '',
    'YOU MUST NOT CLAIM:',
    ...RK_MUST_NOT_CLAIM.map((c) => `- ${c}`),
  ].join('\n');
}
