import api from './api';

// --- transaction api calls ---

export async function fetchTransactions(params = {}) {
  const res = await api.get('/transactions', { params });
  return res.data;
}

export async function fetchTransaction(id) {
  const res = await api.get(`/transactions/${id}`);
  return res.data.transaction;
}

export async function createTransaction(data) {
  const res = await api.post('/transactions', data);
  return res.data;
}

export async function updateTransaction(id, data) {
  const res = await api.put(`/transactions/${id}`, data);
  return res.data;
}

export async function deleteTransaction(id) {
  const res = await api.delete(`/transactions/${id}`);
  return res.data;
}

export async function fetchCategories() {
  const res = await api.get('/transactions/categories');
  return res.data.categories;
}

// --- analytics api calls ---

export async function fetchSummary() {
  const res = await api.get('/analytics/summary');
  return res.data;
}

export async function fetchMonthlyOverview(year) {
  const res = await api.get('/analytics/monthly', { params: { year } });
  return res.data;
}

export async function fetchCategoryBreakdown() {
  const res = await api.get('/analytics/categories');
  return res.data;
}

export async function fetchTrends(months = 6) {
  const res = await api.get('/analytics/trends', { params: { months } });
  return res.data;
}

// --- user api calls (admin) ---

export async function fetchUsers() {
  const res = await api.get('/users');
  return res.data.users;
}

export async function updateUserRole(id, role) {
  const res = await api.put(`/users/${id}/role`, { role });
  return res.data;
}

export async function deleteUser(id) {
  const res = await api.delete(`/users/${id}`);
  return res.data;
}
