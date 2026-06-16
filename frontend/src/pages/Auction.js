import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, formatCurrency, ROLE_COLORS } from '../utils/api';

export default function Auction() {
  const { teams, currentAuction, setCurrentAuction, activeEvent, showToast, refreshTeams } = useApp();
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [customBid, setCustomBid] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showQueue, setShowQueue] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [bidFlash, setBidFlash] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type, label, fn }

  const evId = activeEvent?._id;
  const minInc = activeEvent?.minBidIncrement || 10000;
  const increments = [minInc, minInc * 2, minInc * 5, minInc * 10, minInc * 20, minInc * 50].map(v => Math.round(v));

  useEffect(() => {
    loadAll();
    const iv = setInterval(loadAuction, 4000);
    return () => clearInterval(iv);
  }, [evId]);

  const loadAll = async () => {
    const params = evId ? { auctionEvent: evId } : {};
    try {
      const [ap, session] = await Promise.all([
        api.getPlayers({ ...params, status: 'Available' }),
        api.getCurrentAuction(params),
      ]);
      setAvailablePlayers(ap);
      setCurrentAuction(session);
      await refreshTeams(params);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const loadAuction = async () => {
    try {
      const session = await api.getCurrentAuction(evId ? { auctionEvent: evId } : {});
      setCurrentAuction(session);
    } catch (e) {}
  };

  const withLoad = async (fn) => { setLoading(true); try { await fn(); } finally { setLoading(false); } };

  const handleStart = async (playerId) => {
    if (currentAuction) return showToast('Close current auction first', 'error');
    await withLoad(async () => {
      try {
        const session = await api.startAuction(playerId, evId);
        setCurrentAuction(session);
        setAvailablePlayers(ap => ap.filter(p => p._id !== playerId));
        setShowQueue(false);
        showToast(`Auction started for ${session.player.name}`);
      } catch (e) { showToast(e.message, 'error'); }
    });
  };

  const handleBid = async (amount) => {
    if (!currentAuction || !selectedTeam) return showToast('Select a team first', 'error');
    const team = teams.find(t => t._id === selectedTeam);
    if (!team) return showToast('Team not found', 'error');
    const remainingSlots = team.maxPlayers - team.players.length;
    const minBasePrice = activeEvent?.defaultBasePrice || 0;
    const reservedBudget = (remainingSlots - 1) * minBasePrice;
    const effectiveMaxBid = team.remainingBudget - reservedBudget;
    if (amount > effectiveMaxBid) {
      showToast(`❌ Max bid: ${formatCurrency(effectiveMaxBid)}. Reserve ${formatCurrency(reservedBudget)} for ${remainingSlots - 1} slots.`, 'error');
      return;
    }
    if (amount <= currentAuction.currentBid) {
      showToast(`❌ Bid must exceed ${formatCurrency(currentAuction.currentBid)}`, 'error');
      return;
    }
    const prevAuction = currentAuction;
    const optimisticSession = {
      ...currentAuction,
      currentBid: amount,
      currentBidTeam: { _id: team._id, name: team.name, shortName: team.shortName, color: team.color, logo: team.logo },
      currentBidTeamName: team.name,
      bids: [...currentAuction.bids, { team: team._id, teamName: team.name, amount }],
    };
    setCurrentAuction(optimisticSession);
    setBidFlash(true);
    setTimeout(() => setBidFlash(false), 500);
    await withLoad(async () => {
      try {
        const session = await api.placeBid(prevAuction._id, selectedTeam, amount);
        setCurrentAuction(session);
        await refreshTeams(evId ? { auctionEvent: evId } : {});
        showToast(`✅ ${team.shortName} bid ${formatCurrency(amount)}`);
      } catch (e) {
        setCurrentAuction(prevAuction);
        showToast(`❌ ${e.message}`, 'error');
      }
    });
  };

  const handleSold = async () => {
    await withLoad(async () => {
      try {
        await api.markSold(currentAuction._id);
        showToast(`🔨 SOLD! ${currentAuction.player?.name} → ${currentAuction.currentBidTeamName}`);
        setCurrentAuction(null); setSelectedTeam(''); setConfirmAction(null);
        loadAll();
      } catch (e) { showToast(e.message, 'error'); }
    });
  };

  const handleUnsold = async () => {
    await withLoad(async () => {
      try {
        await api.markUnsold(currentAuction._id);
        showToast(`${currentAuction.player?.name} marked UNSOLD`);
        setCurrentAuction(null); setConfirmAction(null);
        loadAll();
      } catch (e) { showToast(e.message, 'error'); }
    });
  };

  const handleUndo = async () => {
    const prevAuction = currentAuction;
    const newBids = currentAuction.bids.slice(0, -1);
    const lastBid = newBids[newBids.length - 1];
    setCurrentAuction({
      ...currentAuction, bids: newBids,
      currentBid: lastBid?.amount ?? currentAuction.basePrice,
      currentBidTeam: lastBid ? { _id: lastBid.team, name: lastBid.teamName } : null,
      currentBidTeamName: lastBid?.teamName ?? null,
    });
    await withLoad(async () => {
      try {
        const session = await api.undoBid(prevAuction._id);
        setCurrentAuction(session);
        await refreshTeams(evId ? { auctionEvent: evId } : {});
        showToast('↩ Bid undone');
      } catch (e) { setCurrentAuction(prevAuction); showToast(e.message, 'error'); }
    });
  };

  const handlePause = async () => {
    try {
      const session = await api.pauseAuction(currentAuction._id);
      setCurrentAuction(session);
      showToast(session.status === 'Paused' ? '⏸ Paused' : '▶ Resumed');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const roleColor = currentAuction?.player ? ROLE_COLORS[currentAuction.player.role] : '#f5a623';
  const nextBase = currentAuction?.currentBid ?? 0;
  const filteredAvailable = availablePlayers.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedTeamData = teams.find(t => t._id === selectedTeam);
  const remainingSlots = selectedTeamData ? selectedTeamData.maxPlayers - selectedTeamData.players.length : 0;
  const reservedBudget = selectedTeamData ? (remainingSlots - 1) * (activeEvent?.defaultBasePrice || 0) : 0;
  const effectiveMaxBid = selectedTeamData ? selectedTeamData.remainingBudget - reservedBudget : Infinity;
  const isPaused = currentAuction?.status === 'Paused';
  const hasBid = !!currentAuction?.currentBidTeam;

  const css = `
    *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
    .a-root{display:flex;flex-direction:column;height:100vh;overflow:hidden;background:var(--bg)}
    
    /* TOP BAR */
    .a-topbar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0}
    .a-topbar-title{font-size:1rem;font-weight:800;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .a-topbar-sub{font-size:0.7rem;color:var(--text3)}
    .a-queue-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);font-size:0.75rem;font-weight:700;cursor:pointer;flex-shrink:0;white-space:nowrap}
    .a-queue-btn:active{transform:scale(0.95)}

    /* SCROLL AREA */
    .a-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
    .a-scroll::-webkit-scrollbar{display:none}

    /* PLAYER CARD */
    .a-player{padding:14px;border-bottom:1px solid var(--border)}
    .a-player-top{display:flex;align-items:center;gap:12px}
    .a-avatar{width:60px;height:60px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2.5px solid}
    .a-avatar-fb{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:900;flex-shrink:0;border:2.5px solid}
    .a-player-name{font-size:1.2rem;font-weight:900;line-height:1.1}
    .a-player-meta{font-size:0.72rem;color:var(--text2);margin-top:3px}
    .a-badge{display:inline-flex;align-items:center;gap:5px;padding:2px 10px;border-radius:20px;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px}
    .a-live-dot{width:5px;height:5px;border-radius:50%;background:#f04a4a;animation:adot 1.1s infinite}
    @keyframes adot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.6)}}
    .a-stats{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
    .a-stat{padding:3px 9px;border-radius:20px;font-size:0.68rem;font-weight:600;background:rgba(255,255,255,0.05);border:1px solid var(--border)}

    /* BID DISPLAY */
    .a-bid{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--bg2);border-bottom:1px solid var(--border)}
    .a-bid-amount{font-size:2rem;font-weight:900;line-height:1;transition:color 0.3s}
    .a-bid-amount.flash{animation:aflash 0.4s ease}
    @keyframes aflash{0%,100%{transform:scale(1)}40%{transform:scale(1.1)}}
    .a-bid-label{font-size:0.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px}
    .a-bid-team{font-size:0.78rem;font-weight:700;margin-top:3px;display:flex;align-items:center;gap:5px}
    .a-bid-right{text-align:right}
    .a-bid-count{font-size:0.68rem;color:var(--text3)}

    /* SECTION LABEL */
    .a-section-label{font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);padding:10px 14px 6px}

    /* TEAM GRID */
    .a-teams{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:0 14px 10px}
    .a-team{padding:8px 5px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg2);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;position:relative;transition:all 0.12s;-webkit-user-select:none;user-select:none}
    .a-team:active:not(:disabled){transform:scale(0.94)}
    .a-team.sel{border-color:var(--accent);background:rgba(245,158,11,0.1);box-shadow:0 0 0 1px var(--accent)}
    .a-team:disabled{opacity:0.4;cursor:not-allowed}
    .a-team-logo{width:22px;height:22px;border-radius:4px;object-fit:cover}
    .a-team-dot{width:8px;height:8px;border-radius:50%}
    .a-team-name{font-size:0.72rem;font-weight:800}
    .a-team-budget{font-size:0.6rem}
    .a-team-warn{font-size:0.55rem;color:#f04a4a}
    .a-team-check{position:absolute;top:3px;right:3px;width:6px;height:6px;border-radius:50%;background:var(--accent)}

    /* BUDGET INFO */
    .a-budget{margin:0 14px 10px;padding:9px 12px;border-radius:10px;font-size:0.75rem;display:flex;flex-direction:column;gap:3px}
    .a-budget-row{display:flex;justify-content:space-between;align-items:center}
    .a-budget-bar{height:3px;border-radius:2px;background:rgba(255,255,255,0.07);margin-top:5px;overflow:hidden}
    .a-budget-fill{height:100%;border-radius:2px;transition:width 0.4s}

    /* QUICK BIDS */
    .a-quick{padding:0 14px 10px}
    .a-quick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
    .a-qbtn{padding:10px 4px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg2);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;transition:all 0.12s;-webkit-user-select:none;user-select:none}
    .a-qbtn:active:not(:disabled){transform:scale(0.93)}
    .a-qbtn:disabled{opacity:0.3;cursor:not-allowed}
    .a-qbtn-inc{font-size:0.72rem;font-weight:800}
    .a-qbtn-total{font-size:0.6rem;color:var(--text3)}
    .a-qbtn-over{font-size:0.55rem;color:#f04a4a}

    /* CUSTOM BID */
    .a-custom{padding:0 14px 10px;display:flex;gap:7px}
    .a-custom input{flex:1;font-size:0.85rem;padding:10px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg2);color:var(--text);outline:none}
    .a-custom input:focus{border-color:var(--accent)}
    .a-custom-btn{padding:0 16px;border-radius:10px;border:none;background:var(--accent);color:#000;font-weight:800;font-size:0.85rem;cursor:pointer;flex-shrink:0;transition:all 0.12s}
    .a-custom-btn:active:not(:disabled){transform:scale(0.94)}
    .a-custom-btn:disabled{opacity:0.35;cursor:not-allowed}
    .a-custom-warn{padding:0 14px 8px;font-size:0.7rem;color:#f87171}

    /* CONTROLS */
    .a-controls{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px 14px;border-top:1px solid var(--border);flex-shrink:0;background:var(--bg)}
    .a-ctrl{padding:13px 8px;border-radius:12px;border:none;font-size:0.82rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.12s;-webkit-user-select:none;user-select:none}
    .a-ctrl:active:not(:disabled){transform:scale(0.95)}
    .a-ctrl:disabled{opacity:0.35;cursor:not-allowed}
    .a-ctrl.sold{background:#16d975;color:#000;grid-column:1/-1;font-size:1rem;padding:15px}
    .a-ctrl.unsold{background:rgba(240,74,74,0.12);color:#f87171;border:1.5px solid rgba(240,74,74,0.25)}
    .a-ctrl.pause{background:rgba(245,158,11,0.1);color:var(--accent);border:1.5px solid rgba(245,158,11,0.2)}
    .a-ctrl.undo{background:var(--bg3);color:var(--text2);border:1.5px solid var(--border)}

    /* BID HISTORY SHEET */
    .a-sheet{position:fixed;inset:0;z-index:400;pointer-events:none;opacity:0;transition:opacity 0.2s}
    .a-sheet.open{pointer-events:all;opacity:1}
    .a-sheet-bg{position:absolute;inset:0;background:rgba(0,0,0,0.65)}
    .a-sheet-panel{position:absolute;bottom:0;left:0;right:0;background:var(--bg);border-radius:18px 18px 0 0;max-height:70vh;display:flex;flex-direction:column;animation:aup 0.25s ease}
    @keyframes aup{from{transform:translateY(100%)}to{transform:translateY(0)}}
    .a-sheet-handle{width:32px;height:4px;border-radius:2px;background:var(--border2);margin:10px auto 0;flex-shrink:0}
    .a-sheet-title{padding:12px 16px;font-weight:800;font-size:0.9rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
    .a-sheet-body{overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch}
    .a-hist-row{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--border);font-size:0.82rem}

    /* QUEUE DRAWER */
    .a-drawer{position:fixed;inset:0;z-index:400;pointer-events:none;opacity:0;transition:opacity 0.2s}
    .a-drawer.open{pointer-events:all;opacity:1}
    .a-drawer-bg{position:absolute;inset:0;background:rgba(0,0,0,0.65)}
    .a-drawer-panel{position:absolute;bottom:0;left:0;right:0;background:var(--bg);border-radius:18px 18px 0 0;max-height:80vh;display:flex;flex-direction:column;animation:aup 0.25s ease}
    .a-drawer-handle{width:32px;height:4px;border-radius:2px;background:var(--border2);margin:10px auto 0;flex-shrink:0}
    .a-drawer-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
    .a-drawer-header h3{margin:0;font-size:0.9rem;font-weight:800}
    .a-drawer-search{padding:10px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
    .a-drawer-search input{width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg2);color:var(--text);font-size:0.85rem;outline:none}
    .a-plist{overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch}
    .a-prow{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);transition:background 0.1s}
    .a-prow.active{background:rgba(245,158,11,0.07);border-left:3px solid var(--accent)}
    .a-prow-av{width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0}
    .a-prow-av-fb{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;flex-shrink:0}
    .a-prow-name{font-size:0.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .a-prow-meta{font-size:0.68rem;color:var(--text3)}
    .a-start{padding:7px 14px;border-radius:8px;border:none;background:var(--accent);color:#000;font-size:0.75rem;font-weight:800;cursor:pointer;flex-shrink:0;transition:all 0.12s}
    .a-start:active:not(:disabled){transform:scale(0.93)}
    .a-start:disabled{opacity:0.35;cursor:not-allowed}

    /* CONFIRM SHEET */
    .a-confirm{position:fixed;inset:0;z-index:500;pointer-events:none;opacity:0;transition:opacity 0.15s;display:flex;align-items:flex-end}
    .a-confirm.open{pointer-events:all;opacity:1}
    .a-confirm-bg{position:absolute;inset:0;background:rgba(0,0,0,0.7)}
    .a-confirm-panel{position:relative;z-index:1;width:100%;background:var(--bg);border-radius:18px 18px 0 0;padding:20px 16px 32px;animation:aup 0.2s ease}
    .a-confirm-title{font-size:1rem;font-weight:800;margin-bottom:6px}
    .a-confirm-sub{font-size:0.82rem;color:var(--text2);margin-bottom:20px}
    .a-confirm-btns{display:flex;gap:8px}
    .a-confirm-yes{flex:1;padding:14px;border-radius:12px;border:none;font-size:0.9rem;font-weight:800;cursor:pointer;transition:all 0.12s}
    .a-confirm-yes:active{transform:scale(0.95)}
    .a-confirm-no{flex:1;padding:14px;border-radius:12px;border:1.5px solid var(--border);background:var(--bg3);color:var(--text2);font-size:0.9rem;font-weight:700;cursor:pointer;transition:all 0.12s}
    .a-confirm-no:active{transform:scale(0.95)}

    /* NO AUCTION */
    .a-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:60px 24px;text-align:center;flex:1}
    .a-empty-icon{font-size:3rem}
    .a-empty-title{font-size:1.2rem;font-weight:800;color:var(--text2)}
    .a-empty-sub{font-size:0.82rem;color:var(--text3)}
    .a-open-queue{padding:12px 24px;border-radius:12px;border:none;background:var(--accent);color:#000;font-size:0.85rem;font-weight:800;cursor:pointer;margin-top:4px;transition:all 0.12s}
    .a-open-queue:active{transform:scale(0.95)}
  `;

  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const Confirm = () => {
    if (!confirmAction) return null;
    const colors = {
      sold: { yes: '#16d975', text: '#000' },
      unsold: { yes: 'rgba(240,74,74,0.8)', text: '#fff' },
    };
    const c = colors[confirmAction.type] || { yes: 'var(--accent)', text: '#000' };
    return (
      <div className={`a-confirm open`}>
        <div className="a-confirm-bg" onClick={() => setConfirmAction(null)} />
        <div className="a-confirm-panel">
          <div className="a-confirm-title">{confirmAction.label}</div>
          <div className="a-confirm-sub">
            {confirmAction.type === 'sold'
              ? `${currentAuction?.player?.name} → ${currentAuction?.currentBidTeamName} for ${formatCurrency(currentAuction?.currentBid)}`
              : `${currentAuction?.player?.name} will be marked as unsold`
            }
          </div>
          <div className="a-confirm-btns">
            <button className="a-confirm-no" onClick={() => setConfirmAction(null)}>Cancel</button>
            <button className="a-confirm-yes" style={{ background: c.yes, color: c.text }}
              disabled={loading} onClick={confirmAction.fn}>
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      <div className="a-root">

        {/* Top bar */}
        <div className="a-topbar">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="a-topbar-title">🏏 {activeEvent?.name || 'Live Auction'}</div>
            {currentAuction && (
              <div className="a-topbar-sub">
                {isPaused ? '⏸ Paused' : '🔴 Live'} · {availablePlayers.length} players left
              </div>
            )}
          </div>
          <button className="a-queue-btn" onClick={() => setShowQueue(true)}>
            📋 Queue
            {availablePlayers.length > 0 && (
              <span style={{ background: '#f04a4a', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 800 }}>
                {availablePlayers.length}
              </span>
            )}
          </button>
        </div>

        {currentAuction ? (
          <>
            <div className="a-scroll">
              {/* Player */}
              <div className="a-player">
                <div className="a-badge" style={{ background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}35` }}>
                  {isPaused ? '⏸' : <span className="a-live-dot" />}
                  {isPaused ? 'Paused' : 'Live'} · {currentAuction.player?.role}
                </div>
                <div className="a-player-top">
                  {currentAuction.player?.imageUrl
                    ? <img src={currentAuction.player.imageUrl} alt="" className="a-avatar" style={{ borderColor: roleColor }} />
                    : <div className="a-avatar-fb" style={{ background: `${roleColor}18`, color: roleColor, borderColor: roleColor }}>
                        {initials(currentAuction.player?.name)}
                      </div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="a-player-name">{currentAuction.player?.name}</div>
                    <div className="a-player-meta">
                      {[currentAuction.player?.battingStyle, currentAuction.player?.nationality, currentAuction.player?.age && `Age ${currentAuction.player.age}`].filter(Boolean).join(' · ')}
                    </div>
                    {currentAuction.player?.stats && (
                      <div className="a-stats">
                        {currentAuction.player.stats.runs > 0 && <span className="a-stat" style={{ color: '#38d9f5' }}>🏏 {currentAuction.player.stats.runs}R</span>}
                        {currentAuction.player.stats.average > 0 && <span className="a-stat" style={{ color: '#ffe066' }}>Avg {currentAuction.player.stats.average}</span>}
                        {currentAuction.player.stats.wickets > 0 && <span className="a-stat" style={{ color: '#f04a4a' }}>🎯 {currentAuction.player.stats.wickets}W</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bid */}
              <div className="a-bid">
                <div>
                  <div className="a-bid-label">Current Bid</div>
                  <div className={`a-bid-amount${bidFlash ? ' flash' : ''}`} style={{ color: hasBid ? '#16d975' : 'var(--text3)' }}>
                    {formatCurrency(currentAuction.currentBid)}
                  </div>
                  <div className="a-bid-team" style={{ color: hasBid ? 'var(--accent2, #f5a623)' : 'var(--text3)' }}>
                    {hasBid ? (
                      <>
                        {currentAuction.currentBidTeam?.logo
                          ? <img src={currentAuction.currentBidTeam.logo} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'cover' }} />
                          : <span style={{ width: 7, height: 7, borderRadius: '50%', background: currentAuction.currentBidTeam?.color, display: 'inline-block' }} />
                        }
                        {currentAuction.currentBidTeamName}
                      </>
                    ) : 'Awaiting bids'}
                  </div>
                </div>
                <div className="a-bid-right">
                  <div className="a-bid-count">{currentAuction.bids.length} bid{currentAuction.bids.length !== 1 ? 's' : ''}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 2 }}>Base {formatCurrency(currentAuction.basePrice)}</div>
                  {currentAuction.bids.length > 0 && (
                    <button onClick={() => setShowHistory(true)}
                      style={{ marginTop: 6, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: '0.65rem', cursor: 'pointer' }}>
                      View History
                    </button>
                  )}
                </div>
              </div>

              {/* Teams */}
              <div className="a-section-label">Select Team</div>
              <div className="a-teams">
                {teams.map(t => {
                  const tSlots = t.maxPlayers - t.players.length;
                  const tReserved = (tSlots - 1) * (activeEvent?.defaultBasePrice || 0);
                  const tMax = t.remainingBudget - tReserved;
                  const cantAfford = tMax < nextBase + increments[0];
                  const isSel = selectedTeam === t._id;
                  return (
                    <button key={t._id} className={`a-team${isSel ? ' sel' : ''}`}
                      disabled={isPaused}
                      onClick={() => setSelectedTeam(isSel ? '' : t._id)}>
                      {t.logo
                        ? <img src={t.logo} alt={t.name} className="a-team-logo" />
                        : <div className="a-team-dot" style={{ background: t.color }} />
                      }
                      <div className="a-team-name">{t.shortName}</div>
                      <div className="a-team-budget" style={{ color: cantAfford ? '#f04a4a' : 'var(--text3)' }}>{formatCurrency(t.remainingBudget)}</div>
                      {cantAfford && <div className="a-team-warn">Low</div>}
                      {isSel && <div className="a-team-check" />}
                    </button>
                  );
                })}
              </div>

              {/* Budget info */}
              {selectedTeamData && (
                <div className="a-budget" style={{
                  background: effectiveMaxBid < nextBase + increments[0] ? 'rgba(240,74,74,0.07)' : 'rgba(22,217,117,0.06)',
                  border: `1px solid ${effectiveMaxBid < nextBase + increments[0] ? 'rgba(240,74,74,0.2)' : 'rgba(22,217,117,0.18)'}`,
                  color: effectiveMaxBid < nextBase + increments[0] ? '#f87171' : '#16d975',
                }}>
                  <div className="a-budget-row">
                    <span style={{ fontWeight: 700 }}>{selectedTeamData.shortName} · Max bid</span>
                    <span style={{ fontWeight: 800 }}>{formatCurrency(Math.max(0, effectiveMaxBid))}</span>
                  </div>
                  {reservedBudget > 0 && (
                    <div className="a-budget-row" style={{ fontSize: '0.65rem', opacity: 0.75 }}>
                      <span>Reserve {formatCurrency(reservedBudget)} for {remainingSlots - 1} slots</span>
                      <span>{formatCurrency(selectedTeamData.remainingBudget)} total left</span>
                    </div>
                  )}
                  <div className="a-budget-bar">
                    <div className="a-budget-fill" style={{
                      width: `${Math.min(100, (selectedTeamData.remainingBudget / selectedTeamData.budget) * 100)}%`,
                      background: effectiveMaxBid < nextBase + increments[0] ? '#f04a4a' : '#16d975',
                    }} />
                  </div>
                </div>
              )}

              {/* Quick bids */}
              {!isPaused && (
                <>
                  <div className="a-section-label">Quick Bid</div>
                  <div className="a-quick">
                    <div className="a-quick-grid">
                      {increments.map(inc => {
                        const amt = nextBase + inc;
                        const ok = selectedTeamData ? amt <= effectiveMaxBid : true;
                        return (
                          <button key={inc} className="a-qbtn"
                            disabled={!selectedTeam || loading || !ok}
                            onClick={() => handleBid(amt)}
                            style={{ borderColor: !ok ? 'rgba(240,74,74,0.2)' : undefined }}>
                            <span className="a-qbtn-inc" style={{ color: ok ? 'var(--accent)' : '#f04a4a' }}>+{formatCurrency(inc)}</span>
                            <span className="a-qbtn-total">{formatCurrency(amt)}</span>
                            {!ok && <span className="a-qbtn-over">Over budget</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom bid */}
                  <div className="a-section-label">Custom Bid</div>
                  <div className="a-custom">
                    <input type="number" inputMode="numeric" placeholder={`Min ${formatCurrency(nextBase + 1)}`}
                      value={customBid} onChange={e => setCustomBid(e.target.value)}
                      style={{ borderColor: customBid && selectedTeamData && Number(customBid) > effectiveMaxBid ? 'rgba(240,74,74,0.5)' : undefined }} />
                    <button className="a-custom-btn"
                      disabled={!selectedTeam || !customBid || loading || (selectedTeamData && Number(customBid) > effectiveMaxBid)}
                      onClick={() => { handleBid(Number(customBid)); setCustomBid(''); }}>
                      Bid
                    </button>
                  </div>
                  {customBid && selectedTeamData && Number(customBid) > effectiveMaxBid && (
                    <div className="a-custom-warn">
                      ⚠️ Max: {formatCurrency(effectiveMaxBid)} · Reserve {formatCurrency(reservedBudget)} for {remainingSlots - 1} slots
                    </div>
                  )}
                  <div style={{ height: 12 }} />
                </>
              )}
            </div>

            {/* Sticky controls */}
            <div className="a-controls">
              <button className={`a-ctrl sold`}
                disabled={!hasBid || loading}
                onClick={() => setConfirmAction({ type: 'sold', label: '🔨 Confirm Sale', fn: handleSold })}>
                🔨 SOLD — {hasBid ? formatCurrency(currentAuction.currentBid) : 'No bids'}
              </button>
              <button className="a-ctrl unsold" disabled={loading}
                onClick={() => setConfirmAction({ type: 'unsold', label: '❌ Mark Unsold?', fn: handleUnsold })}>
                ❌ Unsold
              </button>
              <button className="a-ctrl pause" disabled={loading} onClick={handlePause}>
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button className="a-ctrl undo" disabled={loading || currentAuction.bids.length === 0} onClick={handleUndo}>
                ↩ Undo Bid
              </button>
            </div>
          </>
        ) : (
          <div className="a-empty">
            <div className="a-empty-icon">🏏</div>
            <div className="a-empty-title">No Active Auction</div>
            <div className="a-empty-sub">Pick a player from the queue to start bidding</div>
            <button className="a-open-queue" onClick={() => setShowQueue(true)}>📋 Open Player Queue</button>
          </div>
        )}

        {/* Bid history sheet */}
        <div className={`a-sheet${showHistory ? ' open' : ''}`}>
          <div className="a-sheet-bg" onClick={() => setShowHistory(false)} />
          <div className="a-sheet-panel">
            <div className="a-sheet-handle" />
            <div className="a-sheet-title">
              <span>Bid History</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{currentAuction?.bids?.length || 0} bids</span>
            </div>
            <div className="a-sheet-body">
              {[...(currentAuction?.bids || [])].reverse().map((b, i) => (
                <div key={i} className="a-hist-row" style={{ background: i === 0 ? 'rgba(22,217,117,0.04)' : undefined }}>
                  <span style={{ color: i === 0 ? '#16d975' : 'var(--text2)', fontWeight: i === 0 ? 700 : 400 }}>
                    {i === 0 ? '🏆 ' : ''}{b.teamName}
                  </span>
                  <span style={{ fontWeight: 700, color: i === 0 ? '#16d975' : 'var(--text)' }}>{formatCurrency(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Player queue drawer */}
        <div className={`a-drawer${showQueue ? ' open' : ''}`}>
          <div className="a-drawer-bg" onClick={() => setShowQueue(false)} />
          <div className="a-drawer-panel">
            <div className="a-drawer-handle" />
            <div className="a-drawer-header">
              <h3>Player Queue</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
                {availablePlayers.length} left
              </span>
            </div>
            <div className="a-drawer-search">
              <input placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="a-plist">
              {filteredAvailable.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: '0.85rem' }}>All players auctioned!</div>
                </div>
              ) : filteredAvailable.map(p => {
                const rc = ROLE_COLORS[p.role] || '#666';
                const isActive = currentAuction?.player?._id === p._id;
                return (
                  <div key={p._id} className={`a-prow${isActive ? ' active' : ''}`}>
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="a-prow-av" />
                      : <div className="a-prow-av-fb" style={{ background: `${rc}18`, color: rc }}>{initials(p.name)}</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="a-prow-name">{p.name}</div>
                      <div className="a-prow-meta">{p.role} · {formatCurrency(p.basePrice)}</div>
                    </div>
                    {isActive
                      ? <span style={{ fontSize: '0.6rem', background: 'var(--accent)', color: '#000', padding: '2px 8px', borderRadius: 8, fontWeight: 800, flexShrink: 0 }}>LIVE</span>
                      : <button className="a-start" disabled={!!currentAuction || loading} onClick={() => handleStart(p._id)}>▶ Start</button>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirm dialog */}
        <Confirm />
      </div>
    </>
  );
}