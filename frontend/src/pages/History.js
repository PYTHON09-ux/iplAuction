import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, formatCurrency } from '../utils/api';

export default function History() {
  const { activeEvent, showToast } = useApp();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = activeEvent ? { auctionEvent: activeEvent._id } : {};
    setLoading(true);
    api.getAuctionHistory(params)
      .then(setHistory)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [activeEvent]);

  const sold = history.filter(h => h.status === 'Sold');
  const unsold = history.filter(h => h.status === 'Unsold');
  const totalSpent = sold.reduce((s, h) => s + h.currentBid, 0);
  const avgSale = sold.length ? Math.round(totalSpent / sold.length) : 0;
  const highestBid = sold.length ? Math.max(...sold.map(h => h.currentBid)) : 0;

  return (
    <div>
      <div className="page-header">
        <div><h1>📋 Auction History</h1><p>{activeEvent ? activeEvent.name : 'All auctions'} · {history.length} results</p></div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        {[
          { label: 'Total Auctions', value: history.length, color: 'var(--text)' },
          { label: 'Sold', value: sold.length, color: 'var(--green)' },
          { label: 'Unsold', value: unsold.length, color: 'var(--red)' },
          { label: 'Total Spent', value: formatCurrency(totalSpent), color: 'var(--gold)', small: true },
          { label: 'Avg Sale', value: formatCurrency(avgSale), color: 'var(--accent2)', small: true },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value" style={{ color: s.color, fontSize: s.small ? '1.3rem' : undefined }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Main table */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><h2>All Results</h2></div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>Loading...</div>
          ) : history.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No auction history yet</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Role</th>
                    <th>Result</th>
                    <th>Team</th>
                    <th>Base Price</th>
                    <th>Final Price</th>
                    <th>Bids</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h._id}>
                      <td style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {h.player?.imageUrl
                            ? <img src={h.player.imageUrl} alt={h.player.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                            : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                                {h.player?.name?.split(' ').map(w => w[0]).join('').slice(0,2)}
                              </div>
                          }
                          <span style={{ fontWeight: 600 }}>{h.player?.name}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{h.player?.role}</span></td>
                      <td><span className={`badge badge-${h.status.toLowerCase()}`}>{h.status}</span></td>
                      <td>
                        {h.status === 'Sold' && h.currentBidTeam ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {h.currentBidTeam.logo
                              ? <img src={h.currentBidTeam.logo} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }} />
                              : <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.currentBidTeam.color }} />}
                            <span style={{ fontSize: '0.85rem' }}>{h.currentBidTeam.shortName}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{formatCurrency(h.basePrice)}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: h.status === 'Sold' ? 'var(--green)' : 'var(--text3)' }}>
                          {h.status === 'Sold' ? formatCurrency(h.currentBid) : '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>{h.bids.length}</td>
                      <td style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>
                        {h.endTime ? new Date(h.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bid breakdown cards */}
        {sold.length > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header"><h2>Bid Breakdown</h2><span style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>Top {Math.min(12, sold.length)} sales</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap: 12 }}>
              {sold.slice(0, 12).map(h => (
                <div key={h._id} style={{ background: 'var(--bg2)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    {h.player?.imageUrl
                      ? <img src={h.player.imageUrl} alt={h.player.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                          {h.player?.name?.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </div>
                    }
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{h.player?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{h.player?.role} · {h.bids.length} bids</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>
                      {formatCurrency(h.currentBid)}
                    </div>
                  </div>
                  <div style={{ maxHeight: 90, overflowY: 'auto' }}>
                    {[...h.bids].reverse().map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '3px 0', borderBottom: '1px solid rgba(30,45,69,0.4)', color: i === 0 ? 'var(--green)' : 'var(--text3)' }}>
                        <span>{i === 0 ? '🏆 ' : ''}{b.teamName}</span>
                        <span style={{ fontWeight: i === 0 ? 700 : 400 }}>{formatCurrency(b.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
