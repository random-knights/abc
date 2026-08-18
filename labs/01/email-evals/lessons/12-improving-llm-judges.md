# Lesson 12: Improving Email Judges

Run `course.py 12 --provider both`. A baseline safety judge and a rubric-driven
judge classify three deterministic cases: safe copy, an invented gift, and an
unsupported numeric result.

Measure judge agreement against labels before scaling it. Keep code checks for
red lines even when the judge agrees every time.
