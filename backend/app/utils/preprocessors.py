from __future__ import annotations

from typing import List

import numpy as np


def preprocess_ecg_signal(signal: List[float]) -> np.ndarray:
    """
    Placeholder ECG preprocessing.

    In production, apply filtering, normalization, segmentation, etc.
    """

    arr = np.asarray(signal, dtype=float)
    if arr.size == 0:
        raise ValueError("ECG signal is empty")
    # Simple normalization as placeholder
    arr = (arr - arr.mean()) / (arr.std() + 1e-8)
    return arr


def preprocess_pkpd_inputs(dose_mg: float, duration_h: float) -> dict:
    """Placeholder PK/PD preprocessing, returning a simple feature dict."""

    return {
        "dose_mg": dose_mg,
        "duration_h": duration_h,
    }


