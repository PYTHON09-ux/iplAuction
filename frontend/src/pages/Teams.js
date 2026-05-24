import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, formatCurrency, buildFormData, ROLE_COLORS } from '../utils/api';
import TeamModal from '../components/TeamModal';

export default function Teams() {
  const { teams, refreshTeams, activeEvent, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshTeams(activeEvent ? { auctionEvent: activeEvent._id } : {});
  }, [activeEvent]);

  const loadTeamDetails = async (id) => {
    if (expandedTeam === id) { setExpandedTeam(null); return; }
    try {
      const t = await api.getTeam(id);
      setTeamDetails(d => ({ ...d, [id]: t }));
      setExpandedTeam(id);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleSave = async (form, logoFile) => {
    setSaving(true);
    try {
      const data = { ...form };
      if (activeEvent && !editTeam) data.auctionEvent = activeEvent._id;
      const fd = buildFormData(data, logoFile, 'logo');
      if (editTeam) { await api.updateTeam(editTeam._id, fd); showToast('Team updated!'); }
      else { await api.createTeam(fd); showToast('Team created!'); }
      setShowModal(false); setEditTeam(null);
      refreshTeams(activeEvent ? { auctionEvent: activeEvent._id } : {});
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete ${t.name}? All their players will be reset.`)) return;
    try {
      await api.deleteTeam(t._id);
      showToast('Team deleted');
      refreshTeams(activeEvent ? { auctionEvent: activeEvent._id } : {});
    } catch (e) { showToast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>🛡️ Teams</h1>
          <p>{teams.length} teams · {activeEvent ? activeEvent.name : 'All auctions'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTeam(null); setShowModal(true); }}>+ Add Team</button>
      </div>

      {teams.length === 0 ? (
        <div className="empty-state"><div className="icon">🛡️</div><p>No teams yet. Add a team to get started.</p></div>
      ) : (
        <div className="team-grid">
          {teams.map(t => {
            const spent = t.budget - t.remainingBudget;
            const pct = Math.round((spent / t.budget) * 100);
            const details = teamDetails[t._id];
            const isExpanded = expandedTeam === t._id;
            return (
              <div key={t._id} className="team-card">
                <div className="team-card-header">
                  <div className="team-badge" style={{ background: t.logo ? 'transparent' : t.color }}>
                    {t.logo
                      ? <img src={t.logo} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : t.shortName}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Rajdhani' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>👤 {t.owner}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setEditTeam(t); setShowModal(true); }}>✏️</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(t)}>🗑</button>
                  </div>
                </div>
                <div className="team-card-body">
                  <div className="team-stat-row"><span className="label">Total Purse</span><span className="val">{formatCurrency(t.budget)}</span></div>
                  <div className="team-stat-row">
                    <span className="label">Remaining</span>
                    <span className="val" style={{ color: t.remainingBudget < t.budget * 0.2 ? 'var(--red)' : 'var(--green)' }}>{formatCurrency(t.remainingBudget)}</span>
                  </div>
                  <div className="team-stat-row"><span className="label">Spent</span><span className="val">{formatCurrency(spent)}</span></div>
                  <div className="team-stat-row"><span className="label">Players</span><span className="val">{t.players.length} / {t.maxPlayers}</span></div>
                  <div className="budget-bar"><div className="budget-bar-fill" style={{ width: `${pct}%`, background: t.color }} /></div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 4 }}>{pct}% purse used</div>

                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} onClick={() => loadTeamDetails(t._id)}>
                    {isExpanded ? '▲ Hide Roster' : '▼ View Roster'}
                  </button>

                  {isExpanded && details && (
                    <div style={{ marginTop: 10 }}>
                      {details.players.length === 0 ? (
                        <div style={{ color: 'var(--text3)', fontSize: '0.82rem', textAlign: 'center', padding: '10px 0' }}>No players yet</div>
                      ) : details.players.map(p => (
                        <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: ROLE_COLORS[p.role], flexShrink: 0 }} />
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} /> : null}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{p.role}</div>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600 }}>{formatCurrency(p.soldPrice)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <TeamModal team={editTeam} defaultBudget={activeEvent?.defaultTeamBudget} onSave={handleSave} onClose={() => { setShowModal(false); setEditTeam(null); }} />
      )}
    </div>
  );
}
