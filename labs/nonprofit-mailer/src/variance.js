/**
 * VARIANCE - blueprint principle 2: a single run tells you nothing.
 *
 * One green run is not evidence. The same (org x status x campaign) triple, at a
 * FIXED temperature, generates a DISTRIBUTION of quality - and the shape of that
 * distribution is the actual signal. A prompt that scores 92 once and 41 once is
 * not a 92 prompt and it is not a 67 prompt. It is an unreliable prompt, and
 * shipping it means some real recipient gets the 41.
 *
 * So: generate N times, hold every knob constant, and report min/max/spread -
 * never a single number. High spread is a REGRESSION, flagged as such, even when
 * the mean looks fine.
 *
 * The floor matters more than the mean. The mean is what you hope for; the min is
 * what you actually ship to somebody.
 */

import { generateDraft, evalDraft, FIXED_TEMPERATURE } from './ai.js';
import { groundingGate } from './grounding.js';

/** Default N. Enough to see a distribution without burning the demo's budget. */
export const DEFAULT_RUNS = 5;

/**
 * Spread thresholds, on the 0-100 scale. A spread over WARN means the prompt is
 * not reliable enough to trust a single sample from it.
 */
export const SPREAD_WARN = 15;
export const SPREAD_FAIL = 25;

/**
 * One trial: draft -> grounding gate -> eval.
 *
 * SCORING: the gate is not one dimension among many, it is a veto. A draft that
 * fails grounding scores ZERO regardless of how good the prose is, because a
 * beautifully written lie is worse than nothing. That is what "trust is the
 * metric" has to mean if it means anything.
 */
export async function runTrial(org, status, campaign, opts = {}) {
  const { temperature = FIXED_TEMPERATURE, injectFabrication = false } = opts;

  const draft = await generateDraft(org, status, campaign, { temperature, injectFabrication });
  const gate = await groundingGate(draft.full_text, org, status);

  // Gate failed: score 0. Skip the eval - there is nothing to grade, and paying
  // an Opus call to rate the prose of a draft we are throwing away is waste.
  if (!gate.passed) {
    return { draft, gate, evaluation: null, score: 0, gate_failed: true };
  }

  const evaluation = await evalDraft(draft, org, status, campaign);
  const s = evaluation.scores;
  const score = Math.round(
    ((s.grounding + s.clarity + s.tone_fit + s.campaign_fit + s.honesty) / 50) * 100
  );

  return { draft, gate, evaluation, score, gate_failed: false };
}

function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Distribution stats over the trial scores. */
export function summarize(scores) {
  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const variance = sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const min = sorted[0];
  const max = sorted[n - 1];
  const spread = max - min;

  let verdict = 'stable';
  if (spread >= SPREAD_FAIL) verdict = 'regression';
  else if (spread >= SPREAD_WARN) verdict = 'unstable';

  return {
    n,
    min,
    max,
    spread,
    mean: Math.round(mean * 10) / 10,
    median: Math.round(quantile(sorted, 0.5) * 10) / 10,
    stddev: Math.round(Math.sqrt(variance) * 10) / 10,
    verdict,
    scores: sorted,
    // The number to actually care about. You ship the floor, not the mean.
    floor: min,
  };
}

/**
 * Run N trials for one triple and report the distribution.
 * Every knob is held constant across runs; the only variable is model sampling.
 */
export async function runVariance(org, status, campaign, opts = {}) {
  const { runs = DEFAULT_RUNS, temperature = FIXED_TEMPERATURE, onProgress } = opts;

  const trials = [];
  for (let i = 0; i < runs; i++) {
    const t = await runTrial(org, status, campaign, { temperature });
    trials.push(t);
    if (onProgress) onProgress(i + 1, runs, t);
  }

  const stats = summarize(trials.map((t) => t.score));
  const gateFailures = trials.filter((t) => t.gate_failed).length;

  return {
    triple: {
      org: { id: org.id, name: org.name },
      status: { id: status.id, label: status.label, synthetic: true },
      campaign: { id: campaign.id, label: campaign.label },
    },
    config: { runs, temperature, model: trials[0]?.draft.model, fixed: true },
    stats,
    gate_failures: gateFailures,
    gate_failure_rate: Math.round((gateFailures / runs) * 100),
    trials,
    // Surfaced as the headline: if the same prompt sometimes fabricates, that is
    // the finding, even if most runs are clean.
    flags: [
      ...(stats.verdict === 'regression'
        ? [`Score spread of ${stats.spread} points across ${runs} identical runs - this prompt is not reliable.`]
        : []),
      ...(stats.verdict === 'unstable'
        ? [`Score spread of ${stats.spread} points - single-run results from this prompt are not trustworthy.`]
        : []),
      ...(gateFailures > 0
        ? [`${gateFailures}/${runs} runs FAILED the grounding gate. The prompt fabricates intermittently.`]
        : []),
    ],
  };
}
