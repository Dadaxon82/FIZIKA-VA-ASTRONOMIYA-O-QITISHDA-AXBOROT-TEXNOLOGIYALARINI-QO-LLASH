/**
 * Lecture 10, Tab 6: Interaktiv Astronomiya & Fizika Simulyatori Laboratoriyasi.
 * Sahifaning 4-bo'limida keltirilgan KeplerianEngine pseudokodiga mos ravishda
 * yopiq Kepler yechimi (analitik r(theta), Vis-Viva tezlik) ishlatiladi —
 * bu integratsion xatosiz, har doim energiya va impuls momentini aniq
 * saqlaydigan yopiq shakldagi orbita hisoblanadi. Uzunlik/vaqt/massa
 * birliklari AU-yil-Quyosh massasi tizimida (G' = 4pi^2), bu haqiqiy
 * km/s va yil qiymatlarini to'g'ridan-to'g'ri beradi.
 *
 * Vizuallashtirish uchun Three.js orqali haqiqiy 3D sahna ishlatiladi
 * (OrbitControls bilan sichqoncha/barmoq orqali aylantirish/kattalashtirish).
 */
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

document.addEventListener('DOMContentLoaded', () => {
  initAstronomyVisualizationLab();
});

function initAstronomyVisualizationLab() {
  const canvas = document.getElementById('astronomy-canvas');
  if (!canvas) return;

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
  const TRAIL_LEN = 220;

  // ---- Fizika: Kepler yopiq yechimi (o'zgarishsiz) ----
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
      const star = new KeplerBody(0, 0, { M: 0.9, color: '#FBBF24', radius: 0.34, label: "Yulduz" });
      star.r = 0; star.x = 0; star.y = 0; star.vx = 0; star.vy = 0; star.speed = 0; star.advance = () => {};
      const planet = new KeplerBody(a0, e0, { M: 0.9, theta: 0, color: '#F97316', radius: 0.14, label: "Hot Jupiter", isPrimary: true });
      list = [star, planet];
      primary = planet;
    } else if (name === 'binary') {
      const starB = new KeplerBody(a0, e0, { M: 1.0, theta: 0, color: '#38BDF8', radius: 0.2, label: "Yulduz B", isPrimary: true });
      const starA = new KeplerBody(a0, e0, { M: 1.0, theta: Math.PI, color: '#F43F5E', radius: 0.2, label: "Yulduz A", mirrorOf: starB });
      list = [starA, starB];
      primary = starB;
    } else {
      // solar: markaziy Quyosh (statik) + ichki sayyoralar + Yupiter + kometa
      const mercury = new KeplerBody(0.39, 0.206, { color: '#94A3B8', radius: 0.05, label: "Merkuriy" });
      const venus = new KeplerBody(0.72, 0.007, { color: '#FBBF24', radius: 0.07, label: "Venera" });
      const earth = new KeplerBody(a0, e0, { color: '#38BDF8', radius: 0.08, label: "Yer", isPrimary: true });
      const mars = new KeplerBody(1.52, 0.093, { color: '#F43F5E', radius: 0.06, label: "Mars" });
      const jupiter = new KeplerBody(2.8, 0.048, { color: '#C084FC', radius: 0.16, label: "Yupiter" });
      const comet = new KeplerBody(2.2, 0.85, { color: '#F8FAFC', radius: 0.03, label: "Kometa" });
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

  // ==========================================================================
  // 3D SAHNA (Three.js)
  // ==========================================================================
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f19);
  scene.fog = new THREE.FogExp2(0x0b0f19, 0.018);

  const camera = new THREE.PerspectiveCamera(48, 800 / 480, 0.05, 500);
  camera.position.set(4.5, 4.2, 7.5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.2;
  controls.maxDistance = 30;
  controls.target.set(0, 0, 0);

  // Yulduzlar foni
  {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 60 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: true, transparent: true, opacity: 0.75 });
    scene.add(new THREE.Points(starGeo, starMat));
  }

  const ambientLight = new THREE.AmbientLight(0x404860, 1.1);
  scene.add(ambientLight);
  const centerLight = new THREE.PointLight(0xfff2d9, 3.2, 60, 1.6);
  scene.add(centerLight);

  // Markaziy jism (Quyosh/Yulduz) mesh(lar)i — preset almashganda qayta yaratiladi
  let centerMeshes = [];
  function clearCenterMeshes() {
    centerMeshes.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
    centerMeshes = [];
  }
  function addStarMesh(radius, color) {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    centerMeshes.push(mesh);

    const glowGeo = new THREE.SphereGeometry(radius * 1.8, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.16, depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);
    centerMeshes.push(glow);
    return mesh;
  }

  // Har bir jism uchun: mesh, orbita chizig'i, iz (trail)
  const bodyViews = new Map();

  function makeOrbitLine(body, color, mirror) {
    // "mirror" — binary tizimda ikkinchi yulduzning orbitasi, teng massalar
    // taxminida barysentr (koordinata boshi) atrofida nuqtaviy simmetrik
    // bo'ladi (r_A = -r_B), shu sababli oddiy 180° burilish emas, aynan
    // nuqtaviy aks (x,z) -> (-x,-z) qo'llaniladi.
    const points = [];
    const N = 128;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2;
      const r = body.p / (1 + body.e * Math.cos(th));
      let x = r * Math.cos(th);
      let z = -r * Math.sin(th);
      if (mirror) { x = -x; z = -z; }
      points.push(new THREE.Vector3(x, 0, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });
    return new THREE.Line(geo, mat);
  }

  function makeTrailLine(color) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_LEN * 3), 3));
    geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 });
    return new THREE.Line(geo, mat);
  }

  function rebuildBodyViews() {
    // eski ko'rinishlarni tozalash
    for (const view of bodyViews.values()) {
      scene.remove(view.mesh, view.orbit, view.trail, view.velocityArrow, view.gravityArrow);
      view.mesh.geometry.dispose(); view.mesh.material.dispose();
      view.orbit.geometry.dispose(); view.orbit.material.dispose();
      view.trail.geometry.dispose(); view.trail.material.dispose();
    }
    bodyViews.clear();
    clearCenterMeshes();

    if (preset === 'exoplanet') {
      addStarMesh(0.34, 0xfbbf24);
    } else if (preset !== 'binary') {
      addStarMesh(0.26, 0xf59e0b);
    }

    for (const b of bodies) {
      const colorNum = new THREE.Color(b.color).getHex();
      const geo = new THREE.SphereGeometry(b.radius, 20, 16);
      const mat = new THREE.MeshStandardMaterial({ color: colorNum, roughness: 0.6, metalness: 0.1, emissive: colorNum, emissiveIntensity: 0.15 });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      const orbit = b.mirrorOf ? makeOrbitLine(b.mirrorOf, colorNum, true) : makeOrbitLine(b, colorNum, false);
      scene.add(orbit);

      const trail = makeTrailLine(colorNum);
      scene.add(trail);

      const velocityArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xf8fafc, 0.12, 0.06);
      const gravityArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xf43f5e, 0.1, 0.05);
      velocityArrow.visible = false; gravityArrow.visible = false;
      scene.add(velocityArrow, gravityArrow);

      bodyViews.set(b, { mesh, orbit, trail, velocityArrow, gravityArrow, trailPoints: [] });
    }
  }

  function resetSimulation() {
    bodies = buildPreset(preset);
    syncMirrors();
    lastTime = null;
    updateSliderLabels();
    rebuildBodyViews();
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

  function rebuildOrbitLineFor(body) {
    const view = bodyViews.get(body);
    if (!view) return;
    scene.remove(view.orbit);
    view.orbit.geometry.dispose(); view.orbit.material.dispose();
    const colorNum = new THREE.Color(body.color).getHex();
    view.orbit = body.mirrorOf
      ? makeOrbitLine(body.mirrorOf, colorNum, true)
      : makeOrbitLine(body, colorNum, false);
    scene.add(view.orbit);
  }

  function rebuildPrimaryOrbit() {
    if (!primary) return;
    rebuildOrbitLineFor(primary);
    // binary: ikkinchi yulduzning aksli orbitasi ham qayta chiziladi
    for (const b of bodies) {
      if (b.mirrorOf === primary) rebuildOrbitLineFor(b);
    }
  }

  sliderE.addEventListener('input', () => {
    if (primary) primary.e = parseFloat(sliderE.value);
    updateSliderLabels();
    rebuildPrimaryOrbit();
  });
  sliderA.addEventListener('input', () => {
    if (primary) primary.a = parseFloat(sliderA.value);
    updateSliderLabels();
    rebuildPrimaryOrbit();
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
    for (const view of bodyViews.values()) {
      view.trailPoints = [];
      view.trail.geometry.setDrawRange(0, 0);
    }
  });

  // Dunyo koordinatasi (x, y orbital tekislik) -> 3D (x, 0, z)
  function worldToScene3D(x, y) {
    return new THREE.Vector3(x, 0, -y);
  }

  function updateScene() {
    const showTrails = chkTrails ? chkTrails.checked : true;
    const showVectors = chkVectors ? chkVectors.checked : true;

    for (const b of bodies) {
      const view = bodyViews.get(b);
      if (!view) continue;
      const pos = worldToScene3D(b.x, b.y);
      view.mesh.position.copy(pos);

      view.trail.visible = showTrails;
      if (showTrails) {
        view.trailPoints.push(pos.clone());
        if (view.trailPoints.length > TRAIL_LEN) view.trailPoints.shift();
        const posAttr = view.trail.geometry.getAttribute('position');
        for (let i = 0; i < view.trailPoints.length; i++) {
          posAttr.setXYZ(i, view.trailPoints[i].x, view.trailPoints[i].y, view.trailPoints[i].z);
        }
        posAttr.needsUpdate = true;
        view.trail.geometry.setDrawRange(0, view.trailPoints.length);
      }

      const showArrowsForThis = b.isPrimary && showVectors;
      view.velocityArrow.visible = showArrowsForThis;
      view.gravityArrow.visible = showArrowsForThis;
      if (showArrowsForThis) {
        const vVec = new THREE.Vector3(b.vx, 0, -b.vy);
        const vLen = vVec.length();
        if (vLen > 1e-4) {
          view.velocityArrow.position.copy(pos);
          view.velocityArrow.setDirection(vVec.clone().normalize());
          view.velocityArrow.setLength(Math.min(2.2, 0.35 * vLen), 0.12, 0.06);
        }
        if (b.r > 0.001) {
          const gVec = new THREE.Vector3(-b.x / b.r, 0, b.y / b.r);
          view.gravityArrow.position.copy(pos);
          view.gravityArrow.setDirection(gVec);
          view.gravityArrow.setLength(0.55, 0.1, 0.05);
        }
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

    updateScene();
    updateHUD();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  function resizeRenderer() {
    const w = Math.max(1, canvas.clientWidth || 800);
    const h = Math.max(1, canvas.clientHeight || 480);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeRenderer).observe(canvas.parentElement);
  } else {
    window.addEventListener('resize', resizeRenderer);
  }
  resizeRenderer();

  resetSimulation();
  requestAnimationFrame(loop);

  window.astroVizLab = {
    initCanvasSize: () => resizeRenderer()
  };

  // ---- Audio-vizual sinxronizatsiya: TTS demo (Web Speech API) ----
  initTtsNarrativeDemo();
}

function initTtsNarrativeDemo() {
  const selectEngine = document.getElementById('select-tts-engine');
  const btnPlay = document.getElementById('btn-play-narrative');
  const btnPause = document.getElementById('btn-pause-narrative');
  const btnStop = document.getElementById('btn-stop-narrative');
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

  let sentenceIndex = 0;
  let engineLabel = 'TTS';
  let isSpeaking = false;
  let isPaused = false;
  let stoppedManually = false;

  function setControlsState() {
    if (btnPause) {
      btnPause.disabled = !isSpeaking;
      btnPause.textContent = isPaused ? '▶ Davom ettirish' : '⏸ Pauza';
    }
    if (btnStop) btnStop.disabled = !isSpeaking;
  }

  function speakNext() {
    if (sentenceIndex >= NARRATIVES.length) {
      narrativeText.textContent = `"${NARRATIVES[NARRATIVES.length - 1]}" — bayon yakunlandi.`;
      stopWave();
      isSpeaking = false;
      isPaused = false;
      setControlsState();
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
      if (stoppedManually) return;
      sentenceIndex++;
      speakNext();
    };
    utter.onerror = () => {
      if (stoppedManually) return;
      stopWave();
      isSpeaking = false;
      isPaused = false;
      setControlsState();
    };
    window.speechSynthesis.speak(utter);
  }

  btnPlay.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      narrativeText.textContent = "⚠️ Brauzeringiz nutq sintezini (Web Speech API) qo'llab-quvvatlamaydi.";
      return;
    }

    stoppedManually = false;
    window.speechSynthesis.cancel();
    engineLabel = ENGINE_LABELS[selectEngine.value] || 'TTS';
    sentenceIndex = 0;
    isSpeaking = true;
    isPaused = false;
    setControlsState();
    speakNext();
  });

  if (btnPause) {
    btnPause.addEventListener('click', () => {
      if (!isSpeaking) return;
      if (isPaused) {
        window.speechSynthesis.resume();
        isPaused = false;
      } else {
        window.speechSynthesis.pause();
        isPaused = true;
      }
      setControlsState();
    });
  }

  if (btnStop) {
    btnStop.addEventListener('click', () => {
      if (!isSpeaking) return;
      stoppedManually = true;
      window.speechSynthesis.cancel();
      isSpeaking = false;
      isPaused = false;
      stopWave();
      narrativeText.textContent = "\"Ovozli tushuntirishni boshlash uchun yuqoridagi tugmani bosing...\"";
      setControlsState();
    });
  }
}
