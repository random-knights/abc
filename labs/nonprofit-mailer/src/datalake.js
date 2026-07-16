/**
 * THE ADAPTER SEAM: where a REAL member dataset would plug in.
 *
 * WHAT THIS FILE IS FOR
 *
 * In this public demo, a recipient's lifecycle status is a hash of their org id
 * (src/status.js) - deliberately fake, and labelled as such everywhere it is
 * shown. But notice what a status actually IS: it is the one piece of the
 * (org x status x campaign) triple that a real CRM would OWN. The org data is
 * public record. The campaign is a choice. The status is the only part that
 * requires knowing something private about a real relationship.
 *
 * So the status lookup is exactly the right seam, and this file is it.
 *
 *   MemberSource.statusFor(orgId) -> { id, label, synthetic, ... }
 *
 * Everything downstream - the campaign router, the drafting prompts, the
 * grounding gate - consumes that interface and never asks where the status came
 * from. Swapping the demo hash for a real member CRM is a config change, not a
 * code change. That is how you know the seam is real rather than decorative.
 *
 * THE REAL IMPLEMENTATION LIVES ELSEWHERE, ON PURPOSE
 *
 * The real member dataset belongs to `xyz-outreach`, a private Random Knights
 * tool. It is not in this repo and must never be: this repo is public and
 * world-readable, and a real member list is real data about real organizations.
 * The seam is public; the data is not.
 *
 * WHAT A REAL SOURCE MUST GUARANTEE
 *
 * If you implement RealMemberSource against a live CRM, the safety properties
 * this demo relies on stop being free and become YOUR job:
 *
 *   1. `synthetic: false` on a real status flips the UI's synthetic labelling
 *      off. Only set it when the status reflects an actual, recorded
 *      relationship - because at that point the emails start asserting one.
 *   2. The grounding gate's red lines (src/grounding.js) forbid claims like
 *      "your donation" because in THIS demo nothing was ever donated. With a
 *      real source, those claims may become true - and the gate must then be
 *      given the supporting facts to check them against, not simply relaxed.
 *      Loosening the gate without supplying the facts is how you ship a
 *      confident lie.
 *   3. Org-level only. This tool has no concept of a person and should not
 *      acquire one. No individuals, no contacts, no PII.
 */

import { syntheticStatusFor, STATUSES, getStatus } from './status.js';

/**
 * @typedef {Object} MemberSource
 * @property {(orgId: string) => object} statusFor  Lifecycle status for an org.
 * @property {() => boolean} isSynthetic            True if statuses are demo data.
 * @property {() => string} describe                Human label for the UI banner.
 */

/**
 * The demo source. Statuses are a hash of the org id: reproducible, and
 * transparently arbitrary. Consults no record of any kind.
 * @returns {MemberSource}
 */
export function createDemoSource() {
  return {
    statusFor(orgId) {
      return syntheticStatusFor(orgId);
    },
    isSynthetic() {
      return true;
    },
    describe() {
      return 'Demo source - statuses are randomly assigned, not real relationships.';
    },
  };
}

/**
 * The real source. NOT IMPLEMENTED HERE, and not implementable here.
 *
 * This stub exists to pin the contract down precisely enough that the real
 * implementation in `xyz-outreach` is a drop-in, and to fail loudly rather than
 * silently falling back to demo data if someone points MEMBER_SOURCE at it.
 *
 * A real implementation would:
 *   - read the member/CRM export (org id -> lifecycle stage + supporting facts)
 *   - return { id, label, meaning, synthetic: false, facts: [...] }
 *     where `facts` are the sourced, checkable statements that justify the
 *     status ("first disclosure published 2026-03-11") so the grounding gate
 *     can verify relationship claims instead of banning them outright
 *   - never widen beyond org level
 *
 * @returns {MemberSource}
 */
export function createRealSource() {
  throw new Error(
    'Real member source is not implemented in this public repo. It lives in the private ' +
      'xyz-outreach tool. See the contract in src/datalake.js. This demo ships with ' +
      'synthetic statuses only.'
  );
}

/**
 * THE SWITCH. Defaults to the demo source. Setting MEMBER_SOURCE=real is what a
 * real deployment would flip - and here it throws, because the real source is
 * deliberately absent from a public repo.
 * @returns {MemberSource}
 */
export function createMemberSource(mode = process.env.MEMBER_SOURCE || 'demo') {
  if (mode === 'real') return createRealSource();
  return createDemoSource();
}

/** The status vocabulary is shared by both sources - a real CRM maps onto this ladder. */
export { STATUSES, getStatus };
