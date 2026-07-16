/**
 * Nonprofit Mailer — Web UI
 * Run: node src/server.js
 * Open: http://localhost:4000
 */

import http from 'http';
import { generateSubjectLines, scoreSubjectLines, generateEmailBody, generateABTestPlan, evalEmail } from './ai.js';
import { createFileAdapter } from './datalake.js';
import { buildIndex } from './rag.js';
import { analyzeCustomer, campaignBriefFrom } from './engine.js';

const PORT = 4000;

// ── Datalake + RAG index (built once at boot; adapter seam = DATALAKE_DIR) ──
const datalake = createFileAdapter();
const ragIndex = buildIndex(datalake.allCustomers());

// Org defaults applied when the retention engine drafts a campaign brief.
const ORG_DEFAULTS = {
  orgName: 'Habitat for Humanity',
  mission: 'Building affordable homes and empowering communities through homeownership',
  tone: 'Warm, hopeful, community-driven — not guilt-inducing',
  cta: 'Stay With Us — See Your Impact',
};

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nonprofit Mailer — AI Campaign Generator</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0f1117;color:#e8eaf0;min-height:100vh}
.topbar{background:linear-gradient(135deg,#1a1a2e,#2e5c8a);padding:18px 28px;display:flex;justify-content:space-between;align-items:center}
.topbar h1{font-size:17px;font-weight:800;letter-spacing:1px}
.topbar p{font-size:11px;color:rgba(255,255,255,0.55);margin-top:2px}
.badge{background:rgba(255,255,255,0.1);border-radius:20px;padding:4px 14px;font-size:11px;color:rgba(255,255,255,0.7)}
.main{display:grid;grid-template-columns:380px 1fr;gap:16px;padding:16px;max-width:1300px;margin:0 auto}
.panel{background:#1e2030;border-radius:10px;border:1px solid #2a2d3e;overflow:hidden}
.ph{padding:12px 16px;border-bottom:1px solid #2a2d3e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#4a9eff}
.form-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:3px}
input,textarea,select{width:100%;background:#252838;border:1px solid #2a2d3e;color:#e8eaf0;font-size:12px;font-family:'Segoe UI',Arial,sans-serif;border-radius:6px;padding:8px 10px;outline:none;transition:border-color 0.15s}
input:focus,textarea:focus,select:focus{border-color:#4a9eff}
textarea{resize:vertical;min-height:60px}
.btn{width:100%;padding:11px;border-radius:7px;border:none;font-size:13px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#2e5c8a,#4a9eff);color:white;letter-spacing:0.5px;margin-top:4px;transition:opacity 0.15s}
.btn:hover{opacity:0.9}
.btn:disabled{opacity:0.4;cursor:not-allowed}
.output-body{padding:16px;min-height:500px}
.placeholder{text-align:center;padding:80px 20px;color:#333;font-size:13px}
.step{background:#252838;border-radius:8px;padding:12px 14px;margin-bottom:10px;border-left:3px solid #2a2d3e}
.step.done{border-left-color:#50c878}
.step.active{border-left-color:#4a9eff;background:#1a2540}
.step.error{border-left-color:#f87171}
.step-title{font-size:12px;font-weight:700;color:#c8cde0;margin-bottom:6px}
.step-content{font-size:11.5px;color:#888;line-height:1.6}
.subject-card{background:#1a1c26;border-radius:6px;padding:8px 10px;margin:4px 0;border:1px solid #2a2d3e;display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.subject-card.winner{border-color:#50c878;background:#1a2a1a}
.subject-text{font-size:12px;color:#c8cde0;line-height:1.4}
.grade{font-size:18px;font-weight:900;flex-shrink:0}
.email-preview{background:#1a1c26;border-radius:8px;padding:14px;font-size:12px;color:#b0b5c8;line-height:1.8;white-space:pre-wrap;border:1px solid #2a2d3e;font-family:'Courier New',monospace;margin-top:6px}
.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px}
.metric{background:#1a1c26;border-radius:6px;padding:8px;text-align:center}
.metric-val{font-size:20px;font-weight:800}
.metric-label{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px}
.tag{display:inline-block;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700;margin:2px}
.tag-g{background:#1a3a20;color:#50c878}
.tag-y{background:#3a2a10;color:#f59e0b}
.tag-r{background:#3a1a1a;color:#f87171}
.loading-dots{display:inline-flex;gap:4px;margin-left:8px}
.dot{width:5px;height:5px;border-radius:50%;background:#4a9eff;animation:p 1.2s infinite;display:inline-block}
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
@keyframes p{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
</style>
</head>
<body>
<div class="topbar">
  <div><h1>NONPROFIT MAILER</h1><p>AI-powered email campaign generator &nbsp;·&nbsp; By Random Knights</p></div>
  <span class="badge">Powered by Claude</span>
</div>
<div class="main" style="grid-template-columns:380px 1fr">
  <div class="panel" style="grid-column:1/-1">
    <div class="ph" style="color:#a78bfa">Retention Engine - RAG over the datalake</div>
    <div class="form-body" style="flex-direction:row;flex-wrap:wrap;align-items:flex-end;gap:12px">
      <div style="flex:1;min-width:240px"><label>Constituent (from the datalake)</label>
        <select id="cust-select"><option value="">Loading datalake...</option></select>
      </div>
      <button class="btn" id="analyze-btn" style="width:auto;padding:11px 22px;margin:0" onclick="analyzeConstituent()">Analyze + Recommend</button>
      <button class="btn" id="retain-btn" style="width:auto;padding:11px 22px;margin:0;opacity:0.4" disabled onclick="runRetentionCampaign()">Generate Retention Email</button>
    </div>
    <div id="engine-output" style="padding:0 16px 14px;display:none">
      <div id="engine-decision" style="font-size:12px;line-height:1.7;color:#b0b5c8"></div>
      <details style="margin-top:8px"><summary style="font-size:11px;color:#a78bfa;cursor:pointer">Retrieved context (what the LLM actually saw)</summary>
        <div id="engine-retrieved" style="font-size:11px;color:#888;line-height:1.6;margin-top:6px"></div>
      </details>
    </div>
  </div>
  <div class="panel">
    <div class="ph">Campaign Setup</div>
    <div class="form-body">
      <div><label>Organization Name</label><input id="orgName" value="Habitat for Humanity" /></div>
      <div><label>Mission</label><textarea id="mission">Building affordable homes and empowering communities through homeownership</textarea></div>
      <div><label>Target Audience</label><textarea id="audience">Past donors aged 35-65, middle income, community-oriented, donated in the last 2 years</textarea></div>
      <div><label>Campaign Goal</label><input id="goal" value="Drive end-of-year donations to fund 3 new home builds" /></div>
      <div><label>Tone</label><select id="tone">
        <option>Warm, hopeful, community-driven</option>
        <option>Urgent, action-oriented</option>
        <option>Inspiring, visionary</option>
        <option>Grateful, appreciative</option>
        <option>Data-driven, impact-focused</option>
      </select></div>
      <div><label>Key Message</label><textarea id="keyMessage">Your gift before December 31st will help a family have a home for the holidays</textarea></div>
      <div><label>Call to Action</label><input id="cta" value="Give Today — Help a Family Come Home" /></div>
      <div><label>Audience Size</label><input id="audienceSize" value="25,000 subscribers" /></div>
      <button class="btn" id="run-btn" onclick="runPipeline()">Generate Campaign</button>
    </div>
  </div>

  <div class="panel">
    <div class="ph" style="color:#2dd4bf">Pipeline Output</div>
    <div class="output-body" id="output">
      <div class="placeholder">Fill in your campaign details and click Generate Campaign to run the full AI pipeline.</div>
    </div>
  </div>
</div>

<script>
// Retention state: set by analyzeConstituent, consumed by runPipeline so the
// 5-step pipeline writes a personalized retention follow-up, not a blast.
window.__retention = null;

async function loadConstituents() {
  try {
    const res = await fetch('/api/customers');
    const roster = await res.json();
    const sel = document.getElementById('cust-select');
    sel.innerHTML = '<option value="">Pick a constituent...</option>' +
      roster.map(function(c){ return '<option value="'+c.id+'">'+c.display_name+' ('+c.membership_tier+')</option>'; }).join('');
  } catch (e) {
    document.getElementById('cust-select').innerHTML = '<option value="">Datalake unavailable: '+e.message+'</option>';
  }
}
loadConstituents();

async function analyzeConstituent() {
  const id = document.getElementById('cust-select').value;
  if (!id) { alert('Pick a constituent first.'); return; }
  const btn = document.getElementById('analyze-btn');
  btn.disabled = true; btn.textContent = 'Analyzing...';
  const out = document.getElementById('engine-output');
  out.style.display = 'block';
  document.getElementById('engine-decision').innerHTML = 'Retrieving records and asking the strategist model...';
  try {
    const res = await fetch('/api/analyze', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerId:id})});
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || ('HTTP '+res.status));
    const d = data.decision;
    const riskColor = d.lapse_risk==='high' ? '#f87171' : d.lapse_risk==='medium' ? '#f59e0b' : '#50c878';
    document.getElementById('engine-decision').innerHTML =
      '<strong style="color:#c8cde0">Segment:</strong> '+d.segment+
      ' &nbsp;·&nbsp; <strong style="color:#c8cde0">Lapse risk:</strong> <strong style="color:'+riskColor+'">'+d.lapse_risk.toUpperCase()+'</strong>'+
      ' &nbsp;·&nbsp; <strong style="color:#c8cde0">Channel:</strong> '+d.channel+
      ' &nbsp;·&nbsp; <strong style="color:#c8cde0">Timing:</strong> '+d.timing+'<br>'+
      '<strong style="color:#c8cde0">Approach:</strong> '+d.recommended_approach+'<br>'+
      '<strong style="color:#c8cde0">Risk factors:</strong> '+d.risk_factors.join('; ')+'<br>'+
      '<strong style="color:#c8cde0">Avoid:</strong> '+(d.do_not||[]).join('; ')+'<br>'+
      '<span style="color:#888">'+d.reasoning+'</span>';
    document.getElementById('engine-retrieved').innerHTML =
      '<div style="color:#a78bfa;margin-top:4px">Own records:</div>'+
      data.retrieved.own.map(function(r){ return '<div>['+r.type+'] '+r.text+'</div>'; }).join('')+
      '<div style="color:#a78bfa;margin-top:4px">Comparable constituents:</div>'+
      data.retrieved.similar.map(function(r){ return '<div>[sim '+r.similarity+'] ['+r.type+'] '+r.text+'</div>'; }).join('');
    // Pre-fill the campaign form from the engine's brief + arm the button.
    const b = data.brief;
    document.getElementById('orgName').value = b.orgName;
    document.getElementById('mission').value = b.mission;
    document.getElementById('audience').value = b.audience;
    document.getElementById('goal').value = b.goal;
    document.getElementById('keyMessage').value = b.keyMessage;
    document.getElementById('cta').value = b.cta;
    document.getElementById('audienceSize').value = b.audienceSize;
    window.__retention = b.retentionContext;
    const rbtn = document.getElementById('retain-btn');
    rbtn.disabled = false; rbtn.style.opacity = '1';
  } catch (e) {
    document.getElementById('engine-decision').innerHTML = '<span style="color:#f87171">Analysis failed: '+e.message+'</span>';
  }
  btn.disabled = false; btn.textContent = 'Analyze + Recommend';
}

function runRetentionCampaign() { runPipeline(); }

async function runPipeline() {
  const btn = document.getElementById('run-btn');
  btn.disabled = true; btn.textContent = 'Running pipeline...';
  const campaign = {
    orgName: document.getElementById('orgName').value,
    mission: document.getElementById('mission').value,
    audience: document.getElementById('audience').value,
    goal: document.getElementById('goal').value,
    tone: document.getElementById('tone').value,
    keyMessage: document.getElementById('keyMessage').value,
    cta: document.getElementById('cta').value,
    audienceSize: document.getElementById('audienceSize').value,
    // Set by the retention engine; makes every pipeline stage personalize
    // to the retrieved datalake context (see retentionBlock in ai.js).
    retentionContext: window.__retention || undefined
  };
  const out = document.getElementById('output');
  out.innerHTML = '';
  
  function addStep(id, title) {
    const el = document.createElement('div');
    el.className = 'step active'; el.id = 'step-'+id;
    el.innerHTML = '<div class="step-title">'+title+'<span class="loading-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span></div><div class="step-content" id="sc-'+id+'">Working...</div>';
    out.appendChild(el); return el;
  }
  function doneStep(id, html) {
    document.getElementById('step-'+id).className = 'step done';
    document.getElementById('step-'+id).querySelector('.loading-dots').remove();
    document.getElementById('sc-'+id).innerHTML = html;
  }
  function errStep(id, msg) {
    document.getElementById('step-'+id).className = 'step error';
    document.getElementById('sc-'+id).innerHTML = '<span style="color:#f87171">'+msg+'</span>';
  }
  // Fetch wrapper: surfaces HTTP status and server {error} payloads as
  // thrown errors instead of letting callers .map an error object.
  async function callApi(url, payload) {
    const res = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    let data = null;
    try { data = await res.json(); } catch (ignored) {}
    if (!res.ok) throw new Error((data && data.error) ? data.error : 'Server error (HTTP '+res.status+') on '+url);
    if (data && data.error) throw new Error(data.error);
    return data;
  }

  try {
    // Step 1
    addStep(1, 'Step 1 of 5 — Generating subject line variants');
    const subjects = await callApi('/api/subjects', campaign);
    doneStep(1, subjects.subjects.map(s =>
      '<div class="subject-card"><div><div class="subject-text">'+s.text+'</div><span class="tag tag-y">'+s.hook+'</span><span class="tag tag-g">'+s.predicted_open_rate+' est. open rate</span></div></div>'
    ).join(''));

    // Step 2
    addStep(2, 'Step 2 of 5 — Scoring and ranking subject lines');
    const scoring = await callApi('/api/score', {subjects:subjects.subjects,campaign});
    doneStep(2, '<div style="margin-bottom:6px;font-size:12px;color:#50c878;font-weight:700">Winner: "'+scoring.winner+'"</div>'+
      scoring.scored.map(s =>
        '<div class="subject-card'+(s.text===scoring.winner?' winner':'')+'"><div style="flex:1"><div class="subject-text">'+s.text+'</div><div style="font-size:10px;color:#555;margin-top:2px">'+s.recommendation+'</div></div><div class="grade" style="color:'+(s.total>=35?'#50c878':s.total>=28?'#f59e0b':'#f87171')+'">'+s.grade+'</div></div>'
      ).join(''));

    // Step 3
    addStep(3, 'Step 3 of 5 — Generating email body');
    const email = await callApi('/api/email', {campaign,winner:scoring.winner});
    // NOTE: this client script lives inside a SERVER-SIDE template literal,
    // so a single-backslash n here reaches the browser as a REAL newline,
    // producing an unterminated string literal that killed the whole script
    // (runPipeline undefined). The double-backslash form delivers a literal
    // newline escape to the client; pre-wrap .email-preview renders it.
    doneStep(3, '<div style="font-size:11px;color:#888;margin-bottom:6px">'+email.word_count+' words · '+email.reading_time+' read</div><div class="email-preview">Subject: '+scoring.winner+'\\n\\n'+email.full_text+'</div>');

    // Step 4
    addStep(4, 'Step 4 of 5 — Building A/B test plan');
    const winIdx = subjects.subjects.findIndex(s => s.text === scoring.winner);
    const test = await callApi('/api/abtest', {campaign,subjects:subjects.subjects,winnerIndex:winIdx>=0?winIdx:0});
    // Defensive render: for a retention segment-of-one the model sometimes
    // reshapes the plan (e.g. omits success_criteria) - never .map/deref an
    // optional field unguarded.
    const crit = test.success_criteria || {};
    doneStep(4, '<div style="font-size:12px;line-height:1.7;color:#b0b5c8">'+
      '<strong style="color:#c8cde0">Hypothesis:</strong> '+(test.hypothesis||'n/a')+'<br>'+
      '<strong style="color:#c8cde0">Duration:</strong> '+(test.test_duration||'n/a')+' &nbsp;·&nbsp; <strong style="color:#c8cde0">Split:</strong> '+(test.sample_split||'n/a')+'<br>'+
      '<strong style="color:#c8cde0">Success criteria:</strong> '+(crit.open_rate_target||'n/a')+' open rate, '+(crit.click_rate_target||'n/a')+' CTR'+
      '</div>');

    // Step 5
    addStep(5, 'Step 5 of 5 — Running eval framework');
    const ev = await callApi('/api/eval', {emailBody:email,campaign});
    const gradeColor = ev.grade.startsWith('A')?'#50c878':ev.grade.startsWith('B')?'#f59e0b':'#f87171';
    doneStep(5, '<div class="metric-grid">'+
      Object.entries(ev.scores).map(([k,v]) =>
        '<div class="metric"><div class="metric-val" style="color:'+(v>=8?'#50c878':v>=6?'#f59e0b':'#f87171')+'">'+v+'</div><div class="metric-label">'+k.replace(/_/g,' ')+'</div></div>'
      ).join('')+
      '</div><div style="margin-top:10px;font-size:12px;color:#b0b5c8;line-height:1.6">'+
      '<strong style="color:'+(ev.approved_for_send?'#50c878':'#f87171')+'">'+(ev.approved_for_send?'✅ Approved for send':'⚠️ Review before sending')+'</strong> &nbsp; Grade: <strong style="color:'+gradeColor+'">'+ev.grade+'</strong> ('+ev.total+'/'+ev.max_possible+')<br>'+
      ev.eval_summary+'</div>'+
      (ev.improvements.length?'<div style="margin-top:8px">'+ev.improvements.map(i=>'<div class="tag tag-y">'+i+'</div>').join('')+'</div>':'')+
      '</div>');

    btn.textContent = 'Generate New Campaign';
  } catch(e) {
    out.innerHTML += '<div style="background:#3a1a1a;border-radius:8px;padding:12px;color:#f87171;font-size:12px;margin-top:10px"><strong>Pipeline error:</strong> '+e.message+'</div>';
    btn.textContent = 'Retry';
  }
  btn.disabled = false;
}
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const setJSON = () => res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
    return;
  }

  // Datalake roster (adapter-backed; no PII beyond synthetic display names).
  if (req.method === 'GET' && req.url === '/api/customers') {
    setJSON();
    res.end(JSON.stringify(datalake.listCustomers()));
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    await new Promise(r => req.on('end', r));
    const data = JSON.parse(body);

    try {
      // Retention engine: RAG-retrieve the constituent's context, get the
      // structured marketing decision, and draft the campaign brief the
      // 5-step pipeline consumes.
      if (req.url === '/api/analyze') {
        const bundle = datalake.getCustomer(String(data.customerId || ''));
        if (!bundle) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unknown constituent id.' })); return;
        }
        const { decision, retrieved } = await analyzeCustomer(ragIndex, bundle.profile.customer_id);
        const brief = campaignBriefFrom(decision, bundle.profile, ORG_DEFAULTS);
        setJSON();
        res.end(JSON.stringify({ decision, retrieved, brief })); return;
      }
      if (req.url === '/api/subjects') {
        const result = await generateSubjectLines(data, 5);
        setJSON(); res.end(JSON.stringify(result)); return;
      }
      if (req.url === '/api/score') {
        const result = await scoreSubjectLines(data.subjects, data.campaign);
        setJSON(); res.end(JSON.stringify(result)); return;
      }
      if (req.url === '/api/email') {
        const result = await generateEmailBody(data.campaign, data.winner);
        setJSON(); res.end(JSON.stringify(result)); return;
      }
      if (req.url === '/api/abtest') {
        const result = await generateABTestPlan(data.campaign, data.subjects, data.winnerIndex);
        setJSON(); res.end(JSON.stringify(result)); return;
      }
      if (req.url === '/api/eval') {
        const result = await evalEmail(data.emailBody, data.campaign);
        setJSON(); res.end(JSON.stringify(result)); return;
      }
    } catch (e) {
      // A handler failure is a server error - say so with the status code
      // (a 200 wrapping {error} hid failures from res.ok checks).
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message })); return;
    }
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('\n  ✅ Nonprofit Mailer is running!');
  console.log(`\n  👉 Open: http://localhost:${PORT}`);
  console.log('\n  Full AI pipeline:');
  console.log('    1. Generate subject line variants');
  console.log('    2. Score and rank by predicted engagement');
  console.log('    3. Generate email body for winner');
  console.log('    4. Build A/B test plan');
  console.log('    5. Run eval framework on output');
  console.log('\n  Ctrl+C to stop.\n');
});
