import {
  LayoutDashboard,
  UserPlus,
  ClipboardList,
  UploadCloud,
  Clock,
  FileText,
  Eye,
  Stethoscope,
  Receipt,
  CreditCard,
  BarChart3,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { ROUTES } from '../routes';

export const NAVIGATION_CONFIG = {
  RECEPTIONIST: [
    { label: 'Operations Command', path: ROUTES.RECEPTIONIST.DASHBOARD, icon: LayoutDashboard },
    { label: 'Patient Registration', path: ROUTES.RECEPTIONIST.INTAKE, icon: UserPlus },
    { label: 'Intake Questionnaire', path: ROUTES.RECEPTIONIST.QUESTIONNAIRE, icon: ClipboardList },
    { label: 'Diagnostic Ingestion', path: ROUTES.RECEPTIONIST.REPORTS, icon: UploadCloud },
    { label: 'Live Token Queue', path: ROUTES.RECEPTIONIST.QUEUE, icon: Clock },
  ],
  DOCTOR: [
    { label: 'Clinical Dashboard', path: ROUTES.DOCTOR.DASHBOARD, icon: LayoutDashboard },
    { label: 'Patient Dossier', path: '/doctor/patient/2', icon: FileText },
    { label: 'Diagnostic Viewer', path: '/doctor/viewer/102', icon: Eye },
    { label: 'Consultation & CDSS', path: '/doctor/consultation/102', icon: Stethoscope },
  ],
  CASHIER: [
    { label: 'Billing Operations', path: ROUTES.CASHIER.DASHBOARD, icon: LayoutDashboard },
    { label: 'Itemized Invoice', path: '/cashier/billing/102', icon: Receipt },
    { label: 'Payment Tender', path: '/cashier/receipt/201', icon: CreditCard },
  ],
  ADMIN: [
    { label: 'Hospital Governance', path: ROUTES.ADMIN.DASHBOARD, icon: BarChart3 },
    { label: 'Staff Provisioning', path: ROUTES.ADMIN.STAFF, icon: Users },
    { label: 'Clinical Audit Logs', path: ROUTES.ADMIN.AUDIT_LOGS, icon: ShieldCheck },
  ],
};
