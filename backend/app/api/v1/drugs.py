from typing import Optional
from fastapi import APIRouter, Query
from app.services.prescription_service import PrescriptionService

router = APIRouter(prefix="/drugs", tags=["Formulary & E-Prescriptions"])

@router.get("/formulary")
def search_drug_formulary(
    q: Optional[str] = Query(None, description="Search term for drug brand or generic molecule name"),
    dosage_form: Optional[str] = Query(None, description="Filter by preparation form: TABLET, CAPSULE, SYRUP, etc."),
    limit: int = Query(50, ge=1, le=200, description="Max search results to return")
):
    """
    FEAT-08: Autocomplete lookup from approved clinic medication formulary.
    Zero-heavy overhead query with substring index matching.
    """
    return PrescriptionService.search_formulary(q=q, dosage_form=dosage_form, limit=limit)
