// Central Route Constants for Bright Solutions
export const ROUTES = {
  LOGIN: '/login',

  // Receptionist Portal
  RECEPTIONIST: {
    DASHBOARD: '/receptionist/dashboard',
    INTAKE: '/receptionist/intake',
    QUESTIONNAIRE: '/receptionist/questionnaire',
    VOICE_INTAKE_ALIAS: '/receptionist/voice-intake',
    REPORTS: '/receptionist/reports',
    QUEUE: '/receptionist/queue',
  },

  // Doctor Portal
  DOCTOR: {
    DASHBOARD: '/doctor/dashboard',
    PATIENT_DOSSIER: '/doctor/patient/:id',
    VIEWER: '/doctor/viewer/:visitId',
    CONSULTATION: '/doctor/consultation/:visitId',
  },

  // Cashier Portal
  CASHIER: {
    DASHBOARD: '/cashier/dashboard',
    BILLING: '/cashier/billing/:visitId',
    RECEIPT: '/cashier/receipt/:billId',
  },

  // Hospital Administrator Portal
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    STAFF: '/admin/staff',
    AUDIT_LOGS: '/admin/audit-logs',
  }
};

export const BRAND_CONFIG = {
  name: 'Bright Solutions',
  systemName: 'Clinical Operating System',
  version: '2026.1',
};
