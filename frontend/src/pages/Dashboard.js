import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api, formatCurrency } from '../utils/api';

export default function Dashboard({ setPage }) {
  const { stats, refreshStats, teams, refreshTeams, activeEvent, showToast } = useApp();

  useEffect(() => {
    const p = activeEvent ? { auctionEvent: activeEvent._id } : {};
    refreshStats(p);
    refreshTeams(p);
  }, [activeEvent]);

  const pct = stats ? Math.round((stats.soldPlayers / (stats.totalPlayers || 1)) * 100) : 0;

  const copyViewerLink = () => {
    if (!activeEvent) return showToast('Select an auction first', 'error');
    const url = `${window.location.origin}/viewer/${activeEvent.viewerToken}`;
    navigator.clipboard.writeText(url).then(() => showToast('Viewer link copied!')).catch(() => showToast(url, 'info'));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p>{activeEvent ? `Auction: ${activeEvent.name}` : 'No auction selected — go to Auctions to select one'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {activeEvent && (
            <button className="btn btn-secondary btn-sm" onClick={copyViewerLink}>📡 Copy Viewer Link</button>
          )}
          {activeEvent && (
            <button className="btn btn-secondary btn-sm" onClick={async () => {
              if (!window.confirm('Reset all auction data for this event?')) return;
              try { await api.resetAuction(activeEvent._id); showToast('Auction reset!'); refreshStats({ auctionEvent: activeEvent._id }); refreshTeams({ auctionEvent: activeEvent._id }); }
              catch (e) { showToast(e.message, 'error'); }
            }}>🔄 Reset Auction</button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Players', value: stats?.totalPlayers ?? '—', color: 'var(--text)', sub: 'Registered' },
          { label: 'Sold', value: stats?.soldPlayers ?? '—', color: 'var(--green)', sub: `${pct}% of total` },
          { label: 'Unsold', value: stats?.unsoldPlayers ?? '—', color: 'var(--red)', sub: 'Returned to pool' },
          { label: 'Available', value: stats?.availablePlayers ?? '—', color: 'var(--accent)', sub: 'Ready to bid' },
          { label: 'Teams', value: stats?.teamCount ?? '—', color: 'var(--accent2)', sub: 'Participating' },
          { label: 'Budget Spent', value: stats ? formatCurrency(stats.totalBudgetSpent) : '—', color: 'var(--gold)', sub: 'Across all teams', small: true },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value" style={{ color: s.color, fontSize: s.small ? '1.3rem' : undefined }}>{s.value}</div>
            <div className="sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {stats?.highestSale && (
        <div className="card" style={{ marginBottom: 22, background: 'linear-gradient(135deg, #1a1200, #2a1a00)', borderColor: 'var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: '2.2rem' }}>👑</div>
            {stats.highestSale.imageUrl && <img src={stats.highestSale.imageUrl} alt={stats.highestSale.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />}
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gold)', fontWeight: 700 }}>Highest Sale</div>
              <div style={{ fontSize: '1.3rem', fontFamily: 'Rajdhani', fontWeight: 700 }}>{stats.highestSale.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{stats.highestSale.role} · {stats.highestSale.team?.name}</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '1.8rem', fontFamily: 'Rajdhani', fontWeight: 800, color: 'var(--gold)' }}>
              {formatCurrency(stats.highestSale.soldPrice)}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>Teams Budget Usage</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage('teams')}>View All</button>
          </div>
          {teams.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              {activeEvent ? 'No teams in this auction' : 'Select an auction first'}
            </div>
          ) : teams.slice(0, 6).map(t => {
            const spent = t.budget - t.remainingBudget;
            const p = Math.round((spent / t.budget) * 100);
            return (
              <div key={t._id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {t.logo ? <img src={t.logo} alt={t.name} style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />}
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t.name}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{t.players.length} players · {formatCurrency(t.remainingBudget)} left</span>
                </div>
                <div className="budget-bar"><div className="budget-bar-fill" style={{ width: `${p}%`, background: t.color }} /></div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-header"><h2>Quick Actions</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setPage('auction')}>🏏 Go to Live Auction</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setPage('players')}>👤 Manage Players</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setPage('teams')}>🛡️ Manage Teams</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setPage('history')}>📋 View History</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setPage('events')}>🏆 Manage Auctions</button>
          </div>
          {stats && (
            <div style={{ marginTop: 18, padding: 14, background: 'var(--bg2)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontWeight: 700 }}>Auction Progress</div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 5, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 6 }}>{stats.soldPlayers} of {stats.totalPlayers} players auctioned ({pct}%)</div>
            </div>
          )}

          {activeEvent && (
            <div style={{ marginTop: 14, padding: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>Viewer Link</div>
              <div className="copy-box">
                <span>{window.location.origin}/viewer/{activeEvent.viewerToken}</span>
                <button className="btn btn-secondary btn-sm" onClick={copyViewerLink}>📋</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
