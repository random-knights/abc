# Nonprofit Mailer

AI-powered email campaign generator for mission-driven organizations.
Runs a 5-step pipeline: subject line generation, scoring, email body
generation, A/B test plan, and LLM-as-judge evaluation.

## Setup
  cd nonprofit-mailer
  npm install
  $env:ANTHROPIC_API_KEY="sk-ant-..."
  node src/server.js
  Open http://localhost:4000

## Pipeline steps
1. Generate 5 subject line variants with different psychological hooks
2. Score and rank each variant, select a winner
3. Generate a complete email body for the winning subject
4. Build a statistically rigorous A/B test plan
5. Run LLM-as-judge eval on the generated email before approving for send
