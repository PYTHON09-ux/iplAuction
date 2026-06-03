import { useEffect, useState, useRef } from 'react';
import { api, formatCurrency, ROLE_COLORS } from '../utils/api';

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:    #06090f;
    --bg2:   #0c1220;
    --bg3:   #111a2e;
    --bg4:   #172038;
    --border: rgba(255,255,255,0.08);
    --border2: rgba(255,255,255,0.15);
    --text:  #eaf0ff;
    --text2: #7a90b8;
    --text3: #3a4f6e;
    --green: #16d975;
    --red:   #f04a4a;
    --amber: #f5a623;
    --gold:  #ffe066;
    --cyan:  #38d9f5;
    --disp:  'Barlow Condensed', sans-serif;
    --body:  'Barlow', sans-serif;
    --radius: 16px;
    --radius-sm: 10px;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--body); -webkit-font-smoothing: antialiased; }

  /* ── LAYOUT ── */
  .vp { min-height: 100vh; display: flex; flex-direction: column; }

  /* TOP HEADER BAR */
  .vp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    gap: 12px;
    flex-shrink: 0;
  }
  .vp-header-left { display: flex; align-items: center; gap: 12px; }
  .vp-event-logo {
    width: 36px; height: 36px; border-radius: 8px;
    object-fit: cover; border: 1px solid var(--border2);
  }
  .vp-event-logo-fb {
    width: 36px; height: 36px; border-radius: 8px;
    background: var(--bg3); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
  }
  .vp-event-name {
    font-family: var(--disp);
    font-size: 1.3rem;
    letter-spacing: .06em;
    font-weight: 700;
    color: var(--text);
    line-height: 1;
  }
  .vp-event-season { font-size: 11px; color: var(--text3); letter-spacing: .06em; margin-top: 2px; }
  .vp-live-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px;
    background: rgba(240,74,74,0.15);
    border: 1px solid rgba(240,74,74,0.3);
    border-radius: 100px;
    font-size: 11px; font-weight: 700;
    color: #f87171; letter-spacing: .1em; text-transform: uppercase;
  }
  .vp-live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #f04a4a;
    animation: pulse 1.1s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.75)} }
  .vp-updated { font-size: 11px; color: var(--text3); }

  /* STAT STRIP */
  .vp-strip {
    display: flex;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .vp-strip-item {
    flex: 1; padding: 8px 6px; text-align: center;
    border-right: 1px solid var(--border);
  }
  .vp-strip-item:last-child { border-right: none; }
  .vp-strip-val {
    font-family: var(--disp);
    font-size: clamp(1.2rem, 3vw, 1.8rem);
    font-weight: 800;
    line-height: 1;
  }
  .vp-strip-label {
    font-size: clamp(9px, 1.5vw, 11px);
    color: var(--text3);
    text-transform: uppercase; letter-spacing: .08em;
    margin-top: 2px;
  }

  /* MAIN AREA */
  .vp-main {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 300px;
    min-height: 0;
  }

  /* CENTER — Player Stage */
  .vp-center {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    overflow: hidden;
  }

  /* Player card */
  .vp-player-card {
    flex: 1;
    display: grid;
    grid-template-rows: 1fr auto;
    min-height: 0;
  }

  /* IMAGE ZONE — big square */
  .vp-img-zone {
    position: relative;
    overflow: hidden;
    background: var(--bg3);
    min-height: 0;
  }
  .vp-img-zone img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
  .vp-img-grad {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 40%,
      rgba(6,9,15,0.6) 70%,
      rgba(6,9,15,0.96) 100%
    );
    pointer-events: none;
  }
  .vp-img-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--disp);
    font-size: clamp(4rem, 12vw, 10rem);
    font-weight: 900;
    letter-spacing: .05em;
    opacity: .12;
  }
  .vp-img-overlay {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 20px 24px;
    z-index: 2;
  }
  .vp-role-pill {
    display: inline-block;
    padding: 3px 14px;
    border-radius: 100px;
    font-size: clamp(10px, 1.5vw, 12px);
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .vp-player-name-big {
    font-family: var(--disp);
    font-size: clamp(2rem, 6vw, 4.5rem);
    font-weight: 900;
    color: #fff;
    line-height: .95;
    letter-spacing: .02em;
    text-shadow: 0 2px 30px rgba(0,0,0,0.6);
    margin-bottom: 6px;
  }
  .vp-player-sub {
    font-size: clamp(12px, 1.8vw, 15px);
    color: rgba(255,255,255,0.5);
    letter-spacing: .03em;
  }

  /* BID SECTION */
  .vp-bid-section {
    padding: 18px 24px 20px;
    background: var(--bg2);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .vp-bid-main {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: 16px;
    margin-bottom: 14px;
  }
  .vp-current-bid-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: .12em;
    margin-bottom: 4px;
  }
  .vp-current-bid-amount {
    font-family: var(--disp);
    font-size: clamp(2.4rem, 5vw, 4rem);
    font-weight: 900;
    line-height: 1;
    letter-spacing: .01em;
  }
  .vp-bid-team-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }
  .vp-team-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .vp-bid-team-name {
    font-size: clamp(13px, 2vw, 16px);
    font-weight: 600;
  }
  .vp-bid-count-box {
    text-align: right;
    flex-shrink: 0;
  }
  .vp-bid-count-num {
    font-family: var(--disp);
    font-size: clamp(2rem, 3.5vw, 3rem);
    font-weight: 900;
    color: var(--cyan);
    line-height: 1;
  }
  .vp-bid-count-label {
    font-size: 10px;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: .1em;
    margin-top: 2px;
  }

  /* Player stats row */
  .vp-stats-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .vp-stat-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 16px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    min-width: 60px;
  }
  .vp-stat-chip-val {
    font-family: var(--disp);
    font-size: clamp(1.1rem, 2.2vw, 1.6rem);
    font-weight: 800;
    line-height: 1;
  }
  .vp-stat-chip-label {
    font-size: 10px;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: .07em;
    margin-top: 3px;
  }

  /* Bid history chips */
  .vp-history-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .vp-hchip {
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 12px;
    background: var(--bg3);
    border: 1px solid var(--border);
    color: var(--text3);
  }
  .vp-hchip-top {
    background: rgba(22,217,117,0.1);
    border-color: rgba(22,217,117,0.3);
    color: var(--green);
    font-weight: 600;
  }

  /* IDLE */
  .vp-idle {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    text-align: center;
    background: var(--bg2);
  }
  .vp-idle-icon {
    font-size: clamp(3rem, 8vw, 6rem);
    margin-bottom: 16px;
    opacity: .5;
  }
  .vp-idle-title {
    font-family: var(--disp);
    font-size: clamp(1.4rem, 4vw, 2.4rem);
    font-weight: 900;
    color: var(--text3);
    letter-spacing: .05em;
    margin-bottom: 8px;
  }
  .vp-idle-sub { font-size: 14px; color: var(--text3); }
  .vp-idle-last {
    margin-top: 24px;
    padding: 16px 24px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .vp-idle-last-label {
    font-size: 10px; color: var(--text3);
    text-transform: uppercase; letter-spacing: .08em;
    margin-bottom: 6px;
  }
  .vp-idle-last-name { font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
  .vp-idle-last-price { color: var(--green); font-weight: 700; font-size: .95rem; }

  /* RIGHT PANEL */
  .vp-right {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg2);
  }
  .vp-panel-header {
    padding: 12px 16px;
    font-size: 10px;
    font-weight: 700;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: .12em;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .vp-panel-header-icon { font-size: 14px; }

  /* TEAMS */
  .vp-teams {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .vp-teams::-webkit-scrollbar { width: 3px; }
  .vp-teams::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .vp-team-card {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .vp-team-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
  }
  .vp-team-badge {
    width: 32px; height: 32px;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--disp);
    font-size: 10px; font-weight: 800;
    color: #fff;
    flex-shrink: 0;
    overflow: hidden;
  }
  .vp-team-badge img { width: 100%; height: 100%; object-fit: cover; }
  .vp-team-name-sm { font-weight: 600; font-size: 13px; line-height: 1.2; }
  .vp-team-budget-sm {
    font-family: var(--disp);
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1;
    margin-left: auto;
    flex-shrink: 0;
  }
  .vp-budget-track {
    height: 3px;
    background: var(--bg);
    margin: 0 12px 10px;
    border-radius: 2px;
    overflow: hidden;
  }
  .vp-budget-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }
  .vp-team-players {
    display: flex; flex-wrap: wrap; gap: 4px;
    padding: 0 10px 10px;
  }
  .vp-player-mini {
    display: flex; align-items: center; gap: 4px;
    padding: 2px 7px;
    background: var(--bg4);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 11px;
  }
  .vp-mini-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  /* HISTORY PANEL — bottom right */
  .vp-history {
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    max-height: 220px;
    overflow-y: auto;
  }
  .vp-history::-webkit-scrollbar { width: 3px; }
  .vp-history::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
  .vp-history-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
  }
  .vp-history-row:last-child { border-bottom: none; }
  .vp-history-status { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .vp-history-name { font-size: 12px; font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vp-history-role { font-size: 10px; color: var(--text3); }
  .vp-history-price { font-size: 12px; font-weight: 700; color: var(--green); flex-shrink: 0; }
  .vp-history-team { font-size: 10px; color: var(--text3); flex-shrink: 0; }

  /* SOLD OVERLAY */
  .vp-sold-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadein .2s ease;
  }
  @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
  .vp-sold-modal {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 24px;
    width: 100%; max-width: 460px;
    overflow: hidden;
    animation: popin .3s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes popin { from { transform: scale(.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .vp-sold-img-zone {
    position: relative;
    height: 240px;
    overflow: hidden;
    background: var(--bg3);
  }
  .vp-sold-img-zone img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: top center;
  }
  .vp-sold-img-grad {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 30%, rgba(6,9,15,.95) 100%);
  }
  .vp-sold-img-name {
    position: absolute;
    bottom: 12px; left: 18px; right: 18px;
    font-family: var(--disp);
    font-size: 2rem; font-weight: 900;
    color: var(--gold);
    letter-spacing: .04em;
    line-height: 1;
    z-index: 2;
  }
  .vp-sold-body {
    padding: 20px 24px 24px;
    text-align: center;
  }
  .vp-sold-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 18px;
    background: rgba(22,217,117,0.12);
    border: 1px solid rgba(22,217,117,0.3);
    border-radius: 100px;
    font-size: 11px; font-weight: 800;
    color: var(--green);
    letter-spacing: .12em; text-transform: uppercase;
    margin-bottom: 18px;
  }
  .vp-sold-price {
    font-family: var(--disp);
    font-size: 3rem; font-weight: 900;
    color: var(--green);
    line-height: 1; margin-bottom: 4px;
  }
  .vp-sold-price-label { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 18px; }
  .vp-sold-team-row {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; margin-bottom: 20px;
  }
  .vp-sold-team-logo {
    width: 42px; height: 42px;
    border-radius: 10px; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--disp); font-size: .8rem; font-weight: 800;
    color: #fff;
  }
  .vp-sold-team-logo img { width: 100%; height: 100%; object-fit: cover; }
  .vp-dismiss-btn {
    width: 100%; padding: 13px;
    border-radius: 12px;
    background: var(--bg3);
    border: 1px solid var(--border2);
    color: var(--text);
    font-family: var(--body);
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    transition: background .15s;
  }
  .vp-dismiss-btn:hover { background: var(--bg4); }

  /* RESPONSIVE */
  @media (max-width: 860px) {
    .vp-main { grid-template-columns: 1fr; }
    .vp-right { border-top: 1px solid var(--border); max-height: 340px; }
    .vp-center { border-right: none; }
    .vp-teams { flex-direction: row; overflow-x: auto; overflow-y: hidden; padding: 10px; }
    .vp-team-card { min-width: 200px; flex-shrink: 0; }
    .vp-history { max-height: 140px; }
  }

  @media (max-width: 520px) {
    .vp-header { padding: 8px 12px; }
    .vp-event-name { font-size: 1rem; }
    .vp-bid-section { padding: 12px 14px 14px; }
    .vp-strip-val { font-size: 1.1rem; }
    .vp-player-name-big { font-size: 1.8rem; }
    .vp-current-bid-amount { font-size: 2.2rem; }
    .vp-img-overlay { padding: 14px 16px; }
    .vp-sold-modal { border-radius: 18px; }
    .vp-sold-price { font-size: 2.2rem; }
  }

  /* PROJECTOR MODE (large screens) */
  @media (min-width: 1280px) {
    .vp-main { grid-template-columns: 1fr 380px; }
    .vp-player-name-big { font-size: 5.5rem; }
    .vp-current-bid-amount { font-size: 5rem; }
    .vp-bid-section { padding: 24px 32px 26px; }
    .vp-bid-count-num { font-size: 3.5rem; }
    .vp-strip-val { font-size: 2rem; }
    .vp-strip-label { font-size: 12px; }
  }

  @media (min-width: 1600px) {
    .vp-main { grid-template-columns: 1fr 440px; }
    .vp-player-name-big { font-size: 7rem; }
    .vp-current-bid-amount { font-size: 6rem; }
    .vp-bid-section { padding: 28px 40px 30px; }
    .vp-event-name { font-size: 1.6rem; }
    .vp-stat-chip-val { font-size: 2rem; }
    .vp-stat-chip-label { font-size: 12px; }
  }

  /* Scrollbar utility */
  .vp-scroll { overflow-y: auto; }
  .vp-scroll::-webkit-scrollbar { width: 3px; }
  .vp-scroll::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* Tabs on right panel */
  .vp-tabs {
    display: flex;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .vp-tab {
    flex: 1; padding: 8px 4px;
    text-align: center;
    font-size: 11px; font-weight: 600;
    color: var(--text3);
    cursor: pointer;
    border-right: 1px solid var(--border);
    transition: color .15s, background .15s;
    text-transform: uppercase;
    letter-spacing: .07em;
  }
  .vp-tab:last-child { border-right: none; }
  .vp-tab.active { color: var(--text); background: var(--bg2); }
  .vp-tab:hover:not(.active) { color: var(--text2); }

  .vp-all-players { overflow-y: auto; flex: 1; }
  .vp-all-players::-webkit-scrollbar { width: 3px; }
  .vp-all-players::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .vp-prow {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--border);
  }
  .vp-prow:last-child { border-bottom: none; }
  .vp-prow-av {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--bg4);
    overflow: hidden; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
  }
  .vp-prow-av img { width: 100%; height: 100%; object-fit: cover; }
  .vp-prow-name { font-size: 12px; font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vp-prow-role { font-size: 10px; color: var(--text3); }
  .vp-status-pill {
    padding: 2px 8px;
    border-radius: 100px;
    font-size: 10px; font-weight: 700;
    flex-shrink: 0;
  }
  .vp-s-sold { background: rgba(22,217,117,.1); color: var(--green); }
  .vp-s-unsold { background: rgba(240,74,74,.1); color: var(--red); }
  .vp-s-available { background: rgba(245,166,35,.1); color: var(--amber); }

  .vp-footer {
    text-align: center;
    padding: 8px;
    font-size: 10px;
    color: var(--text3);
    letter-spacing: .04em;
    background: var(--bg);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
`;

function injectStyles() {
  if (document.getElementById('vp-v2-styles')) return;
  const s = document.createElement('style');
  s.id = 'vp-v2-styles';
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
}

export default function ViewerPage({ token }) {
  const [data, setData]           = useState(null);
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [soldPopup, setSoldPopup] = useState(null);
  const [activeTab, setActiveTab] = useState('teams');
  const prevSessionRef = useRef(null);
  const intervalRef    = useRef(null);

  useEffect(() => { injectStyles(); }, []);

  const fetchData = async () => {
    try {
      const d = await api.getEventLive(token);
      const prev = prevSessionRef.current;
      const curr = d.currentSession;
      if (prev && prev.status !== 'Sold' && curr?.status === 'Sold' && curr?.player) {
        setSoldPopup({
          player: curr.player,
          price:  curr.currentBid,
          team:   curr.currentBidTeam,
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#06090f', color: '#7a90b8', fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>🏏</div>
        <div>Loading auction...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#06090f', color: '#7a90b8', padding: 24, fontFamily: 'Barlow, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>❌</div>
        <h2 style={{ color: '#f04a4a', marginBottom: 8, fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2rem', letterSpacing: '.05em' }}>Auction Not Found</h2>
        <p>Token <strong style={{ letterSpacing: 2 }}>{token}</strong> is invalid or expired.</p>
      </div>
    </div>
  );

  const { event, teams, players, currentSession, history, stats } = data;
  const isLive = !!currentSession && currentSession.status !== 'Sold';
  const roleColor = currentSession?.player ? (ROLE_COLORS[currentSession.player.role] || '#f5a623') : '#f5a623';

  const soldPlayers      = players.filter(p => p.status === 'Sold');
  const unsoldPlayers    = players.filter(p => p.status === 'Unsold');
  const availablePlayers = players.filter(p => p.status === 'Available');

  return (
    <div className="vp" style={{ height: '100vh' }}>

      {/* ── SOLD POPUP ── */}
      {soldPopup && (
        <div className="vp-sold-overlay" onClick={() => setSoldPopup(null)}>
          <div className="vp-sold-modal" onClick={e => e.stopPropagation()}>
            <div className="vp-sold-img-zone">
              {soldPopup.player.imageUrl
                ? <img src={soldPopup.player.imageUrl} alt={soldPopup.player.name} />
                : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '5rem', fontWeight: 900, color: 'rgba(255,255,255,0.08)' }}>
                    {initials(soldPopup.player.name)}
                  </div>
              }
              <div className="vp-sold-img-grad" />
              <div className="vp-sold-img-name">{soldPopup.player.name}</div>
            </div>
            <div className="vp-sold-body">
              <div className="vp-sold-badge">
                <span className="vp-live-dot" style={{ background: '#16d975' }} />
                Sold!
              </div>
              <div className="vp-sold-price">{formatCurrency(soldPopup.price)}</div>
              <div className="vp-sold-price-label">Final Price</div>
              <div className="vp-sold-team-row">
                <div className="vp-sold-team-logo" style={{ background: soldPopup.team?.color || '#172038' }}>
                  {soldPopup.team?.logo
                    ? <img src={soldPopup.team.logo} alt="" />
                    : <span style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>{soldPopup.team?.shortName}</span>
                  }
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{soldPopup.teamName}</div>
                  <div style={{ fontSize: 12, color: '#3a4f6e' }}>Remaining: {formatCurrency(soldPopup.team?.remainingBudget)}</div>
                </div>
              </div>
              <button className="vp-dismiss-btn" onClick={() => setSoldPopup(null)}>Continue Auction</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="vp-header">
        <div className="vp-header-left">
          {event.logo
            ? <img src={event.logo} alt={event.name} className="vp-event-logo" />
            : <div className="vp-event-logo-fb">🏏</div>
          }
          <div>
            <div className="vp-event-name">{event.name}</div>
            {event.season && <div className="vp-event-season">Season {event.season}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isLive
            ? <div className="vp-live-pill"><span className="vp-live-dot" />{currentSession?.status === 'Paused' ? 'Paused' : 'Live'}</div>
            : <div style={{ fontSize: 11, color: '#3a4f6e', textTransform: 'uppercase', letterSpacing: '.08em' }}>Not live</div>
          }
          <div className="vp-updated">
            {lastUpdated?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div className="vp-strip">
        {[
          { label: 'Sold',      value: stats.sold,      color: '#16d975' },
          { label: 'Unsold',    value: stats.unsold,    color: '#f04a4a' },
          { label: 'Available', value: stats.available, color: '#f5a623' },
          { label: 'Total',     value: stats.total,     color: '#7a90b8' },
        ].map(s => (
          <div key={s.label} className="vp-strip-item">
            <div className="vp-strip-val" style={{ color: s.color }}>{s.value}</div>
            <div className="vp-strip-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div className="vp-main" style={{ flex: 1, minHeight: 0 }}>

        {/* CENTER */}
        <div className="vp-center">
          {isLive ? (
            <div className="vp-player-card">

              {/* BIG IMAGE */}
              <div className="vp-img-zone">
                {currentSession.player?.imageUrl
                  ? <img src={currentSession.player.imageUrl} alt={currentSession.player.name} />
                  : <div className="vp-img-fallback" style={{ color: roleColor }}>
                      {initials(currentSession.player?.name)}
                    </div>
                }
                {/* Subtle color tint from role */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(ellipse at 70% 50%, ${roleColor}18 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
                <div className="vp-img-grad" />
                <div className="vp-img-overlay">
                  <div className="vp-role-pill" style={{ background: `${roleColor}20`, color: roleColor }}>
                    {currentSession.player?.role}
                  </div>
                  <div className="vp-player-name-big">{currentSession.player?.name}</div>
                  <div className="vp-player-sub">
                    {currentSession.player?.battingStyle}
                    {currentSession.player?.age ? ` · Age ${currentSession.player.age}` : ''}
                  </div>
                </div>
              </div>

              {/* BID SECTION */}
              <div className="vp-bid-section">
                <div className="vp-bid-main">
                  <div>
                    <div className="vp-current-bid-label">Current Bid</div>
                    <div className="vp-current-bid-amount" style={{ color: currentSession.currentBidTeam ? '#16d975' : '#3a4f6e' }}>
                      {formatCurrency(currentSession.currentBid)}
                    </div>
                    {currentSession.currentBidTeamName ? (
                      <div className="vp-bid-team-info">
                        <div className="vp-team-dot" style={{ background: currentSession.currentBidTeam?.color || '#16d975' }} />
                        <span className="vp-bid-team-name">{currentSession.currentBidTeamName}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#3a4f6e', marginTop: 6 }}>Base price · Awaiting bids</div>
                    )}
                  </div>
                  <div className="vp-bid-count-box">
                    <div className="vp-bid-count-num">{currentSession.bids.length}</div>
                    <div className="vp-bid-count-label">Bids</div>
                  </div>
                </div>

                {/* Stats */}
                {currentSession.player?.stats && (
                  <div className="vp-stats-row">
                    {currentSession.player.stats.runs > 0 && (
                      <div className="vp-stat-chip">
                        <div className="vp-stat-chip-val" style={{ color: '#38d9f5' }}>{currentSession.player.stats.runs}</div>
                        <div className="vp-stat-chip-label">Runs</div>
                      </div>
                    )}
                    {currentSession.player.stats.wickets > 0 && (
                      <div className="vp-stat-chip">
                        <div className="vp-stat-chip-val" style={{ color: '#f04a4a' }}>{currentSession.player.stats.wickets}</div>
                        <div className="vp-stat-chip-label">Wickets</div>
                      </div>
                    )}
                    {currentSession.player.stats.average > 0 && (
                      <div className="vp-stat-chip">
                        <div className="vp-stat-chip-val" style={{ color: '#ffe066' }}>{currentSession.player.stats.average}</div>
                        <div className="vp-stat-chip-label">Avg</div>
                      </div>
                    )}
                    {currentSession.player.stats.strikeRate > 0 && (
                      <div className="vp-stat-chip">
                        <div className="vp-stat-chip-val" style={{ color: '#f5a623' }}>{currentSession.player.stats.strikeRate}</div>
                        <div className="vp-stat-chip-label">SR</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bid history chips */}
                {currentSession.bids.length > 0 && (
                  <div className="vp-history-chips">
                    {[...currentSession.bids].reverse().slice(0, 6).map((b, i) => (
                      <div key={i} className={`vp-hchip${i === 0 ? ' vp-hchip-top' : ''}`}>
                        {b.teamName} · {formatCurrency(b.amount)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="vp-idle">
              <div className="vp-idle-icon">⏸</div>
              <div className="vp-idle-title">Auction Paused</div>
              <div className="vp-idle-sub">The auctioneer will start the next player shortly...</div>
              {history.length > 0 && (
                <div className="vp-idle-last">
                  <div className="vp-idle-last-label">Last sold</div>
                  <div className="vp-idle-last-name">{history[0]?.player?.name}</div>
                  <div className="vp-idle-last-price">
                    {formatCurrency(history[0]?.currentBid)} → {history[0]?.currentBidTeam?.shortName}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="vp-right">
          {/* Tabs */}
          <div className="vp-tabs">
            {[
              ['teams',   '🛡 Teams'],
              ['recent',  '⚡ Recent'],
              ['all',     '👤 All'],
            ].map(([id, label]) => (
              <div
                key={id}
                className={`vp-tab${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </div>
            ))}
          </div>

          {/* TEAMS TAB */}
          {activeTab === 'teams' && (
            <div className="vp-teams">
              {teams.map(t => {
                const spent = t.budget - t.remainingBudget;
                const pct   = Math.min(100, Math.round((spent / t.budget) * 100));
                return (
                  <div key={t._id} className="vp-team-card">
                    <div className="vp-team-card-header">
                      <div className="vp-team-badge" style={{ background: t.logo ? 'transparent' : (t.color || '#172038') }}>
                        {t.logo ? <img src={t.logo} alt={t.name} /> : t.shortName}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="vp-team-name-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: '#3a4f6e' }}>{t.players.length} players</div>
                      </div>
                      <div className="vp-team-budget-sm" style={{ color: pct > 80 ? '#f5a623' : '#16d975' }}>
                        {formatCurrency(t.remainingBudget)}
                      </div>
                    </div>
                    <div className="vp-budget-track">
                      <div className="vp-budget-fill" style={{ width: `${pct}%`, background: t.color || '#3b82f6' }} />
                    </div>
                    {t.players.length > 0 && (
                      <div className="vp-team-players">
                        {t.players.slice(0, 6).map(p => (
                          <div key={p._id} className="vp-player-mini">
                            <div className="vp-mini-dot" style={{ background: ROLE_COLORS[p.role] || '#64748b' }} />
                            {p.name.split(' ')[0]}
                          </div>
                        ))}
                        {t.players.length > 6 && (
                          <div style={{ padding: '2px 7px', borderRadius: 6, background: '#06090f', fontSize: 11, color: '#3a4f6e' }}>
                            +{t.players.length - 6}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* RECENT TAB */}
          {activeTab === 'recent' && (
            <div className="vp-all-players">
              {history.length === 0
                ? <div style={{ textAlign: 'center', padding: '28px 0', color: '#3a4f6e', fontSize: 13 }}>No sales yet</div>
                : history.slice(0, 20).map(h => (
                  <div key={h._id} className="vp-history-row">
                    <div className="vp-history-status" style={{ background: h.status === 'Sold' ? '#16d975' : '#f04a4a' }} />
                    <div className="vp-prow-av">
                      {h.player?.imageUrl ? <img src={h.player.imageUrl} alt="" /> : initials(h.player?.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vp-history-name">{h.player?.name}</div>
                      <div className="vp-history-role">{h.player?.role}</div>
                    </div>
                    {h.status === 'Sold'
                      ? <div style={{ textAlign: 'right' }}>
                          <div className="vp-history-price">{formatCurrency(h.currentBid)}</div>
                          <div className="vp-history-team">{h.currentBidTeam?.shortName}</div>
                        </div>
                      : <span className="vp-status-pill vp-s-unsold">Unsold</span>
                    }
                  </div>
                ))
              }
            </div>
          )}

          {/* ALL PLAYERS TAB */}
          {activeTab === 'all' && (
            <div className="vp-all-players">
              <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <span className="vp-status-pill vp-s-sold">✅ {soldPlayers.length} Sold</span>
                <span className="vp-status-pill vp-s-available">⏳ {availablePlayers.length} Avail</span>
                <span className="vp-status-pill vp-s-unsold">❌ {unsoldPlayers.length} Unsold</span>
              </div>
              {players.map(p => {
                const rc = ROLE_COLORS[p.role] || '#64748b';
                return (
                  <div key={p._id} className="vp-prow">
                    <div className="vp-prow-av" style={{ background: `${rc}18`, color: rc }}>
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : initials(p.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vp-prow-name">{p.name}</div>
                      <div className="vp-prow-role">{p.role}</div>
                    </div>
                    {p.status === 'Sold'
                      ? <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#16d975' }}>{formatCurrency(p.soldPrice)}</div>
                          <div style={{ fontSize: 10, color: '#3a4f6e' }}>{p.team?.shortName}</div>
                        </div>
                      : <span className={`vp-status-pill vp-s-${p.status.toLowerCase()}`}>{p.status}</span>
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="vp-footer">
        🏏 CricAuction · Read-only viewer · Refreshes every 4s &nbsp;·&nbsp; मा. श्री. पवन पाटणे यांचा सहकार्याने ❤️
      </div>
    </div>
  );
}