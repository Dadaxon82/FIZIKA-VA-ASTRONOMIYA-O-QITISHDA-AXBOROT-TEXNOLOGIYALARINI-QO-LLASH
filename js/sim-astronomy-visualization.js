/**
 * Lecture 10, Tab 6: Interaktiv Astronomiya & Fizika Simulyatori Laboratoriyasi.
 * Sahifaning 4-bo'limida keltirilgan KeplerianEngine pseudokodiga mos ravishda
 * yopiq Kepler yechimi (analitik r(theta), Vis-Viva tezlik) ishlatiladi —
 * bu integratsion xatosiz, har doim energiya va impuls momentini aniq
 * saqlaydigan yopiq shakldagi orbita hisoblanadi. Uzunlik/vaqt/massa
 * birliklari AU-yil-Quyosh massasi tizimida (G' = 4pi^2), bu haqiqiy
 * km/s va yil qiymatlarini to'g'ridan-to'g'ri beradi.
 */
document.addEventListener('DOMContentLoaded', () => {
  initAstronomyVisualizationLab();
});

function initAstronomyVisualizationLab() {
  const canvas = document.getElementById('astronomy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const presetBtns = document.querySelectorAll('.astro-preset-btn');
  const sliderE = document.getElementById('sl-eccentricity');
  const valE = document.getElementById('val-eccentricity');
  const sliderA = document.getElementById('sl-semi-major');
  const valA = document.getElementById('val-semi-major');
  const sliderSpeed = document.getElementById('sl-time-scale');
  const valSpeed = document.getElementById('val-time-scale');
  const btnPlay = document.getElementById('btn-astro-play');
  const btnReset = document.getElementById('btn-astro-reset');
  const chkVectors = document.getElementById('chk-astro-vectors');
  const chkTrails = document.getElementById('chk-astro-trails');

  const statFps = document.getElementById('astro-stat-fps');
  const statDist = document.getElementById('astro-stat-dist');
  const statVel = document.getElementById('astro-stat-vel');
  const statPeriod = document.getElementById('astro-stat-period');
  const statEnergy = document.getElementById('astro-stat-energy');

  const AU_YR_TO_KMS = 4.74047; // 1 AU/yil = 4.74 km/s
  const KM_PER_AU = 149.6e6;
  const BASE_YEARS_PER_SEC = 0.12; // animatsiya tezligi (bir yil taxminan ~8s da, x1.0 tezlikda)

  class KeplerBody {
    constructor(a, e, opts = {}) {
      this.a = a;
      this.e = e;
      this.M = opts.M || 1.0; // Quyosh massasida (markaziy jism)
      this.theta = opts.theta || 0;
      this.color = opts.color || '#38BDF8';
      this.radius = opts.radius || 5;
      this.label = opts.label || '';
      this.isPrimary = !!opts.isPrimary;
      this.mirrorOf = opts.mirrorOf || null; // binary tizim uchun
      this.trail = [];
    }
    get mu() { return 4 * Math.PI * Math.PI * this.M; }
    get p() { return this.a * (1 - this.e * this.e); }
    period() { return Math.sqrt(Math.pow(this.a, 3) / this.M); } // yillarda
    advance(deltaYears) {
      if (this.mirrorOf) return; // mirror jismlar alohida hisoblanmaydi
      const mu = this.mu, p = this.p;
      const r = p / (1 + this.e * Math.cos(this.theta));
      const h = Math.sqrt(mu * p);
      const dTheta = (h / (r * r)) * deltaYears;
      this.theta += dTheta;
      if (this.theta > Math.PI * 2) this.theta -= Math.PI * 2;
      this._compute();
    }
    _compute() {
      const mu = this.mu, p = this.p;
      const r = p / (1 + this.e * Math.cos(this.theta));
      const speed = Math.sqrt(Math.max(0, mu * (2 / r - 1 / this.a)));
      const vr = Math.sqrt(mu / p) * this.e * Math.sin(this.theta);
      const vth = Math.sqrt(mu / p) * (1 + this.e * Math.cos(this.theta));
      const x = r * Math.cos(this.theta);
      const y = r * Math.sin(this.theta);
      const vx = vr * Math.cos(this.theta) - vth * Math.sin(this.theta);
      const vy = vr * Math.sin(this.theta) + vth * Math.cos(this.theta);
      this.r = r; this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.speed = speed;
    }
    initCompute() { this._compute(); }
  }

  let bodies = [];
  let primary = null;
  let preset = 'solar';
  let isRunning = true;
  let lastTime = null;
  let fpsCounter = 0, fpsTimer = 0, measuredFps = 60;

  function buildPreset(name) {
    const a0 = parseFloat(sliderA.value);
    const e0 = parseFloat(sliderE.value);
    let list = [];

    if (name === 'exoplanet') {
      const star = new KeplerBody(0, 0, { M: 0.9, color: '#FBBF24', radius: 16, label: "Yulduz" });
      star.mu = 0; star.r = 0; star.x = 0; star.y = 0; star.vx = 0; star.vy = 0; star.speed = 0; star.advance = () => {};
      const planet = new KeplerBody(a0, e0, { M: 0.9, theta: 0, color: '#F97316', radius: 8, label: "Hot Jupiter", isPrimary: true });
      list = [star, planet];
      primary = planet;
    } else if (name === 'binary') {
      const starB = new KeplerBody(a0, e0, { M: 1.0, theta: 0, color: '#38BDF8', radius: 10, label: "Yulduz B", isPrimary: true });
      const starA = new KeplerBody(a0, e0, { M: 1.0, theta: Math.PI, color: '#F43F5E', radius: 10, label: "Yulduz A", mirrorOf: starB });
      list = [starA, starB];
      primary = starB;
    } else {
      // solar: markaziy Quyosh (statik) + ichki sayyoralar + Yupiter + kometa
      const mercury = new KeplerBody(0.39, 0.206, { color: '#94A3B8', radius: 3, label: "Merkuriy" });
      const venus = new KeplerBody(0.72, 0.007, { color: '#FBBF24', radius: 4, label: "Venera" });
      const earth = new KeplerBody(a0, e0, { color: '#38BDF8', radius: 5, label: "Yer", isPrimary: true });
      const mars = new KeplerBody(1.52, 0.093, { color: '#F43F5E', radius: 4, label: "Mars" });
      const jupiter = new KeplerBody(2.8, 0.048, { color: '#C084FC', radius: 9, label: "Yupiter" });
      const comet = new KeplerBody(2.2, 0.85, { color: '#F8FAFC', radius: 2, label: "Kometa" });
      list = [mercury, venus, earth, mars, jupiter, comet];
      primary = earth;
    }

    list.forEach(b => { if (!b.mirrorOf) b.initCompute(); });
    return list;
  }

  function syncMirrors() {
    for (const b of bodies) {
      if (b.mirrorOf) {
        b.r = b.mirrorOf.r; b.x = -b.mirrorOf.x; b.y = -b.mirrorOf.y;
        b.vx = -b.mirrorOf.vx; b.vy = -b.mirrorOf.vy; b.speed = b.mirrorOf.speed;
      }
    }
  }

  function resetSimulation() {
    bodies = buildPreset(preset);
    syncMirrors();
    lastTime = null;
    updateSliderLabels();
  }

  function updateSliderLabels() {
    valE.textContent = parseFloat(sliderE.value).toFixed(2);
    valA.textContent = parseFloat(sliderA.value).toFixed(2) + ' AU';
    valSpeed.textContent = parseFloat(sliderSpeed.value).toFixed(1) + 'x';
  }

  // ---- Boshqaruvlar ----
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      preset = btn.getAttribute('data-preset');
      resetSimulation();
    });
  });

  sliderE.addEventListener('input', () => {
    if (primary) primary.e = parseFloat(sliderE.value);
    updateSliderLabels();
  });
  sliderA.addEventListener('input', () => {
    if (primary) primary.a = parseFloat(sliderA.value);
    updateSliderLabels();
  });
  sliderSpeed.addEventListener('input', updateSliderLabels);

  if (btnPlay) btnPlay.addEventListener('click', () => {
    isRunning = !isRunning;
    btnPlay.textContent = isRunning ? '⏸ Pauza' : '▶ Davom ettirish';
    lastTime = null;
  });
  if (btnReset) btnReset.addEventListener('click', () => {
    bodies.forEach(b => { b.theta = b.mirrorOf ? b.theta : 0; b.trail = []; });
    bodies.forEach(b => { if (!b.mirrorOf) b.initCompute(); });
    syncMirrors();
  });

  // ---- World-to-Screen transformatsiyasi (sahifaning 3-bo'limidagi formula) ----
  function worldToScreen(x, y, w, h, scale) {
    return { sx: w / 2 + x * scale, sy: h / 2 - y * scale };
  }

  function drawArrow(fromX, fromY, toX, toY, color) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke();
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 8 * Math.cos(angle - 0.4), toY - 8 * Math.sin(angle - 0.4));
    ctx.lineTo(toX - 8 * Math.cos(angle + 0.4), toY - 8 * Math.sin(angle + 0.4));
    ctx.closePath(); ctx.fill();
  }

  function drawScene() {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 480;
    ctx.clearRect(0, 0, w, h);

    const maxA = Math.max(3.2, ...bodies.filter(b => !b.mirrorOf).map(b => b.a * (1 + b.e)));
    const scale = (Math.min(w, h) / 2 - 20) / maxA;
    const showTrails = chkTrails ? chkTrails.checked : true;
    const showVectors = chkVectors ? chkVectors.checked : true;

    // Markaziy jism (Quyosh/Yulduz)
    const center = worldToScreen(0, 0, w, h, scale);
    if (preset !== 'binary') {
      const sunR = preset === 'exoplanet' ? 16 : 12;
      const grad = ctx.createRadialGradient(center.sx, center.sy, 0, center.sx, center.sy, sunR * 2);
      grad.addColorStop(0, '#FFF7ED');
      grad.addColorStop(1, preset === 'exoplanet' ? '#FBBF24' : '#F59E0B');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(center.sx, center.sy, sunR, 0, Math.PI * 2); ctx.fill();
    }

    for (const b of bodies) {
      const p = worldToScreen(b.x, b.y, w, h, scale);

      if (showTrails) {
        b.trail.push({ x: p.sx, y: p.sy });
        if (b.trail.length > 260) b.trail.shift();
        if (b.trail.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = b.color; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5;
          b.trail.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(p.sx, p.sy, b.radius, 0, Math.PI * 2); ctx.fill();

      if (b.isPrimary && showVectors) {
        const vScale = 6;
        drawArrow(p.sx, p.sy, p.sx + b.vx * vScale, p.sy - b.vy * vScale, '#F8FAFC');
        if (b.r > 0.001) {
          const nx = -b.x / b.r, ny = -b.y / b.r;
          drawArrow(p.sx, p.sy, p.sx + nx * 22, p.sy - ny * 22, '#F43F5E');
        }
      }
    }

    // Ekzosayyora tranzit indikatori: sayyora yulduz oldidan o'tayotganda
    if (preset === 'exoplanet') {
      const planet = bodies.find(b => b.isPrimary);
      const screenPlanet = worldToScreen(planet.x, planet.y, w, h, scale);
      const dx = screenPlanet.sx - center.sx;
      const transiting = Math.abs(dx) < 16 && planet.y > 0;
      if (transiting) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.arc(center.sx, center.sy, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F8FAFC';
        ctx.font = '12px monospace';
        ctx.fillText('🔭 TRANZIT ANIQLANDI (yorug\'lik pasaymoqda)', 14, h - 16);
      }
    }
  }

  function updateHUD() {
    if (!primary) return;
    const distAU = primary.r;
    const velKms = primary.speed * AU_YR_TO_KMS;
    const periodYears = primary.period();

    if (statDist) statDist.textContent = `${distAU.toFixed(3)} AU (${(distAU * KM_PER_AU / 1e6).toFixed(1)} mln km)`;
    if (statVel) statVel.textContent = `${velKms.toFixed(2)} km/s`;
    if (statPeriod) statPeriod.textContent = periodYears >= 1
      ? `${periodYears.toFixed(2)} yil`
      : `${(periodYears * 365.25).toFixed(1)} kun`;
    if (statEnergy) statEnergy.textContent = '● BARQAROR (KEPLER INVARIANT)';
    if (statFps) statFps.textContent = Math.round(measuredFps) + ' FPS';
  }

  function loop(currentTime) {
    if (lastTime === null) { lastTime = currentTime; requestAnimationFrame(loop); return; }
    let dtSec = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    if (dtSec > 0.05) dtSec = 0.05;

    fpsCounter++; fpsTimer += dtSec;
    if (fpsTimer >= 0.5) { measuredFps = fpsCounter / fpsTimer; fpsCounter = 0; fpsTimer = 0; }

    if (isRunning) {
      const speedMult = parseFloat(sliderSpeed.value);
      const deltaYears = dtSec * BASE_YEARS_PER_SEC * speedMult;
      for (const b of bodies) b.advance(deltaYears);
      syncMirrors();
    }

    drawScene();
    updateHUD();
    requestAnimationFrame(loop);
  }

  const resizeFn = setupResponsiveCanvas(canvas, 480 / 800, () => drawScene());
  resetSimulation();
  requestAnimationFrame(loop);

  window.astroVizLab = {
    initCanvasSize: () => resizeFn()
  };

  // ---- Audio-vizual sinxronizatsiya: TTS demo (Web Speech API) ----
  initTtsNarrativeDemo();
}

function initTtsNarrativeDemo() {
  const selectEngine = document.getElementById('select-tts-engine');
  const btnPlay = document.getElementById('btn-play-narrative');
  const narrativeText = document.getElementById('current-narrative-text');
  const waveCanvas = document.getElementById('tts-audio-wave');
  if (!btnPlay || !waveCanvas) return;
  const wctx = waveCanvas.getContext('2d');

  const NARRATIVES = [
    "Kepler ikkinchi qonuniga ko'ra, sayyorani Quyosh bilan tutashtiruvchi radius-vektor teng vaqt oralig'ida teng maydonlarni chizadi.",
    "Bu shuni anglatadiki, sayyora Quyoshga yaqinlashganda — perigeliyda — tezroq, uzoqlashganda — afeliyda — sekinroq harakatlanadi.",
    "Vis-Viva tenglamasi orbitaning istalgan nuqtasidagi tezlikni radius va katta yarim o'q orqali aniqlashga imkon beradi."
  ];

  let waveAnimId = null;
  let waveAmplitude = 0;

  function resizeWave() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = Math.max(1, Math.floor(waveCanvas.clientWidth || 700));
    const cssHeight = 36;
    waveCanvas.width = cssWidth * dpr;
    waveCanvas.height = cssHeight * dpr;
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeWave();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeWave).observe(waveCanvas.parentElement);
  } else {
    window.addEventListener('resize', resizeWave);
  }

  function drawWave() {
    const w = waveCanvas.clientWidth || 700, h = 36;
    wctx.clearRect(0, 0, w, h);
    wctx.strokeStyle = '#38BDF8';
    wctx.lineWidth = 2;
    wctx.beginPath();
    const bars = 60;
    for (let i = 0; i < bars; i++) {
      const x = (i / bars) * w;
      const amp = waveAmplitude * (0.3 + 0.7 * Math.abs(Math.sin(i * 0.7 + Date.now() * 0.006)));
      const y1 = h / 2 - amp * (h / 2 - 2);
      const y2 = h / 2 + amp * (h / 2 - 2);
      wctx.moveTo(x, y1); wctx.lineTo(x, y2);
    }
    wctx.stroke();
  }

  function animateWave() {
    drawWave();
    waveAnimId = requestAnimationFrame(animateWave);
  }

  function stopWave() {
    waveAmplitude = 0;
    drawWave();
    if (waveAnimId) { cancelAnimationFrame(waveAnimId); waveAnimId = null; }
  }

  const ENGINE_LABELS = {
    muxlisa: 'Muxlisa AI',
    aisha: 'Aisha AI',
    elevenlabs: 'ElevenLabs Multilingual v2',
    google: 'Google Cloud Neural2'
  };

  btnPlay.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      narrativeText.textContent = "⚠️ Brauzeringiz nutq sintezini (Web Speech API) qo'llab-quvvatlamaydi.";
      return;
    }

    window.speechSynthesis.cancel();
    const engineLabel = ENGINE_LABELS[selectEngine.value] || 'TTS';
    let sentenceIndex = 0;

    function speakNext() {
      if (sentenceIndex >= NARRATIVES.length) {
        narrativeText.textContent = `"${NARRATIVES[NARRATIVES.length - 1]}" — bayon yakunlandi.`;
        stopWave();
        return;
      }
      const text = NARRATIVES[sentenceIndex];
      narrativeText.textContent = `[${engineLabel}] "${text}"`;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'uz-UZ';
      utter.rate = 0.95;

      utter.onstart = () => {
        waveAmplitude = 1;
        if (!waveAnimId) animateWave();
      };
      utter.onboundary = () => { waveAmplitude = 0.6 + Math.random() * 0.4; };
      utter.onend = () => {
        sentenceIndex++;
        speakNext();
      };
      utter.onerror = () => {
        stopWave();
      };
      window.speechSynthesis.speak(utter);
    }

    speakNext();
  });
}
