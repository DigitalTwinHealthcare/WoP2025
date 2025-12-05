from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.schemas.ml_inputs import ECGPredictRequest, ECGPredictResponse
from app.services.report_service import report_service
from app.utils.logger import get_logger
from app.utils.preprocessors import preprocess_ecg_signal

logger = get_logger(__name__)


class ECGService:
    """Placeholder ECG ML service. Load model once and expose predict API."""

    def __init__(self) -> None:
        self.model: Any | None = None
        self._load_model()

    def _load_model(self) -> None:
        # In production, load your real ECG model here (e.g., from models/ecg_model)
        model_path = Path("models") / "ecg_model"
        logger.info("Initializing dummy ECG model from %s", model_path)
        self.model = "dummy-ecg-model"

    async def predict(self, payload: ECGPredictRequest) -> ECGPredictResponse:
        features = preprocess_ecg_signal(payload.signal)
        logger.debug("ECG preprocessed features shape: %s", features.shape)

        # Dummy prediction logic
        prediction = "normal_sinus_rhythm"
        confidence = 0.95

        # Store result locally as JSON
        timestamp = datetime.now(timezone.utc)
        timestamp_str = timestamp.isoformat().replace(":", "-")
        base_dir = Path("data/ml") / "ecg" / str(payload.patient_id)
        base_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = base_dir / f"{timestamp_str}.json"
        relative_path = f"ml/ecg/{payload.patient_id}/{file_path.name}"
        
        content = {
            "patient_id": payload.patient_id,
            "prediction": prediction,
            "confidence": confidence
        }
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(content, f, indent=2)
        
        result_url = f"/static/{relative_path}"

        # Create report in SQLite
        report = await report_service.create_report(
            patient_id=payload.patient_id,
            report_type="ecg",
            result_file_url=result_url,
            extra={"prediction": prediction, "confidence": confidence},
        )

        return ECGPredictResponse(
            patient_id=payload.patient_id,
            prediction=prediction,
            confidence=confidence,
            report_id=str(report.id),
            result_file_url=result_url,
        )


ecg_service = ECGService()


