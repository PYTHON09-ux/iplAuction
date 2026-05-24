import { useState, useEffect } from 'react';
import './index.css';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Players from './pages/Players';
import Teams from './pages/Teams';
import Auction from './pages/Auction';
import History from './pages/History';
import Settings from './pages/Settings';
import ViewerPage from './pages/ViewerPage';

// Detect if we're on a viewer route: /viewer/TOKEN
function getViewerToken() {
  const path = window.location.pathname;
  const match = path.match(/^\/viewer\/([A-Z0-9]+)$/i);
  return match ? match[1].toUpperCase() : null;
}

function AdminApp() {
  const { admin, authLoading } = useApp();
  const [page, setPage] = useState('dashboard');

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏏</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!admin) return <AuthPage />;

  const pages = {
    dashboard: <Dashboard setPage={setPage} />,
    events: <Events setPage={setPage} />,
    auction: <Auction />,
    players: <Players />,
    teams: <Teams />,
    history: <History />,
    settings: <Settings />,
  };

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} />
      <main className="main-content">
        {pages[page] || pages.dashboard}
      </main>
      <Toast />
    </div>
  );
}

export default function App() {
  const viewerToken = getViewerToken();

  // Viewer mode: no auth, no sidebar
  if (viewerToken) {
    return (
      <AppProvider>
        <ViewerPage token={viewerToken} />
        <Toast />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <AdminApp />
    </AppProvider>
  );
}
