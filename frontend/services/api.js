const BASE_URL = '/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed (${res.status})`);
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchHealth):', err);
    return { status: 'offline', database: 'disconnected', error: err.message };
  }
}

export async function fetchDoctors() {
  try {
    const res = await fetch(`${BASE_URL}/doctors`);
    if (!res.ok) throw new Error(`Failed to fetch doctors (${res.status})`);
    const data = await res.json();
    return data.doctors || [];
  } catch (err) {
    console.error('API Error (fetchDoctors):', err);
    return [];
  }
}

export async function fetchNextToken() {
  try {
    const res = await fetch(`${BASE_URL}/tokens/next`);
    if (!res.ok) throw new Error(`Failed to preview token (${res.status})`);
    const data = await res.json();
    return data.next_token || 'Q-101';
  } catch (err) {
    console.error('API Error (fetchNextToken):', err);
    return 'Q-101';
  }
}

export async function fetchPatients(searchTerm = '') {
  try {
    const url = searchTerm.trim() 
      ? `${BASE_URL}/patients?search=${encodeURIComponent(searchTerm.trim())}`
      : `${BASE_URL}/patients`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch patients (${res.status})`);
    const data = await res.json();
    return data.patients || [];
  } catch (err) {
    console.error('API Error (fetchPatients):', err);
    return [];
  }
}

export async function registerPatient(payload) {
  const res = await fetch(`${BASE_URL}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMsg = 'Failed to register patient';
    try {
      const errData = await res.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function loginUser(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let errorMsg = 'Invalid credentials';
    try {
      const errData = await res.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function fetchAuthUsers() {
  try {
    const res = await fetch(`${BASE_URL}/auth/users`);
    if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`);
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.error('API Error (fetchAuthUsers):', err);
    return [];
  }
}

export async function fetchDashboardStats() {
  try {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error(`Failed to fetch dashboard stats (${res.status})`);
    return await res.json();
  } catch (err) {
    console.error('API Error (fetchDashboardStats):', err);
    return null;
  }
}
