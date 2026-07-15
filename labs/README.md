# Labs

Experimental AI tools and prototypes by Random Knights.

## Job Fit Scorer (job-scorer.js)
AI-powered job description scorer. Paste any job description and get an
instant match analysis against your candidate profile.

Setup:
  $env:ANTHROPIC_API_KEY="sk-ant-..."
  node job-scorer.js
  Open http://localhost:3000

Customize: Edit the PROFILE constant in job-scorer.js.
See profile-template.md for the template.

## Nonprofit Mailer (nonprofit-mailer/)
AI-powered email campaign generator for mission-driven organizations.
Runs a 5-step pipeline: subject line generation, scoring, email body
generation, A/B test planning, and LLM-as-judge evaluation.

Setup:
  cd nonprofit-mailer
  npm install
  $env:ANTHROPIC_API_KEY="sk-ant-..."
  node src/server.js
  Open http://localhost:4000

Both tools require an Anthropic API key from console.anthropic.com.
