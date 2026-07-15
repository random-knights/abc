/**
 * Nonprofit Mailer — Campaign Pipeline
 * 
 * Full AI-powered campaign generation:
 * 1. Generate subject line variants
 * 2. Score and rank them
 * 3. Generate email body for winner
 * 4. Build A/B test plan
 * 5. Run eval framework on output
 * 6. Save results
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  generateSubjectLines,
  scoreSubjectLines,
  generateEmailBody,
  generateABTestPlan,
  evalEmail
} from './ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Campaign Configuration ──────────────────────────────────────────────────
// Edit this object to run a new campaign
const CAMPAIGN = {
  orgName: 'Habitat for Humanity',
  mission: 'Building affordable homes and empowering communities through homeownership',
  audience: 'Past donors aged 35-65, middle income, community-oriented, have given in the last 2 years',
  goal: 'Drive end-of-year donations to fund 3 new home builds',
  tone: 'Warm, hopeful, community-driven — not guilt-inducing',
  keyMessage: 'Your gift before December 31st will help a family have a home for the holidays',
  cta: 'Give Today — Help a Family Come Home',
  audienceSize: '25,000 subscribers'
};

// ── Pipeline ────────────────────────────────────────────────────────────────
async function runCampaign() {
  const startTime = Date.now();
  const results = { campaign: CAMPAIGN, timestamp: new Date().toISOString(), steps: {} };

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     NONPROFIT MAILER — AI Campaign Pipeline          ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log(`📋 Campaign: ${CAMPAIGN.orgName}`);
  console.log(`🎯 Goal: ${CAMPAIGN.goal}\n`);

  // Step 1 — Generate subject lines
  console.log('Step 1/5 — Generating subject line variants...');
  const subjectData = await generateSubjectLines(CAMPAIGN, 5);
  results.steps.subjects = subjectData;
  console.log(`  ✅ Generated ${subjectData.subjects.length} variants`);
  subjectData.subjects.forEach((s, i) => {
    console.log(`     ${i + 1}. "${s.text}" [${s.hook}]`);
  });

  // Step 2 — Score and rank
  console.log('\nStep 2/5 — Scoring and ranking subject lines...');
  const scoring = await scoreSubjectLines(subjectData.subjects, CAMPAIGN);
  results.steps.scoring = scoring;
  console.log(`  ✅ Winner: "${scoring.winner}"`);
  console.log(`     Reason: ${scoring.winner_reason}`);
  scoring.scored.forEach(s => {
    console.log(`     [${s.grade}] "${s.text}" — total: ${s.total}/50`);
  });

  // Find winner index
  const winnerIndex = subjectData.subjects.findIndex(s => s.text === scoring.winner);
  const safeWinnerIndex = winnerIndex >= 0 ? winnerIndex : 0;

  // Step 3 — Generate email body
  console.log('\nStep 3/5 — Generating email body for winning subject...');
  const emailBody = await generateEmailBody(CAMPAIGN, scoring.winner);
  results.steps.email = emailBody;
  console.log(`  ✅ Email generated (${emailBody.word_count} words, ${emailBody.reading_time} read)`);
  console.log(`\n  ── EMAIL PREVIEW ──────────────────────────────────`);
  console.log(`  Subject: ${scoring.winner}`);
  console.log(`  ${emailBody.greeting}`);
  console.log(`  ${emailBody.hook}`);
  console.log(`  ...`);
  console.log(`  ${emailBody.ps}`);
  console.log(`  ────────────────────────────────────────────────────`);

  // Step 4 — A/B test plan
  console.log('\nStep 4/5 — Building A/B test plan...');
  const testPlan = await generateABTestPlan(CAMPAIGN, subjectData.subjects, safeWinnerIndex);
  results.steps.testPlan = testPlan;
  console.log(`  ✅ Test plan created`);
  console.log(`     Hypothesis: ${testPlan.hypothesis}`);
  console.log(`     Duration: ${testPlan.test_duration}`);
  console.log(`     Success criteria: ${testPlan.success_criteria.open_rate_target} open rate`);

  // Step 5 — Eval framework
  console.log('\nStep 5/5 — Running eval framework on generated email...');
  const evaluation = await evalEmail(emailBody, CAMPAIGN);
  results.steps.evaluation = evaluation;
  console.log(`  ✅ Eval complete — Grade: ${evaluation.grade} (${evaluation.total}/${evaluation.max_possible})`);
  console.log(`     Approved for send: ${evaluation.approved_for_send ? '✅ YES' : '⚠️ NO — review flags'}`);
  if (evaluation.flags.length > 0) {
    console.log(`     Flags: ${evaluation.flags.join(', ')}`);
  }
  if (evaluation.improvements.length > 0) {
    console.log(`     Improvements suggested:`);
    evaluation.improvements.forEach(imp => console.log(`       - ${imp}`));
  }

  // Save results
  const outputDir = join(__dirname, '../output');
  mkdirSync(outputDir, { recursive: true });
  const filename = `campaign_${Date.now()}.json`;
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, JSON.stringify(results, null, 2));

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                  CAMPAIGN SUMMARY                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`✅ Pipeline complete in ${elapsed}s`);
  console.log(`📧 Winning subject: "${scoring.winner}"`);
  console.log(`📊 Email grade: ${evaluation.grade}`);
  console.log(`🧪 A/B test duration: ${testPlan.test_duration}`);
  console.log(`💾 Results saved: output/${filename}\n`);

  return results;
}

runCampaign().catch(err => {
  console.error('\n❌ Pipeline failed:', err.message);
  process.exit(1);
});
