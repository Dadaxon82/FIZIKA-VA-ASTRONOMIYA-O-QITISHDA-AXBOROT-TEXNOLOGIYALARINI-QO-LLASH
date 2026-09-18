(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const text = (selector, value) => { const el = $(selector); if (el) el.textContent = value; };
  const TAU = Math.PI * 2;

  // ---------- Navigation ----------
  const menuButton = $('.menu-toggle');
  const nav = $('.nav-links');
  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? '✕' : '☰';
  });
  $$('.nav-links a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = '☰';
  }));

  // Render at device-pixel resolution without distorting the CSS layout.
  function canvasContext(canvas) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  }

  // ---------- Simulator tabs ----------
  const tabs = $$('.sim-tab');
  const panels = $$('.sim-content');
  function switchSimulator(name) {
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.sim === name));
    panels.forEach(panel => { panel.hidden = panel.id !== `sim-${name}`; });
  }
  tabs.forEach(tab => tab.addEventListener('click', () => switchSimulator(tab.dataset.sim)));
  switchSimulator('pendulum');

  // ---------- Damped nonlinear pendulum ----------
  const pendulum = { running: true, theta: Math.PI / 3, omega: 0, L: 1.5, g: 9.81, gamma: .15, t: 0, path: [], accumulator: 0, last: performance.now() };
  const pCanvas = $('#canvas-pendulum');
  const phaseCanvas = $('#canvas-phase');
  const p = { L: $('#pend-L'), theta: $('#pend-theta'), gamma: $('#pend-gamma'), g: $('#pend-g'), play: $('#pend-play'), reset: $('#pend-reset') };
  const pendulumDerivative = (theta, omega) => [omega, -(pendulum.g / pendulum.L) * Math.sin(theta) - pendulum.gamma * omega];

  function integratePendulum(dt) {
    const [k1t, k1o] = pendulumDerivative(pendulum.theta, pendulum.omega);
    const [k2t, k2o] = pendulumDerivative(pendulum.theta + k1t * dt / 2, pendulum.omega + k1o * dt / 2);
    const [k3t, k3o] = pendulumDerivative(pendulum.theta + k2t * dt / 2, pendulum.omega + k2o * dt / 2);
    const [k4t, k4o] = pendulumDerivative(pendulum.theta + k3t * dt, pendulum.omega + k3o * dt);
    pendulum.theta += dt * (k1t + 2 * k2t + 2 * k3t + k4t) / 6;
    pendulum.omega += dt * (k1o + 2 * k2o + 2 * k3o + k4o) / 6;
    pendulum.t += dt;
  }

  function updatePendulumLabels() {
    text('#pend-L-value', `${pendulum.L.toFixed(2)} m`);
    text('#pend-theta-value', `${(pendulum.theta * 180 / Math.PI).toFixed(1)}°`);
    text('#pend-gamma-value', `${pendulum.gamma.toFixed(2)} s⁻¹`);
    text('#pend-g-value', `${pendulum.g.toFixed(2)} m/s²`);
  }

  function resetPendulum() {
    pendulum.L = Number(p.L?.value ?? pendulum.L);
    pendulum.theta = Number(p.theta?.value ?? (pendulum.theta * 180 / Math.PI)) * Math.PI / 180;
    pendulum.gamma = Number(p.gamma?.value ?? pendulum.gamma);
    pendulum.g = Number(p.g?.value ?? pendulum.g);
    pendulum.omega = 0;
    pendulum.t = 0;
    pendulum.accumulator = 0;
    pendulum.path = [];
    updatePendulumLabels();
  }

  function togglePendulum() {
    pendulum.running = !pendulum.running;
    if (p.play) p.play.textContent = pendulum.running ? 'To‘xtatish' : 'Boshlash';
  }

  [p.L, p.theta, p.gamma, p.g].forEach(el => el?.addEventListener('input', resetPendulum));
  p.play?.addEventListener('click', togglePendulum);
  p.reset?.addEventListener('click', resetPendulum);

  function drawPendulum() {
    const a = canvasContext(pCanvas);
    if (!a) return;

    const { ctx, width: w, height: h } = a;
    ctx.clearRect(0, 0, w, h);
    const pivotX = w / 2;
    const pivotY = 28;
    const length = Math.min(w * .38, h * .78) * (pendulum.L / 3);
    const bobX = pivotX + Math.sin(pendulum.theta) * length;
    const bobY = pivotY + Math.cos(pendulum.theta) * length;

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, TAU);
    ctx.fill();

    const glow = ctx.createRadialGradient(bobX - 3, bobY - 4, 1, bobX, bobY, 17);
    glow.addColorStop(0, '#fff');
    glow.addColorStop(.4, '#22d3ee');
    glow.addColorStop(1, '#2563eb');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bobX, bobY, 14, 0, TAU);
    ctx.fill();

    if (phaseCanvas) {
      const ph = canvasContext(phaseCanvas);
      if (ph) {
        const pc = ph.ctx;
        const pw = ph.width;
        const phh = ph.height;
        pc.clearRect(0, 0, pw, phh);
        pc.strokeStyle = '#24344f';
        pc.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
          pc.beginPath();
          pc.moveTo(i * pw / 6, 0);
          pc.lineTo(i * pw / 6, phh);
          pc.moveTo(0, i * phh / 6);
          pc.lineTo(pw, i * phh / 6);
          pc.stroke();
        }
        pendulum.path.push([pendulum.theta, pendulum.omega]);
        if (pendulum.path.length > 500) pendulum.path.shift();

        pc.beginPath();
        pendulum.path.forEach(([x, y], i) => {
          const px = pw / 2 + x * pw / 2.8;
          const py = phh / 2 - y * phh / 5;
          if (i === 0) pc.moveTo(px, py);
          else pc.lineTo(px, py);
        });
        pc.strokeStyle = '#a78bfa';
        pc.lineWidth = 2;
        pc.stroke();
      }
    }

    text('#pend-stat', `t ${pendulum.t.toFixed(2)} s · ω ${pendulum.omega.toFixed(2)} rad/s`);
  }

  // ---------- Charged particle in uniform B field ----------
  const lorentz = { running: true, B: 1.5, q: 1, vp: 2, vz: .8, t: 0 };
  const lCanvas = $('#canvas-lorentz');
  const l = { B: $('#lorentz-B'), q: $('#lorentz-q'), vp: $('#lorentz-vp'), vz: $('#lorentz-vz'), play: $('#lorentz-play'), reset: $('#lorentz-reset') };
  function updateLorentz() {
    lorentz.B = Number(l.B.value); lorentz.q = Number(l.q.value); lorentz.vp = Number(l.vp.value); lorentz.vz = Number(l.vz.value);
    const wc = lorentz.q * lorentz.B;
    text('#lorentz-B-value', `${lorentz.B.toFixed(1)} T`); text('#lorentz-q-value', `${lorentz.q > 0 ? '+' : ''}${lorentz.q.toFixed(1)} e`);
    text('#lorentz-vp-value', `${lorentz.vp.toFixed(1)} m/s`); text('#lorentz-vz-value', `${lorentz.vz.toFixed(1)} m/s`);
    text('#lorentz-stat', `ωc ${wc.toFixed(2)} rad/s · R ${(lorentz.vp / Math.max(Math.abs(wc), .01)).toFixed(2)} m`);
  }
  function resetLorentz() { lorentz.t = 0; updateLorentz(); }
  function toggleLorentz() { lorentz.running = !lorentz.running; l.play.textContent = lorentz.running ? 'To‘xtatish' : 'Boshlash'; }
  [l.B, l.q, l.vp, l.vz].forEach(el => el?.addEventListener('input', updateLorentz)); l.play?.addEventListener('click', toggleLorentz); l.reset?.addEventListener('click', resetLorentz);
  function drawLorentz() {
    const a = canvasContext(lCanvas); if (!a) return; const { ctx, width: w, height: h } = a;
    ctx.clearRect(0, 0, w, h); if (lorentz.running) lorentz.t += .025;
    const wc = lorentz.q * lorentz.B; const omega = Math.abs(wc); const radius = lorentz.vp / Math.max(omega, .01);
    const path = 260; const scale = Math.min(w * .55 / Math.max(lorentz.vz * 3, .1), h * .28 / Math.max(radius, .1));
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i < path; i++) {
      const u = i / (path - 1); const time = lorentz.t - (1 - u) * 4;
      const angle = wc * time; const x = w * .12 + u * w * .76; const y = h / 2 + Math.sin(angle) * radius * scale;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    const endAngle = wc * lorentz.t; const ex = w * .88; const ey = h / 2 + Math.sin(endAngle) * radius * scale;
    ctx.fillStyle = '#f0fdfa'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(ex, ey, 8, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8'; ctx.font = '12px JetBrains Mono'; ctx.fillText('z →', w * .87, h - 16);
  }

  // ---------- Doppler wavefronts ----------
  const doppler = { running: true, mach: .6, period: 12, t: 0, emissions: [] };
  const dCanvas = $('#canvas-doppler'); const d = { mach: $('#doppler-mach'), period: $('#doppler-period'), play: $('#doppler-play'), reset: $('#doppler-reset') };
  function updateDoppler() { doppler.mach = Number(d.mach.value); doppler.period = Number(d.period.value); text('#doppler-mach-value', `${doppler.mach.toFixed(2)} M`); text('#doppler-period-value', `${doppler.period} kadr`); text('#doppler-stat', doppler.mach < 1 ? 'Subsonik · c = 1' : doppler.mach < 1.2 ? 'Transonik' : 'Supersonik · Mach cone'); }
  function toggleDoppler() { doppler.running = !doppler.running; d.play.textContent = doppler.running ? 'To‘xtatish' : 'Boshlash'; }
  function resetDoppler() { doppler.t = 0; doppler.emissions = []; updateDoppler(); }
  [d.mach, d.period].forEach(el => el?.addEventListener('input', updateDoppler)); d.play?.addEventListener('click', toggleDoppler); d.reset?.addEventListener('click', resetDoppler);
  function drawDoppler() {
    const a = canvasContext(dCanvas); if (!a) return; const { ctx, width: w, height: h } = a;
    ctx.clearRect(0, 0, w, h); if (doppler.running) doppler.t += .016;
    const sx = w * .2 + doppler.t * 35 * doppler.mach; const sy = h / 2; const c = 35;
    const emissionInterval = doppler.period / 60;
    if (!doppler.emissions.length || doppler.t - doppler.emissions.at(-1) >= emissionInterval) doppler.emissions.push(doppler.t);
    doppler.emissions = doppler.emissions.filter(te => doppler.t - te < 20);
    doppler.emissions.forEach(te => {
      const age = doppler.t - te; const radius = c * age; const centerX = w * .2 + te * 35 * doppler.mach;
      if (radius > 1) { ctx.beginPath(); ctx.arc(centerX, sy, radius, 0, TAU); ctx.strokeStyle = `rgba(251,113,133,${Math.max(0, 1 - age / 20)})`; ctx.lineWidth = 1.3; ctx.stroke(); }
    });
    const sourceX = Math.min(w - 20, sx); ctx.fillStyle = '#fb7185'; ctx.shadowColor = '#fb7185'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(sourceX, sy, 9, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    if (doppler.mach >= 1) { const half = Math.asin(1 / doppler.mach); ctx.strokeStyle = '#fda4af'; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(sourceX, sy); ctx.lineTo(sourceX - Math.cos(half) * h, sy - Math.sin(half) * h); ctx.moveTo(sourceX, sy); ctx.lineTo(sourceX - Math.cos(half) * h, sy + Math.sin(half) * h); ctx.stroke(); ctx.setLineDash([]); }
  }

  // ---------- Young double-slit ----------
  const young = { lambda: 532, d: .25, D: 1.2 }; const yCanvas = $('#canvas-young'); const y = { lambda: $('#young-lambda'), d: $('#young-d'), D: $('#young-D') };
  function fringeSpacingMm() { return (young.lambda * 1e-9 * young.D / (young.d * 1e-3)) * 1e3; }
  function updateYoung() { young.lambda = Number(y.lambda.value); young.d = Number(y.d.value); young.D = Number(y.D.value); text('#young-lambda-value', `${young.lambda} nm`); text('#young-d-value', `${young.d.toFixed(2)} mm`); text('#young-D-value', `${young.D.toFixed(2)} m`); text('#young-stat', `β = ${fringeSpacingMm().toFixed(2)} mm`); }
  [y.lambda, y.d, y.D].forEach(el => el?.addEventListener('input', updateYoung));
  function drawYoung() {
    const a = canvasContext(yCanvas); if (!a) return; const { ctx, width: w, height: h } = a; ctx.clearRect(0, 0, w, h);
    const beta = fringeSpacingMm(); const visibleWidthMm = Math.max(beta * 5, 18);
    for (let x = 0; x < w; x++) { const positionMm = (x - w / 2) / w * visibleWidthMm; const intensity = .06 + .94 * Math.cos(Math.PI * positionMm / beta) ** 2; ctx.fillStyle = `rgba(52,211,153,${intensity})`; ctx.fillRect(x, 0, 1, h); }
    ctx.fillStyle = '#d1fae5'; ctx.font = '12px JetBrains Mono'; ctx.fillText(`I(x) = I₀ cos²(πx/β),  β = ${beta.toFixed(2)} mm`, 16, 24);
    ctx.strokeStyle = '#fff'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke(); ctx.globalAlpha = 1;
  }

  // ---------- Prompt, scoring and animation ----------
  $('#generate-prompt')?.addEventListener('click', () => { const topic = $('#topic').value.trim() || 'Garmonik tebranishlar'; const level = $('#level').value; $('#prompt-output').textContent = `Siz fizika o‘qituvchisiz.\nMavzu: ${topic}\nDaraja: ${level}\n\n10 ta diagnostik savol tuzing. Har bir savolda to‘g‘ri javob, qisqa izoh va tipik xatoni ko‘rsating. Yakunda natijaga qarab 3 ta individual o‘quv yo‘lini tavsiya qiling.`; });
  async function copyScenario() { const value = 'Hook → Core Concept → Misconception → Simulation Task\n\nFizik hodisani tushuntiring, formulani SI birliklarda yozing va HTML Canvas simulyatsiyasi uchun tekshiriladigan topshiriq bering.'; try { await navigator.clipboard.writeText(value); text('#copy-status', 'Nusxa olindi ✓'); setTimeout(() => text('#copy-status', 'Nusxa olish'), 1500); } catch { alert('Nusxa olish uchun brauzer ruxsati berilmadi.'); } }
  $('#copy-scenario')?.addEventListener('click', copyScenario);
  const weights = [.3, .25, .2, .15, .1];
  function calculateScore() { let total = 0; weights.forEach((weight, i) => { const input = $(`#score-${i + 1}`); const value = Number(input.value); total += value * weight; text(`#score-${i + 1}-value`, `${value} ball`); }); text('#total-score', `Umumiy: ${total.toFixed(1)} / 100`); }
  $$('.score').forEach(el => el.addEventListener('input', calculateScore));

  function frame(now) {
    const elapsed = Math.min(.1, (now - pendulum.last) / 1000 || 0); pendulum.last = now;
    if (pendulum.running) { pendulum.accumulator += elapsed; while (pendulum.accumulator >= .01) { integratePendulum(.01); pendulum.accumulator -= .01; } }
    drawPendulum(); drawLorentz(); drawDoppler(); drawYoung(); requestAnimationFrame(frame);
  }
  window.addEventListener('resize', () => { drawPendulum(); drawLorentz(); drawDoppler(); drawYoung(); });
  resetPendulum(); updateLorentz(); updateDoppler(); updateYoung(); calculateScore(); requestAnimationFrame(frame);
})();
