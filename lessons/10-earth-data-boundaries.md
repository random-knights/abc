# Lesson 10: Earth Data Boundaries

## Goal

Understand why Earth imagery and satellite examples need strong source,
privacy, and artifact boundaries.

## Concepts

- provider attribution
- API keys
- raw imagery
- derived artifacts
- sensitive coordinates

## Setup

Use these assets for static review:

- `assets/python/earth-vision.py`
- `assets/python/nasa-vision.py`

Do not add real credentials to these files.

## Steps

1. Find every placeholder credential or API key reference.
2. Find where the scripts request imagery or image metadata.
3. Identify any file-writing behavior.
4. Explain why raw imagery should not be committed to this repo.
5. Write a safer derived-artifact alternative.

## Challenge

Sketch a compact evidence artifact with fields for source, region, summary,
confidence, attribution, and limitations.

## Expected Outcome

You can explain why Earth examples should favor source-backed summaries over
raw imagery or sensitive coordinates.

## Cleanup / Reset

Delete any downloaded imagery or generated files from local workspaces.
