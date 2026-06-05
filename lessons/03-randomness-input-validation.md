# Lesson 03: Randomness And Input Validation

## Goal

Understand how beginner scripts use random values and why input validation is
needed before generated output is trusted.

## Concepts

- `%random%`
- generated values
- weak versus strong randomness
- input branches
- validation messages

## Setup

Use these assets:

- `assets/batch/GUESSING GAME.bat`
- `assets/batch/PASSWORD GENERATOR.bat`

These scripts are classroom samples. Do not use generated values as real
passwords.

## Steps

1. Find where each script uses `%random%`.
2. Identify what range or shape the output has.
3. Find what happens when the user enters an unexpected option.
4. Write one safer validation rule for each script.
5. Explain why a classroom password generator is not a security tool.

## Challenge

Draft helper text that clearly labels generated values as practice-only.

## Expected Outcome

You can describe the difference between a random classroom demo and a real
security-grade generator.

## Cleanup / Reset

No generated passwords or notes should be committed.
