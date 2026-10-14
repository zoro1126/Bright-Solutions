import os
import shutil
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import UploadFile, HTTPException, status
from app.core.config import UPLOAD_DIR
from app.repositories.patient_repo import PatientRepository
from app.repositories.report_repo import ReportRepository

class ReportService:
    @staticmethod
    def upload_report(
        visit_id: int,
        file: UploadFile,
        report_type: str,
        modality: Optional[str] = None,
        findings_summary: Optional[str] = None
    ) -> Dict[str, Any]:
        valid_types = {"DICOM", "ECG", "LAB_PDF", "XRAY", "OTHER"}
        normalized_type = report_type.strip().upper()
        if normalized_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid report_type '{report_type}'. Allowed types: {', '.join(sorted(valid_types))}"
            )

        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )
        patient_id = visit["patient_id"]

        visit_dir = os.path.join(UPLOAD_DIR, str(visit_id))
        os.makedirs(visit_dir, exist_ok=True)

        orig_name = os.path.basename(file.filename or "report.bin")
        timestamp = int(datetime.now().timestamp())
        clean_filename = f"{timestamp}_{orig_name.replace(' ', '_')}"
        dest_path = os.path.join(visit_dir, clean_filename)

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size_bytes = os.path.getsize(dest_path)
        file_size_mb = round(file_size_bytes / (1024.0 * 1024.0), 2)
        web_path = f"/uploads/{visit_id}/{clean_filename}"

        report_id = ReportRepository.insert_report(
            visit_id=visit_id,
            patient_id=patient_id,
            report_type=normalized_type,
            modality=modality,
            file_path=web_path,
            file_size_mb=file_size_mb,
            findings_summary=findings_summary
        )

        return {
            "message": "External report uploaded successfully",
            "report_id": report_id,
            "visit_id": visit_id,
            "patient_id": patient_id,
            "file_name": orig_name,
            "report_type": normalized_type,
            "modality": modality,
            "file_size_bytes": file_size_bytes,
            "file_size_mb": file_size_mb,
            "file_path": web_path,
            "uploaded_at": datetime.now().isoformat()
        }

    @staticmethod
    def list_reports(visit_id: int) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )

        reports = ReportRepository.list_by_visit_id(visit_id)
        return {
            "visit_id": visit_id,
            "patient_id": visit["patient_id"],
            "count": len(reports),
            "reports": reports
        }

    @staticmethod
    def get_report(visit_id: int, report_id: int) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )
        report = ReportRepository.get_by_id(report_id)
        if not report or report["visit_id"] != visit_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"External report with ID {report_id} not found for visit {visit_id}."
            )
        return report

    @staticmethod
    def delete_report(visit_id: int, report_id: int) -> Dict[str, Any]:
        visit = PatientRepository.get_visit_by_id(visit_id)
        if not visit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visit encounter with ID {visit_id} not found."
            )
        report = ReportRepository.get_by_id(report_id)
        if not report or report["visit_id"] != visit_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"External report with ID {report_id} not found for visit {visit_id}."
            )

        # Remove physical file if present
        try:
            rel = report["file_path"].replace("/uploads/", "")
            full = os.path.join(UPLOAD_DIR, rel)
            if os.path.exists(full):
                os.remove(full)
        except Exception:
            pass

        ReportRepository.delete_report(report_id)
        return {
            "message": "External report removed successfully",
            "report_id": report_id,
            "visit_id": visit_id
        }

