import { useEffect, useState, useRef } from 'react';
import { api, formatCurrency, ROLE_COLORS } from '../utils/api';

/* ── confetti helper ── */
function spawnConfetti(container) {
  const colors = ['#ffe066','#16d975','#38d9f5','#f5a623','#f04a4a','#c084fc','#fff'];
  for (let i = 0; i < 120; i++) {
    const el = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size  = 5 + Math.random() * 10;
    const left  = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const dur   = 1.8 + Math.random() * 1.4;
    const rot   = Math.random() * 720 - 360;
    const isRect = Math.random() > 0.5;
    el.style.cssText = `position:absolute;top:-20px;left:${left}%;width:${isRect?size:size*.45}px;height:${isRect?size*.4:size}px;background:${color};border-radius:${isRect?2:50}%;animation:confettiFall ${dur}s ${delay}s ease-in forwards;transform:rotate(${rot}deg);pointer-events:none;z-index:10;`;
    container.appendChild(el);
    setTimeout(() => el.remove(), (dur + delay) * 1000 + 300);
  }
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800&family=Barlow:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#06090f;--bg2:#0c1220;--bg3:#111a2e;--bg4:#172038;
    --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.14);
    --text:#eaf0ff;--text2:#7a90b8;--text3:#3a4f6e;
    --green:#16d975;--red:#f04a4a;--amber:#f5a623;--gold:#ffe066;--cyan:#38d9f5;
    --disp:'Barlow Condensed',sans-serif;--body:'Barlow',sans-serif;
    --radius:16px;--radius-sm:10px;
  }
  body{background:var(--bg);color:var(--text);font-family:var(--body);-webkit-font-smoothing:antialiased}
  .vp{height:100vh;display:flex;flex-direction:column;overflow:hidden}

  /* ── ANIMATIONS ── */
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.72)}}
  @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}80%{opacity:1}100%{transform:translateY(700px) rotate(720deg);opacity:0}}
  @keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{transform:scale(.82);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes bidFlash{0%{background:rgba(22,217,117,0.22)}100%{background:transparent}}
  @keyframes slideUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rotateIn{from{opacity:0;transform:rotate(-6deg) scale(.9)}to{opacity:1;transform:rotate(0deg) scale(1)}}
  @keyframes amountCount{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes lineSweep{0%{width:0}100%{width:100%}}
  @keyframes idleDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes badgePop{0%{transform:scale(0.7);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}

  /* HEADER */
  .vp-header{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:var(--bg2);border-bottom:1px solid var(--border);gap:12px;flex-shrink:0}
  .vp-header-left{display:flex;align-items:center;gap:12px}
  .vp-event-logo{width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid var(--border2)}
  .vp-event-logo-fb{width:36px;height:36px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.1rem}
  .vp-event-name{font-family:var(--disp);font-size:1.3rem;letter-spacing:.06em;font-weight:700;line-height:1}
  .vp-event-season{font-size:11px;color:var(--text3);letter-spacing:.06em;margin-top:2px}
  .vp-live-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(240,74,74,0.15);border:1px solid rgba(240,74,74,0.3);border-radius:100px;font-size:11px;font-weight:700;color:#f87171;letter-spacing:.1em;text-transform:uppercase}
  .vp-live-dot{width:7px;height:7px;border-radius:50%;background:#f04a4a;animation:pulse 1.1s ease-in-out infinite}
  .vp-updated{font-size:11px;color:var(--text3)}

  /* STAT STRIP */
  .vp-strip{display:flex;background:var(--bg);border-bottom:1px solid var(--border);flex-shrink:0}
  .vp-strip-item{flex:1;padding:8px 6px;text-align:center;border-right:1px solid var(--border)}
  .vp-strip-item:last-child{border-right:none}
  .vp-strip-val{font-family:var(--disp);font-size:clamp(1.1rem,2.8vw,1.8rem);font-weight:800;line-height:1}
  .vp-strip-label{font-size:clamp(9px,1.3vw,11px);color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-top:2px}

  /* MAIN */
  .vp-main{flex:1;display:grid;grid-template-columns:1fr 310px;min-height:0}

  /* CENTER */
  .vp-center{display:flex;flex-direction:column;border-right:1px solid var(--border);overflow:hidden;position:relative}
  .vp-center.fullscreen{position:fixed;inset:0;z-index:8000;border-right:none;background:var(--bg)}

  /* Fullscreen button */
  .vp-fs-btn{
    position:absolute;top:12px;right:12px;z-index:100;
    display:flex;align-items:center;gap:6px;
    padding:6px 14px;
    background:rgba(6,9,15,0.7);border:1px solid var(--border2);
    border-radius:8px;cursor:pointer;
    font-size:12px;font-weight:600;color:var(--text2);
    backdrop-filter:blur(6px);
    transition:color .15s,border-color .15s;
    user-select:none;
  }
  .vp-fs-btn:hover{color:var(--text);border-color:rgba(255,255,255,0.3)}
  .vp-fs-btn svg{width:14px;height:14px;flex-shrink:0}

  /* Player card */
  .vp-player-card{flex:1;display:flex;flex-direction:column;min-height:0;overflow:hidden;animation:fadeIn .4s ease}

  /* IMAGE ZONE */
  .vp-img-zone{
    flex:1;position:relative;
    display:flex;align-items:center;justify-content:center;
    min-height:0;overflow:hidden;
    transition:background 0.6s ease;
  }
  .vp-img-zone img{
    max-width:100%;max-height:100%;width:100%;height:100%;
    object-fit:contain;object-position:center bottom;
    display:block;position:relative;z-index:1;
    animation:slideUp .5s cubic-bezier(.22,1,.36,1);
  }
  .vp-img-bg-blur{
    position:absolute;inset:0;background-size:cover;background-position:center;
    filter:blur(28px) saturate(0.3);opacity:0.22;z-index:0;transform:scale(1.1);
  }
  .vp-img-fallback-big{
    font-family:var(--disp);font-size:clamp(6rem,18vw,16rem);font-weight:900;
    opacity:.07;letter-spacing:.04em;z-index:1;position:relative;
    animation:rotateIn .5s ease;
  }

  /* Status overlay badge on image */
  .vp-img-status-badge{
    position:absolute;top:16px;left:16px;z-index:5;
    display:flex;align-items:center;gap:8px;
    padding:7px 16px;border-radius:100px;
    font-family:var(--disp);font-size:clamp(11px,1.4vw,14px);font-weight:700;
    letter-spacing:.1em;text-transform:uppercase;
    backdrop-filter:blur(8px);
    animation:badgePop .35s cubic-bezier(.34,1.56,.64,1);
  }
  .vp-img-status-badge.sold{background:rgba(22,217,117,0.18);border:1px solid rgba(22,217,117,0.4);color:#16d975}
  .vp-img-status-badge.unsold{background:rgba(240,74,74,0.15);border:1px solid rgba(240,74,74,0.3);color:#f04a4a}
  .vp-img-status-badge.live{background:rgba(240,74,74,0.15);border:1px solid rgba(240,74,74,0.3);color:#f87171}

  /* ── TRANSITION SCREEN (between players) ── */
  .vp-transition{
    flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:40px 24px;text-align:center;background:var(--bg2);
    animation:fadeIn .5s ease;
    position:relative;overflow:hidden;
  }
  .vp-transition-pitch{
    position:absolute;inset:0;opacity:0.04;
    background:
      radial-gradient(ellipse 60% 40% at 50% 60%, rgba(22,217,117,0.6) 0%, transparent 70%),
      repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(22,217,117,0.15) 28px, rgba(22,217,117,0.15) 29px),
      repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(22,217,117,0.08) 28px, rgba(22,217,117,0.08) 29px);
  }
  .vp-transition-icon{
    position:relative;z-index:1;
    width:72px;height:72px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    background:var(--bg3);border:1px solid var(--border2);
    margin:0 auto 20px;
    animation:idleDrift 3s ease-in-out infinite;
  }
  .vp-transition-icon svg{width:32px;height:32px;color:var(--text3)}
  .vp-transition-title{font-family:var(--disp);font-size:clamp(1.4rem,4vw,2.2rem);font-weight:900;color:var(--text3);letter-spacing:.05em;margin-bottom:6px;position:relative;z-index:1}
  .vp-transition-sub{font-size:13px;color:var(--text3);position:relative;z-index:1}
  .vp-transition-last{
    margin-top:24px;padding:14px 22px;
    background:var(--bg3);border:1px solid var(--border);
    border-radius:var(--radius);position:relative;z-index:1;
    animation:slideUp .4s .1s both ease;
  }
  .vp-transition-last-label{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}
  .vp-transition-last-name{font-weight:700;font-size:1rem;margin-bottom:3px}
  .vp-transition-last-price{color:var(--green);font-weight:700;font-size:.9rem}

  /* ── FULLSCREEN OVERLAY ── */
  .vp-fs-info-overlay{
    position:absolute;bottom:0;left:0;right:0;z-index:5;
    padding:clamp(16px,3vw,32px) clamp(18px,4vw,40px);
    background:linear-gradient(to top, rgba(6,9,15,1) 0%, rgba(6,9,15,0.92) 55%, transparent 100%);
    pointer-events:none;
    animation:slideUp .45s ease;
  }
  .vp-fs-role-tag{
    display:inline-block;padding:3px 14px;border-radius:100px;
    font-size:clamp(10px,1.3vw,13px);font-weight:700;letter-spacing:.1em;text-transform:uppercase;
    margin-bottom:8px;
  }
  .vp-fs-name{
    font-family:var(--disp);font-size:clamp(2.4rem,7vw,7rem);font-weight:900;
    color:#fff;line-height:.95;letter-spacing:.02em;margin-bottom:6px;
  }
  .vp-fs-sub{font-size:clamp(12px,1.6vw,18px);color:rgba(255,255,255,0.5);letter-spacing:.03em;margin-bottom:14px}
  .vp-fs-bottom-row{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}
  .vp-fs-status-block{}
  .vp-fs-status-label{font-size:clamp(9px,1vw,12px);color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}
  .vp-fs-status-amount{font-family:var(--disp);font-size:clamp(2rem,6vw,5.5rem);font-weight:900;line-height:1;animation:amountCount .35s ease}
  .vp-fs-status-team{display:flex;align-items:center;gap:10px;margin-top:8px}
  .vp-fs-team-logo{width:clamp(28px,4vw,44px);height:clamp(28px,4vw,44px);border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-weight:800;color:#fff;font-size:.85rem;flex-shrink:0}
  .vp-fs-team-logo img{width:100%;height:100%;object-fit:cover}
  .vp-fs-team-name{font-family:var(--disp);font-size:clamp(1rem,2.5vw,2rem);font-weight:800;line-height:1}
  .vp-fs-team-budget{font-size:clamp(10px,1.2vw,14px);color:var(--text3);margin-top:3px}
  .vp-fs-verdict-unsold{
    display:inline-flex;align-items:center;gap:8px;
    padding:8px 22px;border-radius:100px;
    background:rgba(240,74,74,0.1);border:1px solid rgba(240,74,74,0.25);
    font-size:clamp(12px,1.6vw,18px);font-weight:800;color:var(--red);
    letter-spacing:.12em;text-transform:uppercase;
  }
  .vp-fs-stats-row{display:flex;gap:clamp(6px,1.2vw,12px);flex-wrap:wrap}
  .vp-fs-stat{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:clamp(6px,1vw,10px) clamp(12px,2vw,20px);text-align:center}
  .vp-fs-stat-val{font-family:var(--disp);font-size:clamp(1.2rem,3vw,2.4rem);font-weight:900;line-height:1}
  .vp-fs-stat-label{font-size:clamp(9px,1vw,12px);color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-top:3px}
  .vp-fs-bid-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
  .vp-fs-bid-chip{padding:4px 12px;border-radius:100px;font-size:clamp(11px,1.2vw,13px);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:var(--text3)}
  .vp-fs-bid-chip-top{background:rgba(22,217,117,0.1);border-color:rgba(22,217,117,0.3);color:var(--green);font-weight:600}

  /* INFO BAR */
  .vp-info-bar{
    flex-shrink:0;background:var(--bg2);border-top:1px solid var(--border);
    padding:14px 22px 16px;overflow-y:auto;max-height:46vh;
    animation:fadeSlideIn .4s ease;
  }
  .vp-info-bar::-webkit-scrollbar{width:3px}
  .vp-info-bar::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
  .vp-info-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
  .vp-role-tag{display:inline-block;padding:3px 14px;border-radius:100px;font-size:clamp(9px,1.2vw,11px);font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px}
  .vp-player-name-big{font-family:var(--disp);font-size:clamp(1.8rem,4.5vw,3.6rem);font-weight:900;color:#fff;line-height:.95;letter-spacing:.02em}
  .vp-player-sub{font-size:clamp(11px,1.4vw,14px);color:var(--text2);margin-top:5px;letter-spacing:.02em}
  .vp-bid-block{text-align:right;flex-shrink:0}
  .vp-bid-mini-label{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px}
  .vp-bid-amount-big{font-family:var(--disp);font-size:clamp(2rem,4.5vw,3.4rem);font-weight:900;line-height:1;transition:color .3s ease}
  .vp-bid-amount-big.flash{animation:amountCount .3s ease}
  .vp-bid-team-mini{font-size:clamp(11px,1.4vw,13px);color:var(--text2);margin-top:4px;font-weight:600}
  .vp-bid-count-mini{font-size:11px;color:var(--text3);margin-top:2px}
  .vp-stats-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px;animation:fadeSlideIn .4s .1s both ease}
  .vp-stat-chip{display:flex;flex-direction:column;align-items:center;padding:7px 13px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);min-width:55px}
  .vp-stat-chip-val{font-family:var(--disp);font-size:clamp(1rem,2vw,1.5rem);font-weight:800;line-height:1}
  .vp-stat-chip-label{font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-top:3px}
  .vp-history-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;animation:fadeSlideIn .4s .15s both ease}
  .vp-hchip{padding:3px 10px;border-radius:100px;font-size:11px;background:var(--bg3);border:1px solid var(--border);color:var(--text3)}
  .vp-hchip-top{background:rgba(22,217,117,0.1);border-color:rgba(22,217,117,0.3);color:var(--green);font-weight:600;animation:bidFlash .5s ease}
  .vp-detail-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:9px;animation:fadeSlideIn .4s .05s both ease}
  .vp-dchip{display:flex;align-items:center;gap:5px;padding:3px 9px;background:var(--bg4);border:1px solid var(--border);border-radius:8px;font-size:clamp(10px,1.2vw,12px);color:var(--text2)}
  .vp-dchip svg{width:12px;height:12px;flex-shrink:0;opacity:.7}

  /* ── ACQUIRED BAR ── */
  .vp-acquired-bar{
    display:flex;align-items:center;gap:12px;
    padding:10px 14px;border-radius:10px;margin-bottom:10px;
    animation:fadeSlideIn .4s ease;
  }
  .vp-acquired-bar-sold{background:rgba(22,217,117,0.08);border:1px solid rgba(22,217,117,0.2)}
  .vp-acquired-bar-unsold{background:rgba(240,74,74,0.08);border:1px solid rgba(240,74,74,0.18)}
  .vp-acq-team-logo{width:36px;height:36px;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-weight:800;color:#fff;font-size:.8rem;flex-shrink:0}
  .vp-acq-team-logo img{width:100%;height:100%;object-fit:cover}
  .vp-acq-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px}
  .vp-acq-name{font-weight:700;font-size:.95rem}
  .vp-acq-price{font-family:var(--disp);font-size:1.4rem;font-weight:900;margin-left:auto;flex-shrink:0}

  /* ── POPUP ── */
  .vp-popup-overlay{
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    padding:20px;overflow:hidden;
    animation:fadeIn .2s ease;
  }
  .vp-popup-sold-bg{position:absolute;inset:0;background:rgba(0,0,0,0.9)}
  .vp-popup-unsold-bg{position:absolute;inset:0;background:rgba(0,0,0,0.92)}
  .vp-popup-card{
    position:relative;z-index:2;width:100%;max-width:500px;
    border-radius:24px;overflow:hidden;
    animation:scaleIn .35s cubic-bezier(.34,1.56,.64,1);
  }
  .vp-popup-card-sold{background:#080f0a;border:1.5px solid rgba(22,217,117,0.3);box-shadow:0 0 80px rgba(22,217,117,0.1)}
  .vp-popup-card-unsold{background:#0f0808;border:1.5px solid rgba(240,74,74,0.2)}

  /* Accent line at top of popup */
  .vp-popup-accent-line{height:3px;width:100%}
  .vp-popup-accent-line.sold{background:linear-gradient(90deg,transparent,#16d975 40%,transparent)}
  .vp-popup-accent-line.unsold{background:linear-gradient(90deg,transparent,#f04a4a 40%,transparent)}

  .vp-popup-img-wrap{position:relative;height:clamp(200px,35vh,300px);background:#080f0a;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
  .vp-popup-img-wrap img{height:100%;width:100%;object-fit:contain;object-position:bottom center;position:relative;z-index:1;animation:slideUp .4s ease}
  .vp-popup-img-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(24px) saturate(0.25);opacity:0.15;transform:scale(1.1);z-index:0}
  .vp-popup-img-grad-sold{position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,transparent 30%,rgba(8,15,10,0.97) 100%)}
  .vp-popup-img-grad-unsold{position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,transparent 30%,rgba(15,8,8,0.98) 100%)}
  .vp-popup-img-fallback{font-family:var(--disp);font-size:8rem;font-weight:900;opacity:.07;letter-spacing:.05em;position:relative;z-index:1;padding-bottom:10px}

  .vp-popup-body{padding:16px 24px 22px;text-align:center}
  .vp-popup-verdict-sold{
    display:inline-flex;align-items:center;gap:8px;
    padding:6px 20px;border-radius:100px;
    background:rgba(22,217,117,0.1);border:1px solid rgba(22,217,117,0.3);
    font-size:12px;font-weight:800;color:var(--green);letter-spacing:.15em;text-transform:uppercase;
    margin-bottom:12px;animation:badgePop .3s ease;
  }
  .vp-popup-verdict-unsold{
    display:inline-flex;align-items:center;gap:8px;
    padding:6px 20px;border-radius:100px;
    background:rgba(240,74,74,0.1);border:1px solid rgba(240,74,74,0.25);
    font-size:12px;font-weight:800;color:var(--red);letter-spacing:.15em;text-transform:uppercase;
    margin-bottom:12px;animation:badgePop .3s ease;
  }
  .vp-popup-player-name{font-family:var(--disp);font-size:clamp(1.8rem,4.5vw,2.8rem);font-weight:900;line-height:1;letter-spacing:.03em;margin-bottom:4px}
  .vp-popup-player-meta{font-size:13px;color:var(--text2);margin-bottom:14px}

  .vp-popup-price-box-sold{
    background:rgba(22,217,117,0.07);border:1px solid rgba(22,217,117,0.2);
    border-radius:14px;padding:12px 24px;display:inline-block;margin-bottom:14px;
  }
  .vp-popup-price-sold{font-family:var(--disp);font-size:clamp(2.2rem,5vw,3.4rem);font-weight:900;color:var(--green);line-height:1;animation:amountCount .4s ease}
  .vp-popup-price-label{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:3px}

  .vp-popup-price-box-unsold{
    background:rgba(240,74,74,0.05);border:1px solid rgba(240,74,74,0.15);
    border-radius:14px;padding:12px 24px;display:inline-block;margin-bottom:14px;
  }
  .vp-popup-price-unsold{font-family:var(--disp);font-size:clamp(1.6rem,3.5vw,2.4rem);font-weight:900;color:var(--red);line-height:1}

  /* Team row in popup */
  .vp-popup-team-row{
    display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:18px;
    padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
    border-radius:12px;animation:fadeSlideIn .4s .1s both ease;
  }
  .vp-popup-team-logo{width:44px;height:44px;border-radius:11px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-size:.85rem;font-weight:800;color:#fff}
  .vp-popup-team-logo img{width:100%;height:100%;object-fit:cover}
  .vp-popup-team-info{text-align:left}
  .vp-popup-team-acquired-label{font-size:10px;color:rgba(22,217,117,0.6);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}
  .vp-popup-team-name{font-weight:700;font-size:1.05rem;color:var(--text)}
  .vp-popup-team-budget{font-size:12px;color:var(--text3);margin-top:2px}

  .vp-popup-unsold-msg{font-size:14px;color:#7a3535;margin-bottom:16px;font-style:italic}
  .vp-dismiss-btn{
    width:100%;padding:12px;border-radius:12px;
    background:var(--bg3);border:1px solid var(--border2);
    color:var(--text);font-family:var(--body);font-size:14px;font-weight:600;
    cursor:pointer;transition:background .15s,border-color .15s;
    display:flex;align-items:center;justify-content:center;gap:8px;
  }
  .vp-dismiss-btn:hover{background:var(--bg4);border-color:var(--border2)}
  .vp-dismiss-btn svg{width:16px;height:16px}

  /* RIGHT PANEL */
  .vp-right{display:flex;flex-direction:column;overflow:hidden;background:var(--bg2)}
  .vp-tabs{display:flex;background:var(--bg);border-bottom:1px solid var(--border);flex-shrink:0}
  .vp-tab{flex:1;padding:9px 4px;text-align:center;font-size:10px;font-weight:700;color:var(--text3);cursor:pointer;border-right:1px solid var(--border);text-transform:uppercase;letter-spacing:.07em;transition:color .15s,background .15s}
  .vp-tab:last-child{border-right:none}
  .vp-tab.active{color:var(--text);background:var(--bg2)}
  .vp-tab:hover:not(.active){color:var(--text2)}
  .vp-panel-scroll{flex:1;overflow-y:auto}
  .vp-panel-scroll::-webkit-scrollbar{width:3px}
  .vp-panel-scroll::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

  /* Team cards */
  .vp-teams{padding:10px;display:flex;flex-direction:column;gap:8px}
  .vp-team-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden}
  .vp-team-card-header{display:flex;align-items:center;gap:10px;padding:10px 12px}
  .vp-team-badge{width:32px;height:32px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-size:10px;font-weight:800;color:#fff;flex-shrink:0;overflow:hidden}
  .vp-team-badge img{width:100%;height:100%;object-fit:cover}
  .vp-team-name-sm{font-weight:600;font-size:13px;line-height:1.2}
  .vp-team-budget-sm{font-family:var(--disp);font-size:1rem;font-weight:800;margin-left:auto;flex-shrink:0}
  .vp-budget-track{height:3px;background:var(--bg);margin:0 12px 9px;border-radius:2px;overflow:hidden}
  .vp-budget-fill{height:100%;border-radius:2px;transition:width .6s ease}
  .vp-team-players-full{display:flex;flex-wrap:wrap;gap:4px;padding:0 10px 10px}
  .vp-player-mini-full{display:flex;align-items:center;gap:5px;padding:3px 9px;background:var(--bg4);border:1px solid var(--border);border-radius:6px;font-size:11px;white-space:nowrap}
  .vp-mini-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
  .vp-mini-price{font-size:10px;color:var(--text3);margin-left:2px}

  /* Player rows */
  .vp-prow{display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid var(--border)}
  .vp-prow:last-child{border-bottom:none}
  .vp-prow-av{width:30px;height:30px;border-radius:50%;background:var(--bg4);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}
  .vp-prow-av img{width:100%;height:100%;object-fit:cover}
  .vp-prow-name{font-size:12px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .vp-prow-role{font-size:10px;color:var(--text3)}
  .vp-status-pill{padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;flex-shrink:0}
  .vp-s-sold{background:rgba(22,217,117,.1);color:var(--green)}
  .vp-s-unsold{background:rgba(240,74,74,.1);color:var(--red)}
  .vp-s-available{background:rgba(245,166,35,.1);color:var(--amber)}

  /* Footer */
  .vp-footer{text-align:center;padding:7px;font-size:10px;color:var(--text3);letter-spacing:.04em;background:var(--bg);border-top:1px solid var(--border);flex-shrink:0}

  /* RESPONSIVE */
  @media(max-width:860px){
    .vp-main{grid-template-columns:1fr}
    .vp-right{border-top:1px solid var(--border);max-height:300px}
    .vp-center{border-right:none}
  }
  @media(max-width:520px){
    .vp-header{padding:8px 12px}
    .vp-info-bar{padding:10px 12px 12px}
    .vp-popup-card{border-radius:16px}
  }
  @media(min-width:1280px){
    .vp-main{grid-template-columns:1fr 360px}
    .vp-event-name{font-size:1.5rem}
  }
  @media(min-width:1600px){
    .vp-main{grid-template-columns:1fr 420px}
    .vp-strip-val{font-size:2.2rem}
    .vp-strip-label{font-size:13px}
  }
`;

function injectStyles() {
  if (document.getElementById('vp-v5-styles')) return;
  const s = document.createElement('style');
  s.id = 'vp-v5-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
}

/* ── SVG ICONS (professional, no emoji) ── */
const IconExpand = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
    <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
  </svg>
);
const IconShrink = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
    <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
  </svg>
);
const IconBat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="20" x2="14" y2="10"/><path d="M14 10 l6 -6 a2 2 0 0 0-3-3 l-6 6"/>
    <circle cx="6" cy="18" r="2"/>
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>
  </svg>
);
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconXCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const IconTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 22v-4.3a5 5 0 0 1-3-4.7V4h10v9a5 5 0 0 1-3 4.7V22"/>
  </svg>
);
const IconCoin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M14.5 9A3 3 0 0 0 9 10v4a3 3 0 0 0 5.5 1"/>
  </svg>
);
const IconCake = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1"/>
    <line x1="12" y1="11" x2="12" y2="7"/><path d="M10 7 C10 5 14 5 14 7"/>
  </svg>
);
const IconFlag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);
const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

/* ── SOLD POPUP ── */
function SoldPopup({ popup, onDismiss }) {
  const overlayRef = useRef(null);
  useEffect(() => { if (overlayRef.current) spawnConfetti(overlayRef.current); }, []);
  const { player, price, team, teamName } = popup;
  return (
    <div className="vp-popup-overlay" ref={overlayRef} onClick={onDismiss}>
      <div className="vp-popup-sold-bg" />
      <div className="vp-popup-card vp-popup-card-sold" onClick={e => e.stopPropagation()}>
        <div className="vp-popup-accent-line sold" />
        <div className="vp-popup-img-wrap">
          {player.imageUrl && <div className="vp-popup-img-bg" style={{ backgroundImage:`url(${player.imageUrl})` }} />}
          {player.imageUrl
            ? <img src={player.imageUrl} alt={player.name} />
            : <div className="vp-popup-img-fallback" style={{ color:'#16d975' }}>{initials(player.name)}</div>
          }
          <div className="vp-popup-img-grad-sold" />
        </div>
        <div className="vp-popup-body">
          <div className="vp-popup-verdict-sold">
            <span style={{ width:8,height:8,borderRadius:'50%',background:'#16d975',display:'inline-block',animation:'pulse 1.1s infinite' }} />
            <IconTrophy />&nbsp;Sold
          </div>
          <div className="vp-popup-player-name" style={{ color:'#ffe066' }}>{player.name}</div>
          <div className="vp-popup-player-meta">
            {player.role}{player.age ? ` · Age ${player.age}` : ''}{player.battingStyle ? ` · ${player.battingStyle}` : ''}
          </div>
          <div className="vp-popup-price-box-sold">
            <div className="vp-popup-price-label">Final Price</div>
            <div className="vp-popup-price-sold">{formatCurrency(price)}</div>
          </div>
          {teamName && (
            <div className="vp-popup-team-row">
              <div className="vp-popup-team-logo" style={{ background: team?.color || '#172038' }}>
                {team?.logo ? <img src={team.logo} alt={teamName} /> : <span>{team?.shortName}</span>}
              </div>
              <div className="vp-popup-team-info">
                <div className="vp-popup-team-acquired-label">Acquired by</div>
                <div className="vp-popup-team-name">{teamName}</div>
                {team?.remainingBudget != null && (
                  <div className="vp-popup-team-budget">Remaining: {formatCurrency(team.remainingBudget)}</div>
                )}
              </div>
            </div>
          )}
          <button className="vp-dismiss-btn" onClick={onDismiss}>
            Continue Auction <IconArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── UNSOLD POPUP ── */
function UnsoldPopup({ popup, onDismiss }) {
  const { player } = popup;
  return (
    <div className="vp-popup-overlay" onClick={onDismiss}>
      <div className="vp-popup-unsold-bg" />
      <div className="vp-popup-card vp-popup-card-unsold" onClick={e => e.stopPropagation()}>
        <div className="vp-popup-accent-line unsold" />
        <div className="vp-popup-img-wrap" style={{ filter:'grayscale(0.7)' }}>
          {player.imageUrl && <div className="vp-popup-img-bg" style={{ backgroundImage:`url(${player.imageUrl})` }} />}
          {player.imageUrl
            ? <img src={player.imageUrl} alt={player.name} style={{ opacity:0.65 }} />
            : <div className="vp-popup-img-fallback" style={{ color:'#f04a4a' }}>{initials(player.name)}</div>
          }
          <div className="vp-popup-img-grad-unsold" />
        </div>
        <div className="vp-popup-body">
          <div className="vp-popup-verdict-unsold">
            <IconXCircle /> Unsold
          </div>
          <div className="vp-popup-player-name" style={{ color:'#94a3b8' }}>{player.name}</div>
          <div className="vp-popup-player-meta">
            {player.role}{player.age ? ` · Age ${player.age}` : ''}
          </div>
          <div className="vp-popup-price-box-unsold">
            <div className="vp-popup-price-label">Base Price · No bids received</div>
            <div className="vp-popup-price-unsold">{formatCurrency(player.basePrice)}</div>
          </div>
          <div className="vp-popup-unsold-msg">No team placed a bid for this player.</div>
          <button className="vp-dismiss-btn" onClick={onDismiss}>
            Continue Auction <IconArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════
   MAIN COMPONENT
══════════════════════ */
export default function ViewerPage({ token }) {
  const [data, setData]               = useState(null);
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [popup, setPopup]             = useState(null);
  const [activeTab, setActiveTab]     = useState('teams');
  const [fullscreen, setFullscreen]   = useState(false);

  /* Refs for reliable popup detection */
  const prevStatusRef    = useRef(null);  // previous status string
  const prevPlayerIdRef  = useRef(null);  // previous player _id
  const prevSessionRef   = useRef(null);  // full previous session snapshot
  const shownPopupRef    = useRef(null);  // composite key of last popup shown: "playerId:status"

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fetchData = async () => {
    try {
      const d = await api.getEventLive(token);
      const curr = d.currentSession;

      /* ── POPUP DETECTION (robust) ──
         Show popup when:
         (a) Status transitions to Sold/Unsold on the SAME player, OR
         (b) A NEW player appears that is already Sold/Unsold (page load / rejoin)
         De-duplicate using a composite key "playerId:status".
      */
      if (curr?.player?._id && (curr.status === 'Sold' || curr.status === 'Unsold')) {
        const compositeKey = `${curr.player._id}:${curr.status}`;
        const prevKey      = `${prevPlayerIdRef.current}:${prevStatusRef.current}`;

        const isNewTransition = compositeKey !== shownPopupRef.current && compositeKey !== prevKey;

        if (isNewTransition) {
          shownPopupRef.current = compositeKey;
          if (curr.status === 'Sold') {
            setPopup({
              type: 'sold',
              player: curr.player,
              price: curr.currentBid,
              team: curr.currentBidTeam,
              teamName: curr.currentBidTeamName
            });
          } else {
            setPopup({ type: 'unsold', player: curr.player });
          }
        }
      }

      /* Save previous state */
      prevStatusRef.current   = curr?.status   ?? null;
      prevPlayerIdRef.current = curr?.player?._id ?? null;
      prevSessionRef.current  = curr;

      setData(d);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 4000);
    return () => clearInterval(id);
  }, [token]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#06090f', color:'#7a90b8', fontFamily:'Barlow Condensed,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', border:'2px solid #172038', borderTopColor:'#16d975', margin:'0 auto 16px', animation:'spin .8s linear infinite' }} />
        <div style={{ fontSize:'1.4rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Loading Auction...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#06090f', color:'#7a90b8', padding:24, fontFamily:'Barlow Condensed,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(240,74,74,0.1)', border:'1px solid rgba(240,74,74,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <IconXCircle />
        </div>
        <h2 style={{ color:'#f04a4a', marginBottom:8, fontSize:'2rem', fontWeight:800 }}>Auction Not Found</h2>
        <p style={{ fontFamily:'Barlow,sans-serif', fontSize:14 }}>Token <strong style={{ letterSpacing:2 }}>{token}</strong> is invalid or expired.</p>
      </div>
    </div>
  );

  const { event, teams, players, currentSession, history, stats } = data;
  const sess = currentSession;
  const isSoldOrUnsold = sess?.status === 'Sold' || sess?.status === 'Unsold';
  const isLive = !!sess && !isSoldOrUnsold;
  const roleColor = sess?.player ? (ROLE_COLORS[sess.player.role] || '#f5a623') : '#f5a623';

  const soldPlayers      = players.filter(p => p.status === 'Sold');
  const unsoldPlayers    = players.filter(p => p.status === 'Unsold');
  const availablePlayers = players.filter(p => p.status === 'Available');

  /* ── Detail chips with SVG icons ── */
  const detailChips = sess?.player ? [
    sess.player.basePrice != null && { icon: <IconCoin />, label: `Base ${formatCurrency(sess.player.basePrice)}` },
    sess.player.age        && { icon: <IconCake />,  label: `Age ${sess.player.age}` },
    sess.player.battingStyle  && { icon: <IconBat />,  label: sess.player.battingStyle },
    sess.player.nationality   && { icon: <IconFlag />, label: sess.player.nationality },
    sess.player.category      && { icon: <IconTag />,  label: sess.player.category },
  ].filter(Boolean) : [];

  /* ── Fullscreen overlay ── */
  const renderFsOverlayInfo = () => {
    if (!sess?.player) return null;
    const isSold   = sess.status === 'Sold';
    const isUnsold = sess.status === 'Unsold';
    return (
      <div className="vp-fs-info-overlay">
        <div className="vp-fs-role-tag" style={{ background:`${roleColor}18`, color:roleColor }}>{sess.player.role}</div>
        <div className="vp-fs-name">{sess.player.name}</div>
        <div className="vp-fs-sub">
          {[sess.player.battingStyle, sess.player.bowlingStyle, sess.player.nationality].filter(Boolean).join(' · ')}
          {sess.player.age ? ` · Age ${sess.player.age}` : ''}
        </div>
        <div className="vp-fs-bottom-row">
          <div className="vp-fs-status-block">
            {isSold ? (
              <>
                <div className="vp-fs-status-label" style={{ color:'rgba(22,217,117,0.6)' }}>Acquired For</div>
                <div className="vp-fs-status-amount" style={{ color:'#16d975' }}>{formatCurrency(sess.currentBid)}</div>
                {sess.currentBidTeam && (
                  <div className="vp-fs-status-team">
                    <div className="vp-fs-team-logo" style={{ background: sess.currentBidTeam.color || '#172038' }}>
                      {sess.currentBidTeam.logo
                        ? <img src={sess.currentBidTeam.logo} alt="" />
                        : <span style={{ fontSize:'.85rem' }}>{sess.currentBidTeam.shortName}</span>
                      }
                    </div>
                    <div>
                      <div className="vp-fs-team-name">{sess.currentBidTeamName}</div>
                      {sess.currentBidTeam.remainingBudget != null && (
                        <div className="vp-fs-team-budget">Remaining: {formatCurrency(sess.currentBidTeam.remainingBudget)}</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : isUnsold ? (
              <>
                <div className="vp-fs-verdict-unsold"><IconXCircle /> Unsold</div>
                <div style={{ marginTop:8, fontSize:'clamp(12px,1.6vw,16px)', color:'#7a3535' }}>No team placed a bid</div>
                <div style={{ marginTop:4, fontSize:'clamp(10px,1.2vw,13px)', color:'#3a4f6e' }}>Base price: {formatCurrency(sess.player.basePrice)}</div>
              </>
            ) : (
              <>
                <div className="vp-fs-status-label">Current Bid</div>
                <div className="vp-fs-status-amount" style={{ color: sess.currentBidTeam ? '#16d975' : '#3a4f6e' }}>
                  {formatCurrency(sess.currentBid)}
                </div>
                {sess.currentBidTeamName ? (
                  <div className="vp-fs-status-team">
                    {sess.currentBidTeam?.logo
                      ? <img src={sess.currentBidTeam.logo} alt="" style={{ width:'clamp(24px,3vw,36px)', height:'clamp(24px,3vw,36px)', borderRadius:6, objectFit:'cover' }} />
                      : <div style={{ width:10, height:10, borderRadius:'50%', background: sess.currentBidTeam?.color, flexShrink:0 }} />
                    }
                    <div className="vp-fs-team-name" style={{ fontSize:'clamp(.9rem,2vw,1.6rem)' }}>{sess.currentBidTeamName}</div>
                  </div>
                ) : (
                  <div style={{ fontSize:'clamp(11px,1.2vw,14px)', color:'#3a4f6e', marginTop:6 }}>Base price · No bids yet</div>
                )}
                {sess.bids?.length > 0 && (
                  <div className="vp-fs-bid-chips" style={{ marginTop:12 }}>
                    {[...sess.bids].reverse().slice(0,5).map((b,i) => (
                      <div key={i} className={`vp-fs-bid-chip${i===0?' vp-fs-bid-chip-top':''}`}>
                        {b.teamName} · {formatCurrency(b.amount)}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {sess.player.stats && (
            <div className="vp-fs-stats-row">
              {sess.player.stats.runs      > 0 && <div className="vp-fs-stat"><div className="vp-fs-stat-val" style={{ color:'#38d9f5' }}>{sess.player.stats.runs}</div><div className="vp-fs-stat-label">Runs</div></div>}
              {sess.player.stats.wickets   > 0 && <div className="vp-fs-stat"><div className="vp-fs-stat-val" style={{ color:'#f04a4a' }}>{sess.player.stats.wickets}</div><div className="vp-fs-stat-label">Wickets</div></div>}
              {sess.player.stats.average   > 0 && <div className="vp-fs-stat"><div className="vp-fs-stat-val" style={{ color:'#ffe066' }}>{sess.player.stats.average}</div><div className="vp-fs-stat-label">Avg</div></div>}
              {sess.player.stats.strikeRate> 0 && <div className="vp-fs-stat"><div className="vp-fs-stat-val" style={{ color:'#f5a623' }}>{sess.player.stats.strikeRate}</div><div className="vp-fs-stat-label">SR</div></div>}
              {sess.player.stats.economy   > 0 && <div className="vp-fs-stat"><div className="vp-fs-stat-val" style={{ color:'#c084fc' }}>{sess.player.stats.economy}</div><div className="vp-fs-stat-label">Econ</div></div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── Non-fullscreen acquired/unsold bar ── */
  const renderAcquiredBar = () => {
    if (!sess) return null;
    if (sess.status === 'Sold' && sess.currentBidTeamName) {
      return (
        <div className="vp-acquired-bar vp-acquired-bar-sold">
          <div className="vp-acq-team-logo" style={{ background: sess.currentBidTeam?.color || '#172038' }}>
            {sess.currentBidTeam?.logo
              ? <img src={sess.currentBidTeam.logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8 }} />
              : <span>{sess.currentBidTeam?.shortName}</span>
            }
          </div>
          <div>
            <div className="vp-acq-label" style={{ color:'rgba(22,217,117,0.6)' }}>Acquired by</div>
            {/* Full team name here, not shortName */}
            <div className="vp-acq-name">{sess.currentBidTeamName}</div>
          </div>
          <div className="vp-acq-price" style={{ color:'#16d975' }}>{formatCurrency(sess.currentBid)}</div>
        </div>
      );
    }
    if (sess.status === 'Unsold') {
      return (
        <div className="vp-acquired-bar vp-acquired-bar-unsold">
          <div style={{ width:36, height:36, borderRadius:8, background:'rgba(240,74,74,0.1)', border:'1px solid rgba(240,74,74,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#f04a4a' }}>
            <IconXCircle />
          </div>
          <div>
            <div className="vp-acq-label" style={{ color:'rgba(240,74,74,0.6)' }}>Unsold</div>
            <div className="vp-acq-name" style={{ color:'#94a3b8' }}>No team placed a bid</div>
          </div>
          <div className="vp-acq-price" style={{ color:'#f04a4a' }}>{formatCurrency(sess.player?.basePrice)}</div>
        </div>
      );
    }
    return null;
  };

  /* ── Status badge on image ── */
  const renderImgStatusBadge = () => {
    if (!sess) return null;
    if (isLive && sess.status !== 'Paused') {
      return (
        <div className="vp-img-status-badge live">
          <span className="vp-live-dot" />
          Live Bidding
        </div>
      );
    }
    if (sess.status === 'Sold') {
      return (
        <div className="vp-img-status-badge sold">
          <IconCheckCircle /> Sold
        </div>
      );
    }
    if (sess.status === 'Unsold') {
      return (
        <div className="vp-img-status-badge unsold">
          <IconXCircle /> Unsold
        </div>
      );
    }
    return null;
  };

  return (
    <div className="vp">
      {/* ── POPUPS ── */}
      {popup?.type === 'sold'   && <SoldPopup   popup={popup} onDismiss={() => setPopup(null)} />}
      {popup?.type === 'unsold' && <UnsoldPopup popup={popup} onDismiss={() => setPopup(null)} />}

      {/* ── HEADER ── */}
      {!fullscreen && (
        <div className="vp-header">
          <div className="vp-header-left">
            {event.logo
              ? <img src={event.logo} alt={event.name} className="vp-event-logo" />
              : <div className="vp-event-logo-fb" style={{ color:roleColor }}>
                  <IconBat />
                </div>
            }
            <div>
              <div className="vp-event-name">{event.name}</div>
              {event.season && <div className="vp-event-season">Season {event.season}</div>}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {isLive
              ? <div className="vp-live-pill"><span className="vp-live-dot" />{sess?.status === 'Paused' ? 'Paused' : 'Live'}</div>
              : <div style={{ fontSize:11, color:'#3a4f6e', textTransform:'uppercase', letterSpacing:'.08em' }}>Not live</div>
            }
            <div className="vp-updated">{lastUpdated?.toLocaleTimeString([],{ hour:'2-digit', minute:'2-digit', second:'2-digit' })}</div>
          </div>
        </div>
      )}

      {/* ── STAT STRIP ── */}
      {!fullscreen && (
        <div className="vp-strip">
          {[
            { label:'Sold',      value:stats.sold,      color:'#16d975' },
            { label:'Unsold',    value:stats.unsold,    color:'#f04a4a' },
            { label:'Available', value:stats.available, color:'#f5a623' },
            { label:'Total',     value:stats.total,     color:'#7a90b8' },
          ].map(s => (
            <div key={s.label} className="vp-strip-item">
              <div className="vp-strip-val" style={{ color:s.color }}>{s.value}</div>
              <div className="vp-strip-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN ── */}
      <div className="vp-main" style={{ flex:1, minHeight:0 }}>

        {/* CENTER */}
        <div className={`vp-center${fullscreen ? ' fullscreen' : ''}`}>

          <button className="vp-fs-btn" onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen player view'}>
            {fullscreen ? <IconShrink /> : <IconExpand />}
            {fullscreen ? 'Exit' : 'Fullscreen'}
          </button>

          {/* Show player card if there's an active session (live OR just sold/unsold) */}
          {sess?.player ? (
            <div className="vp-player-card" key={sess.player._id}>
              <div className="vp-img-zone" style={{ background:`linear-gradient(160deg,#0a1628 0%,${roleColor}12 100%)` }}>
                {sess.player?.imageUrl && <div className="vp-img-bg-blur" style={{ backgroundImage:`url(${sess.player.imageUrl})` }} />}
                {sess.player?.imageUrl
                  ? <img src={sess.player.imageUrl} alt={sess.player.name} />
                  : <div className="vp-img-fallback-big" style={{ color:roleColor }}>{initials(sess.player?.name)}</div>
                }
                {/* Status badge on the image */}
                {!fullscreen && renderImgStatusBadge()}
                {fullscreen && renderFsOverlayInfo()}
              </div>

              {!fullscreen && (
                <div className="vp-info-bar">
                  {renderAcquiredBar()}

                  <div className="vp-info-top">
                    <div>
                      <div className="vp-role-tag" style={{ background:`${roleColor}18`, color:roleColor }}>{sess.player?.role}</div>
                      <div className="vp-player-name-big">{sess.player?.name}</div>
                      <div className="vp-player-sub">
                        {[sess.player?.battingStyle, sess.player?.bowlingStyle, sess.player?.nationality].filter(Boolean).join(' · ')}
                        {sess.player?.age ? ` · Age ${sess.player.age}` : ''}
                      </div>
                    </div>
                    <div className="vp-bid-block">
                      <div className="vp-bid-mini-label">Current Bid</div>
                      <div className="vp-bid-amount-big" style={{ color: sess.currentBidTeam ? '#16d975' : '#3a4f6e' }}>
                        {formatCurrency(sess.currentBid)}
                      </div>
                      {sess.currentBidTeamName
                        ? <>
                            <div className="vp-bid-team-mini" style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                              <div style={{ width:8, height:8, borderRadius:'50%', background:sess.currentBidTeam?.color, flexShrink:0 }} />
                              {/* Full team name */}
                              {sess.currentBidTeamName}
                            </div>
                            <div className="vp-bid-count-mini">{sess.bids?.length ?? 0} bid{sess.bids?.length !== 1 ? 's' : ''}</div>
                          </>
                        : <div style={{ fontSize:12, color:'#3a4f6e', marginTop:4 }}>Base · No bids yet</div>
                      }
                    </div>
                  </div>

                  <div className="vp-detail-chips">
                    {detailChips.map((c, i) => (
                      <div key={i} className="vp-dchip">{c.icon}<span>{c.label}</span></div>
                    ))}
                  </div>

                  {sess.player?.stats && (
                    <div className="vp-stats-row">
                      {sess.player.stats.matches   > 0 && <div className="vp-stat-chip"><div className="vp-stat-chip-val" style={{ color:'#7a90b8' }}>{sess.player.stats.matches}</div><div className="vp-stat-chip-label">Matches</div></div>}
                      {sess.player.stats.runs      > 0 && <div className="vp-stat-chip"><div className="vp-stat-chip-val" style={{ color:'#38d9f5' }}>{sess.player.stats.runs}</div><div className="vp-stat-chip-label">Runs</div></div>}
                      {sess.player.stats.wickets   > 0 && <div className="vp-stat-chip"><div className="vp-stat-chip-val" style={{ color:'#f04a4a' }}>{sess.player.stats.wickets}</div><div className="vp-stat-chip-label">Wickets</div></div>}
                      {sess.player.stats.average   > 0 && <div className="vp-stat-chip"><div className="vp-stat-chip-val" style={{ color:'#ffe066' }}>{sess.player.stats.average}</div><div className="vp-stat-chip-label">Avg</div></div>}
                      {sess.player.stats.strikeRate> 0 && <div className="vp-stat-chip"><div className="vp-stat-chip-val" style={{ color:'#f5a623' }}>{sess.player.stats.strikeRate}</div><div className="vp-stat-chip-label">SR</div></div>}
                      {sess.player.stats.economy   > 0 && <div className="vp-stat-chip"><div className="vp-stat-chip-val" style={{ color:'#c084fc' }}>{sess.player.stats.economy}</div><div className="vp-stat-chip-label">Econ</div></div>}
                    </div>
                  )}

                  {sess.bids?.length > 0 && (
                    <div className="vp-history-chips">
                      {[...sess.bids].reverse().slice(0,7).map((b,i) => (
                        <div key={i} className={`vp-hchip${i===0?' vp-hchip-top':''}`}>
                          {b.teamName} · {formatCurrency(b.amount)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── TRANSITION / PAUSED SCREEN ── */
            <div className="vp-transition">
              <div className="vp-transition-pitch" />
              <div className="vp-transition-icon">
                <IconClock />
              </div>
              <div className="vp-transition-title">Awaiting Next Player</div>
              <div className="vp-transition-sub">The auctioneer will nominate the next player shortly</div>
              {history.length > 0 && (
                <div className="vp-transition-last">
                  <div className="vp-transition-last-label">Last sold</div>
                  <div className="vp-transition-last-name">{history[0]?.player?.name}</div>
                  <div className="vp-transition-last-price">
                    {formatCurrency(history[0]?.currentBid)} → {history[0]?.currentBidTeam?.name || history[0]?.currentBidTeam?.shortName}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        {!fullscreen && (
          <div className="vp-right">
            <div className="vp-tabs">
              {[['teams','Teams'],['recent','Recent'],['all','All']].map(([id,label]) => (
                <div key={id} className={`vp-tab${activeTab===id?' active':''}`} onClick={() => setActiveTab(id)}>{label}</div>
              ))}
            </div>

            <div className="vp-panel-scroll">
              {activeTab === 'teams' && (
                <div className="vp-teams">
                  {teams.map(t => {
                    const spent = t.budget - t.remainingBudget;
                    const pct   = Math.min(100, Math.round((spent / t.budget) * 100));
                    return (
                      <div key={t._id} className="vp-team-card">
                        <div className="vp-team-card-header">
                          <div className="vp-team-badge" style={{ background: t.logo ? 'transparent' : (t.color || '#172038') }}>
                            {t.logo ? <img src={t.logo} alt={t.name} /> : t.shortName}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div className="vp-team-name-sm" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</div>
                            <div style={{ fontSize:10, color:'#3a4f6e' }}>{t.players.length} players · {pct}% spent</div>
                          </div>
                          <div className="vp-team-budget-sm" style={{ color: pct > 80 ? '#f5a623' : '#16d975' }}>
                            {formatCurrency(t.remainingBudget)}
                          </div>
                        </div>
                        <div className="vp-budget-track">
                          <div className="vp-budget-fill" style={{ width:`${pct}%`, background: t.color || '#3b82f6' }} />
                        </div>
                        {t.players.length > 0 ? (
                          <div className="vp-team-players-full">
                            {t.players.map(p => (
                              <div key={p._id} className="vp-player-mini-full">
                                <div className="vp-mini-dot" style={{ background: ROLE_COLORS[p.role] || '#64748b' }} />
                                <span>{p.name}</span>
                                {p.soldPrice != null && <span className="vp-mini-price">{formatCurrency(p.soldPrice)}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding:'6px 12px 10px', fontSize:11, color:'#3a4f6e', fontStyle:'italic' }}>No players yet</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'recent' && (
                history.length === 0
                  ? <div style={{ textAlign:'center', padding:'28px 0', color:'#3a4f6e', fontSize:13 }}>No sales yet</div>
                  : history.slice(0,25).map(h => (
                    <div key={h._id} className="vp-prow">
                      <div style={{ width:7, height:7, borderRadius:'50%', background: h.status==='Sold'?'#16d975':'#f04a4a', flexShrink:0 }} />
                      <div className="vp-prow-av">{h.player?.imageUrl ? <img src={h.player.imageUrl} alt="" /> : initials(h.player?.name)}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="vp-prow-name">{h.player?.name}</div>
                        <div className="vp-prow-role">{h.player?.role}</div>
                      </div>
                      {h.status === 'Sold'
                        ? <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:'#16d975' }}>{formatCurrency(h.currentBid)}</div>
                            {/* Full team name in recent list */}
                            <div style={{ fontSize:10, color:'#3a4f6e' }}>{h.currentBidTeam?.name || h.currentBidTeam?.shortName}</div>
                          </div>
                        : <span className="vp-status-pill vp-s-unsold">Unsold</span>
                      }
                    </div>
                  ))
              )}

              {activeTab === 'all' && (
                <>
                  <div style={{ display:'flex', gap:6, padding:'8px 12px', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
                    <span className="vp-status-pill vp-s-sold">{soldPlayers.length} Sold</span>
                    <span className="vp-status-pill vp-s-available">{availablePlayers.length} Available</span>
                    <span className="vp-status-pill vp-s-unsold">{unsoldPlayers.length} Unsold</span>
                  </div>
                  {players.map(p => {
                    const rc = ROLE_COLORS[p.role] || '#64748b';
                    return (
                      <div key={p._id} className="vp-prow">
                        <div className="vp-prow-av" style={{ background:`${rc}18`, color:rc }}>
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : initials(p.name)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="vp-prow-name">{p.name}</div>
                          <div className="vp-prow-role">{p.role}</div>
                        </div>
                        {p.status === 'Sold'
                          ? <div style={{ textAlign:'right', flexShrink:0 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:'#16d975' }}>{formatCurrency(p.soldPrice)}</div>
                              {/* Full team name */}
                              <div style={{ fontSize:10, color:'#3a4f6e' }}>{p.team?.name || p.team?.shortName}</div>
                            </div>
                          : <span className={`vp-status-pill vp-s-${p.status.toLowerCase()}`}>{p.status}</span>
                        }
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!fullscreen && (
        <div className="vp-footer">
          CricAuction · Read-only viewer · Refreshes every 4s &nbsp;·&nbsp; मा. श्री. पवन पाटणे यांच्या सहकार्याने
        </div>
      )}
    </div>
  );
}