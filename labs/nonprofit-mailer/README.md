# Nonprofit Mailer - RAG-over-datalake retention engine

An LLM reads a nonprofit's datalake - structured donor records, engagement
event logs, and free-text surveys/support notes - determines the best
marketing approach per constituent, and generates retention-focused
follow-up emails through an eval-gated 5-step pipeline.

Demo-safe by construction: the committed lake is fully synthetic (seeded,
reproducible generator), and a documented adapter lets a real datalake
plug in with zero code change.

## Quick start

  cd nonprofit-mailer
  npm install
  $env:ANTHROPIC_API_KEY="sk-ant-..."
  node src/server.js
  Open http://localhost:4000

Pick a constituent in the Retention Engine panel, click Analyze + Recommend,
then Generate Retention Email.

## Architecture walkthrough

  data/demo/*            the synthetic datalake (3 data types)
  data/generate.js       seeded generator (npm run generate-data)
  data/DATA-DICTIONARY.md the datalake contract, field by field
  src/datalake.js        DatalakeAdapter - THE production seam
  src/rag.js             index + retrieval (typed docs, local vectors)
  src/engine.js          LLM marketing/retention decision
  src/ai.js              the 5-step email pipeline (now retention-aware)
  src/server.js          web UI + API

### 1. The datalake ("various data types")

Three data types, not one flat table:
- donors.json: structured records - gift history, RFM rollups, lapse
  signals, membership tier, acquisition channel
- events.jsonl: engagement event log - email opens/clicks, event
  attendance, volunteer hours, page visits
- notes.jsonl: unstructured free text - survey answers, support tickets,
  staff call notes; the part only an LLM can actually read

The demo lake is generated around four sharp personas (lapsed major donor,
engaged small recurring, new one-time, at-risk member) so recommendations
are visibly different per constituent. Same seed, same lake - regenerate
any time with `npm run generate-data`. Zero real PII: names are combined
from a synthetic parts list by a seeded RNG, emails live on example.org.

### 2. RAG retrieval

Every constituent becomes typed documents: a profile doc (structured
record flattened to text), an activity doc (event-log rollup), and one
doc per free-text note. Documents are embedded into a local vector space;
retrieval is cosine similarity.

At question time the engine retrieves (a) ALL of the target constituent's
own documents and (b) the top-k most similar documents from OTHER
constituents - "people like this one" evidence that grounds the segment
call. The UI shows exactly what was retrieved, so the grounding is
inspectable rather than vibes.

The demo embedder is TF-IDF: deterministic, dependency-free, runs
anywhere with zero setup - the right tradeoff for a self-contained demo.
The Embedder seam is one function (embed(texts) -> vectors); swapping in
a hosted embedding model or a real vector DB (pgvector, Pinecone)
replaces one constructor argument.

### 3. The retention decision

src/engine.js sends the retrieved context to Claude and gets a structured
decision: segment (with record-grounded evidence), lapse risk + factors,
recommended approach, channel, timing, an email angle, an explicit
do-not list, and the reasoning. Optimized for retention, not extraction.

### 4. Retention emails through the eval-gated pipeline

The decision becomes a campaign brief that the existing 5-step pipeline
consumes: subject variants -> scoring -> body -> A/B plan -> LLM-as-judge
eval gate. The brief carries the retrieved retention context, so subjects
and body are personalized to the constituent's actual records (and the
do-not list is enforced in-prompt). Nothing ships without passing the
eval step.

### 5. Plugging in a real datalake

Everything downstream consumes the DatalakeAdapter interface - never
files directly. The synthetic generator implements the same contract the
production adapter expects, which is how you know the seam is real:

  DATALAKE_DIR=/path/to/your/export node src/server.js

See data/DATA-DICTIONARY.md for the field-level contract and one-liner
export recipes (SQL COPY, duckdb over Parquet). Identity is not required:
pseudonymous display names and hashed ids work unchanged, because the
prompts consume behavior, not identity.

## Demo script (interview walkthrough)

1. Open the app - the Retention Engine panel is populated from the lake.
2. Pick "patron"-tier constituent -> Analyze: watch it come back as a
   lapsed major donor, high risk, with the impact-report angle pulled
   from their survey text.
3. Open "Retrieved context" - show the exact records the model saw.
4. Generate Retention Email - the 5-step pipeline runs with that context;
   the subject and body reference the constituent's actual situation.
5. Point at DATA-DICTIONARY.md + DATALAKE_DIR: this is where the real
   lake plugs in, zero code change.

## Classic mode

The original generic campaign generator still works: fill the Campaign
Setup form manually and click Generate Campaign.
