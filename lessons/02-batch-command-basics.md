# Lesson 02: Batch Command Basics

## Goal

Learn how simple Windows batch scripts use labels, input, variables, and echo
statements.

## Concepts

- `@echo off`
- `set /p`
- labels and `goto`
- `%random%`
- command-line user experience

## Setup

Use these assets:

- `assets/batch/CALCULATOR.bat`
- `assets/batch/GUESSING GAME.bat`

Open the files in a text editor before running anything.

## Steps

1. Identify the title and first prompt in each script.
2. Find every `set /p` line.
3. Find every `goto` destination.
4. Draw the menu or flow in plain text.
5. Mark any line that changes state or depends on user input.

## Challenge

Rewrite one prompt to be clearer without changing the script behavior. Do this
in a copy inside a local `workspace/` folder.

## Expected Outcome

You can trace a beginner batch script from prompt to branch to result, and you
can explain why reading a script before running it matters.

## Cleanup / Reset

Delete any copied scripts from your local `workspace/` when finished.
