import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, formatCurrency } from '../utils/api';

export default function Dashboard({ setPage }) {
  const { stats, refreshStats, teams, refreshTeams, activeEvent, showToast } = useApp();
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = activeEvent ? { auctionEvent: activeEvent._id } : {};
    refreshStats(p);
    refreshTeams(p);
  }, [activeEvent]);

  const pct = stats ? Math.round((stats.soldPlayers / (stats.totalPlayers || 1)) * 100) : 0;

  const copyViewerLink = () => {
    if (!activeEvent) return showToast('Select an auction first', 'error');
    const url = window.location.origin + '/viewer/' + activeEvent.viewerToken;
    navigator.clipboard.writeText(url)
      .then(() => { showToast('Viewer link copied!'); setCopied(true); setTimeout(() => setCopied(false), 2000); })
      .catch(() => showToast(url, 'info'));
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all auction data for this event?')) return;
    setResetting(true);
    try {
      await api.resetAuction(activeEvent._id);
      showToast('Auction reset!');
      const p = { auctionEvent: activeEvent._id };
      await Promise.all([refreshStats(p), refreshTeams(p)]);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setResetting(false); }
  };

  const statCards = [
    { label: 'Total', value: stats?.totalPlayers ?? '-', color: 'var(--text)', sub: 'Players', icon: '👤' },
    { label: 'Sold', value: stats?.soldPlayers ?? '-', color: 'var(--green)', sub: pct + '% done', icon: '✅' },
    { label: 'Unsold', value: stats?.unsoldPlayers ?? '-', color: 'var(--red)', sub: 'Returned', icon: 'X' },
    { label: 'Available', value: stats?.availablePlayers ?? '-', color: 'var(--accent)', sub: 'Ready', icon: '⏳' },
    { label: 'Teams', value: stats?.teamCount ?? '-', color: 'var(--accent2)', sub: 'Playing', icon: '🛡️' },
    { label: 'Spent', value: stats ? formatCurrency(stats.totalBudgetSpent) : '-', color: 'var(--gold)', sub: 'All teams', icon: '💰', small: true },
  ];

  const quickActions = [
    { label: '🏏 Live Auction', page: 'auction', primary: true },
    { label: '👤 Players', page: 'players' },
    { label: '🛡️ Teams', page: 'teams' },
    { label: '📋 History', page: 'history' },
    { label: '🏆 Auctions', page: 'events' },
    { label: '⚙️ Settings', page: 'settings' },
  ];

  return (
    <div>
      <style>{`
        .dash-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
        .dash-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .dash-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .action-btn { background: var(--bg2); color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 13px 8px; font-family: Exo 2, sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 46px; -webkit-tap-highlight-color: transparent; }
        .action-btn:active { opacity: 0.75; transform: scale(0.97); }
        .action-btn.primary { background: var(--accent); color: #000; border-color: var(--accent); grid-column: 1 / -1; }
        .action-btn:hover { background: var(--border); }
        .action-btn.primary:hover { background: #d97706; }
        .team-row { padding: 10px 12px; background: var(--bg2); border-radius: 10px; border: 1px solid var(--border); margin-bottom: 9px; }
        .copy-btn { background: var(--accent); border: none; color: #000; border-radius: 7px; padding: 6px 13px; font-family: Exo 2, sans-serif; font-size: 0.78rem; font-weight: 700; cursor: pointer; flex-shrink: 0; transition: all 0.2s; min-height: 34px; -webkit-tap-highlight-color: transparent; }
        .copy-btn.copied { background: var(--green); color: #fff; }
        .copy-btn:active { opacity: 0.75; }
        .hdr-btn { font-family: Exo 2, sans-serif; font-size: 0.8rem; font-weight: 600; border-radius: 8px; padding: 8px 13px; cursor: pointer; border: 1px solid var(--border); background: var(--bg3); color: var(--text); transition: all 0.15s; -webkit-tap-highlight-color: transparent; }
        .hdr-btn:active { opacity: 0.7; }
        @media (max-width: 480px) {
          .dash-stats { grid-template-columns: repeat(2, 1fr); }
          .dash-two-col { grid-template-columns: 1fr; }
        }
        @media (min-width: 900px) {
          .dash-stats { grid-template-columns: repeat(6, 1fr); }
          .dash-actions { grid-template-columns: repeat(3, 1fr); }
          .dash-two-col { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.9rem)', fontFamily: 'Rajdhani', fontWeight: 700 }}>📊 Dashboard</h1>
          <p style={{ color: 'var(--text2)', marginTop: 3, fontSize: 'clamp(0.75rem, 2.5vw, 0.88rem)' }}>
            {activeEvent ? activeEvent.name : 'No auction selected'}
          </p>
        </div>
        {activeEvent && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="hdr-btn" onClick={copyViewerLink}>{copied ? '✅ Copied!' : '📡 Viewer Link'}</button>
            <button className="hdr-btn" onClick={handleReset} disabled={resetting} style={{ opacity: resetting ? 0.55 : 1 }}>
              {resetting ? '⏳ Resetting…' : '🔄 Reset'}
            </button>
          </div>
        )}
      </div>

      {/* ── No-auction nudge ── */}
      {!activeEvent && (
        <div onClick={() => setPage('events')} style={{ marginBottom: 16, padding: '13px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <span style={{ fontSize: '1.4rem' }}>🏆</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent)' }}>No auction selected</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Tap to pick an auction event</div>
          </div>
          <span style={{ color: 'var(--accent)', fontSize: '1.3rem' }}>›</span>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="dash-stats">
        {statCards.map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 11px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 8, right: 9, fontSize: '1rem', opacity: 0.18 }}>{s.icon}</div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 5, fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: s.small ? 'clamp(1rem,3.5vw,1.35rem)' : 'clamp(1.25rem,4.5vw,1.65rem)', fontWeight: 800, fontFamily: 'Rajdhani', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Highest Sale ── */}
      {stats?.highestSale && (
        <div style={{ marginBottom: 14, background: 'linear-gradient(135deg,#1a1200,#2a1a00)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '13px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.5rem' }}>👑</span>
            {stats.highestSale.imageUrl && (
              <img src={stats.highestSale.imageUrl} alt={stats.highestSale.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gold)', fontWeight: 700 }}>Highest Sale</div>
              <div style={{ fontSize: 'clamp(0.92rem,3vw,1.15rem)', fontFamily: 'Rajdhani', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stats.highestSale.name}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text2)' }}>{stats.highestSale.role} · {stats.highestSale.team?.name}</div>
            </div>
            <div style={{ fontSize: 'clamp(1rem,4vw,1.5rem)', fontFamily: 'Rajdhani', fontWeight: 800, color: 'var(--gold)', flexShrink: 0 }}>
              {formatCurrency(stats.highestSale.soldPrice)}
            </div>
          </div>
        </div>
      )}

      {/* ── Progress bar ── */}
      {stats && (
        <div style={{ marginBottom: 14, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Auction Progress</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{pct}%</span>
          </div>
          <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,var(--accent),var(--green))', borderRadius: 5, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text2)', marginTop: 6 }}>
            {stats.soldPlayers} of {stats.totalPlayers} players auctioned
          </div>
        </div>
      )}

      {/* ── Two-column section: Quick Actions + Teams ── */}
      <div className="dash-two-col" style={{ marginBottom: 14 }}>

        {/* Quick Actions */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 11 }}>Quick Actions</div>
          <div className="dash-actions">
            {quickActions.map(a => (
              <button key={a.page} className={'action-btn' + (a.primary ? ' primary' : '')} onClick={() => setPage(a.page)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Teams Budget</div>
            <button onClick={() => setPage('teams')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'Exo 2,sans-serif' }}>All ›</button>
          </div>

          {teams.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center', padding: '18px 0' }}>
              {activeEvent ? 'No teams yet' : 'Select an auction'}
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
              {teams.map(t => {
                const spent = t.budget - t.remainingBudget;
                const p = Math.round((spent / t.budget) * 100);
                const low = t.remainingBudget < t.budget * 0.2;
                return (
                  <div key={t._id} className="team-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {t.logo
                        ? <img src={t.logo} alt={t.name} style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 9, height: 9, borderRadius: '50%', background: t.color, flexShrink: 0 }} />}
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: low ? 'var(--red)' : 'var(--green)' }}>{formatCurrency(t.remainingBudget)}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{t.players.length}p</div>
                      </div>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: p + '%', background: t.color, borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text3)' }}>Spent {formatCurrency(spent)}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text3)' }}>{p}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Viewer Link ── */}
      {activeEvent && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 9 }}>📡 Public Viewer Link</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', marginBottom: 7 }}>
            <span style={{ flex: 1, fontSize: '0.73rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
              {window.location.origin}/viewer/{activeEvent.viewerToken}
            </span>
            <button className={'copy-btn' + (copied ? ' copied' : '')} onClick={copyViewerLink}>
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>
            Share with viewers — read-only, auto-refreshes, no login needed
          </div>
        </div>
      )}
    </div>
  );
}