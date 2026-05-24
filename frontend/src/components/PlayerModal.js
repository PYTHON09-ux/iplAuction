import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';

const EMPTY = { name: '', role: 'Batsman', basePrice: 100000, battingStyle: 'Right-Hand', bowlingStyle: '', nationality: 'Indian', age: 22, jerseyNumber: '', stats: { matches: 0, runs: 0, wickets: 0, average: 0 } };

export default function PlayerModal({ player, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setForm(player ? { ...EMPTY, ...player, stats: { ...EMPTY.stats, ...player.stats } } : EMPTY);
    setImageFile(null);
  }, [player]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setStat = (k, v) => setForm(f => ({ ...f, stats: { ...f.stats, [k]: Number(v) } }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">{player ? '✏️ Edit Player' : '➕ Add Player'}</h2>

        <div className="form-group">
          <label>Player Photo</label>
          <ImageUpload currentUrl={player?.imageUrl} label="Upload player photo" onFile={setImageFile} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Player name" />
          </div>
          <div className="form-group">
            <label>Role *</label>
            <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
              {['Batsman','Bowler','All-Rounder','Wicket-Keeper'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Base Price (₹) *</label>
            <input type="number" className="form-control" value={form.basePrice} onChange={e => set('basePrice', Number(e.target.value))} min="10000" step="10000" />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" className="form-control" value={form.age} onChange={e => set('age', Number(e.target.value))} min="14" max="60" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Batting Style</label>
            <select className="form-control" value={form.battingStyle} onChange={e => set('battingStyle', e.target.value)}>
              <option>Right-Hand</option><option>Left-Hand</option>
            </select>
          </div>
          <div className="form-group">
            <label>Bowling Style</label>
            <input className="form-control" value={form.bowlingStyle} onChange={e => set('bowlingStyle', e.target.value)} placeholder="e.g. Right-arm Fast" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nationality</label>
            <input className="form-control" value={form.nationality} onChange={e => set('nationality', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Jersey #</label>
            <input type="number" className="form-control" value={form.jerseyNumber || ''} onChange={e => set('jerseyNumber', e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Career Stats</p>
        <div className="form-row">
          <div className="form-group">
            <label>Matches</label>
            <input type="number" className="form-control" value={form.stats.matches} onChange={e => setStat('matches', e.target.value)} min="0" />
          </div>
          <div className="form-group">
            <label>Runs</label>
            <input type="number" className="form-control" value={form.stats.runs} onChange={e => setStat('runs', e.target.value)} min="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Wickets</label>
            <input type="number" className="form-control" value={form.stats.wickets} onChange={e => setStat('wickets', e.target.value)} min="0" />
          </div>
          <div className="form-group">
            <label>Average</label>
            <input type="number" className="form-control" value={form.stats.average} onChange={e => setStat('average', Number(e.target.value))} min="0" step="0.1" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form, imageFile)}>
            {player ? 'Update Player' : 'Add Player'}
          </button>
        </div>
      </div>
    </div>
  );
}
