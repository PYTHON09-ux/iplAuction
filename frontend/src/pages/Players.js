import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, formatCurrency, buildFormData, ROLE_COLORS } from '../utils/api';
import PlayerModal from '../components/PlayerModal';

export default function Players() {
  const { players, refreshPlayers, activeEvent, showToast } = useApp();
  const [filter, setFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = activeEvent ? { auctionEvent: activeEvent._id } : {};
    refreshPlayers(p);
  }, [activeEvent]);

  const filtered = players.filter(p => {
    const matchStatus = filter === 'All' || p.status === filter;
    const matchRole = roleFilter === 'All' || p.role === roleFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchRole && matchSearch;
  });

  const handleSave = async (form, imageFile) => {
    setSaving(true);
    try {
      const data = { ...form };
      if (activeEvent && !editPlayer) data.auctionEvent = activeEvent._id;
      const fd = buildFormData(data, imageFile, 'image');
      if (editPlayer) { await api.updatePlayer(editPlayer._id, fd); showToast('Player updated!'); }
      else { await api.createPlayer(fd); showToast('Player added!'); }
      setShowModal(false); setEditPlayer(null);
      refreshPlayers(activeEvent ? { auctionEvent: activeEvent._id } : {});
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try { await api.deletePlayer(p._id); showToast('Player deleted'); refreshPlayers(activeEvent ? { auctionEvent: activeEvent._id } : {}); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const handleReset = async (p) => {
    if (!window.confirm(`Reset ${p.name} to Available?`)) return;
    try { await api.resetPlayer(p._id); showToast(`${p.name} reset`); refreshPlayers(activeEvent ? { auctionEvent: activeEvent._id } : {}); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>👤 Players</h1>
          <p>{players.length} total · {activeEvent ? activeEvent.name : 'All auctions'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditPlayer(null); setShowModal(true); }}>+ Add Player</button>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '0.85rem' }}>🔍</span>
          <input className="form-control" style={{ paddingLeft: 32, width: 190 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
        </div>
        {['All','Available','Sold','Unsold'].map(s => (
          <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
        <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
        {['All','Batsman','Bowler','All-Rounder','Wicket-Keeper'].map(r => (
          <button key={r} className={`filter-btn ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>{r === 'All' ? 'All Roles' : r}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text3)' }}>{filtered.length} results</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">👤</div><p>No players found</p></div>
      ) : (
        <div className="player-grid">
          {filtered.map(p => {
            const roleColor = ROLE_COLORS[p.role] || '#666';
            return (
              <div key={p._id} className="player-card" onClick={() => { setEditPlayer(p); setShowModal(true); }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: roleColor }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="p-avatar" />
                    : <div className="p-avatar-placeholder" style={{ background: `${roleColor}22`, color: roleColor }}>{initials(p.name)}</div>
                  }
                  <span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span>
                </div>
                <div className="name">{p.name}</div>
                <div className="meta">{p.role} · Age {p.age}</div>
                {p.stats && (
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 8 }}>
                    {p.stats.runs > 0 && <span>🏏 {p.stats.runs}R</span>}
                    {p.stats.wickets > 0 && <span>🎯 {p.stats.wickets}W</span>}
                    {p.stats.matches > 0 && <span>📊 {p.stats.matches}M</span>}
                  </div>
                )}
                <div className="price-row">
                  <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Base: {formatCurrency(p.basePrice)}</span>
                  {p.status === 'Sold' && p.soldPrice && <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(p.soldPrice)}</span>}
                </div>
                {p.status === 'Sold' && p.team && (
                  <div style={{ marginTop: 5, fontSize: '0.75rem', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {p.team.logo ? <img src={p.team.logo} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'cover' }} /> : '🛡️'}
                    {p.team.name}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                  {(p.status === 'Sold' || p.status === 'Unsold') && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleReset(p)}>↩ Reset</button>
                  )}
                  <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto', padding: '5px 8px' }} onClick={() => handleDelete(p)}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <PlayerModal player={editPlayer} onSave={handleSave} onClose={() => { setShowModal(false); setEditPlayer(null); }} />
      )}
    </div>
  );
}
