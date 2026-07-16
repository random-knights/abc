# Datalake contract - data dictionary

The engine consumes a directory of three files (the DatalakeAdapter
contract in src/datalake.js). Point DATALAKE_DIR at any directory with
this shape - a warehouse export works with zero code change:

  DATALAKE_DIR=/path/to/export node src/server.js

Exporting from a real lake: any CSV/Parquet/SQL source maps onto these
files with a one-liner per table (examples at the bottom).

## donors.json - structured constituent records (JSON array)

| field                | type    | notes                                        |
|----------------------|---------|----------------------------------------------|
| customer_id          | string  | stable unique id (join key for all files)    |
| display_name         | string  | demo data is synthetic; real deployments may pass a pseudonym - the engine never needs a real name |
| email                | string  | demo uses example.org; not used by the engine |
| membership_tier      | string  | e.g. supporter / member / patron / benefactor |
| acquisition_channel  | string  | how they first arrived                       |
| first_gift_date      | date    | ISO yyyy-mm-dd                               |
| last_gift_date       | date    | ISO yyyy-mm-dd                               |
| gift_count           | int     | lifetime                                     |
| total_given_usd      | number  | lifetime                                     |
| largest_gift_usd     | number  | lifetime max                                 |
| is_recurring         | bool    | any active recurring gift                    |
| days_since_last_gift | int     | recency signal                               |
| rfm.recency_days     | int     | RFM rollup (precompute in the warehouse)     |
| rfm.frequency_24mo   | int     | gifts in trailing 24 months                  |
| rfm.monetary_24mo    | number  | dollars in trailing 24 months                |

Fields not listed are carried through untouched; `_demo_*` fields are
demo narration only and are never shown to the model.

## events.jsonl - engagement event log (one JSON object per line)

| field       | type   | notes                                              |
|-------------|--------|----------------------------------------------------|
| customer_id | string | join key                                           |
| type        | string | email_sent, email_open, email_click, event_attended, volunteer_hours, page_visit |
| date        | date   | ISO yyyy-mm-dd                                     |
| campaign    | string | (email_* rows) campaign identifier                 |
| event       | string | (event_attended rows) event identifier             |
| hours       | number | (volunteer_hours rows)                             |
| page        | string | (page_visit rows) path visited                     |

## notes.jsonl - unstructured text (one JSON object per line)

| field       | type   | notes                                              |
|-------------|--------|----------------------------------------------------|
| customer_id | string | join key                                           |
| source      | string | survey, support, staff_note, call_log              |
| date        | date   | ISO yyyy-mm-dd                                     |
| text        | string | free text - the part the LLM must actually read    |

## Export examples

SQL warehouse:
  COPY (SELECT ... FROM donors)  TO 'donors.json'  (FORMAT JSON, ARRAY true);
  COPY (SELECT ... FROM events)  TO 'events.jsonl' (FORMAT JSON);
  COPY (SELECT ... FROM notes)   TO 'notes.jsonl'  (FORMAT JSON);

Parquet (duckdb one-liner per file):
  COPY (SELECT * FROM 'events.parquet') TO 'events.jsonl' (FORMAT JSON);

PII note: the engine's prompts need behavior, not identity. A production
deployment can pass pseudonymous display names and hashed ids; nothing
downstream changes.
