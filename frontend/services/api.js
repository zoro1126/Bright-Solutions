/**
 * api.js — Bright Solutions API Client (v2 — TASK-FE-1.1 fix)
 * Base: /api/v1 (aligned with D15 + backend BE-2.x)
 * Token is read from AuthContext memory store (getMemoryToken) — never localStorage.
 * Falls back to sessionStorage.__bs_token for server-side-only edge cases.
 */

const BASE = '/api/v1';

// Token accessor — reads from window.__bsAuth to avoid circular ESM import
// (AuthContext exposes getToken via window.__bsAuth bridge in App.jsx)
function getMemoryToken() {
  return window.__bsAuth?.getToken?.() || null;
}

async function request(method, path, body = undefined, extraHeaders = {}) {
  const token = getMemoryToken();
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',  // sends HTTP-only refresh cookie on all requests
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`API ${method} ${path} → ${res.status}: ${errText}`);
    err.status = res.status;
    err.body = errText;
    throw err;
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

const get  = (path, headers)       => request('GET',    path, undefined, headers);
const post = (path, body, headers) => request('POST',   path, body, headers);
const put  = (path, body, headers) => request('PUT',    path, body, headers);
const del  = (path)                => request('DELETE', path);
const patch = (path, body)         => request('PATCH',  path, body);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  /** POST /api/v1/auth/login → { access_token, token_type, expires_in, user } */
  login: (email, password) => post('/auth/login', { email, password }),

  /** POST /api/v1/auth/refresh (HTTP-only cookie) → { access_token, user } */
  refresh: () => fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' }).then(r => r.json()),

  /** GET /api/v1/auth/me → full user profile + role + enabled_modules */
  me: () => get('/auth/me'),

  /** POST /api/v1/auth/logout */
  logout: () => post('/auth/logout'),
};

// ─── License ──────────────────────────────────────────────────────────────────
export const license = {
  /** GET /api/v1/admin/license */
  get: () => get('/admin/license'),

  /** POST /api/v1/admin/license/upload (multipart) */
  upload: async (fileOrString) => {
    const token = getMemoryToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let body;
    if (typeof fileOrString === 'string') {
      // String paste — send as JSON
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ license_string: fileOrString });
    } else {
      // File upload — multipart
      const form = new FormData();
      form.append('license_file', fileOrString);
      body = form;
    }
    const res = await fetch(`${BASE}/admin/license/upload`, { method: 'POST', headers, credentials: 'include', body });
    if (!res.ok) { const t = await res.text(); throw new Error(`License upload failed ${res.status}: ${t}`); }
    return res.json();
  },
};

// ─── Patients (Master Patient Index) ─────────────────────────────────────────
export const patients = {
  /** POST /api/v1/patients → { patient, uhid } */
  register: (data) => post('/patients', data),

  /** GET /api/v1/patients/:id */
  get: (id) => get(`/patients/${id}`),

  /** GET /api/v1/patients/search?q= */
  search: (q) => get(`/patients/search?q=${encodeURIComponent(q)}`),

  /** GET /api/v1/patients/:id/dossier */
  dossier: (id) => get(`/patients/${id}/dossier`),
};

// ─── OPD Queue & Tokens ───────────────────────────────────────────────────────
export const opd = {
  /** POST /api/v1/opd/tokens → { token_number, visit_id, estimated_wait_min } */
  createToken: (data) => post('/opd/tokens', data),

  /** GET /api/v1/opd/queue → queue list for current doctor */
  queue: () => get('/opd/queue'),

  /** GET /api/v1/opd/queue?doctor_id= */
  queueByDoctor: (doctorId) => get(`/opd/queue?doctor_id=${doctorId}`),

  /** GET /api/v1/queue/doctors/:id/live — SSE stream endpoint (returns URL for EventSource) */
  liveStreamUrl: (doctorId) => `${BASE}/queue/doctors/${doctorId}/live`,
};

// ─── Triage / Vitals ──────────────────────────────────────────────────────────
export const triage = {
  /** POST /api/v1/triage/vitals → { vitals_id, news2_score, bmi, flags } */
  submitVitals: (data) => post('/triage/vitals', data),

  /** GET /api/v1/triage/vitals/:visitId */
  getVitals: (visitId) => get(`/triage/vitals/${visitId}`),
};

// ─── Consultations ────────────────────────────────────────────────────────────
export const consultations = {
  /** POST /api/v1/consultations → { consultation_id } */
  create: (data) => post('/consultations', data),

  /** GET /api/v1/consultations/:id */
  get: (id) => get(`/consultations/${id}`),

  /** PUT /api/v1/consultations/:id (autosave SOAP draft) */
  update: (id, data) => put(`/consultations/${id}`, data),

  /** POST /api/v1/consultations/:id/sign */
  sign: (id, data) => post(`/consultations/${id}/sign`, data),
};

// ─── CDSS ─────────────────────────────────────────────────────────────────────
export const cdss = {
  /** POST /api/v1/cdss/check-ddi → { interactions: [...], severity } */
  checkDdi: (data) => post('/cdss/check-ddi', data),

  /** POST /api/v1/cdss/news2 → { score, risk_level, component_scores } */
  news2: (data) => post('/cdss/news2', data),
};

// ─── Prescriptions ────────────────────────────────────────────────────────────
export const prescriptions = {
  /** GET /api/v1/consultations/:visitId/prescriptions */
  list: (visitId) => get(`/consultations/${visitId}/prescriptions`),

  /** POST /api/v1/consultations/:visitId/prescriptions */
  create: (visitId, data) => post(`/consultations/${visitId}/prescriptions`, data),
};

// ─── Formulary ────────────────────────────────────────────────────────────────
export const formulary = {
  /** GET /api/v1/formulary?q= */
  search: (query) => get(`/formulary?q=${encodeURIComponent(query)}`),
};

// ─── Beds / IPD Matrix ────────────────────────────────────────────────────────
export const beds = {
  /** GET /api/v1/beds/matrix → { wards: [...], beds: [...], stats: {...} } */
  matrix: () => get('/beds/matrix'),

  /** PATCH /api/v1/beds/:bedId/status */
  updateStatus: (bedId, status) => patch(`/beds/${bedId}/status`, { status }),
};

// ─── IPD Admissions ───────────────────────────────────────────────────────────
export const ipd = {
  admissions: {
    /** POST /api/v1/ipd/admissions → { admission_id, ipd_number, bed_id } */
    create: (data) => post('/ipd/admissions', data),

    /** GET /api/v1/ipd/admissions/:id */
    get: (id) => get(`/ipd/admissions/${id}`),

    /** GET /api/v1/ipd/admissions → list pending/active admissions */
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return get(`/ipd/admissions${qs ? `?${qs}` : ''}`);
    },

    /** GET /api/v1/ipd/admissions/:id/consent-form → print payload for Forms 8 & 9 */
    consentForm: (id) => get(`/ipd/admissions/${id}/consent-form`),

    /** POST /api/v1/ipd/admissions/:id/discharge */
    discharge: (id, data) => post(`/ipd/admissions/${id}/discharge`, data),
  },

  forms: {
    /** POST /api/v1/ipd/admissions/:id/forms/:formCode */
    submit: (admissionId, formCode, data) =>
      post(`/ipd/admissions/${admissionId}/forms/${formCode}`, data),

    /** GET /api/v1/ipd/admissions/:id/forms/:formCode */
    get: (admissionId, formCode) =>
      get(`/ipd/admissions/${admissionId}/forms/${formCode}`),

    /** GET /api/v1/ipd/admissions/:id/forms */
    list: (admissionId) => get(`/ipd/admissions/${admissionId}/forms`),

    /** POST /api/v1/ipd/admissions/:id/forms/:formCode/lock */
    lock: (admissionId, formCode) =>
      post(`/ipd/admissions/${admissionId}/forms/${formCode}/lock`),
  },

  treatmentOrders: {
    /** GET /api/v1/ipd/admissions/:id/treatment-orders */
    list: (admissionId) => get(`/ipd/admissions/${admissionId}/treatment-orders`),

    /** POST /api/v1/ipd/admissions/:id/treatment-orders */
    create: (admissionId, data) => post(`/ipd/admissions/${admissionId}/treatment-orders`, data),
  },

  mar: {
    /** GET /api/v1/ipd/admissions/:id/mar */
    get: (admissionId) => get(`/ipd/admissions/${admissionId}/mar`),

    /** POST /api/v1/ipd/admissions/:id/mar/:orderId/administer */
    administer: (admissionId, orderId, data) =>
      post(`/ipd/admissions/${admissionId}/mar/${orderId}/administer`, data),
  },

  fluidBalance: {
    /** GET /api/v1/ipd/admissions/:id/fluid-balance */
    get: (admissionId) => get(`/ipd/admissions/${admissionId}/fluid-balance`),

    /** POST /api/v1/ipd/admissions/:id/fluid-balance */
    record: (admissionId, data) => post(`/ipd/admissions/${admissionId}/fluid-balance`, data),
  },
};

// ─── Discharge Summary ────────────────────────────────────────────────────────
export const discharge = {
  /** POST /api/v1/ipd/admissions/:id/discharge-summary */
  create: (admissionId, data) => post(`/ipd/admissions/${admissionId}/discharge-summary`, data),

  /** GET /api/v1/ipd/admissions/:id/discharge-summary */
  get: (admissionId) => get(`/ipd/admissions/${admissionId}/discharge-summary`),
};

// ─── Billing ──────────────────────────────────────────────────────────────────
export const billing = {
  /** POST /api/v1/billing/invoices/ipd-final */
  ipdFinal: (data) => post('/billing/invoices/ipd-final', data),

  /** GET /api/v1/billing/invoices/:admissionId/ledger */
  ledger: (admissionId) => get(`/billing/invoices/${admissionId}/ledger`),
};

// ─── Display (TV / Waiting Room) ──────────────────────────────────────────────
export const display = {
  /** Returns an EventSource for SSE queue stream (no auth required for display route) */
  queueStream: () => new EventSource(`${BASE}/display/queue/stream`),

  /** GET /api/v1/display/queue/current → current token info (polling fallback) */
  queueCurrent: () => get('/display/queue/current'),
};

// ─── Health check ─────────────────────────────────────────────────────────────
export const health = {
  ping: () => fetch(`${BASE}/health`, { credentials: 'include' }).then(r => r.ok),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const admin = {
  dashboard: () => get('/admin/dashboard'),
  staff: {
    list:   () => get('/admin/staff'),
    create: (data) => post('/admin/staff', data),
    toggle: (id, active) => put(`/admin/staff/${id}/status`, { active }),
  },
  auditLogs: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return get(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

// ─── Legacy-compatible exports (for existing components that import these) ────
export const queue        = { list: () => get('/opd/queue') };
export const doctorQueue  = { list: () => get('/opd/queue'), call: (id) => post(`/opd/queue/${id}/call`) };
export const dossier      = { get: (id) => get(`/patients/${id}/dossier`) };
export const signOff      = { submit: (visitId, data) => post(`/consultations/${visitId}/sign`, data) };
export const cashier      = {
  queue: () => get('/billing/cashier/queue'),
  bill:  (visitId) => get(`/billing/cashier/bills/${visitId}`),
  pay:   (billId, data) => post(`/billing/${billId}/payments`, data),
};
export const reports = {
  list: (visitId) => get(`/visits/${visitId}/reports`),
  upload: async (visitId, formData) => {
    const token = getMemoryToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}/visits/${visitId}/reports/upload`, { method: 'POST', headers, credentials: 'include', body: formData });
    if (!res.ok) { const t = await res.text(); throw new Error(`Upload failed ${res.status}: ${t}`); }
    return res.json();
  },
};
export const tokens       = { next: () => get('/opd/tokens/next') };
export const dashboard    = { stats: () => get('/admin/dashboard') };
export const questionnaire = {
  get:    (visitId) => get(`/visits/${visitId}/questionnaire`),
  submit: (visitId, data) => post(`/visits/${visitId}/questionnaire`, data),
};

export default {
  auth, license, patients, opd, triage, consultations, cdss,
  prescriptions, formulary, beds, ipd, discharge, billing,
  display, health, admin,
  // legacy
  queue, doctorQueue, dossier, signOff, cashier, reports, tokens, dashboard, questionnaire,
};
