"""Three tools from the L3 lab."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import duckdb
import pandas as pd
from pydantic import BaseModel, Field


TABLE_NAME = "sales"


class TextModel(Protocol):
    def complete_text(self, prompt: str, *, purpose: str) -> str:
        ...

    def structured_chart_config(self, prompt: str) -> "VisualizationConfig":
        ...


class VisualizationConfig(BaseModel):
    chart_type: str = Field(..., description="Type of chart to generate")
    x_axis: str = Field(..., description="Name of the x-axis column")
    y_axis: str = Field(..., description="Name of the y-axis column")
    title: str = Field(..., description="Title of the chart")


@dataclass
class LabTools:
    data_path: Path
    model: TextModel

    def _load_frame(self) -> pd.DataFrame:
        if not self.data_path.exists():
            raise FileNotFoundError(
                f"Missing fixture parquet: {self.data_path}. Run scripts/make_fixture.py."
            )
        return pd.read_parquet(self.data_path)

    def generate_sql_query(self, prompt: str, columns: list[str]) -> str:
        formatted_prompt = f"""
Generate an SQL query based on a prompt. Do not reply with anything besides the SQL query.
Use ASCII only. Do not use em dashes or en dashes.
The prompt is: {prompt}

The available columns are: {columns}
The table name is: {TABLE_NAME}
""".strip()
        sql = self.model.complete_text(formatted_prompt, purpose="sql_generation")
        return _strip_fences(sql)

    def lookup_sales_data(self, prompt: str) -> str:
        try:
            df = self._load_frame()
            sql_query = self.generate_sql_query(prompt, list(df.columns))
            with duckdb.connect() as conn:
                conn.register(TABLE_NAME, df)
                result = conn.execute(sql_query).df()
            return result.to_string(index=False)
        except Exception as error:
            return f"Error accessing data: {type(error).__name__}: {error}"

    def analyze_sales_data(self, prompt: str, data: str) -> str:
        formatted_prompt = f"""
Analyze the following data:
{data}

Your job is to answer the following question:
{prompt}

Use ASCII only. Do not use em dashes or en dashes.
""".strip()
        try:
            analysis = self.model.complete_text(formatted_prompt, purpose="data_analysis")
            return analysis or "No analysis could be generated."
        except Exception as error:
            return f"No analysis could be generated: {type(error).__name__}"

    def extract_chart_config(self, data: str, visualization_goal: str) -> VisualizationConfig:
        formatted_prompt = f"""
Generate a chart config based on this data:
{data}

The goal is:
{visualization_goal}

Use ASCII only. Do not use em dashes or en dashes.
""".strip()
        return self.model.structured_chart_config(formatted_prompt)

    def create_chart(self, config: VisualizationConfig) -> str:
        prompt = f"""
Write Python code to generate a chart based on this config.
Return only runnable Python code.
Use ASCII only. Do not use em dashes or en dashes.

Config:
{config.model_dump_json()}
""".strip()
        return _strip_fences(self.model.complete_text(prompt, purpose="chart_code"))

    def generate_visualization(self, data: str, visualization_goal: str) -> str:
        try:
            config = self.extract_chart_config(data, visualization_goal)
            return self.create_chart(config)
        except Exception as error:
            return f"Visualization code could not be generated: {type(error).__name__}: {error}"

    def call(self, name: str, arguments: dict[str, str]) -> str:
        if name == "lookup_sales_data":
            return self.lookup_sales_data(prompt=arguments.get("prompt", ""))
        if name == "analyze_sales_data":
            return self.analyze_sales_data(
                prompt=arguments.get("prompt", ""),
                data=arguments.get("data", ""),
            )
        if name == "generate_visualization":
            return self.generate_visualization(
                data=arguments.get("data", ""),
                visualization_goal=arguments.get("visualization_goal", ""),
            )
        return f"Unsupported tool: {name}"


def _strip_fences(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^```[a-zA-Z0-9_+-]*\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


OPENAI_TOOLS: list[dict[str, object]] = [
    {
        "type": "function",
        "function": {
            "name": "lookup_sales_data",
            "description": "Look up rows or aggregates from the Store Sales Price Elasticity Promotions dataset.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "The unchanged user request for the data lookup.",
                    }
                },
                "required": ["prompt"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_sales_data",
            "description": "Analyze sales data text to extract trends and answer a business question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "string",
                        "description": "The lookup_sales_data tool output to analyze.",
                    },
                    "prompt": {
                        "type": "string",
                        "description": "The unchanged user question to answer from the data.",
                    },
                },
                "required": ["data", "prompt"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_visualization",
            "description": "Generate Python code to visualize sales data.",
            "parameters": {
                "type": "object",
                "properties": {
                    "data": {
                        "type": "string",
                        "description": "The lookup_sales_data tool output to visualize.",
                    },
                    "visualization_goal": {
                        "type": "string",
                        "description": "The user's requested chart goal.",
                    },
                },
                "required": ["data", "visualization_goal"],
            },
        },
    },
]


ANTHROPIC_TOOLS: list[dict[str, object]] = [
    {
        "name": item["function"]["name"],
        "description": item["function"]["description"],
        "input_schema": item["function"]["parameters"],
    }
    for item in OPENAI_TOOLS
]


def parse_arguments(raw: str | dict[str, object]) -> dict[str, str]:
    if isinstance(raw, dict):
        return {str(k): str(v) for k, v in raw.items()}
    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    if not isinstance(loaded, dict):
        return {}
    return {str(k): str(v) for k, v in loaded.items()}
