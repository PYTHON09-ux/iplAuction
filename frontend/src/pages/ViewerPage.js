import { useEffect, useState, useRef } from 'react';
import { api, formatCurrency, ROLE_COLORS } from '../utils/api';

/* ─── Inject global CSS once ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080c14;
    --bg2: #0e1623;
    --bg3: #141e2e;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --text: #f0f4ff;
    --text2: #94a3b8;
    --text3: #4b5e78;
    --green: #22c55e;
    --red: #ef4444;
    --amber: #f59e0b;
    --gold: #fbbf24;
    --font-display: 'Bebas Neue', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }

  .vp-page { min-height: 100vh; background: var(--bg); }

  /* ── Banner ── */
  .vp-banner {
    position: relative;
    width: 100%;
    min-height: 280px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .vp-banner-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
  }
  .vp-banner-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(8,12,20,0.25) 0%,
      rgba(8,12,20,0.55) 40%,
      rgba(8,12,20,0.92) 80%,
      rgba(8,12,20,1) 100%
    );
  }
  .vp-banner-noimgbg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #0a1628 0%, #0f2040 45%, #1a1035 100%);
  }
  .vp-banner-noimgpattern {
    position: absolute;
    inset: 0;
    opacity: 0.04;
    background-image: repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%);
    background-size: 28px 28px;
  }
  .vp-banner-content {
    position: relative;
    z-index: 2;
    padding: 24px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .vp-banner-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .vp-live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    background: rgba(239,68,68,0.18);
    border: 1px solid rgba(239,68,68,0.35);
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    color: #f87171;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .vp-live-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #ef4444;
    animation: vp-pulse 1.2s infinite;
    flex-shrink: 0;
  }
  @keyframes vp-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50% { opacity:.4; transform:scale(.8); }
  }
  .vp-updated {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    letter-spacing: .03em;
  }
  .vp-banner-event {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .vp-banner-logo {
    width: 54px; height: 54px;
    border-radius: 12px;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.15);
    flex-shrink: 0;
  }
  .vp-banner-logo-fallback {
    width: 54px; height: 54px;
    border-radius: 12px;
    background: rgba(255,255,255,0.08);
    border: 2px solid rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: rgba(255,255,255,0.5);
    flex-shrink: 0;
  }
  .vp-banner-name {
    font-family: var(--font-display);
    font-size: clamp(2rem, 6vw, 3.2rem);
    color: #fff;
    line-height: 1;
    letter-spacing: .03em;
    text-shadow: 0 2px 20px rgba(0,0,0,0.5);
  }
  .vp-banner-season {
    font-size: 13px;
    color: rgba(255,255,255,0.45);
    letter-spacing: .06em;
    margin-top: 3px;
  }
  .vp-banner-stats {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .vp-bstat {
    flex: 1;
    min-width: 70px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 8px 10px;
    text-align: center;
  }
  .vp-bstat-val {
    font-family: var(--font-display);
    font-size: 1.5rem;
    line-height: 1;
  }
  .vp-bstat-label {
    font-size: 10px;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: .07em;
    margin-top: 3px;
  }

  /* ── Summary pills ── */
  .vp-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 14px 16px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .vp-sc {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 8px;
    text-align: center;
  }
  .vp-sc-val { font-family: var(--font-display); font-size: 1.6rem; line-height: 1; }
  .vp-sc-label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: .06em; margin-top: 3px; }

  /* ── Content grid ── */
  .vp-content {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 16px;
    padding: 16px;
    max-width: 1200px;
    margin: 0 auto;
  }
  @media (max-width: 860px) {
    .vp-content { grid-template-columns: 1fr; }
    .vp-right { order: -1; }
    .vp-summary { grid-template-columns: repeat(2, 1fr); }
    .vp-banner { min-height: 220px; }
    .vp-teams-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
  }
  @media (max-width: 480px) {
    .vp-summary { grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .vp-sc-val { font-size: 1.2rem; }
    .vp-teams-grid { grid-template-columns: 1fr !important; }
    .vp-stage-body { padding: 20px 14px !important; }
    .vp-bid-box { padding: 14px 16px !important; }
    .vp-player-stats { gap: 6px !important; }
    .vp-bid-history { gap: 5px !important; }
  }

  .vp-section-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: .12em;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── Stage ── */
  .vp-stage {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 14px;
  }
  .vp-stage-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    border-bottom: 1px solid var(--border);
  }
  .vp-stage-body {
    padding: 28px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .vp-player-avatar {
    width: 96px; height: 96px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 14px;
    flex-shrink: 0;
  }
  .vp-player-avatar-fallback {
    width: 96px; height: 96px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 1.8rem;
    margin-bottom: 14px;
    flex-shrink: 0;
  }
  .vp-role-badge {
    display: inline-block;
    padding: 3px 12px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .07em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .vp-player-name {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 4vw, 2rem);
    color: var(--gold);
    line-height: 1.05;
    margin-bottom: 4px;
    letter-spacing: .03em;
  }
  .vp-player-meta { font-size: 13px; color: var(--text2); margin-bottom: 16px; }
  .vp-player-stats {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .vp-pstat {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 8px 14px;
    text-align: center;
    min-width: 64px;
  }
  .vp-pstat-val { font-family: var(--font-display); font-size: 1.2rem; line-height: 1; }
  .vp-pstat-label { font-size: 10px; color: var(--text3); margin-top: 3px; text-transform: uppercase; letter-spacing: .05em; }
  .vp-bid-box {
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: 14px;
    padding: 18px 24px;
    margin-bottom: 14px;
    min-width: 200px;
    width: 100%;
    max-width: 320px;
  }
  .vp-bid-label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 4px; }
  .vp-bid-amount { font-family: var(--font-display); font-size: 2.6rem; line-height: 1; }
  .vp-bid-team-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
  }
  .vp-bid-history {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }
  .vp-bid-chip {
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 12px;
    border: 1px solid var(--border);
    color: var(--text3);
    background: var(--bg3);
  }
  .vp-bid-chip-top {
    background: rgba(34,197,94,0.1);
    border-color: rgba(34,197,94,0.3);
    color: var(--green);
  }

  /* ── Idle stage ── */
  .vp-idle {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 48px 24px;
    text-align: center;
    margin-bottom: 14px;
  }

  /* ── Tabs ── */
  .vp-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
  }
  .vp-tabs {
    display: flex;
    gap: 0;
    background: var(--bg3);
    border-radius: 8px;
    padding: 3px;
    margin-bottom: 14px;
  }
  .vp-tab {
    flex: 1;
    padding: 7px 6px;
    border-radius: 6px;
    font-size: 12px;
    text-align: center;
    cursor: pointer;
    color: var(--text3);
    white-space: nowrap;
    transition: all .15s;
  }
  .vp-tab.active {
    background: var(--bg);
    color: var(--text);
    font-weight: 600;
    border: 1px solid var(--border2);
  }
  .vp-player-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 0;
    border-bottom: 1px solid var(--border);
  }
  .vp-player-row:last-child { border-bottom: none; }
  .vp-avatar-sm {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: var(--bg3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
    overflow: hidden;
  }
  .vp-avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
  .vp-pname { font-size: 13px; font-weight: 600; }
  .vp-prole { font-size: 11px; color: var(--text3); }
  .vp-badge {
    padding: 3px 9px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .vp-badge-sold { background: rgba(34,197,94,0.1); color: var(--green); }
  .vp-badge-unsold { background: rgba(239,68,68,0.1); color: var(--red); }
  .vp-badge-available { background: rgba(245,158,11,0.1); color: var(--amber); }
  .vp-empty {
    text-align: center;
    padding: 28px 0;
    color: var(--text3);
    font-size: 13px;
  }
  .vp-pill { padding: 3px 10px; border-radius: 100px; font-size: 11px; }

  /* ── Teams ── */
  .vp-teams-grid { display: flex; flex-direction: column; gap: 10px; }
  .vp-team-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }
  .vp-team-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 13px;
    border-bottom: 1px solid var(--border);
  }
  .vp-team-logo {
    width: 34px; height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 11px;
    color: #fff;
    flex-shrink: 0;
    overflow: hidden;
  }
  .vp-team-logo img { width: 100%; height: 100%; object-fit: cover; }
  .vp-budget-bar {
    height: 3px;
    background: var(--bg3);
    border-radius: 2px;
    overflow: hidden;
    margin: 5px 0 8px;
  }
  .vp-budget-fill { height: 100%; border-radius: 2px; transition: width .4s ease; }
  .vp-player-chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .vp-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 7px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 11px;
  }

  /* ── Sold popup ── */
  .vp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.78);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 16px;
    animation: vp-fadein .2s ease;
  }
  @keyframes vp-fadein { from { opacity:0; } to { opacity:1; } }
  .vp-modal {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 22px;
    padding: 36px 32px;
    text-align: center;
    max-width: 400px;
    width: 100%;
    animation: vp-popin .25s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes vp-popin {
    from { transform: scale(.85); opacity:0; }
    to { transform: scale(1); opacity:1; }
  }
  .vp-sold-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 16px;
    background: rgba(34,197,94,0.12);
    border: 1px solid rgba(34,197,94,0.28);
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    color: var(--green);
    text-transform: uppercase;
    letter-spacing: .1em;
    margin-bottom: 18px;
  }
  .vp-sold-name {
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 5vw, 2.2rem);
    color: var(--gold);
    margin-bottom: 4px;
    letter-spacing: .03em;
  }
  .vp-sold-role { font-size: 13px; color: var(--text2); margin-bottom: 22px; }
  .vp-sold-price-box {
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: 14px;
    padding: 16px 24px;
    display: inline-block;
    margin-bottom: 18px;
  }
  .vp-sold-price { font-family: var(--font-display); font-size: 2.4rem; color: var(--green); line-height: 1; }
  .vp-sold-team-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 22px;
  }
  .vp-sold-tlogo {
    width: 36px; height: 36px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .vp-dismiss {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    background: var(--bg3);
    border: 1px solid var(--border2);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 14px;
    cursor: pointer;
    transition: background .15s;
  }
  .vp-dismiss:hover { background: #1e2d42; }

  /* ── Scrollable list ── */
  .vp-scroll { max-height: 360px; overflow-y: auto; }
  .vp-scroll::-webkit-scrollbar { width: 4px; }
  .vp-scroll::-webkit-scrollbar-track { background: transparent; }
  .vp-scroll::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .vp-footer { text-align: center; padding: 18px 0 28px; font-size: 11px; color: var(--text3); }
`;

function injectStyles() {
  if (document.getElementById('vp-styles')) return;
  const s = document.createElement('style');
  s.id = 'vp-styles';
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function ViewerPage({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('live');
  const [loading, setLoading] = useState(true);
  const [soldPopup, setSoldPopup] = useState(null);
  const prevSessionRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => { injectStyles(); }, []);

  const fetchData = async () => {
    try {
      const d = await api.getEventLive(token);

      // Detect sold transition
      const prev = prevSessionRef.current;
      const curr = d.currentSession;
      if (prev && prev.status !== 'Sold' && curr?.status === 'Sold' && curr?.player) {
        setSoldPopup({
          player: curr.player,
          price: curr.currentBid,
          team: curr.currentBidTeam,
          teamName: curr.currentBidTeamName,
        });
      }
      prevSessionRef.current = curr;

      setData(d);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 4000);
    return () => clearInterval(intervalRef.current);
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14', color: '#94a3b8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>🏏</div>
        <div>Loading auction data...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c14', color: '#94a3b8', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>❌</div>
        <h2 style={{ color: '#ef4444', marginBottom: 8, fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem' }}>Auction Not Found</h2>
        <p>Token <strong style={{ letterSpacing: 2 }}>{token}</strong> is invalid or expired.</p>
        <p style={{ marginTop: 8, fontSize: '13px' }}>Check the link and try again.</p>
      </div>
    </div>
  );

  const { event, teams, players, currentSession, history, stats } = data;
  const isLive = !!currentSession;
  const roleColor = currentSession?.player ? (ROLE_COLORS[currentSession.player.role] || '#f59e0b') : '#f59e0b';
  const soldPlayers = players.filter(p => p.status === 'Sold');
  const unsoldPlayers = players.filter(p => p.status === 'Unsold');
  const availablePlayers = players.filter(p => p.status === 'Available');

  return (
    <div className="vp-page">

      {/* ─── SOLD POPUP ────────────────────────────────────── */}
      {soldPopup && (
        <div className="vp-overlay" onClick={() => setSoldPopup(null)}>
          <div className="vp-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.4rem', marginBottom: 14 }}>🏆</div>
            <div className="vp-sold-tag">
              <span className="vp-live-dot" />
              Sold!
            </div>
            <div className="vp-sold-name">{soldPopup.player.name}</div>
            <div className="vp-sold-role">{soldPopup.player.role} · Age {soldPopup.player.age}</div>
            <div className="vp-sold-price-box">
              <div className="vp-bid-label">Final price</div>
              <div className="vp-sold-price">{formatCurrency(soldPopup.price)}</div>
            </div>
            <div style={{ fontSize: 11, color: '#4b5e78', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.07em' }}>Acquired by</div>
            <div className="vp-sold-team-row">
              <div className="vp-sold-tlogo" style={{ background: soldPopup.team?.color || '#1e293b' }}>
                {soldPopup.team?.logo
                  ? <img src={soldPopup.team.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  : <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.8rem', color: '#fff' }}>{soldPopup.team?.shortName}</span>
                }
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{soldPopup.teamName}</div>
                <div style={{ fontSize: 11, color: '#4b5e78' }}>Budget remaining: {formatCurrency(soldPopup.team?.remainingBudget)}</div>
              </div>
            </div>
            <button className="vp-dismiss" onClick={() => setSoldPopup(null)}>Continue auction</button>
          </div>
        </div>
      )}

      {/* ─── BANNER ─────────────────────────────────────────── */}
      <div className="vp-banner">
        {event.bannerImage || event.logo ? (
          <>
            <img
              src={event.bannerImage || event.logo}
              alt={event.name}
              className="vp-banner-img"
            />
            <div className="vp-banner-overlay" />
          </>
        ) : (
          <>
            <div className="vp-banner-noimgbg" />
            <div className="vp-banner-noimgpattern" />
          </>
        )}
        <div className="vp-banner-content">
          <div className="vp-banner-top">
            {isLive
              ? <div className="vp-live-badge"><span className="vp-live-dot" />{currentSession.status === 'Paused' ? 'Paused' : 'Live'}</div>
              : <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Not live</div>
            }
            <div className="vp-updated">
              Updated {lastUpdated?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <div className="vp-banner-event">
            {event.logo && !event.bannerImage && (
              <img src={event.logo} alt={event.name} className="vp-banner-logo" />
            )}
            {!event.logo && <div className="vp-banner-logo-fallback">🏏</div>}
            <div>
              <div className="vp-banner-name">{event.name}</div>
              {event.season && <div className="vp-banner-season">Season {event.season}</div>}
            </div>
          </div>

          <div className="vp-banner-stats">
            {[
              { label: 'Sold', value: stats.sold, color: '#f59e0b' },
              { label: 'Unsold', value: stats.unsold, color: '#f87171' },
              { label: 'Remaining', value: stats.available, color: 'rgba(255,255,255,0.65)' },
              { label: 'Total', value: stats.total, color: 'rgba(255,255,255,0.35)' },
            ].map(s => (
              <div key={s.label} className="vp-bstat">
                <div className="vp-bstat-val" style={{ color: s.color }}>{s.value}</div>
                <div className="vp-bstat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SUMMARY PILLS ──────────────────────────────────── */}
      <div className="vp-summary">
        {[
          { label: 'Sold', value: stats.sold, color: '#22c55e' },
          { label: 'Unsold', value: stats.unsold, color: '#ef4444' },
          { label: 'Available', value: stats.available, color: '#f59e0b' },
          { label: 'Total', value: stats.total, color: '#94a3b8' },
        ].map(s => (
          <div key={s.label} className="vp-sc">
            <div className="vp-sc-val" style={{ color: s.color }}>{s.value}</div>
            <div className="vp-sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── MAIN CONTENT ───────────────────────────────────── */}
      <div className="vp-content">

        {/* LEFT */}
        <div>
          <div className="vp-section-label">🔥 Current player on auction</div>

          {isLive ? (
            <div className="vp-stage">
              <div className="vp-stage-header">
                <div className="vp-live-badge" style={{ fontSize: 10 }}>
                  <span className="vp-live-dot" />
                  {currentSession.status === 'Paused' ? 'Paused' : 'Bidding live'}
                </div>
                <div style={{ fontSize: 12, color: '#4b5e78' }}>{currentSession.bids.length} bid{currentSession.bids.length !== 1 ? 's' : ''} placed</div>
              </div>
              <div className="vp-stage-body">
                {currentSession.player?.imageUrl
                  ? <img src={currentSession.player.imageUrl} alt={currentSession.player.name}
                      className="vp-player-avatar"
                      style={{ border: `3px solid ${roleColor}`, boxShadow: `0 0 24px ${roleColor}40` }} />
                  : <div className="vp-player-avatar-fallback"
                      style={{ border: `3px solid ${roleColor}`, background: `${roleColor}14`, color: roleColor }}>
                      {initials(currentSession.player?.name)}
                    </div>
                }

                <div className="vp-role-badge" style={{ background: `${roleColor}14`, color: roleColor }}>
                  {currentSession.player?.role}
                </div>
                <div className="vp-player-name">{currentSession.player?.name}</div>
                <div className="vp-player-meta">{currentSession.player?.battingStyle} · Age {currentSession.player?.age}</div>

                {currentSession.player?.stats && (
                  <div className="vp-player-stats">
                    {currentSession.player.stats.runs > 0 && (
                      <div className="vp-pstat">
                        <div className="vp-pstat-val">{currentSession.player.stats.runs}</div>
                        <div className="vp-pstat-label">Runs</div>
                      </div>
                    )}
                    {currentSession.player.stats.wickets > 0 && (
                      <div className="vp-pstat">
                        <div className="vp-pstat-val">{currentSession.player.stats.wickets}</div>
                        <div className="vp-pstat-label">Wickets</div>
                      </div>
                    )}
                    {currentSession.player.stats.average > 0 && (
                      <div className="vp-pstat">
                        <div className="vp-pstat-val">{currentSession.player.stats.average}</div>
                        <div className="vp-pstat-label">Avg</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="vp-bid-box">
                  <div className="vp-bid-label">Current bid</div>
                  <div className="vp-bid-amount" style={{ color: currentSession.currentBidTeam ? '#22c55e' : '#4b5e78' }}>
                    {formatCurrency(currentSession.currentBid)}
                  </div>
                  {currentSession.currentBidTeamName ? (
                    <div className="vp-bid-team-row">
                      {currentSession.currentBidTeam?.logo
                        ? <img src={currentSession.currentBidTeam.logo} alt="" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />
                        : <div style={{ width: 10, height: 10, borderRadius: '50%', background: currentSession.currentBidTeam?.color, flexShrink: 0 }} />
                      }
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{currentSession.currentBidTeamName}</span>
                    </div>
                  ) : (
                    <div style={{ color: '#4b5e78', marginTop: 6, fontSize: 13 }}>Base price · Awaiting bids</div>
                  )}
                </div>

                {currentSession.bids.length > 0 && (
                  <div className="vp-bid-history">
                    {[...currentSession.bids].reverse().slice(0, 6).map((b, i) => (
                      <div key={i} className={`vp-bid-chip${i === 0 ? ' vp-bid-chip-top' : ''}`}>
                        {b.teamName} · {formatCurrency(b.amount)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="vp-idle">
              <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>⏸</div>
              <h2 style={{ fontSize: '1.3rem', color: '#64748b', marginBottom: 6, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '.03em' }}>No active bid</h2>
              <p style={{ color: '#4b5e78', fontSize: 13 }}>The auctioneer will start the next player shortly...</p>
              {history.length > 0 && (
                <div style={{ marginTop: 16, padding: '12px 18px', background: '#0e1623', borderRadius: 10, display: 'inline-block', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, color: '#4b5e78', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.07em' }}>Last sold</div>
                  <div style={{ fontWeight: 600 }}>{history[0]?.player?.name}</div>
                  <div style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>
                    {formatCurrency(history[0]?.currentBid)} → {history[0]?.currentBidTeam?.shortName}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="vp-card">
            <div className="vp-tabs">
              {[['live', '⚡ Recent'], ['players', '👤 All'], ['unsold', '❌ Unsold']].map(([id, label]) => (
                <div key={id} className={`vp-tab${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>
                  {label}
                </div>
              ))}
            </div>

            {activeTab === 'live' && (
              history.length === 0
                ? <div className="vp-empty">📋 No sales yet</div>
                : history.slice(0, 15).map(h => (
                  <div key={h._id} className="vp-player-row">
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: h.status === 'Sold' ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
                    <div className="vp-avatar-sm">
                      {h.player?.imageUrl ? <img src={h.player.imageUrl} alt="" /> : initials(h.player?.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vp-pname" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.player?.name}</div>
                      <div className="vp-prole">{h.player?.role}</div>
                    </div>
                    {h.status === 'Sold'
                      ? <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, color: '#22c55e', fontSize: 13 }}>{formatCurrency(h.currentBid)}</div>
                          <div style={{ fontSize: 11, color: '#4b5e78' }}>→ {h.currentBidTeam?.shortName}</div>
                        </div>
                      : <span className="vp-badge vp-badge-unsold">Unsold</span>
                    }
                  </div>
                ))
            )}

            {activeTab === 'players' && (
              <>
                <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span className="vp-pill" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>✅ {soldPlayers.length} Sold</span>
                  <span className="vp-pill" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>⏳ {availablePlayers.length} Available</span>
                  <span className="vp-pill" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>❌ {unsoldPlayers.length} Unsold</span>
                </div>
                <div className="vp-scroll">
                  {players.map(p => {
                    const rc = ROLE_COLORS[p.role] || '#64748b';
                    return (
                      <div key={p._id} className="vp-player-row">
                        <div className="vp-avatar-sm" style={{ background: `${rc}14`, color: rc }}>
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : initials(p.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="vp-pname" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div className="vp-prole">{p.role}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {p.status === 'Sold'
                            ? <>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{formatCurrency(p.soldPrice)}</div>
                                <div style={{ fontSize: 11, color: '#4b5e78' }}>{p.team?.shortName}</div>
                              </>
                            : <span className={`vp-badge vp-badge-${p.status.toLowerCase()}`}>{p.status}</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeTab === 'unsold' && (
              unsoldPlayers.length === 0
                ? <div className="vp-empty">✅ No unsold players yet</div>
                : unsoldPlayers.map(p => (
                  <div key={p._id} className="vp-player-row">
                    <div className="vp-avatar-sm">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : initials(p.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vp-pname" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div className="vp-prole">{p.role} · Base {formatCurrency(p.basePrice)}</div>
                    </div>
                    <span className="vp-badge vp-badge-unsold">Unsold</span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* RIGHT — Teams */}
        <div className="vp-right">
          <div className="vp-section-label">🛡️ Teams & budgets</div>
          <div className="vp-teams-grid">
            {teams.map(t => {
              const spent = t.budget - t.remainingBudget;
              const pct = Math.min(100, Math.round((spent / t.budget) * 100));
              return (
                <div key={t._id} className="vp-team-card">
                  <div className="vp-team-header">
                    <div className="vp-team-logo" style={{ background: t.logo ? 'transparent' : (t.color || '#1e293b') }}>
                      {t.logo ? <img src={t.logo} alt={t.name} /> : t.shortName}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: '#4b5e78' }}>{t.players.length} players · {formatCurrency(t.remainingBudget)} left</div>
                    </div>
                    <div style={{ fontWeight: 700, color: pct > 80 ? '#f59e0b' : '#22c55e', fontSize: 13, flexShrink: 0 }}>
                      {formatCurrency(t.remainingBudget)}
                    </div>
                  </div>
                  <div style={{ padding: '10px 13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4b5e78', marginBottom: 0 }}>
                      <span>Spent {formatCurrency(spent)}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="vp-budget-bar">
                      <div className="vp-budget-fill" style={{ width: `${pct}%`, background: t.color || '#3b82f6' }} />
                    </div>
                    {t.players.length > 0 && (
                      <div className="vp-player-chips">
                        {t.players.slice(0, 5).map(p => (
                          <div key={p._id} className="vp-chip">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                              : <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${ROLE_COLORS[p.role] || '#64748b'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: ROLE_COLORS[p.role] || '#64748b', flexShrink: 0 }}>
                                  {initials(p.name)}
                                </div>
                            }
                            <span>{p.name.split(' ')[0]}</span>
                          </div>
                        ))}
                        {t.players.length > 5 && (
                          <div style={{ padding: '3px 7px', borderRadius: 6, background: '#0e1623', fontSize: 11, color: '#4b5e78' }}>+{t.players.length - 5}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="vp-footer">🏏 CricAuction · Read-only viewer · Auto-refreshes every 4 seconds</div>
      <div className="vp-footer">मा. श्री. अमित पंनोरे यांचा स्मरणार्थ ~ गडहिंग्लज चा सिहं </div>
    </div>
  );
}