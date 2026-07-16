/**
 * Datalake adapter layer.
 *
 * THE SEAM: everything downstream (RAG index, retention engine, email
 * pipeline) consumes the DatalakeAdapter interface below - never files
 * directly. The synthetic demo data and a real warehouse export implement
 * the SAME interface, so pointing the engine at real data is a config
 * change (DATALAKE_DIR), not a code change.
 *
 * Contract (see data/DATA-DICTIONARY.md for field-level docs):
 *   <dir>/donors.json   structured records  - one object per constituent
 *   <dir>/events.jsonl  event log           - one engagement event per line
 *   <dir>/notes.jsonl   unstructured text   - one free-text document per line
 *
 * A real datalake plugs in by exporting those three files (CSV-to-JSON /
 * Parquet-to-JSONL is a one-liner in any warehouse), or by implementing
 * another adapter with the same three methods.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Default: the committed synthetic demo lake (regenerate: npm run generate-data). */
export const DEFAULT_DATALAKE_DIR = join(__dirname, '..', 'data', 'demo');

function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

/**
 * File-based DatalakeAdapter. `dir` defaults to the synthetic demo lake;
 * set DATALAKE_DIR to point at a real export with the same shape.
 */
export function createFileAdapter(dir = process.env.DATALAKE_DIR || DEFAULT_DATALAKE_DIR) {
  const donors = JSON.parse(readFileSync(join(dir, 'donors.json'), 'utf8'));
  const events = readJsonl(join(dir, 'events.jsonl'));
  const notes = readJsonl(join(dir, 'notes.jsonl'));

  const eventsByCustomer = new Map();
  for (const e of events) {
    if (!eventsByCustomer.has(e.customer_id)) eventsByCustomer.set(e.customer_id, []);
    eventsByCustomer.get(e.customer_id).push(e);
  }
  const notesByCustomer = new Map();
  for (const n of notes) {
    if (!notesByCustomer.has(n.customer_id)) notesByCustomer.set(n.customer_id, []);
    notesByCustomer.get(n.customer_id).push(n);
  }

  return {
    /** Lightweight roster for pickers: [{id, display_name, membership_tier}] */
    listCustomers() {
      return donors.map((d) => ({
        id: d.customer_id,
        display_name: d.display_name,
        membership_tier: d.membership_tier,
      }));
    },

    /**
     * Everything the lake knows about one constituent:
     * {profile, events[], notes[]}. Null when unknown.
     */
    getCustomer(id) {
      const profile = donors.find((d) => d.customer_id === id);
      if (!profile) return null;
      return {
        profile,
        events: eventsByCustomer.get(id) || [],
        notes: notesByCustomer.get(id) || [],
      };
    },

    /** Every customer bundle (index-building). */
    allCustomers() {
      return donors.map((d) => this.getCustomer(d.customer_id));
    },
  };
}
