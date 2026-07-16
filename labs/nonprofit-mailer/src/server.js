/**
 * Nonprofit Mailer - web UI + API.
 * Run:  $env:ANTHROPIC_API_KEY="sk-ant-..."; node src/server.js
 * Open: http://localhost:4000
 *
 * NOTE ON THE CLIENT SCRIPT BELOW: it lives inside a server-side template
 * literal, so a single-backslash-n here reaches the browser as a REAL newline
 * and produces an unterminated string literal (this actually happened - see
 * PR #7). Email text is therefore rendered with textContent, never interpolated
 * into an HTML string, which sidesteps the whole class of bug.
 */

import http from 'http';
import { searchOrgs, getOrg, listStates, sizeBand, DATASET_META, ORGS } from './orgs.js';
import { syntheticStatusFor, sampleByStatus, STATUSES, SYNTHETIC_LABEL, SYNTHETIC_DISCLAIMER } from './status.js';
import { CAMPAIGNS, campaignsForStatus, getCampaign, isApplicable } from './campaigns.js';
import { runVariance, runTrial, DEFAULT_RUNS } from './variance.js';
import { createMemberSource } from './datalake.js';
import { SENDER, NAME_CONFLICT } from './sender.js';
import { FIXED_TEMPERATURE, DRAFT_MODEL, EVAL_MODEL } from './ai.js';

const PORT = 4000;
const memberSource = createMemberSource();

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nonprofit Mailer - AI Quality Blueprint demo</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0f1117;color:#e8eaf0;min-height:100vh}
.topbar{background:linear-gradient(135deg,#1a1a2e,#2e5c8a);padding:16px 28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.topbar h1{font-size:17px;font-weight:800;letter-spacing:1px}
.topbar p{font-size:11px;color:rgba(255,255,255,0.55);margin-top:2px}
.badge{background:rgba(255,255,255,0.1);border-radius:20px;padding:4px 14px;font-size:11px;color:rgba(255,255,255,0.7)}
.disclaimer{background:#3a2a10;border-bottom:2px solid #f59e0b;padding:12px 28px;font-size:12px;line-height:1.7;color:#fcd34d}
.disclaimer strong{color:#fbbf24}
.disclaimer ul{margin:4px 0 0 18px}
.main{display:grid;grid-template-columns:400px 1fr;gap:16px;padding:16px;max-width:1400px;margin:0 auto}
@media(max-width:900px){.main{grid-template-columns:1fr}}
.panel{background:#1e2030;border-radius:10px;border:1px solid #2a2d3e;overflow:hidden;margin-bottom:16px}
.ph{padding:12px 16px;border-bottom:1px solid #2a2d3e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#4a9eff}
.form-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:3px}
input,select{width:100%;background:#252838;border:1px solid #2a2d3e;color:#e8eaf0;font-size:12px;font-family:inherit;border-radius:6px;padding:8px 10px;outline:none}
input:focus,select:focus{border-color:#4a9eff}
.btn{width:100%;padding:11px;border-radius:7px;border:none;font-size:13px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#2e5c8a,#4a9eff);color:white;letter-spacing:0.5px;margin-top:4px}
.btn:hover{opacity:0.9}
.btn:disabled{opacity:0.4;cursor:not-allowed}
.btn-danger{background:linear-gradient(135deg,#7a2e2e,#f87171)}
.results{max-height:260px;overflow-y:auto;border:1px solid #2a2d3e;border-radius:6px}
.org-row{padding:8px 10px;border-bottom:1px solid #2a2d3e;cursor:pointer;font-size:12px}
.org-row:hover{background:#252838}
.org-row.sel{background:#1a2540;border-left:3px solid #4a9eff}
.org-name{color:#c8cde0;font-weight:600}
.org-meta{font-size:10px;color:#666;margin-top:2px}
.synth{display:inline-block;background:#3a2a10;color:#f59e0b;border:1px solid #f59e0b;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-left:6px}
.output-body{padding:16px;min-height:400px}
.placeholder{text-align:center;padding:60px 20px;color:#444;font-size:13px;line-height:1.8}
.step{background:#252838;border-radius:8px;padding:12px 14px;margin-bottom:10px;border-left:3px solid #2a2d3e}
.step.done{border-left-color:#50c878}
.step.active{border-left-color:#4a9eff;background:#1a2540}
.step.error{border-left-color:#f87171}
.step-title{font-size:12px;font-weight:700;color:#c8cde0;margin-bottom:6px}
.step-content{font-size:11.5px;color:#888;line-height:1.6}
.email-preview{background:#1a1c26;border-radius:8px;padding:14px;font-size:12px;color:#b0b5c8;line-height:1.8;white-space:pre-wrap;border:1px solid #2a2d3e;font-family:'Courier New',monospace;margin-top:6px}
.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:6px;margin-top:6px}
.metric{background:#1a1c26;border-radius:6px;padding:8px;text-align:center}
.metric-val{font-size:20px;font-weight:800}
.metric-label{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px}
.tag{display:inline-block;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700;margin:2px}
.tag-g{background:#1a3a20;color:#50c878}
.tag-y{background:#3a2a10;color:#f59e0b}
.tag-r{background:#3a1a1a;color:#f87171}
.hist{display:flex;align-items:flex-end;gap:4px;height:90px;margin:10px 0;padding:0 4px}
.bar{flex:1;background:linear-gradient(180deg,#4a9eff,#2e5c8a);border-radius:3px 3px 0 0;position:relative;min-height:3px}
.bar.zero{background:linear-gradient(180deg,#f87171,#7a2e2e)}
.bar-lbl{position:absolute;top:-16px;left:0;right:0;text-align:center;font-size:9px;color:#888}
.viol{background:#3a1a1a;border-left:3px solid #f87171;border-radius:4px;padding:8px 10px;margin:6px 0;font-size:11px;line-height:1.6}
.viol-q{color:#fca5a5;font-style:italic}
.viol-w{color:#999;margin-top:3px}
.caught{display:inline-block;background:#1a1c26;color:#f87171;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;margin-left:4px}
.layer{display:flex;gap:8px;margin:8px 0}
.layer-box{flex:1;background:#1a1c26;border-radius:6px;padding:8px;text-align:center;font-size:10px}
.layer-box.pass{border:1px solid #50c878;color:#50c878}
.layer-box.fail{border:1px solid #f87171;color:#f87171}
.loading-dots{display:inline-flex;gap:4px;margin-left:8px}
.dot{width:5px;height:5px;border-radius:50%;background:#4a9eff;animation:p 1.2s infinite;display:inline-block}
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
@keyframes p{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
details{margin-top:8px}
summary{font-size:11px;color:#a78bfa;cursor:pointer}
.src{font-size:10px;color:#555;margin-top:8px;line-height:1.6}
</style>
</head>
<body>
<div class="topbar">
  <div><h1>NONPROFIT MAILER</h1><p>AI Quality Blueprint demo &nbsp;&middot;&nbsp; grounding &middot; variance &middot; safety</p></div>
  <span class="badge">Sender: Random Knights &nbsp;&middot;&nbsp; drafts only, never sent</span>
</div>

<div class="disclaimer">
  <strong>ILLUSTRATIVE DEMO - READ THIS FIRST.</strong>
  <ul>
    <li><strong>Drafts are never sent.</strong> This tool has no ability to send email. It generates drafts and grades them.</li>
    <li><strong>Lifecycle statuses are SYNTHETIC.</strong> They are randomly assigned for demonstration and are <strong>not real affiliations</strong>. Random Knights has no relationship with any organization shown here.</li>
    <li><strong>Recipient orgs are real, from public data.</strong> Organization name, category, city/state and revenue come from the public IRS Exempt Organizations Business Master File and US Census (public domain). Org-level only: no individuals, no contacts, no PII.</li>
    <li><strong>Random Knights is the sender</strong>, and every claim about it must trace to a sourced fact.</li>
  </ul>
</div>

<div class="main">
  <div>
    <div class="panel">
      <div class="ph">1. Recipient &mdash; search 4,000 real orgs</div>
      <div class="form-body">
        <div><label>Search by name / NTEE / category</label><input id="q" placeholder="e.g. conservation, C34, audubon" autocomplete="off" /></div>
        <div style="display:flex;gap:8px">
          <div style="flex:1"><label>Size</label><select id="size"><option value="">Any size</option><option value="small">Small (&lt;$5M)</option><option value="medium">Medium ($5-50M)</option><option value="large">Large ($50M+)</option></select></div>
          <div style="flex:1"><label>State</label><select id="state"><option value="">Any</option></select></div>
        </div>
        <div class="results" id="results"></div>
        <button class="btn" id="sample-btn" onclick="loadSamples()" style="background:#252838">Show representative orgs per status</button>
      </div>
    </div>

    <div class="panel">
      <div class="ph" style="color:#f59e0b">2. Status &mdash; synthetic</div>
      <div class="form-body">
        <div id="status-box" style="font-size:12px;color:#666">Pick an organization first.</div>
      </div>
    </div>

    <div class="panel">
      <div class="ph" style="color:#2dd4bf">3. Campaign &mdash; lit up by status</div>
      <div class="form-body">
        <div><label>Applicable campaigns</label><select id="campaign"><option value="">Pick an org first...</option></select></div>
        <div><label>Runs (variance sample size)</label><input id="runs" type="number" value="${DEFAULT_RUNS}" min="1" max="10" /></div>
        <button class="btn" id="run-btn" onclick="runPipeline()" disabled>Run pipeline (N runs, fixed temperature)</button>
        <button class="btn btn-danger" id="gate-btn" onclick="proveGate()" disabled>Prove the gate: generate a deliberately fabricated draft</button>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="ph" style="color:#2dd4bf">Pipeline output</div>
    <div class="output-body" id="output">
      <div class="placeholder">
        Pick an <strong>organization</strong>, see its <strong>synthetic status</strong>,<br>choose a <strong>campaign</strong>, then run the pipeline.<br><br>
        The pipeline generates N drafts at a fixed temperature and reports the<br>eval-score <strong>distribution</strong> - not a single pass.
      </div>
    </div>
  </div>
</div>

<script>
var state = { org: null, status: null, campaigns: [] };

function esc(s) {
  var d = document.createElement('div');
  d.textContent = String(s == null ? '' : s);
  return d.innerHTML;
}

async function api(url, payload) {
  var opt = payload
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    : {};
  var res = await fetch(url, opt);
  var data = null;
  try { data = await res.json(); } catch (ignored) {}
  if (!res.ok) throw new Error((data && data.error) ? data.error : 'HTTP ' + res.status + ' on ' + url);
  if (data && data.error) throw new Error(data.error);
  return data;
}

async function boot() {
  var meta = await api('/api/meta');
  var sel = document.getElementById('state');
  meta.states.forEach(function (s) {
    var o = document.createElement('option');
    o.value = s; o.textContent = s;
    sel.appendChild(o);
  });
  search();
}

var timer = null;
function debounced() { clearTimeout(timer); timer = setTimeout(search, 180); }
document.getElementById('q').addEventListener('input', debounced);
document.getElementById('size').addEventListener('change', search);
document.getElementById('state').addEventListener('change', search);

async function search() {
  var q = document.getElementById('q').value;
  var size = document.getElementById('size').value;
  var st = document.getElementById('state').value;
  var url = '/api/orgs?q=' + encodeURIComponent(q) + '&size=' + size + '&state=' + st;
  var orgs = await api(url);
  renderOrgs(orgs);
}

function renderOrgs(orgs) {
  var box = document.getElementById('results');
  if (!orgs.length) { box.innerHTML = '<div style="padding:12px;color:#555;font-size:11px">No matches.</div>'; return; }
  box.innerHTML = orgs.map(function (o) {
    return '<div class="org-row" data-id="' + esc(o.id) + '" onclick="pickOrg(this.dataset.id)">' +
      '<div class="org-name">' + esc(o.name) + '</div>' +
      '<div class="org-meta">NTEE ' + esc(o.ntee) + ' (' + esc(o.ntee_group) + ') &middot; ' +
      esc(o.city) + ', ' + esc(o.state) + ' &middot; ' + esc(o.revenue_display) + '</div></div>';
  }).join('');
}

async function loadSamples() {
  var groups = await api('/api/samples');
  var box = document.getElementById('results');
  box.innerHTML = groups.map(function (g) {
    return '<div style="padding:6px 10px;background:#1a1c26;font-size:10px;color:#f59e0b;font-weight:700;text-transform:uppercase">' +
      esc(g.status.label) + '<span class="synth">synthetic</span></div>' +
      g.orgs.map(function (o) {
        return '<div class="org-row" data-id="' + esc(o.id) + '" onclick="pickOrg(this.dataset.id)">' +
          '<div class="org-name">' + esc(o.name) + '</div>' +
          '<div class="org-meta">' + esc(o.city) + ', ' + esc(o.state) + ' &middot; ' + esc(o.revenue_display) + '</div></div>';
      }).join('');
  }).join('');
}

async function pickOrg(id) {
  var data = await api('/api/select', { orgId: id });
  state.org = data.org;
  state.status = data.status;
  state.campaigns = data.campaigns;

  Array.prototype.forEach.call(document.querySelectorAll('.org-row'), function (r) {
    r.classList.toggle('sel', r.dataset.id === id);
  });

  document.getElementById('status-box').innerHTML =
    '<div style="font-size:14px;font-weight:700;color:#f59e0b">' + esc(data.status.label) +
    '<span class="synth">' + esc(data.status.label_suffix) + '</span></div>' +
    '<div style="font-size:11px;color:#888;margin-top:6px;line-height:1.6">In a real CRM this would mean: ' +
    esc(data.status.meaning) + '</div>' +
    '<div style="font-size:11px;color:#fcd34d;margin-top:8px;line-height:1.6;background:#3a2a10;padding:8px;border-radius:4px">' +
    esc(data.disclaimer) + '</div>';

  var cs = document.getElementById('campaign');
  cs.innerHTML = data.campaigns.map(function (c) {
    return '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>';
  }).join('');
  document.getElementById('run-btn').disabled = false;
  document.getElementById('gate-btn').disabled = false;
}

function out() { return document.getElementById('output'); }
function addStep(id, title) {
  var el = document.createElement('div');
  el.className = 'step active'; el.id = 'step-' + id;
  el.innerHTML = '<div class="step-title">' + title +
    '<span class="loading-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span></div>' +
    '<div class="step-content" id="sc-' + id + '">Working...</div>';
  out().appendChild(el);
  return el;
}
function doneStep(id, html) {
  var s = document.getElementById('step-' + id);
  s.className = 'step done';
  var d = s.querySelector('.loading-dots'); if (d) d.remove();
  document.getElementById('sc-' + id).innerHTML = html;
}
function errStep(id, msg) {
  var s = document.getElementById('step-' + id);
  s.className = 'step error';
  var d = s.querySelector('.loading-dots'); if (d) d.remove();
  document.getElementById('sc-' + id).innerHTML = '<span style="color:#f87171">' + esc(msg) + '</span>';
}

/** Renders email text via textContent - never interpolated into an HTML string. */
function emailBox(parentId, text) {
  var pre = document.createElement('div');
  pre.className = 'email-preview';
  pre.textContent = text;
  document.getElementById(parentId).appendChild(pre);
}

function violList(vios) {
  return vios.map(function (v) {
    return '<div class="viol"><div class="viol-q">"' + esc(v.quote) + '"</div>' +
      '<div class="viol-w"><span class="tag tag-r">' + esc(v.category) + '</span>' +
      '<span class="caught">' + esc(v.caught_by) + '</span><br>' + esc(v.why) + '</div></div>';
  }).join('');
}

function gateBlock(gate) {
  var l = gate.layers;
  return '<div class="layer">' +
    '<div class="layer-box ' + (l.red_line.passed ? 'pass' : 'fail') + '">Layer 1: deterministic red lines<br><strong>' +
    (l.red_line.passed ? 'PASS' : 'FAIL - ' + l.red_line.hits + ' hit(s)') + '</strong></div>' +
    '<div class="layer-box ' + (l.model_judge.passed ? 'pass' : 'fail') + '">Layer 2: model judge (Opus 4.8)<br><strong>' +
    (l.model_judge.passed ? 'PASS' : 'FAIL - ' + l.model_judge.hits + ' hit(s)') + '</strong></div></div>' +
    '<div style="font-size:11px;color:#888;margin-top:6px">Trust risk: <span class="tag ' +
    (gate.trust_risk === 'none' ? 'tag-g' : gate.trust_risk === 'high' ? 'tag-r' : 'tag-y') + '">' +
    esc(gate.trust_risk) + '</span></div>' +
    '<div style="font-size:11px;color:#999;margin-top:6px;line-height:1.6">' + esc(gate.reasoning) + '</div>' +
    (gate.violations.length ? violList(gate.violations) : '');
}

function histogram(stats) {
  var bars = stats.scores.map(function (s) {
    var h = Math.max(3, (s / 100) * 84);
    return '<div class="bar ' + (s === 0 ? 'zero' : '') + '" style="height:' + h + 'px">' +
      '<div class="bar-lbl">' + s + '</div></div>';
  }).join('');
  return '<div class="hist">' + bars + '</div>';
}

async function runPipeline() {
  var btn = document.getElementById('run-btn');
  var gbtn = document.getElementById('gate-btn');
  btn.disabled = true; gbtn.disabled = true;
  btn.textContent = 'Running...';
  out().innerHTML = '';

  var campaignId = document.getElementById('campaign').value;
  var runs = parseInt(document.getElementById('runs').value, 10) || 5;

  addStep('run', 'Generating ' + runs + ' drafts at fixed temperature, gating and scoring each');
  try {
    var r = await api('/api/run', { orgId: state.org.id, campaignId: campaignId, runs: runs });
    var s = r.stats;

    var verdictTag = s.verdict === 'stable' ? 'tag-g' : s.verdict === 'unstable' ? 'tag-y' : 'tag-r';
    doneStep('run',
      '<div style="font-size:11px;color:#888;margin-bottom:4px">' + esc(r.triple.org.name) + ' &middot; ' +
      esc(r.triple.status.label) + ' <span class="synth">synthetic</span> &middot; ' + esc(r.triple.campaign.label) +
      ' &middot; ' + esc(r.config.model) + ' @ temperature ' + r.config.temperature + ' (fixed)</div>' +
      histogram(s) +
      '<div class="metric-grid">' +
      '<div class="metric"><div class="metric-val" style="color:#4a9eff">' + s.mean + '</div><div class="metric-label">mean</div></div>' +
      '<div class="metric"><div class="metric-val" style="color:' + (s.min >= 70 ? '#50c878' : '#f87171') + '">' + s.min + '</div><div class="metric-label">min (floor)</div></div>' +
      '<div class="metric"><div class="metric-val" style="color:#50c878">' + s.max + '</div><div class="metric-label">max</div></div>' +
      '<div class="metric"><div class="metric-val" style="color:' + (s.spread >= 25 ? '#f87171' : s.spread >= 15 ? '#f59e0b' : '#50c878') + '">' + s.spread + '</div><div class="metric-label">spread</div></div>' +
      '<div class="metric"><div class="metric-val" style="color:#888">' + s.stddev + '</div><div class="metric-label">std dev</div></div>' +
      '<div class="metric"><div class="metric-val" style="color:' + (r.gate_failures ? '#f87171' : '#50c878') + '">' + r.gate_failures + '/' + s.n + '</div><div class="metric-label">gate fails</div></div>' +
      '</div>' +
      '<div style="margin-top:10px"><span class="tag ' + verdictTag + '">' + esc(s.verdict) + '</span>' +
      '<span style="font-size:11px;color:#888">&nbsp; bounds: [' + s.min + ', ' + s.max + '] &nbsp;&middot;&nbsp; median ' + s.median + '</span></div>' +
      (r.flags.length ? '<div style="margin-top:8px">' + r.flags.map(function (f) {
        return '<div class="viol"><div class="viol-w">' + esc(f) + '</div></div>';
      }).join('') + '</div>' : '<div style="font-size:11px;color:#50c878;margin-top:8px">Spread within tolerance across ' + s.n + ' identical runs.</div>'));

    // Show each trial's draft + gate result.
    r.trials.forEach(function (t, i) {
      var id = 'trial' + i;
      addStep(id, 'Run ' + (i + 1) + ' of ' + r.trials.length + ' &mdash; score ' + t.score +
        (t.gate_failed ? ' <span class="tag tag-r">GATE FAILED</span>' : ' <span class="tag tag-g">gate passed</span>'));
      doneStep(id, '');
      emailBox('sc-' + id, t.draft.full_text);
      var extra = document.createElement('div');
      extra.innerHTML = '<details><summary>Grounding gate detail</summary>' + gateBlock(t.gate) + '</details>' +
        (t.evaluation ? '<details><summary>Eval scores</summary><div class="metric-grid">' +
          Object.keys(t.evaluation.scores).map(function (k) {
            var v = t.evaluation.scores[k];
            return '<div class="metric"><div class="metric-val" style="color:' + (v >= 8 ? '#50c878' : v >= 6 ? '#f59e0b' : '#f87171') +
              '">' + v + '</div><div class="metric-label">' + esc(k.replace(/_/g, ' ')) + '</div></div>';
          }).join('') + '</div><div style="font-size:11px;color:#999;margin-top:8px;line-height:1.6">' +
          esc(t.evaluation.summary) + '</div></details>' : '');
      document.getElementById('sc-' + id).appendChild(extra);
    });
    btn.textContent = 'Run pipeline (N runs, fixed temperature)';
  } catch (e) {
    errStep('run', e.message);
    btn.textContent = 'Retry';
  }
  btn.disabled = false; gbtn.disabled = false;
}

async function proveGate() {
  var btn = document.getElementById('gate-btn');
  var rbtn = document.getElementById('run-btn');
  btn.disabled = true; rbtn.disabled = true;
  btn.textContent = 'Fabricating...';
  out().innerHTML = '';

  var campaignId = document.getElementById('campaign').value;
  addStep('fab', 'NEGATIVE CONTROL &mdash; instructing the drafter to fabricate, then gating it');
  try {
    var t = await api('/api/prove-gate', { orgId: state.org.id, campaignId: campaignId });
    doneStep('fab',
      '<div style="font-size:11px;color:#f59e0b;margin-bottom:6px">This draft was <strong>deliberately</strong> instructed to invent a ' +
      'relationship, a program, statistics, and a certification. It is a test fixture. The question is whether the gate catches it.</div>');
    emailBox('sc-fab', t.draft.full_text);

    var v = document.createElement('div');
    v.innerHTML = '<div style="margin-top:12px;font-size:13px;font-weight:700;color:' +
      (t.gate.passed ? '#f87171' : '#50c878') + '">' +
      (t.gate.passed ? 'GATE MISSED IT - the fabricated draft passed. This is a bug.' :
        'GATE CAUGHT IT - ' + t.gate.violations.length + ' violation(s), score forced to ' + t.score + '.') +
      '</div>' + gateBlock(t.gate);
    document.getElementById('sc-fab').appendChild(v);
    btn.textContent = 'Prove the gate: generate a deliberately fabricated draft';
  } catch (e) {
    errStep('fab', e.message);
    btn.textContent = 'Retry';
  }
  btn.disabled = false; rbtn.disabled = false;
}

boot();
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const json = (code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(HTML);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/meta') {
      return json(200, {
        sender: { name: SENDER.name, mission: SENDER.mission, aieds_name: SENDER.aieds_name },
        aieds_name_conflict: NAME_CONFLICT,
        dataset: DATASET_META,
        org_count: ORGS.length,
        states: listStates(),
        statuses: STATUSES,
        campaigns: CAMPAIGNS,
        member_source: memberSource.describe(),
        synthetic_statuses: memberSource.isSynthetic(),
        models: { draft: DRAFT_MODEL, judge: EVAL_MODEL, fixed_temperature: FIXED_TEMPERATURE },
        drafts_are_never_sent: true,
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/orgs') {
      return json(200, searchOrgs({
        q: url.searchParams.get('q') || '',
        size: url.searchParams.get('size') || '',
        state: url.searchParams.get('state') || '',
        limit: 30,
      }));
    }

    if (req.method === 'GET' && url.pathname === '/api/samples') {
      return json(200, sampleByStatus(ORGS, 2));
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (d) => (body += d));
      await new Promise((r) => req.on('end', r));
      const data = JSON.parse(body || '{}');

      const org = getOrg(String(data.orgId || ''));
      if (!org) return json(404, { error: 'Unknown organization id.' });
      const status = memberSource.statusFor(org.id);

      if (url.pathname === '/api/select') {
        return json(200, {
          org: { ...org, size_band: sizeBand(org.revenue_usd) },
          status,
          disclaimer: SYNTHETIC_DISCLAIMER,
          synthetic_label: SYNTHETIC_LABEL,
          campaigns: campaignsForStatus(status.id),
        });
      }

      const campaign = getCampaign(String(data.campaignId || ''));
      if (!campaign) return json(400, { error: 'Unknown campaign id.' });
      if (!isApplicable(status.id, campaign.id)) {
        return json(400, {
          error: `Campaign "${campaign.label}" is not applicable to status "${status.label}".`,
        });
      }

      if (url.pathname === '/api/run') {
        const runs = Math.min(Math.max(parseInt(data.runs, 10) || DEFAULT_RUNS, 1), 10);
        return json(200, await runVariance(org, status, campaign, { runs }));
      }

      if (url.pathname === '/api/prove-gate') {
        return json(200, await runTrial(org, status, campaign, { injectFabrication: true }));
      }
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (e) {
    // A handler failure is a server error - say so with the status code.
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log('\n  Nonprofit Mailer - AI Quality Blueprint demo');
  console.log(`\n  Open: http://localhost:${PORT}`);
  console.log(`\n  Sender:     ${SENDER.name} (fixed)`);
  console.log(`  Recipients: ${ORGS.length} real orgs, public IRS/Census data, org-level only`);
  console.log(`  Statuses:   ${memberSource.describe()}`);
  console.log(`  Models:     draft=${DRAFT_MODEL} @ temp ${FIXED_TEMPERATURE} (fixed) | judge=${EVAL_MODEL}`);
  console.log('\n  Drafts are never sent.\n');
});
