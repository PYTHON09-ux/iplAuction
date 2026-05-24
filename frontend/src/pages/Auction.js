import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, formatCurrency, ROLE_COLORS } from '../utils/api';

export default function Auction() {
  const { players, teams, currentAuction, setCurrentAuction, activeEvent, showToast, refreshTeams } = useApp();
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [customBid, setCustomBid] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

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
        showToast(`Auction started for ${session.player.name}`);
      } catch (e) { showToast(e.message, 'error'); }
    });
  };

  const handleBid = async (amount) => {
    if (!currentAuction || !selectedTeam) return showToast('Select a team first', 'error');
    await withLoad(async () => {
      try {
        const session = await api.placeBid(currentAuction._id, selectedTeam, amount);
        setCurrentAuction(session);
        await refreshTeams(evId ? { auctionEvent: evId } : {});
        showToast(`✅ Bid: ${formatCurrency(amount)}`);
      } catch (e) { showToast(e.message, 'error'); }
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
    await withLoad(async () => {
      try {
        const session = await api.undoBid(currentAuction._id);
        setCurrentAuction(session);
        await refreshTeams(evId ? { auctionEvent: evId } : {});
        showToast('↩ Last bid undone');
      } catch (e) { showToast(e.message, 'error'); }
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

  return (
    <div>
      <div className="page-header">
        <div><h1>🏏 Live Auction</h1><p>{activeEvent ? activeEvent.name : 'No auction selected'}</p></div>
        {!activeEvent && <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--red)' }}>⚠️ Select an auction from the Auctions page first</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Main Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {currentAuction ? (
            <div className="auction-stage">
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Status badge */}
                <div style={{ marginBottom: 14 }}>
                  <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: `${roleColor}22`, color: roleColor, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {currentAuction.status === 'Paused' ? '⏸ Paused' : '🔴 Live'} · {currentAuction.player?.role}
                  </span>
                </div>

                {/* Player card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
                  {currentAuction.player?.imageUrl ? (
                    <img src={currentAuction.player.imageUrl} alt={currentAuction.player.name}
                      style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${roleColor}`, boxShadow: `0 0 20px ${roleColor}44` }} />
                  ) : (
                    <div style={{ width: 90, height: 90, borderRadius: '50%', background: `${roleColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: `3px solid ${roleColor}` }}>
                      {currentAuction.player?.name?.split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                  )}
                  <div style={{ textAlign: 'left' }}>
                    <div className="auction-player-name" style={{ fontSize: '1.9rem', textAlign: 'left' }}>{currentAuction.player?.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
                      {currentAuction.player?.battingStyle} · Age {currentAuction.player?.age} · {currentAuction.player?.nationality}
                    </div>
                    {currentAuction.player?.stats && (
                      <div style={{ display: 'flex', gap: 14, marginTop: 6, color: 'var(--text2)', fontSize: '0.82rem' }}>
                        <span>🏏 {currentAuction.player.stats.runs}R</span>
                        <span>📊 Avg {currentAuction.player.stats.average}</span>
                        {currentAuction.player.stats.wickets > 0 && <span>🎯 {currentAuction.player.stats.wickets}W</span>}
                        <span>🏟 {currentAuction.player.stats.matches}M</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current bid */}
                <div style={{ padding: '18px 24px', background: 'rgba(0,0,0,0.35)', borderRadius: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Current Bid</div>
                  <div className={`current-bid-display ${currentAuction.currentBidTeam ? 'has-bid' : ''}`}>
                    {formatCurrency(currentAuction.currentBid)}
                  </div>
                  {currentAuction.currentBidTeamName ? (
                    <div style={{ color: 'var(--accent2)', marginTop: 4, fontWeight: 600 }}>
                      {currentAuction.currentBidTeam?.logo
                        ? <img src={currentAuction.currentBidTeam.logo} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', marginRight: 6, verticalAlign: 'middle' }} />
                        : '🛡️ '}
                      {currentAuction.currentBidTeamName}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text3)', marginTop: 4 }}>Base Price · Awaiting bids</div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 6 }}>{currentAuction.bids.length} bid{currentAuction.bids.length !== 1 ? 's' : ''} placed</div>
                </div>

                {/* Team selector */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 8 }}>Select Bidding Team</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                    {teams.map(t => (
                      <button key={t._id} className={`bid-btn ${selectedTeam === t._id ? 'selected' : ''}`}
                        disabled={currentAuction.status === 'Paused'}
                        onClick={() => setSelectedTeam(selectedTeam === t._id ? '' : t._id)}>
                        {t.logo
                          ? <img src={t.logo} alt={t.name} style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover', marginBottom: 3, display: 'block', margin: '0 auto 3px' }} />
                          : <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, margin: '0 auto 3px' }} />}
                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{t.shortName}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{formatCurrency(t.remainingBudget)}</div>
                      </button>
                    ))}
                  </div>
                  {selectedTeamData && (
                    <div style={{ marginTop: 8, padding: '6px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--accent)' }}>
                      ✅ {selectedTeamData.name} · {formatCurrency(selectedTeamData.remainingBudget)} remaining
                    </div>
                  )}
                </div>

                {/* Quick bid buttons */}
                {currentAuction.status !== 'Paused' && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 8 }}>Quick Bid</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 10 }}>
                      {increments.map(inc => (
                        <button key={inc} className="btn btn-secondary" disabled={!selectedTeam || loading}
                          onClick={() => handleBid(nextBase + inc)}
                          style={{ flexDirection: 'column', gap: 1, padding: '10px 6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700 }}>+{formatCurrency(inc)}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{formatCurrency(nextBase + inc)}</span>
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="number" className="form-control" placeholder={`Custom amount (min ${formatCurrency(nextBase + 1)})`}
                        value={customBid} onChange={e => setCustomBid(e.target.value)} style={{ flex: 1 }} />
                      <button className="btn btn-primary" disabled={!selectedTeam || !customBid || loading}
                        onClick={() => { handleBid(Number(customBid)); setCustomBid(''); }}>Bid</button>
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button className="btn btn-success" style={{ padding: '12px 28px', fontSize: '1rem' }}
                    disabled={!currentAuction.currentBidTeam || loading} onClick={handleSold}>
                    🔨 SOLD
                  </button>
                  <button className="btn btn-danger" style={{ padding: '12px 22px' }} disabled={loading} onClick={handleUnsold}>
                    ❌ UNSOLD
                  </button>
                  <button className="btn btn-secondary" disabled={loading} onClick={handlePause}>
                    {currentAuction.status === 'Paused' ? '▶ Resume' : '⏸ Pause'}
                  </button>
                  <button className="btn btn-secondary" disabled={loading || currentAuction.bids.length === 0} onClick={handleUndo}>
                    ↩ Undo Bid
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="auction-stage" style={{ padding: 60 }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>🏏</div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--text2)', marginBottom: 8 }}>No Active Auction</h2>
              <p style={{ color: 'var(--text3)' }}>Select a player from the queue to start bidding</p>
            </div>
          )}

          {/* Recent bids */}
          {currentAuction && currentAuction.bids.length > 0 && (
            <div className="card">
              <div className="card-header"><h2>Bid History</h2><span style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>{currentAuction.bids.length} bids</span></div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {[...currentAuction.bids].reverse().map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <span style={{ color: i === 0 ? 'var(--green)' : 'var(--text2)', fontWeight: i === 0 ? 700 : 400 }}>
                      {i === 0 ? '🏆 ' : ''}{b.teamName}
                    </span>
                    <span style={{ fontWeight: 600, color: i === 0 ? 'var(--green)' : 'var(--text)' }}>{formatCurrency(b.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Player queue sidebar */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 20 }}>
            <div className="card-header">
              <h2>Player Queue</h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>{availablePlayers.length} left</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <input className="form-control" placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {filteredAvailable.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 0' }}>
                <div className="icon" style={{ fontSize: '2rem' }}>🎉</div>
                <p style={{ fontSize: '0.85rem' }}>All players auctioned!</p>
              </div>
            ) : (
              <div style={{ maxHeight: 560, overflowY: 'auto', paddingRight: 2 }}>
                {filteredAvailable.map(p => {
                  const roleColor = ROLE_COLORS[p.role] || '#666';
                  const isActive = currentAuction?.player?._id === p._id;
                  return (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, marginBottom: 5, background: isActive ? 'rgba(245,158,11,0.1)' : 'var(--bg2)', border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${roleColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: roleColor, flexShrink: 0 }}>
                            {p.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                          </div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{p.role} · {formatCurrency(p.basePrice)}</div>
                      </div>
                      {isActive ? (
                        <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: '#000', padding: '2px 7px', borderRadius: 10, fontWeight: 800, flexShrink: 0 }}>LIVE</span>
                      ) : (
                        <button className="btn btn-primary btn-sm" disabled={!!currentAuction || loading}
                          onClick={() => handleStart(p._id)} style={{ flexShrink: 0 }}>
                          ▶
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
