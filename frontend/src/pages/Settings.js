import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';

export default function Settings() {
  const { admin, showToast } = useApp();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('account');

  const setPw = (k, v) => setPwForm(f => ({ ...f, [k]: v }));

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return showToast('Fill in all fields', 'error');
    if (pwForm.newPassword !== pwForm.confirmPassword) return showToast('New passwords do not match', 'error');
    if (pwForm.newPassword.length < 6) return showToast('Password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      await api.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showToast('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>⚙️ Settings</h1><p>Manage your account and system configuration</p></div>
      </div>

      <div className="tabs">
        {[['account', '👤 Account'], ['cloudinary', '☁️ Cloudinary'], ['about', 'ℹ️ About']].map(([id, label]) => (
          <div key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</div>
        ))}
      </div>

      {tab === 'account' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header"><h2>Admin Profile</h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0 20px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'Rajdhani' }}>
                {admin?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{admin?.name || 'Admin'}</div>
                <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>@{admin?.username}</div>
                <div style={{ color: 'var(--text3)', fontSize: '0.75rem', marginTop: 4 }}>Administrator</div>
              </div>
            </div>
            <div style={{ padding: '14px', background: 'var(--bg2)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text3)' }}>
              <div>Role: <strong style={{ color: 'var(--text2)' }}>Super Admin</strong></div>
              <div style={{ marginTop: 4 }}>Access: <strong style={{ color: 'var(--text2)' }}>Full</strong></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2>Change Password</h2></div>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" className="form-control" value={pwForm.currentPassword}
                onChange={e => setPw('currentPassword', e.target.value)} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" className="form-control" value={pwForm.newPassword}
                onChange={e => setPw('newPassword', e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" className="form-control" value={pwForm.confirmPassword}
                onChange={e => setPw('confirmPassword', e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
              {saving ? '⏳ Saving...' : '🔐 Update Password'}
            </button>
          </div>
        </div>
      )}

      {tab === 'cloudinary' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header"><h2>☁️ Cloudinary Setup</h2></div>
            <p style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 16 }}>
              Cloudinary is used to store player photos and team logos. You need to add these credentials to your <code style={{ background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, fontSize: '0.82rem' }}>server/.env</code> file.
            </p>
            <ol style={{ color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 2, paddingLeft: 20 }}>
              <li>Go to <strong>cloudinary.com</strong> and create a free account</li>
              <li>From your dashboard, copy your <strong>Cloud Name</strong>, <strong>API Key</strong>, and <strong>API Secret</strong></li>
              <li>Add them to <code style={{ background: 'var(--bg2)', padding: '2px 5px', borderRadius: 4 }}>server/.env</code></li>
              <li>Restart the server</li>
            </ol>
            <div style={{ marginTop: 16, padding: 14, background: 'var(--bg2)', borderRadius: 10, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--green)', lineHeight: 1.8 }}>
              CLOUDINARY_CLOUD_NAME=your_cloud_name<br/>
              CLOUDINARY_API_KEY=your_api_key<br/>
              CLOUDINARY_API_SECRET=your_api_secret
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--accent)' }}>
              ⚠️ Without Cloudinary configured, image uploads will fail. Players and teams can still be created without photos.
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2>Upload Folders</h2></div>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: 16 }}>
              Images are automatically organized in your Cloudinary account under:
            </p>
            {[
              { folder: 'cricket-auction/players', desc: 'Player profile photos', transform: '400×400, face-crop' },
              { folder: 'cricket-auction/teams', desc: 'Team logos', transform: '300×300, fill' },
              { folder: 'cricket-auction/events', desc: 'Auction event logos', transform: '400×400, fill' },
            ].map(f => (
              <div key={f.folder} style={{ padding: '12px 14px', background: 'var(--bg2)', borderRadius: 8, marginBottom: 10 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent2)', marginBottom: 4 }}>{f.folder}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{f.desc}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>Auto-transform: {f.transform}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header"><h2>ℹ️ About CricAuction</h2></div>
          <div style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.8 }}>
            <p style={{ marginBottom: 12 }}>A full-featured cricket player auction system for local tournaments.</p>
            {[
              ['Version', '2.0.0'],
              ['Frontend', 'React 18 (Plain JS)'],
              ['Backend', 'Node.js + Express'],
              ['Database', 'MongoDB + Mongoose'],
              ['Image Storage', 'Cloudinary'],
              ['Auth', 'JWT (7-day tokens)'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text3)' }}>{k}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 20, padding: 14, background: 'var(--bg2)', borderRadius: 8, fontSize: '0.8rem' }}>
              <strong style={{ color: 'var(--accent)' }}>Features:</strong>
              <ul style={{ marginTop: 8, paddingLeft: 18, color: 'var(--text3)', lineHeight: 2 }}>
                <li>Multiple auction events</li>
                <li>Player & team photo uploads via Cloudinary</li>
                <li>Live auction with bid increments, undo, pause</li>
                <li>Public viewer link (read-only, auto-refreshes)</li>
                <li>Admin dashboard with JWT auth</li>
                <li>Auction history & bid breakdown</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
