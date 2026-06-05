# Lab 06: Script Safety Review

## Goal

Perform a static safety review of a risky batch script without running it.

## Concepts

- static review
- destructive command detection
- admin behavior
- run/no-run decision

## Setup

Use this source file for review only:

- `assets/batch/MR.ROBOT PC-CLEAN.bat`

Do not copy or run the script. Review it in a text editor.

## Steps

1. Search for `del`.
2. Search for `rd`.
3. Search for admin or elevation behavior.
4. List three commands that could modify the machine.
5. Mark the final decision as `do not run`.

## Challenge

Write a short review summary:

```text
Decision: do not run
Reason:
Safer classroom use:
```

## Expected Outcome

You can defend a no-run decision using evidence from the script.

## Cleanup / Reset

No cleanup is needed because the script must not be executed.
