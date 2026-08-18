"""Generate the synthetic L3 lab parquet fixture.

Synthetic course fixture only. It must never be used by application code or
product features.
"""

from __future__ import annotations

from pathlib import Path

import duckdb
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
PARQUET_PATH = DATA_DIR / "store_sales_fixture.parquet"


def build_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    stores = [1320, 1401, 1776, 2021]
    products = [
        ("SKU-APPLE", "produce", 1.25, 0.62),
        ("SKU-BREAD", "bakery", 3.50, 1.40),
        ("SKU-COFFEE", "grocery", 8.00, 4.10),
        ("SKU-SOUP", "grocery", 2.75, 1.25),
        ("SKU-YOGURT", "dairy", 1.60, 0.74),
    ]
    dates = pd.date_range("2021-11-01", periods=14, freq="D")
    for date_index, date in enumerate(dates):
        for store_index, store_id in enumerate(stores):
            for product_index, (sku, category, base_price, unit_cost) in enumerate(products):
                promotion = "none"
                discount_pct = 0.0
                if (date_index + product_index + store_index) % 4 == 0:
                    promotion = "weekly_ad"
                    discount_pct = 0.15
                elif (date_index + product_index) % 7 == 0:
                    promotion = "endcap"
                    discount_pct = 0.10
                units = 8 + ((date_index * 3 + store_index * 5 + product_index * 2) % 23)
                if store_id == 1320 and date.strftime("%Y-%m-%d") == "2021-11-01":
                    units += 8
                if promotion != "none":
                    units += 5
                price = round(base_price * (1.0 - discount_pct), 2)
                rows.append(
                    {
                        "store_id": store_id,
                        "sale_date": date.strftime("%Y-%m-%d"),
                        "product_sku": sku,
                        "category": category,
                        "promotion": promotion,
                        "discount_pct": discount_pct,
                        "unit_price": price,
                        "unit_cost": unit_cost,
                        "units_sold": units,
                        "sales": round(price * units, 2),
                        "cost": round(unit_cost * units, 2),
                        "gross_margin": round((price - unit_cost) * units, 2),
                    }
                )
    return rows


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame(build_rows())
    with duckdb.connect() as conn:
        conn.register("sales_fixture", df)
        conn.execute(
            "COPY sales_fixture TO ? (FORMAT PARQUET)",
            [str(PARQUET_PATH)],
        )
    print(f"wrote {PARQUET_PATH} rows={len(df)}")


if __name__ == "__main__":
    main()
