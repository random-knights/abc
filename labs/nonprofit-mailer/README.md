# Nonprofit Mailer
### AI-powered email campaign generator for mission-driven organizations

A Random Knights demonstration of applied AI engineering for nonprofit email automation.

---

## What It Does

Runs a complete 5-step AI pipeline to generate, score, and evaluate email campaigns:

1. **Subject Line Generation** — Creates 5 variants using different psychological hooks (urgency, curiosity, social proof, direct benefit, emotional storytelling)
2. **Scoring & Ranking** — Scores each variant on clarity, urgency, relevance, deliverability, and emotional pull. Selects a winner with reasoning.
3. **Email Body Generation** — Writes a complete human-sounding email for the winning subject line
4. **A/B Test Plan** — Builds a statistically rigorous test plan with success criteria, sample sizing, and send schedule
5. **Eval Framework** — Scores the generated email on authenticity, clarity, emotional resonance, mission alignment, CTA strength, spam risk, and hallucination detection

---

## Setup

```bash
# Install dependencies
npm install

# Set your API key (Windows PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-..."

# Set your API key (Mac/Linux)
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Run

### Web UI (recommended)
```bash
node src/server.js
# Open http://localhost:4000
```

### CLI Pipeline
```bash
node src/campaign.js
# Edit the CAMPAIGN object in src/campaign.js to customize
```

---

## Architecture

```
nonprofit-mailer/
├── src/
│   ├── ai.js          # Core AI engine — all LLM calls
│   ├── campaign.js    # CLI pipeline runner
│   └── server.js      # Web UI + API server
├── output/            # Saved campaign results (JSON)
└── README.md
```

### AI Functions (src/ai.js)
- `generateSubjectLines(campaign, count)` — LLM generates N subject variants
- `scoreSubjectLines(subjects, campaign)` — LLM scores and ranks, selects winner
- `generateEmailBody(campaign, winner)` — LLM writes full email copy
- `generateABTestPlan(campaign, subjects, winnerIndex)` — LLM builds test plan
- `evalEmail(emailBody, campaign)` — LLM-as-judge evaluates output quality

---

## Why This Matters

This project demonstrates:
- **Agentic pipeline design** — multi-step LLM orchestration where each step feeds the next
- **Structured output handling** — every LLM call returns validated JSON
- **LLM-as-judge eval pattern** — using a second LLM call to score the first
- **Responsible AI** — hallucination detection and quality gates before any content is approved for send
- **Real business value** — directly maps to nonprofit email automation at scale

---

## Extending This

Ideas for expanding the framework:
- Add a feedback loop: track actual open/click rates and feed back into prompt optimization
- Add personalization: segment-aware email variants per audience group
- Add a template library: save high-scoring emails as reusable templates
- Add scheduling: integrate with Mailchimp or SendGrid API to schedule sends
- Add multi-language: generate campaigns in multiple languages for global nonprofits
