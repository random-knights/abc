/**
 * CAMPAIGN TAGS: what drives the pipeline.
 *
 * The chosen (org x status x campaign) triple is the unit of work. Status lights
 * up the campaigns that make sense for that stage - you cannot run a Win-back at
 * a Prospect, or Onboarding at someone who has never adopted anything.
 *
 * Because the status is synthetic (see src/status.js), this routing is
 * ILLUSTRATIVE: it demonstrates how a real CRM would route, using made-up
 * stages. It is not a plan to actually contact anyone. Nothing is ever sent.
 */

export const CAMPAIGNS = [
  {
    id: 'aieds-adoption',
    label: 'AIEDS Adoption',
    goal: 'Introduce AIEDS and invite the org to publish a self-attested disclosure.',
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    goal: 'Help an org that has adopted AIEDS get their first disclosure published.',
  },
  {
    id: 'renewal',
    label: 'Renewal',
    goal: 'Invite an engaged org to continue into the next cycle.',
  },
  {
    id: 'win-back',
    label: 'Win-back',
    goal: 'Re-open the conversation with an org that has gone quiet.',
  },
  {
    id: 'fundraising',
    label: 'Fundraising',
    goal: 'Invite support for the open-source work. Never guilt-driven.',
  },
  {
    id: 'impact-report',
    label: 'Impact Report',
    goal: 'Share what the open tooling and Earth data show, with confidence labels intact.',
  },
  {
    id: 'product-release',
    label: 'Product Release',
    goal: 'Announce a new capability in the open tooling.',
  },
  {
    id: 'newsletter',
    label: 'Newsletter / Digest',
    goal: 'Share a periodic roundup of open-source and Earth-data work.',
  },
];

const BY_ID = new Map(CAMPAIGNS.map((c) => [c.id, c]));

export function getCampaign(id) {
  return BY_ID.get(id) || null;
}

/**
 * status -> applicable campaigns. The routing rationale, stage by stage:
 *
 *   prospect    never contacted, so only the cold intro + broad-interest sends
 *   adopter     using it -> help them finish; do not re-pitch adoption
 *   subscriber  reading -> deepen into support
 *   supporter   contributing -> renew, ask, report back
 *   patron      sustained -> renew and report; no cold pitch
 *   benefactor  major -> report and renew; asking again would be crass
 *   lapsed      gone quiet -> win it back; do not onboard or upsell
 */
export const STATUS_CAMPAIGNS = {
  prospect: ['aieds-adoption', 'newsletter', 'product-release'],
  adopter: ['onboarding', 'product-release', 'newsletter', 'impact-report'],
  subscriber: ['aieds-adoption', 'newsletter', 'product-release', 'impact-report', 'fundraising'],
  supporter: ['impact-report', 'renewal', 'fundraising', 'product-release', 'newsletter'],
  patron: ['impact-report', 'renewal', 'newsletter', 'product-release'],
  benefactor: ['impact-report', 'renewal', 'newsletter'],
  lapsed: ['win-back', 'impact-report', 'newsletter'],
};

/** Campaigns lit up by a status, in routing order. */
export function campaignsForStatus(statusId) {
  return (STATUS_CAMPAIGNS[statusId] || []).map((id) => BY_ID.get(id)).filter(Boolean);
}

export function isApplicable(statusId, campaignId) {
  return (STATUS_CAMPAIGNS[statusId] || []).includes(campaignId);
}

export function campaignPromptBlock(campaign) {
  return [`CAMPAIGN: ${campaign.label}`, `CAMPAIGN GOAL: ${campaign.goal}`].join('\n');
}
