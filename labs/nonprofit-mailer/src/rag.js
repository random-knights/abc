/**
 * RAG layer: index the datalake, retrieve the relevant constituent context.
 *
 * DESIGN
 * Every customer becomes a set of typed DOCUMENTS:
 *   - profile doc:  the structured record flattened to text (giving history,
 *                    RFM, tier, channel) so lexical/semantic search sees it
 *   - activity doc: the event log rolled up (opens, clicks, attendance,
 *                    volunteer hours, recent visits)
 *   - note docs:    each unstructured text verbatim (surveys, support notes)
 *
 * Documents are embedded into a local vector space and retrieval is cosine
 * similarity. The demo embedder is TF-IDF (deterministic, dependency-free,
 * runs anywhere with zero setup - the right call for a self-contained demo).
 * The Embedder interface is one function: embed(texts) -> vectors. Swapping
 * in a hosted embedding model (Voyage, Vertex, OpenAI) or a real vector DB
 * (pgvector, Pinecone) replaces ONE constructor argument; index/retrieve
 * call sites do not change.
 *
 * Retrieval at question time does two things:
 *   1. pulls ALL of the target customer's own documents (their full context)
 *   2. retrieves the top-k most similar documents from OTHER customers -
 *      the "constituents like this one" evidence the LLM uses to ground its
 *      segment call and approach recommendation.
 */

// ── Tokenizer + TF-IDF embedder (the demo Embedder implementation) ─────────
const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on',
  'for', 'at', 'is', 'was', 'were', 'be', 'been', 'this', 'that', 'with',
  'by', 'from', 'as', 'it', 'its', 'their', 'our', 'we', 'they', 'i']);

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function createTfIdfEmbedder() {
  return {
    /** embed(texts) -> sparse vectors (Map term->weight), fit on the corpus. */
    embed(texts) {
      const docsTokens = texts.map(tokenize);
      const df = new Map();
      for (const tokens of docsTokens) {
        for (const term of new Set(tokens)) df.set(term, (df.get(term) || 0) + 1);
      }
      const n = texts.length;
      return docsTokens.map((tokens) => {
        const tf = new Map();
        for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
        const vec = new Map();
        let norm = 0;
        for (const [term, count] of tf) {
          const idf = Math.log((n + 1) / ((df.get(term) || 0) + 1)) + 1;
          const w = (count / tokens.length) * idf;
          vec.set(term, w);
          norm += w * w;
        }
        norm = Math.sqrt(norm) || 1;
        for (const [term, w] of vec) vec.set(term, w / norm);
        return vec;
      });
    },
  };
}

function cosine(a, b) {
  // Vectors are L2-normalized sparse maps: dot product = cosine.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, w] of small) {
    const other = large.get(term);
    if (other !== undefined) dot += w * other;
  }
  return dot;
}

// ── Document construction (datalake bundle -> typed docs) ──────────────────
export function customerDocuments(bundle) {
  const p = bundle.profile;
  const docs = [];
  docs.push({
    customerId: p.customer_id,
    type: 'profile',
    text:
      `Constituent ${p.display_name}, tier ${p.membership_tier}, acquired via ` +
      `${p.acquisition_channel}. ${p.gift_count} gifts totaling $${p.total_given_usd} ` +
      `(largest $${p.largest_gift_usd}). ${p.is_recurring ? 'Recurring donor.' : 'Not recurring.'} ` +
      `Last gift ${p.days_since_last_gift} days ago. RFM: recency ${p.rfm.recency_days} days, ` +
      `frequency ${p.rfm.frequency_24mo} gifts / 24mo, monetary $${p.rfm.monetary_24mo} / 24mo.`,
  });
  const counts = {};
  let volunteerHours = 0;
  const pages = [];
  for (const e of bundle.events) {
    counts[e.type] = (counts[e.type] || 0) + 1;
    if (e.type === 'volunteer_hours') volunteerHours += e.hours || 0;
    if (e.type === 'page_visit' && e.page) pages.push(e.page);
  }
  const opens = counts.email_open || 0;
  const sends = counts.email_sent || 0;
  docs.push({
    customerId: p.customer_id,
    type: 'activity',
    text:
      `Engagement rollup: ${sends} emails sent, ${opens} opened ` +
      `(${sends ? Math.round((100 * opens) / sends) : 0}% open rate), ` +
      `${counts.email_click || 0} clicks, ${counts.event_attended || 0} events attended, ` +
      `${volunteerHours} volunteer hours, recent site pages: ${pages.slice(0, 6).join(' ') || 'none'}.`,
  });
  for (const note of bundle.notes) {
    docs.push({
      customerId: p.customer_id,
      type: `text:${note.source}`,
      text: `${note.source} (${note.date}): ${note.text}`,
    });
  }
  return docs;
}

// ── Index + retrieval ───────────────────────────────────────────────────────
export function buildIndex(bundles, embedder = createTfIdfEmbedder()) {
  const docs = bundles.flatMap(customerDocuments);
  const vectors = embedder.embed(docs.map((d) => d.text));
  const queryEmbedder = createQueryEmbedder(docs, vectors);
  return {
    size: docs.length,

    /** All of one customer's own documents (their full retrieved context). */
    ownDocuments(customerId) {
      return docs.filter((d) => d.customerId === customerId);
    },

    /**
     * Top-k documents from OTHER customers most similar to this customer's
     * combined context - the comparable-constituent evidence.
     */
    similarDocuments(customerId, k = 6) {
      const ownIdx = docs
        .map((d, i) => (d.customerId === customerId ? i : -1))
        .filter((i) => i >= 0);
      if (ownIdx.length === 0) return [];
      const scored = [];
      for (let i = 0; i < docs.length; i++) {
        if (docs[i].customerId === customerId) continue;
        let best = 0;
        for (const oi of ownIdx) best = Math.max(best, cosine(vectors[oi], vectors[i]));
        scored.push({ doc: docs[i], score: best });
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, k).map((s) => ({ ...s.doc, similarity: Number(s.score.toFixed(3)) }));
    },

    /** Free-text retrieval over the whole lake (top-k). */
    search(query, k = 8) {
      const qv = queryEmbedder(query);
      const scored = docs.map((doc, i) => ({ doc, score: cosine(qv, vectors[i]) }));
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, k).map((s) => ({ ...s.doc, similarity: Number(s.score.toFixed(3)) }));
    },
  };
}

// Query vectors reuse the corpus document-frequency statistics so query and
// document space agree (standard TF-IDF practice).
function createQueryEmbedder(docs, vectors) {
  const df = new Map();
  for (const vec of vectors) {
    for (const term of vec.keys()) df.set(term, (df.get(term) || 0) + 1);
  }
  const n = docs.length;
  return function embedQuery(query) {
    const tokens = tokenize(query);
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    const vec = new Map();
    let norm = 0;
    for (const [term, count] of tf) {
      const idf = Math.log((n + 1) / ((df.get(term) || 0) + 1)) + 1;
      const w = (count / (tokens.length || 1)) * idf;
      vec.set(term, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [term, w] of vec) vec.set(term, w / norm);
    return vec;
  };
}
