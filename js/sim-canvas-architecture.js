/**
 * Lecture 7, Tab 6: Interaktiv Canvas Fizik Animatsiya Arxitekturasi
 * Laboratoriyasi. Sahifaning o'zida (3-bo'lim) ko'rsatilgan Glenn Fiedler
 * "Fix Your Timestep" akkumulyator algoritmining jonli demonstratsiyasi:
 * uchta rejim — Fixed dt + Alpha interpolyatsiya, Fixed dt akkumulyator
 * (interpolyatsiyasiz) va O'zgaruvchan dt — bitta zarracha to'qnashuv
 * simulyatsiyasida taqqoslanadi.
 */
document.addEventListener('DOMContentLoaded', () => {
  initCanvasArchitecture();
});

function initCanvasArchitecture() {
  const canvas = document.getElementById('arch-canvas');
  const graphCanvas = document.getElementById('arch-graph-canvas');
  if (!canvas || !graphCanvas) return;
  const ctx = canvas.getContext('2d');
  const gctx = graphCanvas.getContext('2d');

  const modeSelect = document.getElementById('arch-mode');
  const fpsSlider = document.getElementById('arch-fps');
  const fpsVal = document.getElementById('arch-fps-val');
  const cpuLoadSlider = document.getElementById('arch-cpu-load');
  const cpuLoadVal = document.getElementById('arch-cpu-load-val');
  const countSlider = document.getElementById('arch-count');
  const countVal = document.getElementById('arch-count-val');
  const poolToggle = document.getElementById('arch-pool-toggle');
  const btnPlay = document.getElementById('arch-play-btn');
  const btnReset = document.getElementById('arch-reset-btn');

  const hudFps = document.getElementById('arch-hud-fps');
  const hudPhysFps = document.getElementById('arch-hud-phys-fps');
  const hudDt = document.getElementById('arch-hud-dt');
  const hudAcc = document.getElementById('arch-hud-acc');
  const hudSteps = document.getElementById('arch-hud-steps');
  const hudJank = document.getElementById('arch-hud-jank');

  const GRAVITY = 480; // px/s^2
  const RESTITUTION = 0.82;
  const FIXED_DELTA = 1 / 60;
  const MAX_FRAME_TIME = 0.25; // "O'lim spirali" himoyasi

  let isRunning = true;
  let accumulator = 0;
  let lastTime = null;
  let lastProcessedTime = null;
  let jankCount = 0;
  let physicsStepsPerSec = 60;
  let physicsStepCounter = 0;
  let physicsStepTimer = 0;
  let renderFpsCounter = 0;
  let renderFpsTimer = 0;
  let measuredRenderFps = 60;
  const frameHistory = []; // ms, pacing grafigi uchun
  const MAX_HISTORY = 90;

  let particles = [];

  function createParticle() {
    const r = 6 + Math.random() * 6;
    return {
      x: Math.random() * 700 + 40,
      y: Math.random() * 150 + 20,
      vx: (Math.random() - 0.5) * 220,
      vy: Math.random() * 60,
      r,
      prevX: 0,
      prevY: 0
    };
  }

  function setParticleCount(n) {
    const pooling = poolToggle ? poolToggle.checked : true;
    if (pooling) {
      while (particles.length < n) particles.push(createParticle());
      particles.length = n;
    } else {
      // Pooling o'chirilganda: har safar butunlay yangi massiv va
      // obyektlar yaratiladi (haqiqiy GC bosimini ko'rsatish uchun).
      const fresh = [];
      for (let i = 0; i < n; i++) {
        fresh.push(i < particles.length ? Object.assign({}, particles[i]) : createParticle());
      }
      particles = fresh;
    }
  }

  function resetSimulation() {
    particles = [];
    setParticleCount(parseInt(countSlider.value, 10));
    accumulator = 0;
    jankCount = 0;
    frameHistory.length = 0;
    lastTime = null;
    lastProcessedTime = null;
    if (hudJank) hudJank.textContent = '0';
  }

  // ---- Boshqaruvlar ----
  if (fpsSlider) {
    fpsSlider.addEventListener('input', () => {
      const v = parseInt(fpsSlider.value, 10);
      fpsVal.textContent = v >= 120 ? "Cheklovsiz (V-Sync)" : v + ' FPS';
    });
  }
  if (cpuLoadSlider) {
    cpuLoadSlider.addEventListener('input', () => {
      cpuLoadVal.textContent = parseFloat(cpuLoadSlider.value).toFixed(1) + ' ms';
    });
  }
  if (countSlider) {
    countSlider.addEventListener('input', () => {
      const n = parseInt(countSlider.value, 10);
      countVal.textContent = n + ' ta';
      setParticleCount(n);
    });
  }
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      isRunning = !isRunning;
      btnPlay.textContent = isRunning ? "⏸ To'xtatish" : "▶ Davom ettirish";
      lastTime = null; // pauzadan keyin katta dt sakramasligi uchun
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', resetSimulation);
  }

  // ---- Fizika ----
  function stepParticle(p, dt) {
    p.prevX = p.x;
    p.prevY = p.y;

    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 420;

    if (p.x - p.r < 0) { p.x = p.r; p.vx = -p.vx * RESTITUTION; }
    else if (p.x + p.r > w) { p.x = w - p.r; p.vx = -p.vx * RESTITUTION; }

    if (p.y - p.r < 0) { p.y = p.r; p.vy = -p.vy * RESTITUTION; }
    else if (p.y + p.r > h) {
      p.y = h - p.r;
      p.vy = -p.vy * RESTITUTION;
      if (Math.abs(p.vy) < 20) p.vy = 0;
    }
  }

  function updatePhysics(dt) {
    for (const p of particles) stepParticle(p, dt);
    physicsStepCounter++;
  }

  // ---- Chizish ----
  function drawScene(alpha) {
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 420;
    ctx.clearRect(0, 0, w, h);

    // Fon panjarasi (statik "qatlam" — bitta chizish, xotira tejash tamoyili)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y < h; y += 40) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    const usePool = poolToggle ? poolToggle.checked : true;
    ctx.fillStyle = usePool ? '#38BDF8' : '#F43F5E';

    for (const p of particles) {
      let rx = p.x, ry = p.y;
      if (typeof alpha === 'number') {
        rx = p.prevX * (1 - alpha) + p.x * alpha;
        ry = p.prevY * (1 - alpha) + p.y * alpha;
      }
      // "Butun sonli koordinatalar" optimizatsiyasi (4-bo'limda tavsiflangan)
      rx = Math.round(rx);
      ry = Math.round(ry);
      ctx.beginPath();
      ctx.arc(rx, ry, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(10, 10, 190, 26, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px sans-serif';
    const modeLabels = {
      'fixed-interp': 'Fixed dt + Interpolyatsiya',
      'fixed': 'Fixed dt Akkumulyator',
      'variable': "O'zgaruvchan dt"
    };
    ctx.fillText('Rejim: ' + (modeLabels[modeSelect.value] || ''), 20, 27);
  }

  function drawPacingGraph() {
    const w = graphCanvas.clientWidth || 800;
    const h = graphCanvas.clientHeight || 90;
    gctx.clearRect(0, 0, w, h);

    const barW = w / MAX_HISTORY;
    for (let i = 0; i < frameHistory.length; i++) {
      const ms = frameHistory[i];
      const barH = Math.min(h, (ms / 33) * h);
      const x = i * barW;
      const y = h - barH;
      gctx.fillStyle = ms < 18 ? '#34D399' : (ms <= 25 ? '#FBBF24' : '#F43F5E');
      gctx.fillRect(x, y, Math.max(1, barW - 1), barH);
    }

    // 60fps chegara chizig'i (~16.6ms)
    const refY = h - (16.6 / 33) * h;
    gctx.strokeStyle = 'rgba(148,163,184,0.4)';
    gctx.setLineDash([4, 3]);
    gctx.beginPath();
    gctx.moveTo(0, refY);
    gctx.lineTo(w, refY);
    gctx.stroke();
    gctx.setLineDash([]);
  }

  function updateHUD() {
    hudFps.textContent = Math.round(measuredRenderFps) + ' FPS';
    hudPhysFps.textContent = Math.round(physicsStepsPerSec) + ' Hz';
    if (hudJank) hudJank.textContent = String(jankCount);
  }

  // ---- Asosiy tsikl (Glenn Fiedler akkumulyatori) ----
  function loop(currentTime) {
    if (lastTime === null) {
      lastTime = currentTime;
      lastProcessedTime = currentTime;
      requestAnimationFrame(loop);
      return;
    }

    const fpsThrottle = parseInt(fpsSlider.value, 10);
    if (fpsThrottle < 120) {
      const minInterval = 1000 / fpsThrottle;
      if (currentTime - lastProcessedTime < minInterval) {
        requestAnimationFrame(loop);
        return;
      }
    }
    lastProcessedTime = currentTime;

    // Sun'iy CPU yuklamasi (band-tsikl orqali lag simulyatsiyasi)
    const cpuLoadMs = cpuLoadSlider ? parseFloat(cpuLoadSlider.value) : 0;
    if (cpuLoadMs > 0) {
      const busyUntil = performance.now() + cpuLoadMs;
      while (performance.now() < busyUntil) { /* sun'iy CPU band qilish */ }
    }

    let frameTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    const frameMs = frameTime * 1000;

    frameHistory.push(frameMs);
    if (frameHistory.length > MAX_HISTORY) frameHistory.shift();
    if (frameMs > 25) jankCount++;

    renderFpsCounter++;
    renderFpsTimer += frameTime;
    if (renderFpsTimer >= 0.5) {
      measuredRenderFps = renderFpsCounter / renderFpsTimer;
      renderFpsCounter = 0;
      renderFpsTimer = 0;
    }

    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    let steps = 0;
    let alpha = 1;

    if (isRunning) {
      const mode = modeSelect.value;

      if (mode === 'variable') {
        updatePhysics(frameTime);
        steps = 1;
        accumulator = 0;
        physicsStepTimer += frameTime;
        physicsStepCounter = 0; // Hz alohida hisoblanadi pastda
      } else {
        accumulator += frameTime;
        while (accumulator >= FIXED_DELTA) {
          updatePhysics(FIXED_DELTA);
          accumulator -= FIXED_DELTA;
          steps++;
        }
        alpha = accumulator / FIXED_DELTA;
      }

      physicsStepTimer += frameTime;
      if (physicsStepTimer >= 0.5) {
        physicsStepsPerSec = mode === 'variable'
          ? measuredRenderFps
          : (steps > 0 || physicsStepCounter > 0 ? 60 : physicsStepsPerSec);
        physicsStepTimer = 0;
      }
      if (mode !== 'variable') physicsStepsPerSec = 60;
    }

    const mode = modeSelect.value;
    if (mode === 'fixed-interp') {
      drawScene(alpha);
    } else {
      drawScene(null);
    }
    drawPacingGraph();

    hudDt.textContent = frameMs.toFixed(1) + ' ms';
    hudAcc.textContent = (accumulator * 1000).toFixed(1) + ' ms';
    hudSteps.textContent = String(steps);
    updateHUD();

    requestAnimationFrame(loop);
  }

  countVal.textContent = countSlider.value + ' ta';
  fpsVal.textContent = parseInt(fpsSlider.value, 10) >= 120 ? "Cheklovsiz (V-Sync)" : fpsSlider.value + ' FPS';
  cpuLoadVal.textContent = parseFloat(cpuLoadSlider.value).toFixed(1) + ' ms';

  resetSimulation();
  setupResponsiveCanvas(canvas, 420 / 800);
  setupResponsiveCanvas(graphCanvas, 90 / 800);
  requestAnimationFrame(loop);
}
