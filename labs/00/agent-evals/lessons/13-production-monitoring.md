# Lesson 13: Production Monitoring

## Source Basis

Transcript-derived. No notebook was provided for lesson 13.

## Run

After lessons 09, 11, and 12:

```powershell
.\.venv\Scripts\python.exe course.py 13
```

The monitor reads local experiment and AIEDS JSONL, counts provider coverage,
and reports detections of the known chart defect. The known defect blocks the
example release gate. It is evidence, not a reason to weaken the evaluator.

Production adds novel inputs, model updates, API failures, drift, and user
feedback. Curate representative failures into a reviewed golden dataset. Run
the same experiments in delivery gates and compare changes over time.

## AIEDS

Monitoring combines quality with model-call volume, latency, energy, carbon,
and tree-time. A quality improvement that sharply increases resource impact is
a tradeoff to judge, not an automatic win.

## Next Boundary

Do not auto-train from raw user feedback. Label, review, de-identify, and version
examples before they enter a golden dataset.
