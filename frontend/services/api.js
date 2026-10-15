/**
 * Bright Solutions — API Client (FE-01)
 * All requests start with /api/ and are proxied to the backend (port 8000).
 * Each helper returns the parsed JSON body or throws on non-OK response.
 */

const BASE = '/api';

async function request(method, path, body = undefined, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  const storedToken = token || localStorage.getItem('auth_token');
  if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API ${method} ${path} → ${res.status}: ${errText}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

const get   = (path)        => request('GET',    path);
const post  = (path, body)  => request('POST',   path, body);
const put   = (path, body)  => request('PUT',    path, body);
const patch = (path, body)  => request('PATCH',  path, body);
const del   = (path)        => request('DELETE', path);


// ─── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  /** POST /api/auth/login → { token, user } */
  login: (username, password) => post('/auth/login', { username, password }),

  /** POST /api/auth/logout */
  logout: () => post('/auth/logout'),
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const dashboard = {
  /** GET /api/dashboard/stats */
  stats: () => get('/dashboard/stats'),
};

// ─── Tokens ───────────────────────────────────────────────────────────────────
export const tokens = {
  /** GET /api/tokens/next → { next_token } */
  next: () => get('/tokens/next'),
};

// ─── Receptionist — Patients ──────────────────────────────────────────────────
export const patients = {
  /** GET /api/patients */
  list: () => get('/patients'),

  /** POST /api/patients → { patient, token_number } */
  register: (data) => post('/patients', data),

  /** GET /api/patients/:id */
  get: (id) => get(`/patients/${id}`),

  /** GET /api/doctors — active on-duty physicians */
  doctors: () => get('/doctors'),
};

// ─── Receptionist — Questionnaire ─────────────────────────────────────────────
export const questionnaire = {
  /** GET /api/visits/:visitId/questionnaire */
  get: (visitId) => get(`/visits/${visitId}/questionnaire`),

  /** POST /api/visits/:visitId/questionnaire */
  submit: (visitId, data) => post(`/visits/${visitId}/questionnaire`, data),
};

// ─── Receptionist — Reports Upload ────────────────────────────────────────────
export const reports = {
  /** GET /api/visits/:visitId/reports */
  list: (visitId) => get(`/visits/${visitId}/reports`),

  /** POST /api/visits/:visitId/reports/upload (multipart form-data — use fetch directly) */
  upload: async (visitId, formData) => {
    const token = localStorage.getItem('auth_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}/visits/${visitId}/reports/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed ${res.status}: ${errText}`);
    }
    return res.json();
  },
};

// ─── Receptionist — Queue ─────────────────────────────────────────────────────
export const queue = {
  /** GET /api/receptionist/queue */
  list: () => get('/receptionist/queue'),
};

// ─── Doctor — Queue ───────────────────────────────────────────────────────────
export const doctorQueue = {
  /** GET /api/doctor/queue */
  list: () => get('/doctor/queue'),

  /** POST /api/doctor/queue/:id/call → navigates to consultation */
  call: (queueId) => post(`/doctor/queue/${queueId}/call`),
};

// ─── Doctor — Patient Dossier ─────────────────────────────────────────────────
export const dossier = {
  /** GET /api/doctor/patients/:id/dossier */
  get: (patientId) => get(`/doctor/patients/${patientId}/dossier`),
};

// ─── Doctor — CDSS / Insights ─────────────────────────────────────────────────
export const cdss = {
  /** POST /api/doctor/visits/:visitId/insights/evaluate */
  evaluate: (visitId, payload = {}) => post(`/doctor/visits/${visitId}/insights/evaluate`, payload),

  /** GET /api/doctor/visits/:visitId/insights */
  list: (visitId) => get(`/doctor/visits/${visitId}/insights`),

  /** PATCH /api/doctor/insights/:insightId */
  review: (insightId, data) => patch(`/doctor/insights/${insightId}`, data),
};

// ─── Doctor — Prescriptions ───────────────────────────────────────────────────
export const prescriptions = {
  /** GET /api/doctor/visits/:visitId/prescriptions */
  list: (visitId) => get(`/doctor/visits/${visitId}/prescriptions`),

  /** POST /api/doctor/visits/:visitId/prescriptions/check-safety */
  checkSafety: (visitId, items) => post(`/doctor/visits/${visitId}/prescriptions/check-safety`, items),

  /** POST /api/doctor/visits/:visitId/prescriptions */
  create: (visitId, data) => post(`/doctor/visits/${visitId}/prescriptions`, data),
};

// ─── Doctor — Formulary ───────────────────────────────────────────────────────
export const formulary = {
  /** GET /api/doctor/formulary?q=:query */
  search: (query) => get(`/doctor/formulary?q=${encodeURIComponent(query)}`),
};

// ─── Doctor — Sign-Off ────────────────────────────────────────────────────────
export const signOff = {
  /** POST /api/doctor/visits/:visitId/sign-off */
  submit: (visitId, data) => post(`/doctor/visits/${visitId}/sign-off`, data),
};

// ─── Cashier ──────────────────────────────────────────────────────────────────
export const cashier = {
  /** GET /api/cashier/queue */
  queue: () => get('/cashier/queue'),

  /** GET /api/cashier/bills/:visitId */
  bill: (visitId) => get(`/cashier/bills/${visitId}`),

  /** POST /api/bills/:billId/payments */
  pay: (billId, data) => post(`/bills/${billId}/payments`, data),

  /** GET /api/bills/:billId/receipt */
  receipt: (billId, format = null) => get(`/bills/${billId}/receipt${format ? `?format=${format}` : ''}`),
};


// ─── Admin — Analytics ────────────────────────────────────────────────────────
export const admin = {
  /** GET /api/admin/dashboard */
  dashboard: () => get('/admin/dashboard'),

  /** GET /api/admin/staff */
  staff: () => get('/admin/staff'),

  /** POST /api/admin/staff */
  createStaff: (data) => post('/admin/staff', data),

  /** PUT /api/admin/staff/:id/status */
  toggleStatus: (id, active) => put(`/admin/staff/${id}/status`, { active }),

  /** GET /api/admin/audit-logs */
  auditLogs: (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return get(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

export default { auth, dashboard, tokens, patients, questionnaire, reports, queue, doctorQueue, dossier, cdss, prescriptions, formulary, signOff, cashier, admin };
