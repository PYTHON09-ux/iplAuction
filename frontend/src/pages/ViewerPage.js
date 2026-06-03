import { useEffect, useRef } from 'react';

export default function CricketTransitionCanvas({ history }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 680, H = 300;
    canvas.width = W; canvas.height = H;

    const TAU = Math.PI * 2;
    let t = 0, scene = 0, sceneT = 0;
    const SCENE_DUR = [210, 210, 210];
    const particles = [];

    const stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.72,
      r: 0.4 + Math.random() * 1.1,
      a: 0.2 + Math.random() * 0.5,
      tw: 2 + Math.random() * 3
    }));

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function lerp(a, b, f) { return a + (b - a) * f; }
    function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

    function spawnParticles(x, y, count, colors, spread = 1) {
      for (let i = 0; i < count; i++) {
        const ang = rnd(0, TAU);
        const spd = rnd(1.5, 6) * spread;
        particles.push({
          x, y,
          vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - rnd(0, 3),
          life: 1, decay: rnd(0.012, 0.025),
          r: rnd(2, 5), color: colors[Math.floor(Math.random() * colors.length)],
          rot: rnd(0, TAU), rotV: rnd(-0.2, 0.2), sq: Math.random() > 0.5
        });
      }
    }

    function drawPitch() {
      ctx.fillStyle = '#06090f';
      ctx.fillRect(0, 0, W, H);
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t / s.tw);
        ctx.globalAlpha = s.a * twinkle;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0c1f10';
      ctx.fillRect(0, H * 0.64, W, H * 0.36);
      ctx.strokeStyle = '#1a3a20'; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(0, H * 0.64 + i * 16); ctx.lineTo(W, H * 0.64 + i * 16); ctx.stroke();
      }
      ctx.strokeStyle = '#ffffff18'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(W / 2, H * 0.74, 150, 20, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(W / 2, H * 0.74, 75, 11, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ffffffbb'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(W / 2 - 6, H * 0.64); ctx.lineTo(W / 2 - 6, H * 0.59); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2 + 6, H * 0.64); ctx.lineTo(W / 2 + 6, H * 0.59); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2, H * 0.64); ctx.lineTo(W / 2, H * 0.58); ctx.stroke();
      ctx.strokeStyle = '#ffffff77'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(W / 2 - 10, H * 0.59); ctx.lineTo(W / 2 + 10, H * 0.59); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2 - 10, H * 0.58); ctx.lineTo(W / 2 + 10, H * 0.58); ctx.stroke();
    }

    function stickHead(color, hx = 0, hy = -70) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(hx, hy, 9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffffcc';
      ctx.beginPath(); ctx.arc(hx - 3, hy - 3, 2.5, 0, TAU); ctx.fill();
    }

    function drawStickFigure(x, y, scale, color, poseFunc) {
      ctx.save();
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(x, y + 2, 18 * scale, 5 * scale, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.translate(x, y); ctx.scale(scale, scale);
      poseFunc(color);
      ctx.restore();
    }

    function poseHitStart(color) {
      ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      stickHead(color, 0, -70);
      ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -55); ctx.lineTo(-22, -40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-22, -40); ctx.lineTo(-32, -22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -55); ctx.lineTo(18, -43); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, -43); ctx.lineTo(28, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(-14, 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(14, 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, 5); ctx.lineTo(-18, 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, 5); ctx.lineTo(18, 30); ctx.stroke();
      ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(28, -30); ctx.lineTo(28, 20); ctx.stroke();
    }

    function poseHitEnd(color) {
      ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      stickHead(color, 4, -68);
      ctx.beginPath(); ctx.moveTo(4, -58); ctx.lineTo(2, -22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -52); ctx.lineTo(30, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30, -30); ctx.lineTo(40, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -52); ctx.lineTo(-28, -35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-28, -35); ctx.lineTo(-38, -12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, -22); ctx.lineTo(-16, 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, -22); ctx.lineTo(18, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-16, 5); ctx.lineTo(-22, 32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, 8); ctx.lineTo(14, 32); ctx.stroke();
      ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-38, -12); ctx.lineTo(-20, 28); ctx.stroke();
    }

    function poseBowlerRunup(color, phase) {
      ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const legSwing = Math.sin(phase) * 18;
      const armSwing = Math.sin(phase + Math.PI) * 22;
      stickHead(color, 0, -70);
      ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(22 + armSwing, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22 + armSwing, -30); ctx.lineTo(30 + armSwing, -10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(-22, -35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-22, -35); ctx.lineTo(-28, -14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(12 + legSwing, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12 + legSwing, 8); ctx.lineTo(10 + legSwing, 32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-12 - legSwing, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12 - legSwing, 8); ctx.lineTo(-8 - legSwing, 32); ctx.stroke();
      ctx.fillStyle = '#e8312a';
      ctx.beginPath(); ctx.arc(30 + armSwing, -10, 5, 0, TAU); ctx.fill();
    }

    function poseBowlerRelease(color) {
      ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      stickHead(color, 3, -68);
      ctx.beginPath(); ctx.moveTo(3, -58); ctx.lineTo(0, -20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -52); ctx.lineTo(38, -28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(38, -28); ctx.lineTo(42, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -52); ctx.lineTo(-24, -40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-24, -40); ctx.lineTo(-30, -22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-18, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(22, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-18, 10); ctx.lineTo(-25, 32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, 8); ctx.lineTo(20, 32); ctx.stroke();
      ctx.fillStyle = '#e8312a';
      ctx.beginPath(); ctx.arc(42, -6, 5, 0, TAU); ctx.fill();
    }

    function poseCatch(color, armHeight) {
      ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      stickHead(color, 0, -70);
      ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(22, -50 + armHeight); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, -50 + armHeight); ctx.lineTo(28, -32 + armHeight); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(-22, -50 + armHeight); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-22, -50 + armHeight); ctx.lineTo(-28, -32 + armHeight); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-14, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, 10); ctx.lineTo(-16, 32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(14, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, 10); ctx.lineTo(16, 32); ctx.stroke();
    }

    function drawBall(bx, by, r = 6, glow = false) {
      if (glow) {
        ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#e8312a';
        ctx.beginPath(); ctx.arc(bx, by, r * 3.5, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(bx, by, r * 2, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#e8312a';
      ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(bx, by, r, 0.3, 1.5); ctx.stroke();
    }

    function drawTrail(bx, by, vx, vy) {
      for (let i = 1; i <= 8; i++) {
        ctx.globalAlpha = 0.06 * (i / 8);
        ctx.fillStyle = '#e8312a';
        ctx.beginPath(); ctx.arc(bx - vx * (8 - i) * 0.4, by - vy * (8 - i) * 0.4, 5 * (i / 8), 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawSceneHit(st) {
      const f = st / SCENE_DUR[0];
      const phase1 = Math.min(1, f * 2.5);
      const phase2 = Math.max(0, (f - 0.35) * 1.6);
      const batSwingDone = phase1 > 0.7;
      const batX = W * 0.38, batY = H * 0.67;
      drawStickFigure(batX, batY, 1.15, '#FFD700', batSwingDone ? poseHitEnd : poseHitStart);
      if (batSwingDone) {
        const bx = lerp(batX + 20, batX + 400, easeOut(Math.min(1, phase2 * 1.2)));
        const by = H * 0.57 - Math.sin(Math.min(1, phase2) * Math.PI) * H * 0.32 + phase2 * phase2 * H * 0.2;
        if (phase2 > 0.05) drawTrail(bx, by, 12, -4);
        drawBall(bx, by, 7, true);
        if (phase2 > 0.1 && phase2 < 0.55) {
          ctx.save(); ctx.globalAlpha = Math.max(0, 0.65 - phase2 * 1.1);
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.arc(batX + 20, H * 0.57, (phase2 - 0.1) / 0.45 * 80 + i * 14, 0, TAU); ctx.stroke();
          }
          ctx.restore();
        }
        if (phase2 > 0.15) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, (phase2 - 0.15) * 3);
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 28px Barlow Condensed,sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SIX!', batX + 180, H * 0.28 - phase2 * 15);
          ctx.restore();
        }
      }
    }

    function drawSceneBowl(st) {
      const f = st / SCENE_DUR[1];
      const runX = lerp(W * 0.72, W * 0.56, easeOut(Math.min(1, f * 1.6)));
      const bowlerY = H * 0.67;
      const isRelease = f > 0.62;
      if (!isRelease) {
        ctx.save(); ctx.translate(runX, bowlerY); ctx.scale(1.15, 1.15);
        poseBowlerRunup('#38d9f5', f * 14); ctx.restore();
      } else {
        drawStickFigure(runX, bowlerY, 1.15, '#38d9f5', poseBowlerRelease);
        const relF = (f - 0.62) / 0.38;
        const bx = lerp(runX - 20, W * 0.22, easeOut(Math.min(1, relF)));
        const by = lerp(H * 0.59, H * 0.62, Math.min(1, relF));
        if (relF > 0.05) drawTrail(bx, by, -14, 1);
        drawBall(bx, by, 6, true);
        if (relF > 0.4) drawStickFigure(W * 0.28, H * 0.67, 0.9, '#FFD700', poseHitStart);
      }
      ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = '#38d9f5'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(W * 0.72, H * 0.6); ctx.quadraticCurveTo(W * 0.52, H * 0.48, W * 0.22, H * 0.6); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }

    function drawSceneCatch(st) {
      const f = st / SCENE_DUR[2];
      const bRise = Math.min(1, f * 1.4);
      const bFall = Math.max(0, (f - 0.55) / 0.45);
      const bx = lerp(W * 0.2, W * 0.73, easeOut(bRise));
      const by = H * 0.55 - Math.sin(bRise * Math.PI) * H * 0.3 + bFall * bFall * H * 0.08;
      if (f > 0.05) drawTrail(bx, by, 8, -3);
      drawBall(bx, by, 7, true);
      const fielderX = W * 0.73, fielderY = H * 0.67;
      const armH = lerp(0, -40, easeOut(Math.min(1, f * 2.5)));
      ctx.save(); ctx.translate(fielderX, fielderY); ctx.scale(1.1, 1.1); poseCatch('#16d975', armH); ctx.restore();
      const caught = bFall > 0.7;
      if (caught) {
        drawBall(fielderX + 28 * 1.1, fielderY - 82 * 1.1, 7, false);
        const pf = (bFall - 0.7) / 0.3;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 0.7 - pf * 0.9); ctx.strokeStyle = '#16d975'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(fielderX + 30, fielderY - 90, pf * 55, 0, TAU); ctx.stroke();
        ctx.globalAlpha = Math.max(0, 0.5 - pf * 0.8); ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(fielderX + 30, fielderY - 90, pf * 35, 0, TAU); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.globalAlpha = Math.min(1, (bFall - 0.7) * 4);
        ctx.fillStyle = '#16d975'; ctx.font = 'bold 26px Barlow Condensed,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('CAUGHT!', fielderX, fielderY - 110); ctx.restore();
      }
      drawStickFigure(W * 0.22, H * 0.67, 0.85, '#FFD700', poseHitEnd);
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.97; p.life -= p.decay; p.rot += p.rotV;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.sq) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, TAU); ctx.fill(); }
        ctx.restore();
      }
    }

    const SCENE_COLORS = [
      ['#ffe066', '#FFD700', '#f5a623', '#ffffff', '#38d9f5'],
      ['#38d9f5', '#ffffff', '#e8312a', '#16d975', '#c084fc'],
      ['#16d975', '#ffe066', '#ffffff', '#38d9f5', '#e8312a'],
    ];

    function loop() {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.restore();
      drawPitch();
      if (scene === 0) drawSceneHit(sceneT);
      else if (scene === 1) drawSceneBowl(sceneT);
      else drawSceneCatch(sceneT);
      updateParticles();
      if (sceneT === 55 && scene === 0) spawnParticles(W * 0.38 + 50, H * 0.48, 80, SCENE_COLORS[0], 1.4);
      if (sceneT === 135 && scene === 1) spawnParticles(W * 0.54, H * 0.6, 40, SCENE_COLORS[1], 0.9);
      if (sceneT === 165 && scene === 2) spawnParticles(W * 0.73, H * 0.5, 90, SCENE_COLORS[2], 1.3);
      sceneT++;
      if (sceneT >= SCENE_DUR[scene] + 40) { sceneT = 0; scene = (scene + 1) % 3; }
      t++;
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const lastSold = history?.[0];
  const SCENE_NAMES = ['Batsman hits a six', 'Bowler in full flight', 'Fielder takes the catch'];

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', overflow: 'hidden', position: 'relative'
    }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', flex: 1, minHeight: 0 }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(6,9,15,0.96) 0%, rgba(6,9,15,0.7) 60%, transparent 100%)',
        padding: '14px 20px 16px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16,
        pointerEvents: 'none'
      }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed,sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
            Awaiting next player
          </div>
          <div style={{ fontFamily: 'Barlow Condensed,sans-serif', fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '.04em' }}>
            Auction in progress
          </div>
        </div>
        {lastSold && (
          <div style={{ textAlign: 'right', flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Last sold</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#eaf0ff' }}>{lastSold?.player?.name}</div>
            <div style={{ fontSize: 12, color: '#16d975', fontWeight: 700, marginTop: 2 }}>
              {lastSold?.currentBidTeam?.name || lastSold?.currentBidTeam?.shortName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}