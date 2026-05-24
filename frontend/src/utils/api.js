const BASE = '/api';

const getToken = () => localStorage.getItem('ca_token');

const handle = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    if (res.status === 401) { localStorage.removeItem('ca_token'); window.location.reload(); }
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

const authHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
  ...extra,
});

const authFormHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

export const api = {
  // Auth
  needsSetup: () => fetch(`${BASE}/auth/needs-setup`).then(handle),
  setup: (data) => fetch(`${BASE}/auth/setup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handle),
  login: (data) => fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handle),
  me: () => fetch(`${BASE}/auth/me`, { headers: authHeaders() }).then(handle),
  changePassword: (data) => fetch(`${BASE}/auth/password`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),

  // Auction Events
  getEvents: () => fetch(`${BASE}/events`).then(handle),
  getEvent: (id) => fetch(`${BASE}/events/${id}`).then(handle),
  createEvent: (fd) => fetch(`${BASE}/events`, { method: 'POST', headers: authFormHeaders(), body: fd }).then(handle),
  updateEvent: (id, fd) => fetch(`${BASE}/events/${id}`, { method: 'PUT', headers: authFormHeaders(), body: fd }).then(handle),
  deleteEvent: (id) => fetch(`${BASE}/events/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
  getEventLive: (token) => fetch(`${BASE}/events/${token}/live`).then(handle),

  // Players
  getPlayers: (params = {}) => { const q = new URLSearchParams(params).toString(); return fetch(`${BASE}/players${q ? '?' + q : ''}`).then(handle); },
  getPlayer: (id) => fetch(`${BASE}/players/${id}`).then(handle),
  createPlayer: (fd) => fetch(`${BASE}/players`, { method: 'POST', headers: authFormHeaders(), body: fd }).then(handle),
  updatePlayer: (id, fd) => fetch(`${BASE}/players/${id}`, { method: 'PUT', headers: authFormHeaders(), body: fd }).then(handle),
  deletePlayer: (id) => fetch(`${BASE}/players/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
  resetPlayer: (id) => fetch(`${BASE}/players/${id}/reset`, { method: 'PUT', headers: authHeaders() }).then(handle),

  // Teams
  getTeams: (params = {}) => { const q = new URLSearchParams(params).toString(); return fetch(`${BASE}/teams${q ? '?' + q : ''}`).then(handle); },
  getTeam: (id) => fetch(`${BASE}/teams/${id}`).then(handle),
  createTeam: (fd) => fetch(`${BASE}/teams`, { method: 'POST', headers: authFormHeaders(), body: fd }).then(handle),
  updateTeam: (id, fd) => fetch(`${BASE}/teams/${id}`, { method: 'PUT', headers: authFormHeaders(), body: fd }).then(handle),
  deleteTeam: (id) => fetch(`${BASE}/teams/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),

  // Auction
  getCurrentAuction: (params = {}) => { const q = new URLSearchParams(params).toString(); return fetch(`${BASE}/auction/current${q ? '?' + q : ''}`).then(handle); },
  getAuctionHistory: (params = {}) => { const q = new URLSearchParams(params).toString(); return fetch(`${BASE}/auction/history${q ? '?' + q : ''}`).then(handle); },
  getAuctionStats: (params = {}) => { const q = new URLSearchParams(params).toString(); return fetch(`${BASE}/auction/stats${q ? '?' + q : ''}`).then(handle); },
  startAuction: (playerId, auctionEvent) => fetch(`${BASE}/auction/start`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ playerId, auctionEvent }) }).then(handle),
  placeBid: (sessionId, teamId, amount) => fetch(`${BASE}/auction/bid`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ sessionId, teamId, amount }) }).then(handle),
  markSold: (sessionId) => fetch(`${BASE}/auction/sold`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ sessionId }) }).then(handle),
  markUnsold: (sessionId) => fetch(`${BASE}/auction/unsold`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ sessionId }) }).then(handle),
  pauseAuction: (sessionId) => fetch(`${BASE}/auction/pause`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ sessionId }) }).then(handle),
  undoBid: (sessionId) => fetch(`${BASE}/auction/undo-bid`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ sessionId }) }).then(handle),

  // Seed (admin)
  seedDemo: () => fetch(`${BASE}/seed/demo`, { method: 'POST', headers: authHeaders() }).then(handle),
  resetAuction: (auctionEvent) => fetch(`${BASE}/seed/reset`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ auctionEvent }) }).then(handle),
};

export const formatCurrency = (amount) => {
  // if (!amount && amount !== 0) return '—';
  // if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  // if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  // if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
};

export const buildFormData = (obj, imageFile, imageField = 'image') => {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    if (typeof v === 'object' && !(v instanceof File)) fd.append(k, JSON.stringify(v));
    else fd.append(k, v);
  });
  if (imageFile) fd.append(imageField, imageFile);
  return fd;
};

export const ROLE_COLORS = { 'Batsman': '#3B82F6', 'Bowler': '#EF4444', 'All-Rounder': '#10B981', 'Wicket-Keeper': '#F59E0B' };
export const STATUS_COLORS = { 'Available': '#10B981', 'Sold': '#3B82F6', 'Unsold': '#EF4444' };
