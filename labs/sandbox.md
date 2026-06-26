# Lab: Sandbox

The sandbox is a place to practice safely without changing source assets.

## Goal

Create a local ignored workspace and confirm git does not track temporary
classroom output.

## Setup

From the repo root, create:

```text
workspace/sandbox/
```

## Steps

1. Create `workspace/sandbox/notes.txt`.
2. Write one sentence about what you want to learn next.
3. Run `git status -sb`.
4. Confirm `workspace/` is ignored.
5. Delete the sandbox folder when you are done.

## Expected Outcome

You can experiment locally without staging generated files, copied scripts, or
temporary notes.

## Cleanup / Reset

Delete `workspace/sandbox/`.
