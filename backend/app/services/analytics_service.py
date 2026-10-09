from typing import Dict, Any
from app.repositories.analytics_repo import AnalyticsRepository
from app.repositories.patient_repo import PatientRepository
from app.repositories.user_repo import UserRepository

class AnalyticsService:
    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        total_patients = PatientRepository.count_matching_patients()
        today_visits = PatientRepository.get_today_token_count()
        active_doctors = len(UserRepository.list_active_doctors())
        next_token = f"Q-{101 + today_visits}"

        bp_breakdown = AnalyticsRepository.get_bp_breakdown()
        bmi_breakdown = AnalyticsRepository.get_bmi_breakdown()
        recent_patients = AnalyticsRepository.get_recent_patients_triage(limit=5)

        return {
            "total_patients": total_patients,
            "today_visits": today_visits,
            "active_doctors": active_doctors,
            "next_token": next_token,
            "bp_breakdown": bp_breakdown,
            "bmi_breakdown": bmi_breakdown,
            "recent_patients": recent_patients
        }

    @staticmethod
    def get_admin_analytics() -> Dict[str, Any]:
        kpis = AnalyticsRepository.get_dashboard_summary()
        rev_info = AnalyticsRepository.get_revenue_breakdown()
        doctor_workload = AnalyticsRepository.get_doctor_workload()
        recent_activity = AnalyticsRepository.get_recent_activity(limit=5)

        return {
            "summary": {
                "total_patients": kpis["total_patients"],
                "today_footfall": kpis["today_footfall"],
                "completed_consultations": kpis["completed_consultations"],
                "ready_for_billing": kpis["ready_for_billing"],
                "in_consultation": kpis["in_consultation"],
                "gross_revenue": rev_info["gross_revenue"],
                "avg_throughput_minutes": 25.0
            },
            "revenue_by_mode": rev_info["revenue_by_mode"],
            "doctor_workload": doctor_workload,
            "recent_activity": recent_activity
        }
