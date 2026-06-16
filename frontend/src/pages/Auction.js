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
  const [bidFlash, setBidFlash] = useState(false);

  const evId = activeEvent?._id;
  const minInc = activeEvent?.minBidIncrement || 10000;
  const increments = [minInc, minInc * 2.5, minInc * 5, minInc * 10, minInc * 25, minInc * 50].map(v => Math.round(v));

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
      showToast(
        `❌ ${team.name} can only bid up to ${formatCurrency(effectiveMaxBid)}. Must reserve ${formatCurrency(reservedBudget)} for ${remainingSlots - 1} more players.`,
        'error'
      );
      return;
    }
    if (amount <= currentAuction.currentBid) {
      showToast(`❌ Bid must be higher than ${formatCurrency(currentAuction.currentBid)}`, 'error');
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
    setTimeout(() => setBidFlash(false), 600);

    await withLoad(async () => {
      try {
        const session = await api.placeBid(prevAuction._id, selectedTeam, amount);
        setCurrentAuction(session);
        await refreshTeams(evId ? { auctionEvent: evId } : {});
        showToast(`✅ Bid: ${formatCurrency(amount)}`);
      } catch (e) {
        setCurrentAuction(prevAuction);
        showToast(`❌ ${e.message}`, 'error');
      }
    });
  };

  const handleSold = async () => {
    if (!currentAuction) return;
    await withLoad(async () => {
      try {
        await api.markSold(currentAuction._id);
        showToast(`🔨 SOLD! ${currentAuction.player?.name} → ${currentAuction.currentBidTeamName}`);
        setCurrentAuction(null); setSelectedTeam('');
        loadAll();
      } catch (e) { showToast(e.message, 'error'); }
    });
  };

  const handleUnsold = async () => {
    if (!currentAuction) return;
    await withLoad(async () => {
      try {
        await api.markUnsold(currentAuction._id);
        showToast(`${currentAuction.player?.name} marked UNSOLD`);
        setCurrentAuction(null);
        loadAll();
      } catch (e) { showToast(e.message, 'error'); }
    });
  };

  const handleUndo = async () => {
    if (!currentAuction) return;
    const prevAuction = currentAuction;
    const newBids = currentAuction.bids.slice(0, -1);
    const lastBid = newBids[newBids.length - 1];
    const optimisticSession = {
      ...currentAuction,
      bids: newBids,
      currentBid: lastBid?.amount ?? currentAuction.basePrice,
      currentBidTeam: lastBid ? { _id: lastBid.team, name: lastBid.teamName } : null,
      currentBidTeamName: lastBid?.teamName ?? null,
    };
    setCurrentAuction(optimisticSession);
    await withLoad(async () => {
      try {
        const session = await api.undoBid(prevAuction._id);
        setCurrentAuction(session);
        await refreshTeams(evId ? { auctionEvent: evId } : {});
        showToast('↩ Last bid undone');
      } catch (e) {
        setCurrentAuction(prevAuction);
        showToast(e.message, 'error');
      }
    });
  };

  const handlePause = async () => {
    if (!currentAuction) return;
    try {
      const session = await api.pauseAuction(currentAuction._id);
      setCurrentAuction(session);
      showToast(session.status === 'Paused' ? '⏸ Auction paused' : '▶ Auction resumed');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const roleColor = currentAuction?.player ? ROLE_COLORS[currentAuction.player.role] : 'var(--accent)';
  const nextBase = currentAuction ? currentAuction.currentBid : 0;
  const filteredAvailable = availablePlayers.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedTeamData = teams.find(t => t._id === selectedTeam);
  const remainingSlots = selectedTeamData ? selectedTeamData.maxPlayers - selectedTeamData.players.length : 0;
  const reservedBudget = selectedTeamData ? (remainingSlots - 1) * (activeEvent?.defaultBasePrice || 0) : 0;
  const effectiveMaxBid = selectedTeamData ? selectedTeamData.remainingBudget - reservedBudget : Infinity;
  const isPaused = currentAuction?.status === 'Paused';

  const css = `
    .auc-wrap { display: flex; flex-direction: column; gap: 0; }
    .auc-topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg2); border-bottom: 1px solid var(--border); gap: 10px; flex-wrap: wrap; }
    .auc-topbar h1 { font-size: 1.1rem; margin: 0; }
    .auc-topbar p { font-size: 0.78rem; color: var(--text3); margin: 0; }
    .auc-body { display: grid; grid-template-columns: 1fr 340px; gap: 0; min-height: calc(100vh - 120px); }
    .auc-main { display: flex; flex-direction: column; gap: 0; border-right: 1px solid var(--border); overflow-y: auto; }
    .auc-sidebar { display: flex; flex-direction: column; overflow: hidden; }

    /* Player hero */
    .player-hero { position: relative; padding: 20px 20px 16px; background: linear-gradient(160deg, var(--bg2) 0%, var(--bg) 100%); border-bottom: 1px solid var(--border); }
    .player-hero-inner { display: flex; gap: 16px; align-items: center; }
    .player-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 3px solid; box-shadow: 0 0 20px rgba(0,0,0,0.4); }
    .player-avatar-fb { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 800; flex-shrink: 0; border: 3px solid; }
    .player-name { font-size: clamp(1.2rem, 3vw, 1.8rem); font-weight: 800; line-height: 1.1; }
    .player-meta { font-size: 0.8rem; color: var(--text2); margin-top: 4px; }
    .player-stats { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
    .player-stat { padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; background: rgba(255,255,255,0.06); border: 1px solid var(--border); }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #f04a4a; animation: pulse 1.1s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }

    /* Bid display */
    .bid-display { padding: 14px 20px; background: var(--bg2); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .bid-amount { font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 900; transition: color 0.3s; }
    .bid-amount.flash { animation: bidFlash 0.5s ease; }
    @keyframes bidFlash { 0%{transform:scale(1)} 30%{transform:scale(1.08)} 100%{transform:scale(1)} }
    .bid-team { font-size: 0.85rem; font-weight: 600; margin-top: 2px; }
    .bid-count { font-size: 0.72rem; color: var(--text3); margin-top: 2px; }

    /* Team grid */
    .team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
    .team-btn { padding: 8px 6px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--bg2); cursor: pointer; transition: all 0.15s; text-align: center; position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .team-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.2); background: var(--bg3); transform: translateY(-1px); }
    .team-btn.selected { border-color: var(--accent); background: rgba(245,158,11,0.08); box-shadow: 0 0 0 1px var(--accent); }
    .team-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .team-btn-name { font-size: 0.75rem; font-weight: 700; }
    .team-btn-budget { font-size: 0.65rem; }
    .team-btn-warn { font-size: 0.58rem; color: #f04a4a; }

    /* Budget bar */
    .budget-bar { margin: 0 16px 12px; padding: 10px 14px; border-radius: 10px; font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px; }
    .budget-bar-row { display: flex; justify-content: space-between; align-items: center; }

    /* Quick bids */
    .quick-bids { padding: 0 16px 14px; }
    .quick-bids-label { font-size: 0.7rem; color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 8px; }
    .quick-bid-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px; }
    .quick-bid-btn { padding: 10px 4px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--bg2); cursor: pointer; transition: all 0.15s; text-align: center; display: flex; flex-direction: column; gap: 1px; align-items: center; }
    .quick-bid-btn:hover:not(:disabled) { border-color: var(--accent); background: rgba(245,158,11,0.06); transform: translateY(-1px); }
    .quick-bid-btn:active:not(:disabled) { transform: scale(0.96); }
    .quick-bid-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .quick-bid-btn .inc { font-size: 0.75rem; font-weight: 700; }
    .quick-bid-btn .total { font-size: 0.65rem; color: var(--text3); }
    .quick-bid-btn .over { font-size: 0.58rem; color: #f04a4a; }
    .custom-bid-row { display: flex; gap: 8px; }
    .custom-bid-row input { flex: 1; }

    /* Controls */
    .controls { display: flex; gap: 8px; padding: 14px 16px; border-top: 1px solid var(--border); flex-wrap: wrap; }
    .controls .btn { flex: 1; min-width: 80px; padding: 12px 8px; font-size: 0.82rem; font-weight: 700; border-radius: 10px; border: none; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 5px; }
    .controls .btn:active:not(:disabled) { transform: scale(0.96); }
    .controls .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-sold { background: var(--green, #16a34a); color: #fff; font-size: 1rem !important; }
    .btn-sold:hover:not(:disabled) { background: #15803d; }
    .btn-unsold { background: rgba(239,68,68,0.15); color: #f87171; border: 1.5px solid rgba(239,68,68,0.3) !important; }
    .btn-unsold:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
    .btn-pause { background: rgba(245,158,11,0.12); color: var(--accent); border: 1.5px solid rgba(245,158,11,0.25) !important; }
    .btn-pause:hover:not(:disabled) { background: rgba(245,158,11,0.2); }
    .btn-undo { background: var(--bg3); color: var(--text2); border: 1.5px solid var(--border) !important; }
    .btn-undo:hover:not(:disabled) { background: var(--bg2); color: var(--text); }

    /* Sidebar */
    .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--border); background: var(--bg2); flex-shrink: 0; }
    .sidebar-header h3 { margin: 0; font-size: 0.9rem; }
    .sidebar-search { padding: 10px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .player-list { flex: 1; overflow-y: auto; }
    .player-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border); transition: background 0.12s; cursor: default; }
    .player-row:hover { background: var(--bg2); }
    .player-row.active { background: rgba(245,158,11,0.08); border-left: 3px solid var(--accent); }
    .player-row-av { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .player-row-av-fb { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0; }
    .player-row-name { font-size: 0.85rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .player-row-meta { font-size: 0.7rem; color: var(--text3); }
    .start-btn { padding: 6px 14px; border-radius: 8px; border: none; background: var(--accent); color: #000; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
    .start-btn:hover:not(:disabled) { background: #d97706; transform: scale(1.04); }
    .start-btn:active:not(:disabled) { transform: scale(0.96); }
    .start-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Bid history */
    .bid-history { border-top: 1px solid var(--border); }
    .bid-history-header { padding: 10px 16px; font-size: 0.75rem; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; }
    .bid-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 16px; border-bottom: 1px solid var(--border); font-size: 0.82rem; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

    /* Queue drawer (mobile) */
    .queue-fab { display: none; position: fixed; bottom: 80px; right: 16px; z-index: 200; width: 52px; height: 52px; border-radius: 50%; background: var(--accent); color: #000; border: none; font-size: 1.3rem; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.4); transition: transform 0.15s; align-items: center; justify-content: center; }
    .queue-fab:active { transform: scale(0.92); }
    .queue-drawer { display: none; position: fixed; inset: 0; z-index: 300; }
    .queue-drawer-bg { position: absolute; inset: 0; background: rgba(0,0,0,0.6); }
    .queue-drawer-panel { position: absolute; bottom: 0; left: 0; right: 0; background: var(--bg); border-radius: 16px 16px 0 0; max-height: 75vh; display: flex; flex-direction: column; animation: slideUp 0.25s ease; }
    @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
    .queue-drawer-handle { width: 36px; height: 4px; border-radius: 2px; background: var(--border2); margin: 10px auto 0; flex-shrink: 0; }

    /* No auction */
    .no-auction { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 24px; gap: 12px; text-align: center; flex: 1; }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .auc-body { grid-template-columns: 1fr; }
      .auc-sidebar { display: none; }
      .queue-fab { display: flex; }
      .queue-drawer { display: block; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
      .queue-drawer.open { pointer-events: all; opacity: 1; }
      .team-grid { grid-template-columns: repeat(2, 1fr); }
      .quick-bid-grid { grid-template-columns: repeat(2, 1fr); }
      .controls .btn { min-width: 60px; font-size: 0.75rem; padding: 11px 6px; }
      .player-hero { padding: 14px; }
      .player-avatar, .player-avatar-fb { width: 64px; height: 64px; }
    }
    @media (max-width: 400px) {
      .team-grid { grid-template-columns: repeat(2, 1fr); }
      .quick-bid-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `;

  const PlayerQueue = () => (
    <>
      <div className="sidebar-header">
        <h3>Player Queue</h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text3)', background: 'var(--bg3)', padding: '2px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
          {availablePlayers.length} left
        </span>
      </div>
      <div className="sidebar-search">
        <input className="form-control" placeholder="Search players..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ fontSize: '0.85rem', padding: '8px 12px' }} />
      </div>
      <div className="player-list">
        {filteredAvailable.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: '0.85rem' }}>All players auctioned!</div>
          </div>
        ) : filteredAvailable.map(p => {
          const rc = ROLE_COLORS[p.role] || '#666';
          const isActive = currentAuction?.player?._id === p._id;
          return (
            <div key={p._id} className={`player-row${isActive ? ' active' : ''}`}>
              {p.imageUrl
                ? <img src={p.imageUrl} alt={p.name} className="player-row-av" />
                : <div className="player-row-av-fb" style={{ background: `${rc}22`, color: rc }}>
                    {p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="player-row-name">{p.name}</div>
                <div className="player-row-meta">{p.role} · {formatCurrency(p.basePrice)}</div>
              </div>
              {isActive
                ? <span style={{ fontSize: '0.62rem', background: 'var(--accent)', color: '#000', padding: '2px 8px', borderRadius: 10, fontWeight: 800, flexShrink: 0 }}>LIVE</span>
                : <button className="start-btn" disabled={!!currentAuction || loading} onClick={() => handleStart(p._id)}>▶ Start</button>
              }
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="auc-wrap">

        {/* Top bar */}
        <div className="auc-topbar">
          <div>
            <h1>🏏 Live Auction</h1>
            <p>{activeEvent ? activeEvent.name : 'No auction selected'}</p>
          </div>
          {!activeEvent && (
            <div style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--red)' }}>
              ⚠️ Select an auction first
            </div>
          )}
        </div>

        <div className="auc-body">
          {/* Main panel */}
          <div className="auc-main">
            {currentAuction ? (
              <>
                {/* Player hero */}
                <div className="player-hero">
                  <div className="status-badge" style={{ background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}40` }}>
                    {isPaused ? <span>⏸</span> : <span className="live-dot" />}
                    {isPaused ? 'Paused' : 'Live'} · {currentAuction.player?.role}
                  </div>
                  <div className="player-hero-inner">
                    {currentAuction.player?.imageUrl
                      ? <img src={currentAuction.player.imageUrl} alt={currentAuction.player.name} className="player-avatar" style={{ borderColor: roleColor }} />
                      : <div className="player-avatar-fb" style={{ background: `${roleColor}22`, color: roleColor, borderColor: roleColor }}>
                          {currentAuction.player?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="player-name">{currentAuction.player?.name}</div>
                      <div className="player-meta">
                        {[currentAuction.player?.battingStyle, currentAuction.player?.nationality, currentAuction.player?.age && `Age ${currentAuction.player.age}`].filter(Boolean).join(' · ')}
                      </div>
                      {currentAuction.player?.stats && (
                        <div className="player-stats">
                          {currentAuction.player.stats.runs > 0 && <span className="player-stat" style={{ color: '#38d9f5' }}>🏏 {currentAuction.player.stats.runs}R</span>}
                          {currentAuction.player.stats.average > 0 && <span className="player-stat" style={{ color: '#ffe066' }}>Avg {currentAuction.player.stats.average}</span>}
                          {currentAuction.player.stats.wickets > 0 && <span className="player-stat" style={{ color: '#f04a4a' }}>🎯 {currentAuction.player.stats.wickets}W</span>}
                          {currentAuction.player.stats.matches > 0 && <span className="player-stat" style={{ color: 'var(--text3)' }}>🏟 {currentAuction.player.stats.matches}M</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current bid display */}
                <div className="bid-display">
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Current Bid</div>
                    <div className={`bid-amount${bidFlash ? ' flash' : ''}`} style={{ color: currentAuction.currentBidTeam ? '#16d975' : 'var(--text3)' }}>
                      {formatCurrency(currentAuction.currentBid)}
                    </div>
                    {currentAuction.currentBidTeamName
                      ? <div className="bid-team" style={{ color: 'var(--accent2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {currentAuction.currentBidTeam?.logo
                            ? <img src={currentAuction.currentBidTeam.logo} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'cover' }} />
                            : <span style={{ width: 8, height: 8, borderRadius: '50%', background: currentAuction.currentBidTeam?.color, display: 'inline-block' }} />
                          }
                          {currentAuction.currentBidTeamName}
                        </div>
                      : <div className="bid-team" style={{ color: 'var(--text3)' }}>Base Price · Awaiting bids</div>
                    }
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="bid-count">{currentAuction.bids.length} bid{currentAuction.bids.length !== 1 ? 's' : ''}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2 }}>
                      Base: {formatCurrency(currentAuction.basePrice)}
                    </div>
                  </div>
                </div>

                {/* Team selector */}
                <div style={{ padding: '14px 16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>Select Bidding Team</div>
                  <div className="team-grid">
                    {teams.map(t => {
                      const tRemainingSlots = t.maxPlayers - t.players.length;
                      const tReserved = (tRemainingSlots - 1) * (activeEvent?.defaultBasePrice || 0);
                      const tEffMax = t.remainingBudget - tReserved;
                      const cantAfford = tEffMax < nextBase + increments[0];
                      return (
                        <button key={t._id} className={`team-btn${selectedTeam === t._id ? ' selected' : ''}`}
                          disabled={isPaused}
                          onClick={() => setSelectedTeam(selectedTeam === t._id ? '' : t._id)}>
                          {t.logo
                            ? <img src={t.logo} alt={t.name} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
                            : <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                          }
                          <div className="team-btn-name">{t.shortName}</div>
                          <div className="team-btn-budget" style={{ color: cantAfford ? '#f04a4a' : 'var(--text3)' }}>
                            {formatCurrency(t.remainingBudget)}
                          </div>
                          {cantAfford && <div className="team-btn-warn">Low budget</div>}
                          {selectedTeam === t._id && (
                            <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Budget warning */}
                  {selectedTeamData && (
                    <div className="budget-bar" style={{
                      background: effectiveMaxBid < nextBase + increments[0] ? 'rgba(240,74,74,0.08)' : 'rgba(22,217,117,0.06)',
                      border: `1px solid ${effectiveMaxBid < nextBase + increments[0] ? 'rgba(240,74,74,0.25)' : 'rgba(22,217,117,0.2)'}`,
                      color: effectiveMaxBid < nextBase + increments[0] ? '#f87171' : '#16d975',
                    }}>
                      <div className="budget-bar-row">
                        <span style={{ fontWeight: 700 }}>{selectedTeamData.name}</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(selectedTeamData.remainingBudget)} left</span>
                      </div>
                      <div className="budget-bar-row" style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                        <span>Max bid: <strong>{formatCurrency(Math.max(0, effectiveMaxBid))}</strong></span>
                        {reservedBudget > 0 && (
                          <span>Reserve {formatCurrency(reservedBudget)} for {remainingSlots - 1} slots</span>
                        )}
                      </div>
                      {/* Budget progress bar */}
                      <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${Math.min(100, (selectedTeamData.remainingBudget / selectedTeamData.budget) * 100)}%`,
                          background: effectiveMaxBid < nextBase + increments[0] ? '#f04a4a' : '#16d975',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick bids */}
                {!isPaused && (
                  <div className="quick-bids" style={{ paddingTop: 14 }}>
                    <div className="quick-bids-label">Quick Bid</div>
                    <div className="quick-bid-grid">
                      {increments.map(inc => {
                        const bidAmount = nextBase + inc;
                        const canAfford = selectedTeamData ? bidAmount <= effectiveMaxBid : true;
                        return (
                          <button key={inc} className="quick-bid-btn"
                            disabled={!selectedTeam || loading || !canAfford}
                            onClick={() => handleBid(bidAmount)}>
                            <span className="inc" style={{ color: canAfford ? 'var(--accent)' : '#f04a4a' }}>+{formatCurrency(inc)}</span>
                            <span className="total">{formatCurrency(bidAmount)}</span>
                            {!canAfford && <span className="over">Over budget</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="custom-bid-row">
                      <input type="number" className="form-control"
                        placeholder={`Custom (min ${formatCurrency(nextBase + 1)})`}
                        value={customBid} onChange={e => setCustomBid(e.target.value)}
                        style={{
                          fontSize: '0.85rem',
                          borderColor: customBid && selectedTeamData && Number(customBid) > effectiveMaxBid
                            ? 'rgba(240,74,74,0.5)' : undefined,
                        }} />
                      <button className="btn btn-primary"
                        disabled={!selectedTeam || !customBid || loading || (selectedTeamData && Number(customBid) > effectiveMaxBid)}
                        onClick={() => { handleBid(Number(customBid)); setCustomBid(''); }}
                        style={{ flexShrink: 0, padding: '0 18px', fontWeight: 700 }}>
                        Bid
                      </button>
                    </div>
                    {customBid && selectedTeamData && Number(customBid) > effectiveMaxBid && (
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#f87171' }}>
                        ⚠️ Max allowed: {formatCurrency(effectiveMaxBid)} — must reserve {formatCurrency(reservedBudget)} for {remainingSlots - 1} slots
                      </div>
                    )}
                  </div>
                )}

                {/* Action controls */}
                <div className="controls">
                  <button className="btn btn-sold"
                    disabled={!currentAuction.currentBidTeam || loading} onClick={handleSold}>
                    🔨 SOLD
                  </button>
                  <button className="btn btn-unsold" disabled={loading} onClick={handleUnsold}>
                    ❌ UNSOLD
                  </button>
                  <button className="btn btn-pause" disabled={loading} onClick={handlePause}>
                    {isPaused ? '▶ Resume' : '⏸ Pause'}
                  </button>
                  <button className="btn btn-undo" disabled={loading || currentAuction.bids.length === 0} onClick={handleUndo}>
                    ↩ Undo
                  </button>
                </div>

                {/* Bid history */}
                {currentAuction.bids.length > 0 && (
                  <div className="bid-history">
                    <div className="bid-history-header">
                      <span>Bid History</span>
                      <span>{currentAuction.bids.length} bids</span>
                    </div>
                    <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                      {[...currentAuction.bids].reverse().map((b, i) => (
                        <div key={i} className="bid-row" style={{ background: i === 0 ? 'rgba(22,217,117,0.04)' : undefined }}>
                          <span style={{ color: i === 0 ? '#16d975' : 'var(--text2)', fontWeight: i === 0 ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {i === 0 && <span>🏆</span>} {b.teamName}
                          </span>
                          <span style={{ fontWeight: 600, color: i === 0 ? '#16d975' : 'var(--text)' }}>{formatCurrency(b.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-auction">
                <div style={{ fontSize: '3rem' }}>🏏</div>
                <h2 style={{ color: 'var(--text2)', margin: 0 }}>No Active Auction</h2>
                <p style={{ color: 'var(--text3)', margin: 0, fontSize: '0.85rem' }}>Select a player from the queue to start bidding</p>
                <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowQueue(true)}>
                  📋 Open Player Queue
                </button>
              </div>
            )}
          </div>

          {/* Desktop sidebar */}
          <div className="auc-sidebar">
            <PlayerQueue />
          </div>
        </div>

        {/* Mobile FAB */}
        <button className="queue-fab" onClick={() => setShowQueue(true)}>
          📋
          {availablePlayers.length > 0 && (
            <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#f04a4a', fontSize: '0.6rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {availablePlayers.length}
            </span>
          )}
        </button>

        {/* Mobile queue drawer */}
        <div className={`queue-drawer${showQueue ? ' open' : ''}`}>
          <div className="queue-drawer-bg" onClick={() => setShowQueue(false)} />
          <div className="queue-drawer-panel">
            <div className="queue-drawer-handle" />
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
              <PlayerQueue />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}