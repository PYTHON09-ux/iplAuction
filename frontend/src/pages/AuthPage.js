import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';

export default function AuthPage() {
  const { login, showToast } = useApp();
  const [mode, setMode] = useState('login'); // 'login' | 'setup'
  const [form, setForm] = useState({ username: '', password: '', name: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.needsSetup()
      .then(r => { if (r.needsSetup) setMode('setup'); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.username || !form.password) return showToast('Username and password required', 'error');
    if (mode === 'setup' && form.password !== form.confirmPassword) return showToast('Passwords do not match', 'error');
    setLoading(true);
    try {
      if (mode === 'setup') {
        const r = await api.setup({ username: form.username, password: form.password, name: form.name });
        localStorage.setItem('ca_token', r.token);
        window.location.reload();
      } else {
        await login(form.username, form.password);
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="auth-page">
        <div style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🏏 CricAuction</h1>
          <p>{mode === 'setup' ? 'Create your admin account to get started' : 'Admin Dashboard Login'}</p>
        </div>

        {mode === 'setup' && (
          <div className="form-group">
            <label>Your Name</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Raj Kumar" />
          </div>
        )}

        <div className="form-group">
          <label>Username</label>
          <input className="form-control" value={form.username} onChange={e => set('username', e.target.value)} placeholder="admin" autoFocus />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-control" value={form.password} onChange={e => set('password', e.target.value)}
            placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {mode === 'setup' && (
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" className="form-control" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
              placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8, fontSize: '1rem' }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Please wait...' : mode === 'setup' ? '🚀 Create Admin Account' : '🔐 Login'}
        </button>

        {mode === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: 'var(--text3)' }}>
            No account?{' '}
            <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setMode('setup')}>
              Create admin account
            </span>
          </p>
        )}

        {mode === 'setup' && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: 'var(--text3)' }}>
            Already have an account?{' '}
            <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setMode('login')}>
              Login
            </span>
          </p>
        )}

        <div style={{ marginTop: 24, padding: 14, background: 'var(--bg2)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--text3)' }}>
          <strong style={{ color: 'var(--text2)' }}>Default credentials:</strong> admin / admin123
          <br />Change these after first login in Settings.
        </div>
      </div>
    </div>
  );
}
