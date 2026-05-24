import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, formatCurrency, buildFormData } from '../utils/api';
import ImageUpload from '../components/ImageUpload';

const EMPTY_EVENT = { name: '', description: '', season: '', defaultTeamBudget: 8000000, defaultBasePrice: 100000, minBidIncrement: 10000, status: 'Draft' };

export default function Events({ setPage }) {
  const { events, refreshEvents, activeEvent, setActiveEvent, showToast } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { refreshEvents(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(EMPTY_EVENT); setLogoFile(null); setEditEvent(null); setShowCreate(true); };
  const openEdit = (ev) => { setForm({ ...EMPTY_EVENT, ...ev }); setLogoFile(null); setEditEvent(ev); setShowCreate(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return showToast('Event name is required', 'error');
    setLoading(true);
    try {
      const fd = buildFormData(form, logoFile, 'logo');
      if (editEvent) {
        await api.updateEvent(editEvent._id, fd);
        showToast('Auction updated!');
      } else {
        await api.createEvent(fd);
        showToast('Auction created!');
      }
      setShowCreate(false);
      refreshEvents();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (ev) => {
    if (!window.confirm(`Delete "${ev.name}"? This will remove all teams, sessions and reset players.`)) return;
    try {
      await api.deleteEvent(ev._id);
      showToast('Auction deleted');
      if (activeEvent?._id === ev._id) setActiveEvent(null);
      refreshEvents();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleSelect = (ev) => {
    setActiveEvent(ev);
    showToast(`Switched to: ${ev.name}`);
    setPage('dashboard');
  };

  const copyViewerLink = (ev) => {
    const url = `${window.location.origin}/viewer/${ev.viewerToken}`;
    navigator.clipboard.writeText(url).then(() => showToast('Viewer link copied!')).catch(() => showToast(url, 'info'));
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>🏆 Auctions</h1><p>Create and manage your cricket auction events</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={async () => {
            try { const r = await api.seedDemo(); showToast(r.message); refreshEvents(); } catch (e) { showToast(e.message, 'error'); }
          }}>🌱 Load Demo</button>
          <button className="btn btn-primary" onClick={openCreate}>+ New Auction</button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏆</div>
          <p>No auctions yet. Create one to get started!</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>+ Create Auction</button>
        </div>
      ) : (
        <div className="event-grid">
          {events.map(ev => {
            const isActive = activeEvent?._id === ev._id;
            return (
              <div key={ev._id} className="event-card" style={{ border: isActive ? '2px solid var(--accent)' : undefined }}>
                <div className="event-card-header">
                  <div className="event-logo">
                    {ev.logo ? <img src={ev.logo} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : '🏏'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Rajdhani' }}>{ev.name}</span>
                      {isActive && <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: '#000', padding: '1px 7px', borderRadius: 10, fontWeight: 800, textTransform: 'uppercase' }}>Active</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge badge-${ev.status.toLowerCase()}`}>{ev.status}</span>
                      {ev.season && <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Season {ev.season}</span>}
                    </div>
                  </div>
                </div>

                <div className="event-card-body">
                  {ev.description && <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 12 }}>{ev.description}</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text3)' }}>Default Purse</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(ev.defaultTeamBudget)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text3)' }}>Base Price</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(ev.defaultBasePrice)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text3)' }}>Min Bid Inc.</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(ev.minBidIncrement)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text3)' }}>Teams</span>
                      <span style={{ fontWeight: 600 }}>{ev.teams?.length || 0}</span>
                    </div>
                  </div>

                  {/* Viewer link */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>Viewer Link</div>
                    <div className="copy-box">
                      <span>{window.location.origin}/viewer/{ev.viewerToken}</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => copyViewerLink(ev)}>📋 Copy</button>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>Token: <strong style={{ color: 'var(--accent)', letterSpacing: 2 }}>{ev.viewerToken}</strong></div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleSelect(ev)}>
                      {isActive ? '✅ Selected' : '▶ Use This'}
                    </button>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(ev)} title="Edit">✏️</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(ev)} title="Delete">🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal modal-lg">
            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            <h2 className="modal-title">{editEvent ? '✏️ Edit Auction' : '🏆 Create New Auction'}</h2>

            <div className="form-group">
              <label>Auction Logo</label>
              <ImageUpload currentUrl={editEvent?.logo} label="Upload auction logo" onFile={setLogoFile} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Auction Name *</label>
                <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Local T20 Auction 2025" />
              </div>
              <div className="form-group">
                <label>Season</label>
                <input className="form-control" value={form.season} onChange={e => set('season', e.target.value)} placeholder="2025" />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description..." rows={2} style={{ resize: 'vertical' }} />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label>Default Team Purse (₹)</label>
                <input type="number" className="form-control" value={form.defaultTeamBudget} onChange={e => set('defaultTeamBudget', Number(e.target.value))} min="100000" step="100000" />
              </div>
              <div className="form-group">
                <label>Default Base Price (₹)</label>
                <input type="number" className="form-control" value={form.defaultBasePrice} onChange={e => set('defaultBasePrice', Number(e.target.value))} min="10000" step="10000" />
              </div>
              <div className="form-group">
                <label>Min Bid Increment (₹)</label>
                <input type="number" className="form-control" value={form.minBidIncrement} onChange={e => set('minBidIncrement', Number(e.target.value))} min="1000" step="1000" />
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Draft</option><option>Active</option><option>Completed</option>
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? '⏳ Saving...' : editEvent ? 'Update Auction' : 'Create Auction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
