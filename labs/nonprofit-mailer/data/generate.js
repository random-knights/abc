/**
 * Seeded synthetic-datalake generator (reproducible: same seed, same lake).
 *
 * Emits the three demo-safe files of the adapter contract into data/demo/:
 *   donors.json  events.jsonl  notes.jsonl
 *
 * The lake is deliberately built around four sharp personas so the retention
 * engine's recommendations are visibly different on demo day:
 *   - lapsed_major:    former $1k+ donors, silent 14-30 months, opens declining
 *   - engaged_small:   $15-40/mo recurring, opens everything, volunteers
 *   - new_onetime:     single first gift in the last 90 days, no other touch
 *   - at_risk_member:  membership renewals slipping, support friction in notes
 *
 * All names/emails are synthetic (name parts are combined by the seeded RNG,
 * emails live on example.org). NO real person is represented.
 *
 * Run: npm run generate-data
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'demo');

// ── Seeded RNG (mulberry32) - reproducibility is the point ─────────────────
const SEED = 20260715;
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + rand() * (hi - lo);
const int = (lo, hi) => Math.floor(between(lo, hi + 1));

// "Now" is pinned so the generated recency signals never drift.
const NOW = Date.parse('2026-07-01T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const daysAgo = (d) => iso(NOW - d * DAY);

const FIRST = ['Avery', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Quinn', 'Rowan',
  'Emerson', 'Sage', 'Hollis', 'Marlow', 'Ellis', 'Wren', 'Kai', 'Devon',
  'Lane', 'Reese', 'Tatum', 'Arden', 'Blair'];
const LAST = ['Fielder', 'Marsh', 'Calloway', 'Winters', 'Hale', 'Bram',
  'Okafor', 'Voss', 'Lindqvist', 'Serrano', 'Takeda', 'Moreau', 'Petrov',
  'Ashby', 'Navarro', 'Kimura', 'Deluca', 'Haugen', 'Iqbal', 'Sterling'];
const CHANNELS = ['direct_mail', 'gala_2023', 'peer_to_peer', 'web_organic',
  'facebook_ads', 'newsletter_signup', 'volunteer_conversion'];

// ── Persona definitions (the crafted segments) ──────────────────────────────
const PERSONAS = [
  {
    key: 'lapsed_major', count: 14,
    tier: () => pick(['patron', 'benefactor']),
    gifts() {
      const gifts = [];
      const firstGiftDays = int(900, 1800);
      let d = firstGiftDays;
      const lapseDays = int(430, 900); // silent 14-30 months
      while (d > lapseDays) {
        gifts.push({ date: daysAgo(d), amount: int(750, 5000), recurring: false });
        d -= int(90, 240);
      }
      return { gifts, lastGiftDays: lapseDays };
    },
    engagement: { openRate: [0.05, 0.25], eventsAttended: [0, 1], volunteerHours: [0, 0] },
    notes: [
      'Asked to be recognized in the annual report under family name. Very proud of the scholarship their 2023 gift funded.',
      'Spoke at length about wanting impact reports before giving again. Said the last two appeals felt generic.',
      'Told our gala table host they now split giving between three organizations and are re-evaluating this year.',
      'Requested we stop calling during work hours. Prefers a short written impact summary once or twice a year.',
      'Mentioned a planned-giving conversation might interest them in a few years, not now.',
    ],
  },
  {
    key: 'engaged_small', count: 16,
    tier: () => pick(['member', 'supporter']),
    gifts() {
      const gifts = [];
      const monthly = pick([15, 20, 25, 40]);
      const months = int(8, 30);
      for (let m = 0; m < months; m++) {
        gifts.push({ date: daysAgo(15 + m * 30), amount: monthly, recurring: true });
      }
      return { gifts, lastGiftDays: 15 };
    },
    engagement: { openRate: [0.55, 0.9], eventsAttended: [1, 4], volunteerHours: [4, 60] },
    notes: [
      'Survey: "I love the monthly photo updates from the field. Please never stop those."',
      'Volunteered at the spring river cleanup and brought two friends. Asked about a team captain role.',
      'Survey: "Would give more if there was a simple way to round up my monthly gift."',
      'Replied to the newsletter asking how to gift a membership to their sister.',
      'Attended two workshops this year; rated both 5/5 and asked for advanced sessions.',
    ],
  },
  {
    key: 'new_onetime', count: 12,
    tier: () => 'supporter',
    gifts() {
      return {
        gifts: [{ date: daysAgo(int(10, 90)), amount: pick([25, 50, 75, 100]), recurring: false }],
        lastGiftDays: 45,
      };
    },
    engagement: { openRate: [0.2, 0.6], eventsAttended: [0, 1], volunteerHours: [0, 2] },
    notes: [
      'Gave after seeing the wildfire relief story a friend shared. First contact with us.',
      'Signed up at the street fair booth. Asked what percentage of gifts reach programs.',
      'Survey: "Just discovered you all. What else do you do besides the food bank?"',
    ],
  },
  {
    key: 'at_risk_member', count: 12,
    tier: () => 'member',
    gifts() {
      const gifts = [];
      let d = int(700, 1100);
      while (d > 320) { // renewals present but the last one is overdue
        gifts.push({ date: daysAgo(d), amount: pick([60, 90, 120]), recurring: false });
        d -= 365;
      }
      return { gifts, lastGiftDays: int(330, 420) };
    },
    engagement: { openRate: [0.1, 0.4], eventsAttended: [0, 1], volunteerHours: [0, 6] },
    notes: [
      'Support ticket: renewal payment failed twice on the website; fixed by phone but member was frustrated.',
      'Survey: "The member portal login never works on my phone. Almost did not renew last year."',
      'Asked why member pricing was not applied at the fall event. Refund issued, apology sent.',
      'Survey: "I am not sure what my membership actually gets me anymore."',
      'Voicemail: considering letting membership lapse, money is tighter this year.',
    ],
  },
];

// ── Generate ────────────────────────────────────────────────────────────────
const donors = [];
const events = [];
const notes = [];
let idCounter = 1000;
const usedNames = new Set();

for (const persona of PERSONAS) {
  for (let i = 0; i < persona.count; i++) {
    let name;
    do { name = `${pick(FIRST)} ${pick(LAST)}`; } while (usedNames.has(name));
    usedNames.add(name);
    const id = `C-${idCounter++}`;
    const { gifts, lastGiftDays } = persona.gifts();
    const totalGiven = gifts.reduce((sum, g) => sum + g.amount, 0);
    const [openLo, openHi] = persona.engagement.openRate;
    const openRate = between(openLo, openHi);

    donors.push({
      customer_id: id,
      display_name: name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.org`,
      membership_tier: persona.tier(),
      acquisition_channel: pick(CHANNELS),
      first_gift_date: gifts.length ? gifts[gifts.length - 1].date : null,
      last_gift_date: gifts.length ? gifts[0].date : null,
      gift_count: gifts.length,
      total_given_usd: totalGiven,
      largest_gift_usd: gifts.reduce((max, g) => Math.max(max, g.amount), 0),
      is_recurring: gifts.some((g) => g.recurring),
      days_since_last_gift: lastGiftDays,
      // RFM-style rollups a warehouse would precompute
      rfm: {
        recency_days: lastGiftDays,
        frequency_24mo: gifts.filter((g) => Date.parse(g.date) > NOW - 730 * DAY).length,
        monetary_24mo: gifts
          .filter((g) => Date.parse(g.date) > NOW - 730 * DAY)
          .reduce((sum, g) => sum + g.amount, 0),
      },
      // Ground truth for demo narration only - the engine never sees this.
      _demo_persona: persona.key,
    });

    // Event log: email engagement + attendance + volunteering + web visits
    const sends = int(8, 24);
    for (let s = 0; s < sends; s++) {
      const day = int(3, 540);
      events.push({ customer_id: id, type: 'email_sent', date: daysAgo(day), campaign: `news-${int(1, 40)}` });
      if (rand() < openRate) {
        events.push({ customer_id: id, type: 'email_open', date: daysAgo(day), campaign: `news-${int(1, 40)}` });
        if (rand() < 0.35) events.push({ customer_id: id, type: 'email_click', date: daysAgo(day), campaign: `news-${int(1, 40)}` });
      }
    }
    const attended = int(...persona.engagement.eventsAttended);
    for (let a = 0; a < attended; a++) {
      events.push({ customer_id: id, type: 'event_attended', date: daysAgo(int(20, 400)), event: pick(['spring-gala', 'river-cleanup', 'member-workshop', 'harvest-5k']) });
    }
    const hours = int(...persona.engagement.volunteerHours);
    if (hours > 0) events.push({ customer_id: id, type: 'volunteer_hours', date: daysAgo(int(10, 200)), hours });
    for (let v = 0; v < int(0, 6); v++) {
      events.push({ customer_id: id, type: 'page_visit', date: daysAgo(int(1, 120)), page: pick(['/impact', '/donate', '/events', '/membership', '/blog']) });
    }

    // Unstructured text: 1-2 persona-flavored documents
    const docCount = int(1, 2);
    const pool = [...persona.notes];
    for (let n = 0; n < docCount && pool.length; n++) {
      const idx = Math.floor(rand() * pool.length);
      const text = pool.splice(idx, 1)[0];
      notes.push({
        customer_id: id,
        source: pick(['survey', 'support', 'staff_note', 'call_log']),
        date: daysAgo(int(5, 400)),
        text,
      });
    }
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'donors.json'), JSON.stringify(donors, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'events.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n');
writeFileSync(join(OUT_DIR, 'notes.jsonl'), notes.map((n) => JSON.stringify(n)).join('\n') + '\n');
console.log(`Synthetic lake written to ${OUT_DIR}: ${donors.length} donors, ${events.length} events, ${notes.length} text docs (seed ${SEED})`);
