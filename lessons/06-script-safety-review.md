# Lesson 06: Script Safety Review

## Goal

Learn how to inspect a script for risky commands before executing it.

## Concepts

- destructive commands
- admin elevation
- file deletion
- system inspection
- safe review boundaries

## Setup

Use this asset for static review only:

- `assets/batch/MR.ROBOT PC-CLEAN.bat`

Do not run this script. It contains cleanup and deletion commands that can
modify a Windows machine.

## Steps

1. Search for `del`, `rd`, `rmdir`, and admin-elevation behavior.
2. Mark every command that can delete files.
3. Mark every command that reads system information.
4. Separate "safe to discuss" from "unsafe to execute".
5. Write a recommendation for how this script should be handled in class.

## Challenge

Draft a safety checklist for reviewing any script before running it.

## Expected Outcome

You can explain why inspection is a valid learning activity even when execution
is not safe.

## Cleanup / Reset

No execution should happen. No cleanup should be needed.
