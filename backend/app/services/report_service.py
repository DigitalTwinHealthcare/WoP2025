from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlmodel import Session, select, desc

from app.db.db import engine
from app.db.models import Report as ReportModel
from app.utils.logger import get_logger

logger = get_logger(__name__)


class Report:
    """Report data class for backward compatibility."""
    
    def __init__(
        self,
        id: int,
        patient_id: str,
        type: str,
        status: str,
        created_at: datetime,
        result_file_url: str,
    ):
        self.id = id
        self.patient_id = patient_id
        self.type = type
        self.status = status
        self.created_at = created_at
        self.result_file_url = result_file_url


class ReportService:
    """Service for managing diagnostic reports in SQLite."""

    async def create_report(
        self,
        *,
        patient_id: str,
        report_type: str,
        result_file_url: str,
        status: str = "completed",
        extra: Optional[dict[str, Any]] = None,
    ) -> Report:
        now = datetime.now(timezone.utc)
        
        with Session(engine) as session:
            # Extract result_path from result_file_url (remove /static/ prefix)
            result_path = result_file_url.replace("/static/", "") if result_file_url.startswith("/static/") else result_file_url
            
            report = ReportModel(
                patient_id=int(patient_id),
                type=report_type,
                status=status,
                result_path=result_path,
                created_at=now,
            )
            session.add(report)
            session.commit()
            session.refresh(report)
            
            logger.info("Created report %s for patient %s", report.id, patient_id)
            return Report(
                id=report.id,
                patient_id=str(report.patient_id),
                type=report.type,
                status=report.status,
                created_at=report.created_at,
                result_file_url=f"/static/{report.result_path}",
            )

    async def get_report(self, report_id: str) -> dict[str, Any]:
        with Session(engine) as session:
            statement = select(ReportModel).where(ReportModel.id == int(report_id))
            report = session.exec(statement).first()
            
            if not report:
                raise ValueError("Report not found")
            
            return {
                "id": str(report.id),
                "patientId": str(report.patient_id),
                "type": report.type,
                "status": report.status,
                "createdAt": report.created_at.isoformat(),
                "resultFileUrl": f"/static/{report.result_path}",
            }

    async def list_reports(self, *, limit: int | None = None) -> list[dict[str, Any]]:
        with Session(engine) as session:
            statement = select(ReportModel).order_by(desc(ReportModel.created_at))
            if limit:
                statement = statement.limit(limit)
            
            reports = session.exec(statement).all()
            
            result = []
            for report in reports:
                result.append({
                    "id": str(report.id),
                    "patientId": str(report.patient_id),
                    "type": report.type,
                    "status": report.status,
                    "createdAt": report.created_at.isoformat(),
                    "resultFileUrl": f"/static/{report.result_path}",
                })
            return result

    async def stats(self) -> dict[str, Any]:
        """Very simple stats; in production use aggregations."""

        reports = await self.list_reports()
        total = len(reports)
        by_type: dict[str, int] = {}
        for r in reports:
            report_type = r.get("type", "unknown")
            by_type[report_type] = by_type.get(report_type, 0) + 1
        return {"total": total, "by_type": by_type}


report_service = ReportService()


