/**
 * THE STATUS: an ILLUSTRATIVE, SYNTHETIC lifecycle stage. Not a real relationship.
 *
 * READ THIS BEFORE CHANGING ANYTHING HERE.
 *
 * The recipients in this demo are REAL organizations (src/orgs.js, public IRS
 * data). The statuses are MADE UP. Random Knights has no relationship with any
 * of these orgs, and this file must never imply otherwise.
 *
 * Statuses are assigned by a seeded RNG keyed on the org id, which buys two
 * things: the demo is reproducible (same org, same status, every run), and the
 * assignment is transparently arbitrary - it is a hash of the org's name, not a
 * record of anything. There is no lookup, no dataset, no truth being consulted.
 *
 * SAFETY RULES enforced downstream:
 *   - Every status is rendered with SYNTHETIC_LABEL next to it in the UI.
 *   - The drafting prompt is told the status is fictional and must not be
 *     referenced as history (see statusPromptBlock).
 *   - The grounding gate fails any draft asserting a real relationship, past
 *     gift, membership, endorsement, or adoption (see src/grounding.js).
 */

export const SYNTHETIC_LABEL = 'SYNTHETIC / DEMO - not a real relationship';

export const SYNTHETIC_DISCLAIMER =
  'This lifecycle status is randomly assigned for demonstration purposes only. ' +
  'Random Knights has no relationship with this organization. The status is not ' +
  'derived from any record, dataset, or interaction, and asserts nothing about ' +
  'this organization.';

/**
 * The ladder. `meaning` describes what the stage would mean in a REAL CRM;
 * it is the campaign-routing rationale, not a claim about the recipient.
 */
export const STATUSES = [
  { id: 'prospect', label: 'Prospect', meaning: 'No contact yet. Has never heard from the sender.' },
  { id: 'adopter', label: 'Adopter', meaning: 'Has started using AIEDS or the open tooling.' },
  { id: 'subscriber', label: 'Subscriber', meaning: 'Follows updates. Reads, has not contributed.' },
  { id: 'supporter', label: 'Supporter', meaning: 'Actively contributes or advocates.' },
  { id: 'patron', label: 'Patron', meaning: 'Sustained, ongoing backing.' },
  { id: 'benefactor', label: 'Benefactor', meaning: 'Major, long-horizon backing.' },
  { id: 'lapsed', label: 'Lapsed', meaning: 'Was previously engaged. Has gone quiet.' },
];

const BY_ID = new Map(STATUSES.map((s) => [s.id, s]));

export function getStatus(id) {
  return BY_ID.get(id) || null;
}

/** FNV-1a. Small, deterministic, dependency-free. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Assign a synthetic status to an org. Deterministic in the org id, so the demo
 * reproduces. This is a HASH, not a lookup - it consults no record of any kind.
 */
export function syntheticStatusFor(orgId) {
  const s = STATUSES[hash(String(orgId)) % STATUSES.length];
  return { ...s, synthetic: true, label_suffix: SYNTHETIC_LABEL };
}

/** Deterministically sample representative orgs per status for the demo picker. */
export function sampleByStatus(orgs, perStatus = 2) {
  const buckets = new Map(STATUSES.map((s) => [s.id, []]));
  for (const o of orgs) {
    const s = syntheticStatusFor(o.id);
    const b = buckets.get(s.id);
    if (b.length < perStatus) b.push({ ...o, status: s.id, status_label: s.label });
  }
  return STATUSES.map((s) => ({ status: s, orgs: buckets.get(s.id) }));
}

/**
 * The status block for the drafting prompt. Note how hard this leans on telling
 * the model the status is fictional: the model is allowed to use the status to
 * pick a TONE and an ASK, and forbidden from referring to it as fact.
 */
export function statusPromptBlock(status) {
  return [
    `SYNTHETIC LIFECYCLE STATUS: ${status.label}`,
    `(In a real CRM this would mean: ${status.meaning})`,
    '',
    'CRITICAL - THIS STATUS IS FICTIONAL:',
    'This status was randomly assigned for a demo. It is NOT a real relationship.',
    'Random Knights has never interacted with this organization.',
    '',
    'You may use the status ONLY to choose the tone and the ask of the email.',
    'You MUST NOT reference it as history. Specifically, you must not write that',
    'the recipient has donated, joined, subscribed, adopted, supported, endorsed,',
    'partnered, renewed, lapsed, attended, or previously corresponded - and you',
    'must not thank them for any past action. None of that happened.',
    '',
    'Write as a genuine first-contact email that happens to be pitched at the',
    'tone this status implies.',
  ].join('\n');
}
