import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';

const EMPTY = { name: '', shortName: '', owner: '', city: '', color: '#3B82F6', budget: 8000000, maxPlayers: 15 };
const COLORS = ['#1E40AF','#DC2626','#D97706','#7C3AED','#065F46','#BE185D','#0E7490','#92400E','#1D4ED8','#B45309'];

export default function TeamModal({ team, defaultBudget, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    setForm(team ? { ...EMPTY, ...team } : { ...EMPTY, budget: defaultBudget || 8000000 });
    setLogoFile(null);
  }, [team, defaultBudget]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">{team ? '✏️ Edit Team' : '➕ Add Team'}</h2>

        <div className="form-group">
          <label>Team Logo</label>
          <ImageUpload currentUrl={team?.logo} label="Upload team logo" onFile={setLogoFile} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Team Name *</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Mumbai Warriors" />
          </div>
          <div className="form-group">
            <label>Short Code * (4 chars)</label>
            <input className="form-control" value={form.shortName} onChange={e => set('shortName', e.target.value.toUpperCase().slice(0,4))} placeholder="e.g. MUW" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Owner Name *</label>
            <input className="form-control" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Owner name" />
          </div>
          <div className="form-group">
            <label>City</label>
            <input className="form-control" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Purse / Budget (₹) *</label>
            <input type="number" className="form-control" value={form.budget} onChange={e => set('budget', Number(e.target.value))} min="500000" step="500000" />
          </div>
          <div className="form-group">
            <label>Max Players</label>
            <input type="number" className="form-control" value={form.maxPlayers} onChange={e => set('maxPlayers', Number(e.target.value))} min="11" max="25" />
          </div>
        </div>

        <div className="form-group">
          <label>Team Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => set('color', c)}
                style={{ width: 30, height: 30, background: c, borderRadius: 8, cursor: 'pointer', border: form.color === c ? '3px solid white' : '2px solid transparent', transition: 'all 0.15s', boxShadow: form.color === c ? `0 0 10px ${c}` : 'none' }} />
            ))}
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: 30, height: 30, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} title="Custom color" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form, logoFile)}>
            {team ? 'Update Team' : 'Add Team'}
          </button>
        </div>
      </div>
    </div>
  );
}
