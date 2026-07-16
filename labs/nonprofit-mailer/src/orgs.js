/**
 * THE RECIPIENTS: real US environmental nonprofits, from public IRS/Census data.
 *
 * Source: the same public pipeline dataset rand0m.ai's Earth globe reads -
 *   https://storage.googleapis.com/randomknights-xyz.firebasestorage.app/nonprofits/nonprofits-env-points.json
 * vendored here (trimmed to org-level fields) so the lab runs offline with no keys.
 *
 * WHAT IS IN HERE: organization name, NTEE code + group, city/state, latest
 * reported revenue, and a ProPublica link to the org's public filing.
 *
 * WHAT IS DELIBERATELY NOT IN HERE: people. No staff, no officers, no contacts,
 * no email addresses, no PII. The upstream dataset ships ZIP-centroid lat/lon;
 * those were dropped when vendoring because a mailer has no business knowing a
 * location finer than city/state. Everything here is public-record ORG data.
 *
 * These are real organizations. Nothing in this tool asserts any relationship
 * between Random Knights and any of them - see src/status.js.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'data', 'nonprofits-env.json');

const raw = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

export const DATASET_META = raw.meta;

/** Stable id: the ProPublica EIN when present, else a name+state slug. */
function orgId(o) {
  const ein = /organizations\/(\d+)/.exec(o.url || '');
  if (ein) return `ein-${ein[1]}`;
  return `slug-${o.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}-${o.state}`;
}

export const ORGS = raw.orgs.map((o) => ({ ...o, id: orgId(o) }));

const BY_ID = new Map(ORGS.map((o) => [o.id, o]));

/** Revenue buckets - the "size" axis of the search. */
export const SIZE_BANDS = [
  { id: 'small', label: 'Small (under $5M)', test: (r) => r < 5e6 },
  { id: 'medium', label: 'Medium ($5M - $50M)', test: (r) => r >= 5e6 && r < 5e7 },
  { id: 'large', label: 'Large ($50M+)', test: (r) => r >= 5e7 },
];

export function sizeBand(revenue) {
  return (SIZE_BANDS.find((b) => b.test(revenue)) || SIZE_BANDS[0]).id;
}

export function getOrg(id) {
  return BY_ID.get(id) || null;
}

/**
 * Typeahead / search over the full 4000-org pool.
 * Matches on name, NTEE code, and NTEE group; filterable by size band and state.
 * Ranked so prefix matches beat substring matches, then by revenue desc.
 */
export function searchOrgs({ q = '', size = '', state = '', limit = 25 } = {}) {
  const needle = q.trim().toLowerCase();
  const out = [];

  for (const o of ORGS) {
    if (size && sizeBand(o.revenue_usd) !== size) continue;
    if (state && o.state !== state) continue;

    let rank = 0;
    if (needle) {
      const name = o.name.toLowerCase();
      const ntee = o.ntee.toLowerCase();
      const group = o.ntee_group.toLowerCase();
      if (name.startsWith(needle)) rank = 3;
      else if (name.includes(needle)) rank = 2;
      else if (ntee.startsWith(needle) || group.includes(needle)) rank = 1;
      else continue;
    }
    out.push({ org: o, rank });
  }

  out.sort((a, b) => b.rank - a.rank || b.org.revenue_usd - a.org.revenue_usd);
  return out.slice(0, limit).map(({ org }) => ({ ...org, size_band: sizeBand(org.revenue_usd) }));
}

export function listStates() {
  return [...new Set(ORGS.map((o) => o.state))].sort();
}

/**
 * The org's PUBLIC profile, as the drafting prompt sees it. This block is the
 * ONLY thing a draft may claim about the recipient - the grounding gate checks
 * every recipient claim back against exactly these fields.
 */
export function orgPromptBlock(org) {
  return [
    'RECIPIENT ORG (public IRS/Census record - the ONLY facts you may state about them):',
    `- Name: ${org.name}`,
    `- NTEE code: ${org.ntee} (${org.ntee_group})`,
    `- Location: ${org.city}, ${org.state}`,
    `- Latest reported revenue: ${org.revenue_display}`,
    `- Public filing: ${org.url}`,
    '',
    'You know NOTHING else about this organization. You do not know their programs,',
    'their staff, their campaigns, their outcomes, their history, or their opinions.',
    'The NTEE code tells you their broad category and nothing more specific.',
  ].join('\n');
}

/** The verifiable field set, handed to the grounding gate. */
export function orgFacts(org) {
  return {
    name: org.name,
    ntee: org.ntee,
    ntee_group: org.ntee_group,
    city: org.city,
    state: org.state,
    revenue_display: org.revenue_display,
    url: org.url,
  };
}
