from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_reports() -> List[Dict[str, Any]]:
    """Return all reports."""

    return await report_service.list_reports()


@router.get("/recent", response_model=List[Dict[str, Any]])
async def recent_reports() -> List[Dict[str, Any]]:
    """Return most recent reports."""

    return await report_service.list_reports(limit=5)


@router.get("/{report_id}", response_model=Dict[str, Any])
async def get_report(report_id: str) -> Dict[str, Any]:
    """Return a single report by ID."""

    try:
        return await report_service.get_report(report_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Report not found")


@router.get("/stats", response_model=Dict[str, Any])
async def report_stats() -> Dict[str, Any]:
    """Return basic report statistics."""

    return await report_service.stats()


