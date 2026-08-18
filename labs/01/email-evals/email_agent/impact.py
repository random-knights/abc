"""AIEDS v2 impact helpers using the app's field names."""

from __future__ import annotations

from dataclasses import dataclass


AIEDS_MODEL_VERSION = "v2"
GRID_INTENSITY_GRAMS_PER_KWH = 429.0
MATURE_TREE_CO2E_GRAMS_PER_YEAR = 21000.0
MINUTES_PER_YEAR = 365 * 24 * 60


@dataclass(frozen=True)
class EnergyProfile:
    wh_per_1k_in: float
    wh_per_1k_out: float
    pue: float
    confidence: str


def profile_for_model(model: str) -> EnergyProfile:
    model_id = model.strip().lower()
    if model_id.startswith(("gpt", "o1", "o3", "o4", "chatgpt")):
        return EnergyProfile(0.17, 0.68, 1.0, "vendorPublished")
    if model_id.startswith("claude"):
        return EnergyProfile(0.145, 0.58, 1.2, "classEstimated")
    return EnergyProfile(0.145, 0.58, 1.2, "unknown")


def estimate_aieds(model: str, tokens_in: int, tokens_out: int) -> dict[str, object]:
    profile = profile_for_model(model)
    energy_wh = (
        (tokens_in / 1000.0) * profile.wh_per_1k_in
        + (tokens_out / 1000.0) * profile.wh_per_1k_out
    ) * profile.pue
    carbon_g = energy_wh / 1000.0 * GRID_INTENSITY_GRAMS_PER_KWH
    tree_time_min = carbon_g / MATURE_TREE_CO2E_GRAMS_PER_YEAR * MINUTES_PER_YEAR
    return {
        "tokensTotal": tokens_in + tokens_out,
        "carbonG": carbon_g,
        "energyWh": energy_wh,
        "treeTimeMin": tree_time_min,
        "aiedsModelVersion": AIEDS_MODEL_VERSION,
        "aiedsConfidence": profile.confidence,
    }
