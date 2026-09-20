/**
 * Lecture 6, Tab 6: Interaktiv Erkin Jism Diagrammasi (FBD) Simulyatori.
 * Qiyalikdagi jism: og'irlik (mg), normal reaksiya (N), tashqi tortish
 * kuchi (F, qiyalik bo'ylab yuqoriga) va ishqalanish (statik/kinetik).
 */
document.addEventListener('DOMContentLoaded', () => {
  initFBD();
});

function initFBD() {
  const canvas = document.getElementById('fbd-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const angleSlider = document.getElementById('fbd-angle');
  const massSlider = document.getElementById('fbd-mass');
  const forceSlider = document.getElementById('fbd-force');
  const musSlider = document.getElementById('fbd-mus');
  const mukSlider = document.getElementById('fbd-muk');
  const compToggle = document.getElementById('fbd-comp-toggle');
  const netToggle = document.getElementById('fbd-net-toggle');
  const btnPlay = document.getElementById('fbd-play-btn');
  const btnReset = document.getElementById('fbd-reset-btn');

  const angleVal = document.getElementById('fbd-angle-val');
  const massVal = document.getElementById('fbd-mass-val');
  const forceVal = document.getElementById('fbd-force-val');
  const musVal = document.getElementById('fbd-mus-val');
  const mukVal = document.getElementById('fbd-muk-val');

  const hudState = document.getElementById('fbd-hud-state');
  const hudN = document.getElementById('fbd-hud-n');
  const hudMg = document.getElementById('fbd-hud-mg');
  const hudMgPar = document.getElementById('fbd-hud-mgpar');
  const hudFfr = document.getElementById('fbd-hud-ffr');
  const hudFsMax = document.getElementById('fbd-hud-fsmax');
  const hudFnet = document.getElementById('fbd-hud-fnet');
  const hudA = document.getElementById('fbd-hud-a');
  const hudV = document.getElementById('fbd-hud-v');

  const G = 9.8;
  const STOP_SPEED = 0.05; // m/s — shundan pastda "to'xtadi" deb hisoblanadi
  const MAX_S = 3; // m — qiyalik bo'ylab siljish chegarasi (ikkala tomon)

  let isRunning = false;
  let s = 0;   // qiyalik bo'ylab siljish (m), + = yuqoriga
  let v = 0;   // tezlik (m/s)
  let lastTime = null;

  function readParams() {
    return {
      angleDeg: parseFloat(angleSlider.value),
      mass: parseFloat(massSlider.value),
      force: parseFloat(forceSlider.value),
      mus: parseFloat(musSlider.value),
      muk: parseFloat(mukSlider.value)
    };
  }

  function updateLabels() {
    const p = readParams();
    angleVal.textContent = p.angleDeg.toFixed(0) + '°';
    massVal.textContent = p.mass.toFixed(1) + ' kg';
    forceVal.textContent = p.force.toFixed(0) + ' N';
    musVal.textContent = p.mus.toFixed(2);
    mukVal.textContent = p.muk.toFixed(2);
  }

  [angleSlider, massSlider, forceSlider, musSlider, mukSlider].forEach(el => {
    el.addEventListener('input', updateLabels);
  });

  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      isRunning = !isRunning;
      btnPlay.textContent = isRunning ? '⏸ To\'xtatish' : '▶ Boshlash';
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      s = 0;
      v = 0;
      isRunning = false;
      if (btnPlay) btnPlay.textContent = '▶ Boshlash';
    });
  }

  /** Berilgan parametrlar asosida FBD kattaliklarini hisoblaydi. */
  function computePhysics() {
    const { angleDeg, mass, force, mus, muk } = readParams();
    const alpha = angleDeg * Math.PI / 180;

    const mg = mass * G;
    const mgPar = mg * Math.sin(alpha);   // pastga qarab (qiyalik bo'ylab)
    const mgPerp = mg * Math.cos(alpha);  // sirtga perpendikulyar
    const N = mgPerp;
    const Fsmax = mus * N;

    const appliedNet = force - mgPar; // musbat = yuqoriga siljitishga moyillik
    const moving = Math.abs(v) > 1e-3;

    let friction, netForce, accel, state;

    if (!moving && Math.abs(appliedNet) <= Fsmax) {
      friction = -appliedNet;
      netForce = 0;
      accel = 0;
      state = 'Muvozanatda (Statik)';
    } else {
      const dir = moving ? Math.sign(v) : Math.sign(appliedNet || 1);
      friction = -dir * muk * N;
      netForce = appliedNet + friction;
      accel = netForce / mass;
      state = dir > 0 ? 'Sirpanmoqda (Yuqoriga) ↑' : 'Sirpanmoqda (Pastga) ↓';
    }

    return { alpha, angleDeg, mass, force, mg, mgPar, mgPerp, N, Fsmax, friction, netForce, accel, state };
  }

  function integrate(p, dt) {
    if (!isRunning) return;

    v += p.accel * dt;

    // Statik yopishish: agar tashqi kuch statik ishqalanish chegarasidan
    // oshmasa va tezlik juda kichik bo'lsa, jismni to'xtatamiz (drift'ni oldini olish).
    const appliedNet = p.force - p.mgPar;
    if (Math.abs(appliedNet) <= p.Fsmax && Math.abs(v) < STOP_SPEED) {
      v = 0;
    }

    s += v * dt;

    if (s > MAX_S) { s = MAX_S; v = 0; isRunning = false; if (btnPlay) btnPlay.textContent = '▶ Boshlash'; }
    if (s < -MAX_S) { s = -MAX_S; v = 0; isRunning = false; if (btnPlay) btnPlay.textContent = '▶ Boshlash'; }
  }

  function updateHUD(p) {
    hudState.textContent = p.accel === 0 && p.netForce === 0 ? 'Muvozanatda (Statik)' : p.state;
    hudN.textContent = p.N.toFixed(2) + ' N';
    hudMg.textContent = p.mg.toFixed(2) + ' N';
    hudMgPar.textContent = p.mgPar.toFixed(2) + ' N';
    hudFfr.textContent = p.friction.toFixed(2) + ' N';
    hudFsMax.textContent = p.Fsmax.toFixed(2) + ' N';
    hudFnet.textContent = p.netForce.toFixed(2) + ' N';
    hudA.textContent = p.accel.toFixed(2) + ' m/s²';
    hudV.textContent = v.toFixed(2) + ' m/s';
  }

  function drawArrow(x0, y0, dx, dy, color, label) {
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const x1 = x0 + dx;
    const y1 = y0 + dy;
    const headLen = Math.min(12, len * 0.35);
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - headLen * Math.cos(angle - Math.PI / 6), y1 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x1 - headLen * Math.cos(angle + Math.PI / 6), y1 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(label, x1 + 6 * Math.cos(angle), y1 + 6 * Math.sin(angle));
    }
  }

  function dashedArrow(x0, y0, dx, dy, color, label) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    drawArrow(x0, y0, dx, dy, color, label);
    ctx.restore();
  }

  function draw(p) {
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    ctx.clearRect(0, 0, w, h);

    const alpha = p.alpha;
    const originX = w * 0.14;
    const originY = h * 0.86;
    const inclineLen = Math.min(w * 0.62, h * 1.5);
    const upX = Math.cos(alpha), upY = -Math.sin(alpha);   // qiyalik bo'ylab yuqoriga (dunyo koordinatasida)
    const normX = -Math.sin(alpha), normY = -Math.cos(alpha); // sirtdan tashqariga (normal)

    const topX = originX + inclineLen * upX;
    const topY = originY + inclineLen * upY;

    // Yer chizig'i
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(w, originY);
    ctx.stroke();

    // Qiyalik (uchburchak)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(topX, topY);
    ctx.lineTo(topX, originY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Burchak yoyi va yorlig'i
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(originX, originY, 34, -alpha, 0, false);
    ctx.stroke();
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '13px sans-serif';
    ctx.fillText('α = ' + p.angleDeg.toFixed(0) + '°', originX + 42, originY - 10);

    // Jismning qiyalik bo'ylab holati (m -> px)
    const pxPerMeter = 45;
    const margin = 34;
    const rawDist = inclineLen * 0.5 + s * pxPerMeter;
    const dist = Math.max(margin, Math.min(inclineLen - margin, rawDist));
    const surfCx = originX + dist * upX;
    const surfCy = originY + dist * upY;

    const blockSize = 46;
    const cx = surfCx + (blockSize / 2) * normX;
    const cy = surfCy + (blockSize / 2) * normY;

    // Jism (qiyalikka moslab aylantirilgan kvadrat)
    ctx.save();
    ctx.translate(surfCx, surfCy);
    ctx.rotate(-alpha);
    ctx.translate(0, -blockSize / 2);
    ctx.fillStyle = '#0EA5E9';
    ctx.strokeStyle = '#0369A1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0C4A6E';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('m', 0, 5);
    ctx.textAlign = 'left';
    ctx.restore();

    // Kuch vektorlari (barchasi jism markazidan boshlanadi)
    const fScale = 1.3; // px / N

    if (compToggle && compToggle.checked) {
      dashedArrow(cx, cy, -upX * p.mgPar * fScale, -upY * p.mgPar * fScale, '#FCA5A5', 'mg∥');
      dashedArrow(cx, cy, -normX * p.mgPerp * fScale, -normY * p.mgPerp * fScale, '#FCA5A5', 'mg⊥');
    }

    // Og'irlik mg (dunyoda doim pastga)
    drawArrow(cx, cy, 0, p.mg * fScale, '#F43F5E', 'mg');

    // Normal reaksiya N
    drawArrow(cx, cy, normX * p.N * fScale, normY * p.N * fScale, '#38BDF8', 'N');

    // Tashqi tortish kuchi F (qiyalik bo'ylab yuqoriga)
    if (p.force > 0.5) {
      drawArrow(cx, cy, upX * p.force * fScale, upY * p.force * fScale, '#C084FC', 'F');
    }

    // Ishqalanish kuchi
    if (Math.abs(p.friction) > 0.5) {
      const dir = Math.sign(p.friction);
      drawArrow(cx, cy, upX * dir * Math.abs(p.friction) * fScale, upY * dir * Math.abs(p.friction) * fScale, '#FBBF24', 'f');
    }

    // Natijaviy kuch
    if (netToggle && netToggle.checked && Math.abs(p.netForce) > 0.5) {
      const dir = Math.sign(p.netForce);
      drawArrow(cx, cy, upX * dir * Math.abs(p.netForce) * fScale, upY * dir * Math.abs(p.netForce) * fScale, '#34D399', 'ΣF');
    }
  }

  function loop(time) {
    if (lastTime === null) lastTime = time;
    const dt = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;

    const p = computePhysics();
    integrate(p, dt);
    updateHUD(p);
    draw(p);

    requestAnimationFrame(loop);
  }

  updateLabels();
  setupResponsiveCanvas(canvas, 450 / 800);
  requestAnimationFrame(loop);
}
