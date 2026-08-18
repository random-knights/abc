# Lesson 13: Production Monitoring

After lessons 09, 11, and 12, run `course.py 13`. The monitor reads experiment
and AIEDS JSONL, checks both-provider coverage, counts deterministic failures,
and blocks the example release gate on any core safety regression.

Do not place raw recipients, addresses, drafts, or feedback into a golden set.
Review, de-identify, label, and version every production example first.
