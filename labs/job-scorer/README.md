# Job Fit Scorer

AI-powered job description scorer built on the Anthropic Claude API.
Paste any job description plus your resume and cover letter to get an
instant personalized match score.

## Setup
  $env:ANTHROPIC_API_KEY="sk-ant-..."
  node job-scorer.js
  Open http://localhost:3000

## How it works
1. Paste the job description on the left
2. Paste your resume and cover letter in the optional context section
3. Click Score This Job
4. Get an instant fit analysis with score, verdict, strengths, gaps, and priority

## No baked-in profile
All scoring is based on what you paste. Nothing personal is hardcoded.
The more context you provide, the more accurate the score.
