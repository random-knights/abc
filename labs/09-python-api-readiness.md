# Lab 09: Python API Readiness

## Goal

Review small API scripts and classify their execution readiness.

## Concepts

- endpoint inventory
- dependency readiness
- demo keys
- optional network execution
- safe output

## Setup

Use these files:

- `assets/python/iss-tracking.py`
- `assets/python/asteroid-tracking.py`

Create:

```text
workspace/python-api-readiness/review.md
```

## Steps

1. List imports for each script.
2. List every URL.
3. Mark whether the script needs an API key.
4. Mark whether it prints broad public data or local/private data.
5. Decide if the script is safe to run in class as-is.

## Challenge

Write a review table with columns: script, dependency, network, key required,
safe default.

## Expected Outcome

You can explain what must be checked before a classroom script makes a network
request.

## Cleanup / Reset

Delete `workspace/python-api-readiness/`. Do not commit responses or local
environment files.
