import { useApp } from '../context/AppContext';

export default function Sidebar({ page, setPage }) {
  const { admin, logout, activeEvent } = useApp();

  const items = [
    { section: 'Main' },
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'events', icon: '🏆', label: 'Auctions' },
    { section: 'Manage' },
    { id: 'auction', icon: '🏏', label: 'Live Auction' },
    { id: 'players', icon: '👤', label: 'Players' },
    { id: 'teams', icon: '🛡️', label: 'Teams' },
    { id: 'history', icon: '📋', label: 'History' },
    { section: 'System' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>🏏 CricAuction</h1>
        <span>Admin Dashboard</span>
      </div>

      {activeEvent && (
        <div className="sidebar-event">
          <div className="ev-label">Active Auction</div>
          <div className="ev-name">{activeEvent.name}</div>
        </div>
      )}

      <nav className="sidebar-nav">
        {items.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          )
        )}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin?.name || 'Admin'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{admin?.username}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
