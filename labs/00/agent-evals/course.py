"""Command-line entry point for the self-contained agent evals course."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from l3_agent.evaluations import (
    EvaluationResult,
    chart_data_fidelity,
    expected_tool_choice,
    generated_code_compiles,
    llm_clarity_judge,
    llm_entity_judge,
    llm_tool_call_judge,
    run_evaluation_suite,
    sql_result_matches,
)
from l3_agent.experiments import CourseExample, run_course_experiment
from l3_agent.observability import tracing
from l3_agent.router import RunTranscript
from l3_agent.runner import (
    DEFAULT_QUERY,
    EXPERIMENT_PATH,
    OUTPUT_DIR,
    TRACE_PATH,
    flush_tracing,
    make_judge,
    make_trace_sink,
    provider_names,
    run_query,
)


CONVERGENCE_QUESTIONS = [
    "What was the average quantity sold per transaction?",
    "What is the mean number of items per sale?",
    "Calculate the typical quantity per transaction.",
    "What is the average basket size per sale?",
    "How many items does a customer buy on average per transaction?",
]

OVERALL_CASES = [
    CourseExample(
        input={
            "case_id": "chart-sales-by-store",
            "question": "Create a bar chart showing total sales by store in November 2021.",
        },
        expected={
            "tools": ["lookup_sales_data", "generate_visualization"],
            "sql_result": "1320 4903.81 1401 4857.91 1776 4703.10 2021 4617.73",
        },
        metadata={"known_defect": "placeholder chart data"},
    ),
    CourseExample(
        input={
            "case_id": "total-revenue",
            "question": "What was the total revenue across all stores?",
        },
        expected={"tools": ["lookup_sales_data"], "sql_result": "19082.55"},
    ),
    CourseExample(
        input={
            "case_id": "popular-sku",
            "question": "What was the most popular product SKU by units sold?",
        },
        expected={"tools": ["lookup_sales_data"], "sql_result": "SKU-COFFEE 1188"},
    ),
]

SQL_PROMPT_V2 = """
Generate an SQL query based on a prompt.
Return only SQL, with no Markdown fences or explanation.
Use only the listed columns and table.
The prompt is: {prompt}

The available columns are: {columns}
The table name is: {table_name}

Think before you respond.
""".strip()


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("lesson", choices=["03", "05", "06", "07", "08", "09", "10", "11", "12", "13", "all"])
    parser.add_argument(
        "--provider",
        choices=["openai", "anthropic", "both"],
        default="both",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Use the expanded course datasets instead of the verification subset.",
    )
    return parser


def _save_transcript(lesson: str, transcript: RunTranscript) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / f"lesson-{lesson}-{transcript.provider}.txt"
    path.write_text(transcript.render(), encoding="utf-8")


def _print_results(provider: str, results: list[EvaluationResult]) -> None:
    print(f"EVALUATIONS provider={provider}")
    for result in results:
        marker = "EXPECTED_DEFECT" if result.expected_failure else "RESULT"
        print(
            f"{marker} name={result.name} label={result.label} score={result.score:.3f}"
        )
        print(f"  {result.explanation[:500]}")


def lesson_03(selection: str) -> None:
    trace = make_trace_sink()
    for provider in provider_names(selection):
        transcript = run_query(
            provider,
            DEFAULT_QUERY,
            trace=trace,
            prefix=f"lesson-03-{provider}",
        )
        _save_transcript("03", transcript)
        print(transcript.render())
        if transcript.error:
            raise RuntimeError(f"Lesson 03 failed for {provider}: {transcript.error}")


def lesson_05(selection: str) -> None:
    print(tracing.status_line())
    trace = make_trace_sink()
    for provider in provider_names(selection):
        transcript = run_query(
            provider,
            DEFAULT_QUERY,
            trace=trace,
            prefix=f"lesson-05-{provider}",
        )
        _save_transcript("05", transcript)
        print(
            f"TRACE_RUN provider={provider} tools={transcript.tool_sequence} "
            f"path_length={transcript.as_experiment_output()['path_length']}"
        )
        if transcript.error:
            raise RuntimeError(f"Lesson 05 failed for {provider}: {transcript.error}")


def lesson_06() -> None:
    plan = {
        "router": ["ground-truth tool choice", "LLM tool-call judge"],
        "lookup_sales_data": ["SQL result ground truth"],
        "analyze_sales_data": ["clarity judge", "entity judge"],
        "generate_visualization": ["code compiles", "chart data fidelity"],
        "human": ["annotate disagreements and novel failures"],
    }
    print(json.dumps(plan, indent=2))


def lesson_07(selection: str) -> None:
    trace = make_trace_sink()
    for provider in provider_names(selection):
        transcript = run_query(
            provider,
            DEFAULT_QUERY,
            trace=trace,
            prefix=f"lesson-07-agent-{provider}",
        )
        if transcript.error:
            raise RuntimeError(f"Lesson 07 agent failed for {provider}: {transcript.error}")
        judge = make_judge(provider, trace=trace, prefix=f"lesson-07-judge-{provider}")
        results = run_evaluation_suite(
            transcript,
            judge=judge,
            expected_tools=["lookup_sales_data", "generate_visualization"],
            expected_sql_result="1320 4903.81 1401 4857.91 1776 4703.10 2021 4617.73",
        )
        _print_results(provider, results)
        fidelity = next(result for result in results if result.name == "chart_data_fidelity")
        if fidelity.label != "placeholder_data":
            raise RuntimeError("The verified placeholder-data defect was not reproduced.")


def lesson_08(selection: str, *, full: bool) -> None:
    trace = make_trace_sink()
    questions = CONVERGENCE_QUESTIONS if full else CONVERGENCE_QUESTIONS[:2]
    for provider in provider_names(selection):
        lengths: list[int] = []
        for index, question in enumerate(questions, start=1):
            transcript = run_query(
                provider,
                question,
                trace=trace,
                prefix=f"lesson-08-{provider}-{index}",
            )
            if transcript.error:
                raise RuntimeError(f"Lesson 08 failed for {provider}: {transcript.error}")
            lengths.append(int(transcript.as_experiment_output()["path_length"]))
        optimal = min(lengths)
        scores = [optimal / length for length in lengths]
        print(
            f"TRAJECTORY provider={provider} path_lengths={lengths} "
            f"optimal={optimal} convergence={sum(scores) / len(scores):.3f}"
        )


def lesson_09(selection: str, *, full: bool) -> None:
    trace = make_trace_sink()
    questions = CONVERGENCE_QUESTIONS if full else CONVERGENCE_QUESTIONS[:3]
    for provider in provider_names(selection):
        outputs: dict[str, dict[str, Any]] = {}
        examples: list[CourseExample] = []
        for index, question in enumerate(questions, start=1):
            case_id = f"convergence-{index}"
            transcript = run_query(
                provider,
                question,
                trace=trace,
                prefix=f"lesson-09-{provider}-{index}",
            )
            if transcript.error:
                raise RuntimeError(f"Lesson 09 failed for {provider}: {transcript.error}")
            outputs[case_id] = {"case_id": case_id, **transcript.as_experiment_output()}
            examples.append(CourseExample(input={"case_id": case_id, "question": question}))
        optimal = min(int(output["path_length"]) for output in outputs.values())

        def task(input: dict[str, Any]) -> dict[str, Any]:
            return outputs[str(input["case_id"])]

        def convergence(output: dict[str, Any], **_: Any) -> dict[str, Any]:
            score = optimal / float(output["path_length"])
            return {
                "score": score,
                "label": "optimal" if score == 1.0 else "longer_path",
                "explanation": f"optimal={optimal} actual={output['path_length']}",
            }

        record = run_course_experiment(
            name=f"lesson-09-convergence-{provider}",
            description="Equivalent questions measured against the shortest observed path.",
            examples=examples,
            task=task,
            evaluators={"convergence": convergence},
        )
        print(
            f"EXPERIMENT provider={provider} backend={record['backend']} "
            f"optimal_path_length={optimal} cases={len(examples)}"
        )


def lesson_10() -> None:
    structure = {
        "dataset": "representative inputs plus ground truth where available",
        "task": "one version of the agent or evaluator",
        "evaluators": "router, SQL, clarity, entity, convergence, chart fidelity",
        "comparison": "hold dataset and evaluators fixed while changing one variable",
        "release_gate": "known failures stay visible and new regressions block release",
    }
    print(json.dumps(structure, indent=2))


def _transcript_from_output(
    input: dict[str, Any], output: dict[str, Any]
) -> RunTranscript:
    return RunTranscript(
        provider=str(output["provider"]),
        model=str(output["model"]),
        query=str(input["question"]),
        tool_sequence=list(output.get("tool_sequence", [])),
        tool_calls=list(output.get("tool_calls", [])),
        tool_responses=list(output.get("tool_responses", [])),
        final_response=str(output.get("final_output", "")),
        error=output.get("error"),
    )


def _result_dict(result: EvaluationResult) -> dict[str, Any]:
    return {
        "score": result.score,
        "label": result.label,
        "explanation": result.explanation,
    }


def lesson_11(selection: str, *, full: bool) -> None:
    examples = OVERALL_CASES if full else OVERALL_CASES[:1]
    trace = make_trace_sink()
    for provider in provider_names(selection):
        judge = make_judge(provider, trace=trace, prefix=f"lesson-11-judge-{provider}")
        for version, sql_prompt in (("v1", None), ("v2", SQL_PROMPT_V2)):
            def task(input: dict[str, Any], _version: str = version) -> dict[str, Any]:
                transcript = run_query(
                    provider,
                    str(input["question"]),
                    trace=trace,
                    prefix=f"lesson-11-{_version}-{provider}-{input['case_id']}",
                    **({"sql_generation_prompt": sql_prompt} if sql_prompt else {}),
                )
                if transcript.error:
                    raise RuntimeError(transcript.error)
                return {"case_id": input["case_id"], **transcript.as_experiment_output()}

            def tool_choice(input: dict[str, Any], output: dict[str, Any], expected: dict[str, Any], **_: Any) -> dict[str, Any]:
                return _result_dict(expected_tool_choice(_transcript_from_output(input, output), expected["tools"]))

            def tool_judge(input: dict[str, Any], output: dict[str, Any], **_: Any) -> dict[str, Any]:
                return _result_dict(llm_tool_call_judge(judge, _transcript_from_output(input, output)))

            def sql_match(input: dict[str, Any], output: dict[str, Any], expected: dict[str, Any], **_: Any) -> dict[str, Any]:
                return _result_dict(sql_result_matches(_transcript_from_output(input, output), str(expected["sql_result"])))

            def clarity(input: dict[str, Any], output: dict[str, Any], **_: Any) -> dict[str, Any]:
                return _result_dict(llm_clarity_judge(judge, _transcript_from_output(input, output)))

            def entities(input: dict[str, Any], output: dict[str, Any], **_: Any) -> dict[str, Any]:
                return _result_dict(llm_entity_judge(judge, _transcript_from_output(input, output)))

            def code_compiles(input: dict[str, Any], output: dict[str, Any], **_: Any) -> dict[str, Any]:
                return _result_dict(generated_code_compiles(_transcript_from_output(input, output)))

            def data_fidelity(input: dict[str, Any], output: dict[str, Any], **_: Any) -> dict[str, Any]:
                return _result_dict(chart_data_fidelity(_transcript_from_output(input, output)))

            record = run_course_experiment(
                name=f"lesson-11-overall-{version}-{provider}",
                description="Overall agent experiment reconstructed from the lesson 11 notebook.",
                examples=examples,
                task=task,
                evaluators={
                    "tool_choice_ground_truth": tool_choice,
                    "tool_calling_judge": tool_judge,
                    "sql_result": sql_match,
                    "clarity": clarity,
                    "entity_correctness": entities,
                    "generated_code_compiles": code_compiles,
                    "chart_data_fidelity": data_fidelity,
                },
            )
            print(
                f"OVERALL_EXPERIMENT provider={provider} version={version} "
                f"backend={record['backend']} cases={len(examples)}"
            )


JUDGE_CASES = [
    CourseExample(
        input={
            "case_id": "correct-lookup",
            "question": "What was total revenue?",
            "tool_call": {"name": "lookup_sales_data", "arguments": {"prompt": "total revenue"}},
        },
        expected={"label": "correct"},
    ),
    CourseExample(
        input={
            "case_id": "wrong-tool",
            "question": "What was total revenue?",
            "tool_call": {"name": "generate_visualization", "arguments": {"visualization_goal": "revenue"}},
        },
        expected={"label": "incorrect"},
    ),
    CourseExample(
        input={
            "case_id": "wrong-parameter",
            "question": "Chart November sales.",
            "tool_call": {"name": "generate_visualization", "arguments": {"visualization_goal": "December sales"}},
        },
        expected={"label": "incorrect"},
    ),
]


def _judge_prompt(input: dict[str, Any], *, improved: bool) -> str:
    examples = ""
    if improved:
        examples = """
Example: revenue question plus lookup_sales_data is correct.
Example: a chart request with the wrong month in parameters is incorrect.
Check both the function and every extracted parameter.
""".strip()
    return f"""
Judge the tool call for the user question as correct or incorrect.
{examples}
Question: {input['question']}
Tool call: {json.dumps(input['tool_call'], ensure_ascii=True)}
Respond with exactly one final line: LABEL: correct or LABEL: incorrect
""".strip()


def lesson_12(selection: str) -> None:
    trace = make_trace_sink()
    for provider in provider_names(selection):
        judge = make_judge(provider, trace=trace, prefix=f"lesson-12-judge-{provider}")
        for version, improved in (("baseline", False), ("few-shot", True)):
            def task(input: dict[str, Any]) -> dict[str, Any]:
                response = judge.complete_text(
                    _judge_prompt(input, improved=improved),
                    purpose=f"judge_calibration_{version}",
                )
                labels = [
                    label.lower()
                    for label in __import__("re").findall(
                        r"(?im)^\s*LABEL\s*:\s*(correct|incorrect)\s*$",
                        response,
                    )
                ]
                return {
                    "case_id": input["case_id"],
                    "label": labels[-1] if labels else "invalid",
                    "response": response,
                }

            def agreement(output: dict[str, Any], expected: dict[str, Any], **_: Any) -> dict[str, Any]:
                passed = output["label"] == expected["label"]
                return {
                    "score": float(passed),
                    "label": "aligned" if passed else "misaligned",
                    "explanation": f"judge={output['label']} ground_truth={expected['label']}",
                }

            record = run_course_experiment(
                name=f"lesson-12-judge-{version}-{provider}",
                description="Judge calibration against deterministic labels.",
                examples=JUDGE_CASES,
                task=task,
                evaluators={"ground_truth_agreement": agreement},
            )
            print(
                f"JUDGE_EXPERIMENT provider={provider} version={version} "
                f"backend={record['backend']} cases={len(JUDGE_CASES)}"
            )


def lesson_13() -> None:
    experiment_records = _read_jsonl(EXPERIMENT_PATH)
    aieds_records = _read_jsonl(TRACE_PATH)
    if not experiment_records:
        raise RuntimeError("No experiment records exist. Run lessons 09, 11, and 12 first.")
    if not aieds_records:
        raise RuntimeError("No AIEDS records exist. Run a model-backed lesson first.")
    evaluation_results = [
        evaluation
        for record in experiment_records
        for evaluation in record.get("evaluationRuns", [])
    ]
    defect_hits = sum(
        1
        for evaluation in evaluation_results
        if evaluation.get("name") == "chart_data_fidelity"
        and "placeholder_data" in json.dumps(evaluation.get("result"), default=str)
    )
    providers = sorted({str(record.get("provider")) for record in aieds_records})
    summary = {
        "experimentRecords": len(experiment_records),
        "evaluationResults": len(evaluation_results),
        "aiedsModelCalls": len(aieds_records),
        "providers": providers,
        "knownChartDefectDetections": defect_hits,
        "releaseGate": "blocked_by_known_chart_defect" if defect_hits else "review_required",
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "monitoring-summary.json").write_text(
        json.dumps(summary, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, indent=2))


def _read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    records: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            records.append(json.loads(line))
    return records


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = _parser().parse_args()
    lessons = ["03", "05", "06", "07", "08", "09", "10", "11", "12", "13"] if args.lesson == "all" else [args.lesson]
    for lesson in lessons:
        print(f"LESSON {lesson} START")
        if lesson == "03":
            lesson_03(args.provider)
        elif lesson == "05":
            lesson_05(args.provider)
        elif lesson == "06":
            lesson_06()
        elif lesson == "07":
            lesson_07(args.provider)
        elif lesson == "08":
            lesson_08(args.provider, full=args.full)
        elif lesson == "09":
            lesson_09(args.provider, full=args.full)
        elif lesson == "10":
            lesson_10()
        elif lesson == "11":
            lesson_11(args.provider, full=args.full)
        elif lesson == "12":
            lesson_12(args.provider)
        elif lesson == "13":
            lesson_13()
        print(f"LESSON {lesson} COMPLETE")
    print(f"AIEDS_RECORDS={TRACE_PATH}")
    print(f"EXPERIMENT_RECORDS={EXPERIMENT_PATH}")
    print(f"PHOENIX_FLUSHED={flush_tracing()}")


if __name__ == "__main__":
    main()
