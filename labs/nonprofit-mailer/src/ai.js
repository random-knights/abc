import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate subject line variants for a campaign
 */
export async function generateSubjectLines(campaign, count = 5) {
  const prompt = `You are an expert nonprofit email marketer. Generate ${count} compelling email subject lines for this campaign.

ORGANIZATION: ${campaign.orgName}
MISSION: ${campaign.mission}
AUDIENCE: ${campaign.audience}
CAMPAIGN GOAL: ${campaign.goal}
TONE: ${campaign.tone}
KEY MESSAGE: ${campaign.keyMessage}

Generate exactly ${count} subject lines. Each should use a different psychological hook:
1. Urgency / scarcity
2. Curiosity / intrigue
3. Social proof / community
4. Direct benefit / value
5. Emotional / storytelling

Respond ONLY with JSON, no markdown:
{
  "subjects": [
    { "text": "subject line", "hook": "urgency", "reasoning": "why this works", "predicted_open_rate": "estimated % as string like 24%" }
  ]
}`;

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = res.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

/**
 * Score and rank subject lines by predicted engagement
 */
export async function scoreSubjectLines(subjects, campaign) {
  const prompt = `You are an email deliverability and engagement expert. Score these subject lines for a nonprofit email campaign.

ORGANIZATION: ${campaign.orgName}
AUDIENCE: ${campaign.audience}
CAMPAIGN GOAL: ${campaign.goal}

SUBJECT LINES TO SCORE:
${subjects.map((s, i) => `${i + 1}. "${s.text}"`).join('\n')}

Score each on these criteria (1-10 each):
- clarity: how clear is the message
- urgency: motivates action now
- relevance: matches audience interests
- deliverability: avoids spam triggers
- emotional_pull: creates emotional connection

Respond ONLY with JSON, no markdown:
{
  "scored": [
    {
      "text": "subject line text",
      "scores": { "clarity": 8, "urgency": 7, "relevance": 9, "deliverability": 8, "emotional_pull": 7 },
      "total": 39,
      "grade": "A",
      "recommendation": "one sentence on why to use or improve this"
    }
  ],
  "winner": "the best subject line text",
  "winner_reason": "why this one wins"
}`;

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = res.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

/**
 * Generate the full email body for the winning subject
 */
export async function generateEmailBody(campaign, winningSubject) {
  const prompt = `You are an expert nonprofit copywriter. Write a compelling donation/engagement email.

ORGANIZATION: ${campaign.orgName}
MISSION: ${campaign.mission}
AUDIENCE: ${campaign.audience}
GOAL: ${campaign.goal}
TONE: ${campaign.tone}
KEY MESSAGE: ${campaign.keyMessage}
SUBJECT LINE: ${winningSubject}
CTA: ${campaign.cta}

Write a complete email with:
- Personalized greeting
- Hook opening (2-3 sentences max)
- Story or impact statement (1 paragraph)
- Clear ask / call to action
- Warm closing
- P.S. line (these get high read rates)

Keep it under 300 words. Write for humans, not algorithms.

Respond ONLY with JSON, no markdown:
{
  "greeting": "Dear [First Name],",
  "hook": "opening sentences",
  "body": "main paragraph",
  "cta_block": "the ask and button text",
  "closing": "warm sign off",
  "ps": "P.S. line",
  "full_text": "complete assembled email as plain text",
  "word_count": 245,
  "reading_time": "1 min"
}`;

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = res.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

/**
 * Generate A/B test plan with measurable success criteria
 */
export async function generateABTestPlan(campaign, subjects, winnerIndex) {
  const challengers = subjects.filter((_, i) => i !== winnerIndex).slice(0, 1);

  const prompt = `You are an email A/B testing expert. Create a rigorous test plan.

CAMPAIGN: ${campaign.orgName} - ${campaign.goal}
VARIANT A (Control): "${subjects[winnerIndex].text}"
VARIANT B (Challenger): "${challengers[0]?.text || 'alternate subject line'}"
AUDIENCE SIZE: ${campaign.audienceSize || '10,000 subscribers'}

Create a complete A/B test plan with statistical rigor.

Respond ONLY with JSON, no markdown:
{
  "hypothesis": "what we expect to learn",
  "primary_metric": "open rate",
  "secondary_metrics": ["click rate", "conversion rate", "unsubscribe rate"],
  "sample_split": "50/50",
  "test_duration": "48 hours",
  "minimum_sample_size": 1000,
  "significance_threshold": "95% confidence",
  "send_schedule": {
    "test_group": "20% of list - first send",
    "winner_send": "remaining 80% - 48 hours later"
  },
  "success_criteria": {
    "open_rate_target": "above 25%",
    "click_rate_target": "above 3%",
    "minimum_improvement": "10% lift over control"
  },
  "segments_to_watch": ["new subscribers", "lapsed donors", "active volunteers"],
  "what_to_do_if_no_winner": "fallback recommendation"
}`;

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = res.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

/**
 * Eval framework - score a generated email against quality criteria
 */
export async function evalEmail(emailBody, campaign) {
  const prompt = `You are an AI output evaluator specializing in nonprofit email quality. Evaluate this generated email.

CAMPAIGN GOAL: ${campaign.goal}
INTENDED AUDIENCE: ${campaign.audience}
BRAND TONE: ${campaign.tone}

EMAIL TO EVALUATE:
${emailBody.full_text}

Score on these dimensions (1-10):
- authenticity: does it sound human, not AI-generated
- clarity: is the ask crystal clear
- emotional_resonance: does it connect emotionally
- mission_alignment: does it reflect the org's mission
- cta_strength: is the call to action compelling
- spam_risk: inverse score - 10 means very low spam risk
- hallucination_check: does anything seem fabricated or inaccurate

Respond ONLY with JSON, no markdown:
{
  "scores": {
    "authenticity": 8,
    "clarity": 9,
    "emotional_resonance": 7,
    "mission_alignment": 9,
    "cta_strength": 8,
    "spam_risk": 9,
    "hallucination_check": 10
  },
  "total": 60,
  "max_possible": 70,
  "grade": "B+",
  "flags": ["any concerns here"],
  "improvements": ["specific suggestion 1", "specific suggestion 2"],
  "approved_for_send": true,
  "eval_summary": "one paragraph honest assessment"
}`;

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = res.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}
