#!/usr/bin/env node
/**
 * Job Fit Scorer — Local Server
 * 
 * SETUP (one time):
 *   1. Set your Anthropic API key:
 *      Mac/Linux:  export ANTHROPIC_API_KEY=sk-ant-...
 *      Windows:    set ANTHROPIC_API_KEY=sk-ant-...
 * 
 * RUN:
 *   node job-scorer.js
 *   Then open: http://localhost:3000
 */

const http = require('http');
const https = require('https');

const PORT = 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Job Fit Scorer - AI Career Tool</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0f1117;color:#e8eaf0;min-height:100vh}
.topbar{background:linear-gradient(135deg,#1a1a2e,#2e5c8a);padding:18px 28px;display:flex;justify-content:space-between;align-items:center}
.topbar h1{font-size:17px;font-weight:800;letter-spacing:1px;color:#fff}
.topbar p{font-size:11px;color:rgba(255,255,255,0.55);margin-top:2px}
.key-status{font-size:11px;padding:4px 12px;border-radius:20px;font-weight:600}
.key-ok{background:#1a3a20;color:#50c878}
.key-missing{background:#3a1a1a;color:#f87171}
.main{display:grid;grid-template-columns:1fr 320px;gap:16px;padding:16px;max-width:1200px;margin:0 auto}
.panel{background:#1e2030;border-radius:10px;border:1px solid #2a2d3e;overflow:hidden}
.ph{padding:12px 16px;border-bottom:1px solid #2a2d3e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#4a9eff}
textarea{width:100%;height:360px;background:#252838;border:none;color:#c8cde0;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;padding:14px;resize:none;outline:none;line-height:1.6}
textarea:focus{background:#2a2e44}
textarea::placeholder{color:#3a3d50}
.btn-row{padding:12px 16px;background:#1a1c26;border-top:1px solid #2a2d3e;display:flex;gap:8px}
.btn{padding:9px 20px;border-radius:7px;border:none;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;letter-spacing:0.5px}
.btn-score{background:linear-gradient(135deg,#2e5c8a,#4a9eff);color:white;flex:1}
.btn-score:hover{opacity:0.9}
.btn-score:disabled{opacity:0.4;cursor:not-allowed}
.btn-clear{background:#252838;color:#888;border:1px solid #333}
.btn-clear:hover{background:#2a2d3e;color:#ccc}
.ob{padding:16px;min-height:400px}
.score-hero{text-align:center;padding:20px 0 14px;border-bottom:1px solid #2a2d3e;margin-bottom:14px}
.score-num{font-size:64px;font-weight:900;line-height:1}
.score-title{font-size:12px;color:#888;margin-top:3px}
.verdict{display:inline-block;border-radius:20px;padding:3px 14px;font-size:11px;font-weight:700;margin-top:8px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.mc{background:#252838;border-radius:6px;padding:8px 10px}
.ml{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.5px}
.mv{font-size:12px;font-weight:700;margin-top:2px}
.sl{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#444;margin:12px 0 5px}
.ci{display:flex;gap:8px;padding:6px 8px;border-radius:5px;background:#252838;margin-bottom:4px;font-size:11.5px;color:#b0b5c8;align-items:flex-start;line-height:1.4}
.sum{background:#252838;border-radius:6px;padding:10px 12px;font-size:12px;color:#a0a5b8;line-height:1.6;border-left:3px solid #2e5c8a;margin-top:12px}
.placeholder{text-align:center;padding:80px 20px;color:#333}
.placeholder-icon{font-size:40px;margin-bottom:10px}
.loading{text-align:center;padding:60px 20px;color:#555}
.dots{display:inline-flex;gap:5px;margin-top:14px}
.dot{width:7px;height:7px;border-radius:50%;background:#4a9eff;animation:p 1.2s infinite}
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
@keyframes p{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
.err{background:#3a1a1a;border:1px solid #f87171;border-radius:7px;padding:12px;color:#f87171;font-size:12px;margin-top:10px}
.history-panel{grid-column:1/-1}
.hgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;padding:12px 16px}
.hcard{background:#252838;border-radius:7px;padding:10px;border:1px solid #2a2d3e;cursor:pointer;transition:border-color .15s}
.hcard:hover{border-color:#4a9eff}
.hcs{font-size:22px;font-weight:900}
.hct{font-size:10px;color:#888;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.no-history{padding:14px 16px;color:#444;font-size:12px}
</style>
</head>
<body>
<div class="topbar">
  <div><h1>JOB FIT SCORER -- AI Career Tool</h1><p>Paste a job description and your resume to get an instant match score.</p></div>
  <span class="key-status ${API_KEY ? 'key-ok' : 'key-missing'}">${API_KEY ? '✅ API key loaded' : '⚠️ No API key — set ANTHROPIC_API_KEY'}</span>
</div>
<div class="main">
  <div class="panel">
    <div class="ph">Paste Job Description</div>
    <textarea id="jd" placeholder="Paste the full job description here...&#10;&#10;Include title, company, requirements, salary, and work arrangement for the best score."></textarea>
    <div class="btn-row">
      <button class="btn btn-score" id="sbtn" onclick="score()">⚡ Score This Job</button>
      <button class="btn btn-clear" onclick="clearJob()">Clear</button>
    </div>
    <div style="padding:10px 16px 14px;border-top:1px solid #2a2d3e;display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#a78bfa;">Your Materials (optional but recommended)</div>
        <div style="font-size:10px;color:#444;">Paste for personalized scoring</div>
      </div>
      <div>
        <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Resume or Background Summary</div>
        <textarea id="resume-input" style="width:100%;height:120px;background:#1a1c26;border:1px solid #2a2d3e;color:#b0b5c8;font-size:12px;font-family:Segoe UI,Arial,sans-serif;border-radius:6px;padding:8px 10px;resize:none;outline:none;line-height:1.5;" placeholder="Paste your resume or background summary here -- scorer will flag specific gaps and strengths against the role..."></textarea>
      </div>
      <div>
        <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Cover Letter</div>
        <textarea id="cover-input" style="width:100%;height:100px;background:#1a1c26;border:1px solid #2a2d3e;color:#b0b5c8;font-size:12px;font-family:Segoe UI,Arial,sans-serif;border-radius:6px;padding:8px 10px;resize:none;outline:none;line-height:1.5;" placeholder="Paste your cover letter here -- scorer checks if your pitch aligns with what the role actually needs..."></textarea>
      </div>
    </div>
  </div>
  <div class="panel">
    <div class="ph" style="color:#2dd4bf">Fit Analysis</div>
    <div class="ob" id="output">
      <div class="placeholder"><div class="placeholder-icon">🎯</div><div style="font-size:13px;color:#444">Paste a job and click Score</div></div>
    </div>
  </div>
  <div class="panel history-panel">
    <div class="ph" style="color:#a78bfa">Session History</div>
    <div id="history"><div class="no-history">No jobs scored yet this session.</div></div>
  </div>
</div>
<script>
let hist=[];
function sc(s){return s>=8?'#50c878':s>=6?'#f59e0b':'#f87171'}
function vs(v){
  if(v==='APPLY NOW'||v==='STRONG FIT')return'background:#1a3a20;color:#50c878';
  if(v==='GOOD FIT')return'background:#3a2a10;color:#f59e0b';
  return'background:#3a1a1a;color:#f87171'
}
async function score(){
  const jd=document.getElementById('jd').value.trim();
  if(!jd){alert('Paste a job description first.');return}
  const btn=document.getElementById('sbtn');
  btn.disabled=true;btn.textContent='Scoring...';
  document.getElementById('output').innerHTML='<div class="loading"><div>Analyzing against your profile...</div><div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>';
  try{
    const coverVal = document.getElementById('cover-input')?.value?.trim() || '';
    const resumeVal = document.getElementById('resume-input')?.value?.trim() || '';
    const res=await fetch('/score',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ jd, resume: resumeVal, cover: coverVal })});
    const r=await res.json();
    if(r.error){throw new Error(r.error)}
    render(r);addHist(r);
  }catch(e){
    document.getElementById('output').innerHTML='<div class="err"><strong>Failed.</strong><br>'+e.message+'</div>'
  }
  btn.disabled=false;btn.textContent='⚡ Score This Job'
}
function render(r){
  const c=sc(r.score);
  const remC=r.remote.includes('Remote')?'#50c878':r.remote.includes('On-site')?'#f87171':'#f59e0b';
  const priC=r.priority==='HIGH'?'#50c878':r.priority==='MEDIUM'?'#f59e0b':'#f87171';
  const salWarn=r.salary==='Not listed'?'<div style="font-size:10px;color:#f59e0b;margin-top:3px;">Ask before investing time</div>':'';
  const str=r.strengths.map(s=>'<div class="ci"><span style="color:#50c878;flex-shrink:0">✅</span>'+s+'</div>').join('');
  const gaps=r.gaps.map(g=>'<div class="ci"><span style="color:#f59e0b;flex-shrink:0">⚠️</span>'+g+'</div>').join('');
  const dbs=r.dealbreakers?.length?'<div class="sl">Dealbreakers</div>'+r.dealbreakers.map(d=>'<div class="ci"><span style="color:#f87171;flex-shrink:0">🚫</span><strong>'+d+'</strong></div>').join(''):'';
  document.getElementById('output').innerHTML=\`
    <div class="score-hero">
      <div class="score-num" style="color:\${c}">\${r.score}<span style="font-size:24px;color:#333">/10</span></div>
      <div class="score-title">\${r.title}</div>
      <div class="score-title" style="color:#555">\${r.company}</div>
      <span class="verdict" style="\${vs(r.verdict)}">\${r.verdict}</span>
    </div>
    <div class="meta">
      <div class="mc"><div class="ml">Salary</div><div class="mv" style="font-size:11px;color:#c8cde0">\${r.salary}</div>\${salWarn}</div>
      <div class="mc"><div class="ml">Arrangement</div><div class="mv" style="color:\${remC};font-size:11px">\${r.remote}</div></div>
      <div class="mc" style="grid-column:1/-1"><div class="ml">Priority</div><div class="mv" style="color:\${priC}">\${r.priority}</div></div>
    </div>
    <div class="sl">What lands</div>\${str}
    <div class="sl">Gaps</div>\${gaps}
    \${dbs}
    <div class="sum">\${r.summary}</div>\`
}
function addHist(r){
  hist.unshift(r);
  const g=document.getElementById('history');
  if(hist.length===1)g.innerHTML='<div class="hgrid" id="hgrid"></div>';
  const c=document.createElement('div');
  c.className='hcard';
  c.innerHTML='<div class="hcs" style="color:'+sc(r.score)+'">'+r.score+'/10</div><div class="hct">'+r.title+'</div><div class="hct" style="color:#555">'+r.company+'</div>';
  c.onclick=()=>render(r);
  document.getElementById('hgrid').prepend(c)
}
function clearJob(){
  document.getElementById('jd').value='';
  const c = document.getElementById('cover-input'); if(c) c.value='';
  const r = document.getElementById('resume-input'); if(r) r.value='';
  document.getElementById('output').innerHTML='<div class="placeholder"><div class="placeholder-icon">🎯</div><div style="font-size:13px;color:#444">Paste a job and click Score</div></div>'
}
</script>
</body>
</html>`;

if (!API_KEY) {
  console.log('\n  ⚠️  No API key found.');
  console.log('  Set it first:');
  console.log('    Mac/Linux:  export ANTHROPIC_API_KEY=sk-ant-...');
  console.log('    Windows:    set ANTHROPIC_API_KEY=sk-ant-...\n');
}

const server = http.createServer((req, res) => {

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML.replace('${API_KEY ? \'✅ API key loaded\' : \'⚠️ No API key — set ANTHROPIC_API_KEY\'}', API_KEY ? '✅ API key loaded' : '⚠️ No API key — set ANTHROPIC_API_KEY').replace("'key-ok' : 'key-missing'}", `'${API_KEY ? 'key-ok' : 'key-missing'}'`));
    return;
  }

  if (req.method === 'POST' && req.url === '/score') {
    if (!API_KEY) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No ANTHROPIC_API_KEY set. See terminal for instructions.' }));
      return;
    }

    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const { jd, resume, cover } = JSON.parse(body);

      const prompt = `You are a career advisor scoring job fit for a candidate.

${resume ? `CANDIDATE RESUME:\n${resume}` : 'No resume provided -- score based on job description alone.'}

${cover ? `CANDIDATE COVER LETTER:\n${cover}` : 'No cover letter provided.'}

JOB DESCRIPTION:\n${jd}

Analyze fit between this candidate and this job. If no resume is provided,
give a general analysis of the role difficulty and requirements. If resume
is provided, score specifically against the candidate's actual background.

Respond ONLY with a JSON object, no markdown, no extra text:
{"score":1-10,"title":"job title max 40 chars","company":"company name max 30 chars",
"salary":"listed salary range or Not listed",
"remote":"Remote or Hybrid or On-site or Not specified",
"verdict":"APPLY NOW or STRONG FIT or GOOD FIT or BORDERLINE or SKIP",
"priority":"HIGH or MEDIUM or LOW or SKIP",
"strengths":["strength 1","strength 2","strength 3"],
"gaps":["gap 1","gap 2","gap 3"],
"dealbreakers":[],
"summary":"2-3 sentence honest assessment based on the candidate materials provided"}

Scoring: 9-10 near perfect, 8 strong minor gaps, 7 good 1-2 gaps,
6 backup, 5 borderline, 1-4 skip. Flag 5-day on-site as a dealbreaker
if candidate resume or cover letter signals remote preference.`;

      const payload = JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const apiReq = https.request(options, apiRes => {
        let data = '';
        apiRes.on('data', d => data += d);
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.content?.[0]?.text || '';
            const clean = text.replace(/```json|```/g, '').trim();
            const result = JSON.parse(clean);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to parse API response: ' + e.message }));
          }
        });
      });

      apiReq.on('error', e => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API request failed: ' + e.message }));
      });

      apiReq.write(payload);
      apiReq.end();
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ✅ Job Scorer is running!');
  console.log('');
  console.log(`  👉 Open: http://localhost:${PORT}`);
  console.log('');
  if (API_KEY) {
    console.log('  API key: loaded ✅');
  } else {
    console.log('  API key: MISSING ⚠️');
    console.log('  Set it with: export ANTHROPIC_API_KEY=sk-ant-...');
  }
  console.log('');
  console.log('  Keep this window open. Ctrl+C to stop.');
  console.log('');
});