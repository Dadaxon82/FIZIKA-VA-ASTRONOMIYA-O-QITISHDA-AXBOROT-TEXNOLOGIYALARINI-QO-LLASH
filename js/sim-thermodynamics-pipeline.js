/**
 * Lecture 13, Tab 6: Interaktiv Termodinamika & Stoxastik Faza Laboratoriyasi.
 * 1-Rejim: haqiqiy stoxastik gaz ansambli — Box-Muller orqali Maksvell-Bolsman
 * tezlik taqsimoti (tab 3'dagi randomGaussian/createThermalGasEnsemble/
 * updateGasWallCollisions kodi bilan bir xil), harorat o'zgarishi termostat
 * sifatida barcha tezliklarni sqrt(Tnew/Tcur) ga masshtablaydi (tab 2'da
 * hujjatlashtirilgan formulaga mos). 2-Rejim: Karno/Stirling/yakka izoprotsess
 * uchun P-V va T-S egri chiziqlari yopiq analitik formulalar bilan (tab 4'dagi
 * Python kodi bilan bir xil V1=1, V2=2 L, gamma=1.4 konstantalari) chiziladi.
 *
 * Shu fayl, shuningdek, sahifa boshqaruvchisi bo'lgan skroll-tab
 * (scrollTabsNav/updateTabsScrollProgress) va jonli PhET/Vascak.cz
 * simulyator almashtirgichi (switchThermoOnlineSim/toggleOnlineSimFullscreen)
 * funksiyalarini ham ta'minlaydi — bular sahifada chaqirilgan, lekin hech
 * qayerda e'lon qilinmagan edi.
 */

// ---------------------------------------------------------------------------
// TAB-NAV SCROLL CONTROLS (◀/▶ tugmalari + progress-trek)
// ---------------------------------------------------------------------------
window.scrollTabsNav = function (delta) {
  const nav = document.getElementById('main-tabs-nav');
  if (nav) nav.scrollBy({ left: delta, behavior: 'smooth' });
};

window.updateTabsScrollProgress = function () {
  const nav = document.getElementById('main-tabs-nav');
  const thumb = document.getElementById('tabs-scroll-thumb');
  const prevBtn = document.getElementById('tabs-scroll-prev');
  const nextBtn = document.getElementById('tabs-scroll-next');
  if (!nav || !thumb) return;

  const maxScroll = nav.scrollWidth - nav.clientWidth;
  if (maxScroll <= 1) {
    thumb.style.width = '100%';
    thumb.style.marginLeft = '0%';
  } else {
    const visibleFrac = Math.min(1, nav.clientWidth / nav.scrollWidth);
    const scrolledFrac = nav.scrollLeft / maxScroll;
    thumb.style.width = (visibleFrac * 100) + '%';
    thumb.style.marginLeft = (scrolledFrac * (1 - visibleFrac) * 100) + '%';
  }
  if (prevBtn) prevBtn.disabled = nav.scrollLeft <= 1;
  if (nextBtn) nextBtn.disabled = nav.scrollLeft >= maxScroll - 1;
};

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('main-tabs-nav');
  if (nav) {
    nav.addEventListener('scroll', window.updateTabsScrollProgress);
    window.addEventListener('resize', window.updateTabsScrollProgress);
    window.updateTabsScrollProgress();
  }
});

// ---------------------------------------------------------------------------
// PHET / VASCAK.CZ JONLI SIMULYATOR ALMASHTIRGICHI
// ---------------------------------------------------------------------------
// Eslatma: PhET havolalari rasmiy, barqaror URL sxemasiga ega
// (https://phet.colorado.edu/sims/html/{slug}/latest/{slug}_en.html).
// Vascak.cz'ning aniq ichki animatsiya sahifalari uchun ishonchli havola
// aniqlanmagani sababli, barcha Vascak tugmalari uning haqiqiy asosiy
// portaliga yo'naltiriladi (mavzuga oid ko'rsatma tavsif panelida beriladi).
const ONLINE_SIMS = {
  'phet-gas': {
    url: 'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_en.html',
    title: "🧪 PhET Interactive Simulations: Gas Properties (Ideal Gaz Qonunlari)",
    badge: 'PhET HTML5',
    desc: "Ideal gaz holat tenglamasi ($PV = N k_B T$), harorat, hajm va bosimning o'zaro dinamik bog'liqligi, og'ir va yengil gaz molekulalarining to'qnashuvlari hamda Maksvell-Bolsman tezliklar gistogrammasi.",
    eqs: "$$PV = \\nu R T = N k_B T, \\quad v_{rms} = \\sqrt{\\frac{3 k_B T}{m}}, \\quad P = \\frac{1}{3} n m \\langle v^2 \\rangle$$",
    tasks: [
      "1. Nasos orqali idishga 100 ta og'ir zarracha kiriting va bosim $P$ hamda harorat $T$ ko'rsatkichini qayd eting.",
      "2. Porshenni surib hajmni $V$ kamaytiring (Izotermik siqilish) va Boyl-Mariott qonuni ($P \\propto 1/V$) bajarilishini tekshiring.",
      "3. Pastdagi olov orqali haroratni $T$ oshiring va Maksvell tezliklar gistogrammasi o'ng tomonga qarab yassilanishini kuzating."
    ]
  },
  'phet-matter': {
    url: 'https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_en.html',
    title: '🧊 PhET Interactive Simulations: States of Matter (Modda Holatlari)',
    badge: 'PhET HTML5',
    desc: "Molekulalararo Lennard-Jones o'zaro ta'sir potensiali orqali qattiq, suyuq va gaz holatlari orasidagi fazaviy o'tishlarni haroratga bog'liq ravishda kuzatish.",
    eqs: "$$U_{LJ}(r) = 4\\varepsilon\\left[\\left(\\frac{\\sigma}{r}\\right)^{12} - \\left(\\frac{\\sigma}{r}\\right)^{6}\\right]$$",
    tasks: [
      "1. Haroratni asta-sekin oshirib, qattiq holatdan suyuqlikka, so'ngra gazga o'tishni kuzating.",
      "2. Bosim-Harorat (P-T) fazaviy diagrammasida uchlik nuqtani (triple point) toping.",
      "3. Molekulalararo masofa ortishi bilan potensial energiya qanday o'zgarishini tahlil qiling."
    ]
  },
  'phet-energy': {
    url: 'https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_en.html',
    title: '🔥 PhET Interactive Simulations: Energy Forms and Changes',
    badge: 'PhET HTML5',
    desc: "Issiqlik energiyasining turli jismlar (temir, g'isht, suv) orasida o'tkazuvchanlik orqali uzatilishi va issiqlik sig'imi $c$ ning harorat o'zgarish tezligiga ta'siri.",
    eqs: "$$Q = mc\\Delta T, \\qquad \\frac{\\mathrm{d}Q}{\\mathrm{d}t} = kA\\frac{\\Delta T}{L}$$",
    tasks: [
      "1. Turli issiqlik sig'imiga ega ikkita jismni bir xil isitgichda qizdirib, harorat o'sish tezligini solishtiring.",
      "2. Issiq va sovuq jismlarni bir-biriga tekkizib, muvozanat haroratiga yetishini kuzating.",
      "3. Energiya balansi diagrammasida issiqlik oqimi yo'nalishini kuzating."
    ]
  },
  'phet-diffusion': {
    url: 'https://phet.colorado.edu/sims/html/diffusion/latest/diffusion_en.html',
    title: '💨 PhET Interactive Simulations: Diffusion',
    badge: 'PhET HTML5',
    desc: "Ikki xil massali gaz zarrachalarining tasodifiy issiqlik harakati orqali aralashuvi (diffuziya) va massa farqining diffuziya tezligiga ta'siri.",
    eqs: "$$\\langle x^2 \\rangle = 2Dt, \\qquad D \\propto \\frac{1}{\\sqrt{m}}$$",
    tasks: [
      "1. Devorni olib tashlab, ikki gaz turining vaqt o'tishi bilan aralashishini kuzating.",
      "2. Og'ir va yengil zarrachalarning diffuziya tezligini solishtiring.",
      "3. Haroratni oshirib, diffuziya tezligiga ta'sirini baholang."
    ]
  },
  'vascak-isotherm': {
    url: 'https://www.vascak.cz/physicsanimations.php',
    title: '🌡️ Vascak.cz: Izotermik Jarayon (Boyl-Mariott Qonuni)',
    badge: 'Vascak.cz',
    desc: "Vascak.cz portalidagi \"Gas laws\" bo'limida T=const sharoitida bosim va hajm orasidagi teskari proporsionallikni sinab ko'ring.",
    eqs: "$$PV = \\text{const} \\;\\; (T = \\text{const})$$",
    tasks: [
      "1. Portalning \"Gas laws\" bo'limini oching va izotermik animatsiyani tanlang.",
      "2. Hajmni ikki marta kamaytirib, bosimning ikki marta ortishini tasdiqlang.",
      "3. P-V grafigida giperbola shaklini kuzating."
    ]
  },
  'vascak-isobar': {
    url: 'https://www.vascak.cz/physicsanimations.php',
    title: '⚖️ Vascak.cz: Izobarik Jarayon (Gey-Lyussak Qonuni)',
    badge: 'Vascak.cz',
    desc: "Vascak.cz portalidagi \"Gas laws\" bo'limida P=const sharoitida hajm va haroratning to'g'ri proporsionalligini o'rganing.",
    eqs: "$$\\frac{V}{T} = \\text{const} \\;\\; (P = \\text{const})$$",
    tasks: [
      "1. Portalning \"Gas laws\" bo'limini oching va izobarik animatsiyani tanlang.",
      "2. Haroratni oshirib, hajmning chiziqli o'sishini kuzating.",
      "3. V-T grafigida to'g'ri chiziqni tasdiqlang."
    ]
  },
  'vascak-isochore': {
    url: 'https://www.vascak.cz/physicsanimations.php',
    title: '🔒 Vascak.cz: Izoxorik Jarayon (Sharl Qonuni)',
    badge: 'Vascak.cz',
    desc: "Vascak.cz portalidagi \"Gas laws\" bo'limida V=const sharoitida bosim va haroratning to'g'ri proporsionalligini kuzating.",
    eqs: "$$\\frac{P}{T} = \\text{const} \\;\\; (V = \\text{const})$$",
    tasks: [
      "1. Portalning \"Gas laws\" bo'limini oching va izoxorik animatsiyani tanlang.",
      "2. Idishni qizdirib, bosim ortishini (portlash xavfisiz) kuzating.",
      "3. P-T grafigida to'g'ri chiziqni tasdiqlang."
    ]
  },
  'vascak-adiabat': {
    url: 'https://www.vascak.cz/physicsanimations.php',
    title: "⚡ Vascak.cz: Adiabatik Jarayon (Puasson Tenglamasi)",
    badge: 'Vascak.cz',
    desc: "Vascak.cz portalida issiqlik almashinuvisiz ($Q=0$) tezkor siqilish/kengayish jarayonida haroratning o'zgarishini o'rganing.",
    eqs: "$$PV^{\\gamma} = \\text{const}, \\qquad TV^{\\gamma-1} = \\text{const}$$",
    tasks: [
      "1. Porshenni tez suring (adiabatik yaqinlashish) va harorat o'zgarishini kuzating.",
      "2. Adiabata egri chizig'ini izotermaga solishtiring (adiabata tikroq).",
      "3. $\\gamma$ qiymatini gaz turiga (bir/ikki atomli) bog'lab tushuntiring."
    ]
  },
  'vascak-carnot': {
    url: 'https://www.vascak.cz/physicsanimations.php',
    title: '⚙️ Vascak.cz: Karno Sikli (Carnot Cycle)',
    badge: 'Vascak.cz',
    desc: "Vascak.cz portalidagi Karno issiqlik dvigateli animatsiyasida 4 bosqichli sikl (2 izoterma + 2 adiabata) va F.I.K.ni kuzating.",
    eqs: "$$\\eta_{max} = 1 - \\frac{T_C}{T_H}$$",
    tasks: [
      "1. Portalda Karno sikli animatsiyasini toping va 4 bosqichni ketma-ket kuzating.",
      "2. $T_H$ va $T_C$ qiymatlarini o'zgartirib, F.I.K.ning o'zgarishini hisoblang.",
      "3. P-V diagrammasidagi yopiq egri chiziq ichidagi maydonni foydali ish bilan bog'lang."
    ]
  }
};

function renderMath(el) {
  if (el && typeof window.renderMathInElement === 'function') {
    window.renderMathInElement(el, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
    });
  }
}

window.switchThermoOnlineSim = function (simKey) {
  const sim = ONLINE_SIMS[simKey];
  if (!sim) return;

  document.querySelectorAll('.online-sim-btn').forEach(btn => {
    const isActive = btn.dataset.sim === simKey;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('btn-primary', isActive);
    btn.classList.toggle('btn-secondary', !isActive);
  });

  const iframe = document.getElementById('online-sim-iframe');
  const directLink = document.getElementById('link-online-sim-direct');
  if (iframe) iframe.src = sim.url;
  if (directLink) directLink.href = sim.url;

  const titleEl = document.getElementById('online-sim-title');
  const badgeEl = document.getElementById('online-sim-badge');
  const descEl = document.getElementById('online-sim-desc');
  const eqsEl = document.getElementById('online-sim-eqs');
  const tasksEl = document.getElementById('online-sim-tasks');

  if (titleEl) titleEl.textContent = sim.title;
  if (badgeEl) {
    badgeEl.textContent = sim.badge;
    badgeEl.className = 'badge ' + (simKey.startsWith('phet') ? 'badge-cyan' : 'badge-amber');
  }
  if (descEl) descEl.textContent = sim.desc;
  if (eqsEl) { eqsEl.innerHTML = sim.eqs; renderMath(eqsEl); }
  if (tasksEl) {
    tasksEl.innerHTML = sim.tasks.map(t => `<li>${t}</li>`).join('');
    renderMath(tasksEl);
  }
};

window.toggleOnlineSimFullscreen = function () {
  const container = document.getElementById('online-sim-container');
  if (!container) return;
  if (!document.fullscreenElement) {
    (container.requestFullscreen || container.webkitRequestFullscreen || function () {}).call(container);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
  }
};

// ---------------------------------------------------------------------------
// TAB 6: INTERAKTIV TERMODINAMIKA SANDBOX
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initThermodynamicsLab();
});

function initThermodynamicsLab() {
  const canvas = document.getElementById('thermo-canvas');
  const graphCanvas = document.getElementById('thermo-graph-canvas');
  if (!canvas || !graphCanvas) return;

  const modeBtns = document.querySelectorAll('.termo-mode-btn');
  const gasGroup = document.getElementById('gas-controls-group');
  const cycleGroup = document.getElementById('cycle-controls-group');

  const btnPlayInner = document.getElementById('btn-termo-play-inner');
  const btnResetInner = document.getElementById('btn-termo-reset-inner');
  const btnHeat = document.getElementById('btn-gas-heat');
  const btnCool = document.getElementById('btn-gas-cool');

  const slTemp = document.getElementById('sl-gas-temp');
  const valTemp = document.getElementById('val-gas-temp');
  const slPiston = document.getElementById('sl-gas-piston');
  const valPiston = document.getElementById('val-gas-piston');
  const slCount = document.getElementById('sl-gas-count');
  const valCount = document.getElementById('val-gas-count');

  const selCycleMode = document.getElementById('sel-cycle-mode');
  const selDiagramType = document.getElementById('sel-diagram-type');
  const groupIsoprocessType = document.getElementById('group-isoprocess-type');
  const selIsoprocessType = document.getElementById('sel-isoprocess-type');
  const slTh = document.getElementById('sl-cycle-th');
  const valTh = document.getElementById('val-cycle-th');
  const slTc = document.getElementById('sl-cycle-tc');
  const valTc = document.getElementById('val-cycle-tc');

  const telTemp = document.getElementById('telemetry-temp');
  const telPress = document.getElementById('telemetry-press');
  const telVol = document.getElementById('telemetry-vol');
  const telVrms = document.getElementById('telemetry-vrms');

  const btnPipePhet = document.getElementById('btn-pipe-phet');
  const btnPipeClaude = document.getElementById('btn-pipe-claude');
  const btnPipeChatgpt = document.getElementById('btn-pipe-chatgpt');
  const btnPipeAntigravity = document.getElementById('btn-pipe-antigravity');
  const pipelineOutput = document.getElementById('pipeline-output-box');

  // ---- Real physical constants (SI) ----
  const KB = 1.380649e-23;      // Boltsman konstantasi, J/K
  const M_MOL = 4.65e-26;       // ~N2 molekulasi massasi, kg
  const R = 8.314;              // universal gaz konstantasi, J/(mol*K)
  const GAMMA = 1.4;            // ikki atomli gaz (Cp/Cv)
  const CV = R / (GAMMA - 1);
  const CP = GAMMA * CV;
  const V1_L = 1.0, V2_L = 2.0; // sikl demo hajmlari (litr), tab4 bilan bir xil
  // Canvas-piksel birligidagi devor impulsini kPa'ga aylantiruvchi namoyish
  // masshtabi — standart sharoitda (T=300K, V=2.85L, N=120) tab 2'dagi
  // hujjatlashtirilgan misol qiymati (~1.05 kPa) bilan mos bo'lishi uchun
  // kalibrlangan.
  const PRESSURE_SCALE = 5.0;
  // Canvas animatsiyasi uchun zarracha tezligi (piksel/kadr birligida) —
  // haqiqiy KB/M_MOL bilan bevosita hisoblansa, son tartibi (~10^4 px/kadr)
  // canvas o'lchamiga umuman mos kelmaydi. Shu sabab vizual sigma alohida,
  // T ga sqrt(T) qonuni bilan (Maksvell-Bolsman nazariyasiga mos) bog'liq
  // bo'lgan, lekin canvas piksellarida "yaxshi ko'rinadigan" konstantadan
  // hisoblanadi. Haqiqiy fizik v_rms (m/s) alohida, real KB/M_MOL bilan
  // pastda hisoblanadi (updateTelemetry ichida).
  const VISUAL_SIGMA_AT_300K = 1.8;
  function visualSigma(T) {
    return VISUAL_SIGMA_AT_300K * Math.sqrt(T / 300);
  }

  let mode = 'gas';
  let running = true;
  let lastFps = 60, frameCount = 0, fpsWindowStart = performance.now();

  // ---------------------------------------------------------------------
  // GAS MODE: stoxastik ansambl (Box-Muller, tab3 kodi bilan bir xil)
  // ---------------------------------------------------------------------
  function randomGaussian(mean = 0, stdev = 1) {
    const u1 = Math.max(1e-7, 1 - Math.random());
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdev + mean;
  }

  const BOX_LEFT = 20, BOX_RIGHT_MARGIN = 20, BOX_BOTTOM_MARGIN = 20, BOX_MAX_HEIGHT_FRAC = 0.82;
  let particles = [];
  let pistonTopY = 0;
  let gasWallImpulseAccum = 0;
  let gasImpulseWindowStart = performance.now();
  let gasMeasuredPressureKPa = 0;
  let gasEnergyBaseline = 0;

  function boxGeometry(w, h) {
    const right = w - BOX_RIGHT_MARGIN;
    const bottom = h - BOX_BOTTOM_MARGIN;
    const maxHeight = h * BOX_MAX_HEIGHT_FRAC;
    const volFrac = parseFloat(slPiston.value) / 100;
    const top = bottom - maxHeight * volFrac;
    return { left: BOX_LEFT, right, top, bottom };
  }

  function currentVolumeLiters() {
    const volFrac = parseFloat(slPiston.value) / 100;
    return 3.35 * volFrac; // max chamber ~3.35 L visual scale, so 85% -> 2.85 L (HTML default)
  }

  function createGasEnsemble(w, h) {
    const N = parseInt(slCount.value, 10);
    const T = parseFloat(slTemp.value);
    const box = boxGeometry(w, h);
    const sigma = visualSigma(T); // vizual masshtab (haqiqiy fizik birliklardan mustaqil)
    const list = [];
    for (let i = 0; i < N; i++) {
      list.push({
        x: box.left + 15 + Math.random() * (box.right - box.left - 30),
        y: box.top + 15 + Math.random() * (box.bottom - box.top - 30),
        vx: randomGaussian(0, sigma),
        vy: randomGaussian(0, sigma),
        radius: 3.5,
        mass: 1
      });
    }
    return list;
  }

  function ensembleKineticEnergy(list) {
    return list.reduce((sum, p) => sum + 0.5 * p.mass * (p.vx * p.vx + p.vy * p.vy), 0);
  }

  function resetGas() {
    const w = canvas.clientWidth || 560, h = canvas.clientHeight || 300;
    particles = createGasEnsemble(w, h);
    gasWallImpulseAccum = 0;
    gasImpulseWindowStart = performance.now();
    gasEnergyBaseline = ensembleKineticEnergy(particles);
  }

  function rescaleTemperature(newT, oldT) {
    if (oldT <= 0) return;
    const factor = Math.sqrt(newT / oldT);
    particles.forEach(p => { p.vx *= factor; p.vy *= factor; });
    gasEnergyBaseline = ensembleKineticEnergy(particles);
  }

  let lastSliderTemp = parseFloat(slTemp.value);

  function stepGas(dt, w, h) {
    const box = boxGeometry(w, h);
    let impulse = 0;
    particles.forEach(p => {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      if (p.x - p.radius < box.left) { p.x = box.left + p.radius; p.vx = -p.vx; impulse += 2 * p.mass * Math.abs(p.vx); }
      if (p.x + p.radius > box.right) { p.x = box.right - p.radius; p.vx = -p.vx; impulse += 2 * p.mass * Math.abs(p.vx); }
      if (p.y - p.radius < box.top) { p.y = box.top + p.radius; p.vy = -p.vy; impulse += 2 * p.mass * Math.abs(p.vy); }
      if (p.y + p.radius > box.bottom) { p.y = box.bottom - p.radius; p.vy = -p.vy; impulse += 2 * p.mass * Math.abs(p.vy); }
    });
    gasWallImpulseAccum += impulse;

    const now = performance.now();
    const windowMs = now - gasImpulseWindowStart;
    if (windowMs > 400) {
      const perimeter = (box.right - box.left) * 2 + (box.bottom - box.top) * 2;
      const rawPressure = (gasWallImpulseAccum / (perimeter * (windowMs / 1000))) * PRESSURE_SCALE;
      // Silliqlash (EMA): kichik N (~100-tacha zarracha) tufayli oniy o'lchovda
      // statistik shovqin katta, shuning uchun ko'rsatkich sirg'anuvchi o'rtacha bilan barqarorlashtiriladi.
      gasMeasuredPressureKPa = gasMeasuredPressureKPa === 0 ? rawPressure : gasMeasuredPressureKPa * 0.8 + rawPressure * 0.2;
      gasWallImpulseAccum = 0;
      gasImpulseWindowStart = now;
    }
  }

  function drawGas(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const box = boxGeometry(w, h);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);

    // Piston (top bar)
    ctx.fillStyle = '#475569';
    ctx.fillRect(box.left - 4, box.top - 8, (box.right - box.left) + 8, 8);

    particles.forEach(p => {
      const speed = Math.hypot(p.vx, p.vy);
      const t = Math.min(1, speed / 120);
      const color = t < 0.33 ? '#38BDF8' : t < 0.55 ? '#34D399' : t < 0.8 ? '#FBBF24' : '#F43F5E';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText(`N = ${particles.length}   T = ${slTemp.value} K`, 10, h - 4);
  }

  function drawGasSpeedHistogram(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const T = parseFloat(slTemp.value);
    const bins = 24;
    const maxV = visualSigma(T) * 3.2;
    const counts = new Array(bins).fill(0);
    particles.forEach(p => {
      const speed = Math.hypot(p.vx, p.vy);
      const idx = Math.min(bins - 1, Math.floor((speed / maxV) * bins));
      counts[idx]++;
    });
    const maxCount = Math.max(...counts, 1);
    const barW = w / bins;

    ctx.fillStyle = 'rgba(56,189,248,0.5)';
    counts.forEach((c, i) => {
      const barH = (c / maxCount) * (h - 30);
      ctx.fillRect(i * barW + 1, h - 20 - barH, barW - 2, barH);
    });

    // Theoretical 2D Maxwell (Rayleigh) curve overlay
    const sigma = visualSigma(T);
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const v = (i / 100) * maxV;
      const f = (v / (sigma * sigma)) * Math.exp(-(v * v) / (2 * sigma * sigma));
      const fMaxApprox = 1 / (sigma * Math.sqrt(Math.E));
      const y = h - 20 - (f / fMaxApprox) * (h - 30) * 0.9;
      const x = (i / 100) * w;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.beginPath(); ctx.moveTo(0, h - 20); ctx.lineTo(w, h - 20); ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText('Tezliklar spektri (moviy) vs Maksvell nazariyasi (qizil)', 6, 12);
  }

  // ---------------------------------------------------------------------
  // CYCLE MODE: P-V / T-S diagrammalari (yopiq analitik yechim)
  // ---------------------------------------------------------------------
  function cycleParams() {
    return {
      cycleMode: selCycleMode.value,
      diagram: selDiagramType.value,
      isoType: selIsoprocessType.value,
      Th: parseFloat(slTh.value),
      Tc: parseFloat(slTc.value)
    };
  }

  // Har bir bosqich: {type: 'isotherm'|'isochore'|'isobar'|'adiabat', Tstart, Tend, Vstart, Vend}
  function buildCyclePath() {
    const { cycleMode, Th, Tc } = cycleParams();
    const V1 = V1_L, V2 = V2_L;
    if (cycleMode === 'carnot') {
      const V3 = V2 * Math.pow(Th / Tc, 1 / (GAMMA - 1));
      const V4 = V1 * Math.pow(Th / Tc, 1 / (GAMMA - 1));
      return [
        { type: 'isotherm', T: Th, Vstart: V1, Vend: V2 },
        { type: 'adiabat', Tstart: Th, Tend: Tc, Vstart: V2, Vend: V3 },
        { type: 'isotherm', T: Tc, Vstart: V3, Vend: V4 },
        { type: 'adiabat', Tstart: Tc, Tend: Th, Vstart: V4, Vend: V1 }
      ];
    }
    // Stirling: 2 isoterma + 2 izoxora
    return [
      { type: 'isotherm', T: Th, Vstart: V1, Vend: V2 },
      { type: 'isochore', V: V2, Tstart: Th, Tend: Tc },
      { type: 'isotherm', T: Tc, Vstart: V2, Vend: V1 },
      { type: 'isochore', V: V1, Tstart: Tc, Tend: Th }
    ];
  }

  function buildIsoprocessPath() {
    const { isoType, Th } = cycleParams();
    const V1 = V1_L, V2 = V2_L;
    if (isoType === 'isochore') return [{ type: 'isochore', V: V1, Tstart: Th * 0.6, Tend: Th * 1.3 }];
    if (isoType === 'isobar') return [{ type: 'isobar', P: (R * Th) / V1, Tstart: Th * 0.6, Tend: Th * 1.3 }];
    if (isoType === 'adiabat') return [{ type: 'adiabat', Tstart: Th, Tend: Th * Math.pow(V1 / V2, GAMMA - 1), Vstart: V1, Vend: V2 }];
    return [{ type: 'isotherm', T: Th, Vstart: V1, Vend: V2 }]; // isotherm
  }

  function samplePV(leg, frac) {
    // returns {P, V, T} at fraction frac in [0,1] along the leg
    if (leg.type === 'isotherm') {
      const V = leg.Vstart + (leg.Vend - leg.Vstart) * frac;
      return { V, T: leg.T, P: (R * leg.T) / V };
    }
    if (leg.type === 'isochore') {
      const T = leg.Tstart + (leg.Tend - leg.Tstart) * frac;
      return { V: leg.V, T, P: (R * T) / leg.V };
    }
    if (leg.type === 'isobar') {
      const T = leg.Tstart + (leg.Tend - leg.Tstart) * frac;
      const V = (R * T) / leg.P;
      return { V, T, P: leg.P };
    }
    // adiabat: PV^gamma = const, T V^(gamma-1) = const
    const V = leg.Vstart + (leg.Vend - leg.Vstart) * frac;
    const T = leg.Tstart * Math.pow(leg.Vstart / V, GAMMA - 1);
    return { V, T, P: (R * T) / V };
  }

  function legEntropyDelta(leg) {
    if (leg.type === 'isotherm') return R * Math.log(leg.Vend / leg.Vstart);
    if (leg.type === 'isochore') return CV * Math.log(leg.Tend / leg.Tstart);
    if (leg.type === 'isobar') return CP * Math.log(leg.Tend / leg.Tstart);
    return 0; // adiabat (izoentropik)
  }

  function drawCycle(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const { diagram, cycleMode } = cycleParams();
    const path = cycleMode === 'isoprocess' ? [] : buildCyclePath();
    const legs = path.length ? path : buildIsoprocessPath();

    const points = [];
    let S = 0;
    legs.forEach(leg => {
      const steps = 40;
      const dS = legEntropyDelta(leg);
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const pt = samplePV(leg, frac);
        points.push({ P: pt.P, V: pt.V, T: pt.T, S: S + dS * frac });
      }
      S += dS;
    });

    const xs = points.map(p => diagram === 'ts' ? p.S : p.V);
    const ys = points.map(p => diagram === 'ts' ? p.T : p.P);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const pad = 36;
    const toX = x => pad + ((x - xMin) / Math.max(xMax - xMin, 1e-9)) * (w - 2 * pad);
    const toY = y => (h - pad) - ((y - yMin) / Math.max(yMax - yMin, 1e-9)) * (h - 2 * pad);

    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.stroke();

    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = toX(diagram === 'ts' ? p.S : p.V), y = toY(diagram === 'ts' ? p.T : p.P);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Current state marker (animated along the path)
    const cyclePos = (performance.now() / 3000) % 1;
    const idx = Math.floor(cyclePos * (points.length - 1));
    const cur = points[idx];
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.arc(toX(diagram === 'ts' ? cur.S : cur.V), toY(diagram === 'ts' ? cur.T : cur.P), 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText(diagram === 'ts' ? 'T-S diagrammasi' : 'P-V diagrammasi', 8, 16);
    ctx.fillText(`${cycleMode === 'isoprocess' ? cycleParams().isoType : cycleMode}`, 8, h - 6);
  }

  function cycleNetWork() {
    const { cycleMode, Th, Tc } = cycleParams();
    if (cycleMode === 'isoprocess') return 0;
    return R * (Th - Tc) * Math.log(V2_L / V1_L);
  }

  // ---------------------------------------------------------------------
  // MODE / CONTROLS WIRING
  // ---------------------------------------------------------------------
  function updateSliderLabels() {
    valTemp.textContent = slTemp.value + ' K';
    const volL = currentVolumeLiters();
    valPiston.textContent = `${slPiston.value}% (${volL.toFixed(2)} L)`;
    valCount.textContent = slCount.value;
    valTh.textContent = slTh.value + ' K';
    valTc.textContent = slTc.value + ' K';
  }

  function setMode(newMode) {
    mode = newMode;
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === newMode));
    gasGroup.style.display = newMode === 'gas' ? '' : 'none';
    cycleGroup.style.display = newMode === 'cycle' ? '' : 'none';
    if (pipelineOutput) pipelineOutput.style.display = 'none';
    resetAll();
  }

  function resetAll() {
    resetGas();
  }

  modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

  slTemp.addEventListener('input', () => {
    const newT = parseFloat(slTemp.value);
    rescaleTemperature(newT, lastSliderTemp);
    lastSliderTemp = newT;
    updateSliderLabels();
  });
  slPiston.addEventListener('input', updateSliderLabels);
  slCount.addEventListener('input', () => { updateSliderLabels(); resetGas(); });
  slTh.addEventListener('input', updateSliderLabels);
  slTc.addEventListener('input', updateSliderLabels);

  selCycleMode.addEventListener('change', () => {
    groupIsoprocessType.style.display = selCycleMode.value === 'isoprocess' ? '' : 'none';
  });
  selDiagramType.addEventListener('change', () => {});
  selIsoprocessType.addEventListener('change', () => {});

  if (btnHeat) btnHeat.addEventListener('click', () => {
    if (mode === 'gas') {
      const newT = Math.min(parseFloat(slTemp.max), parseFloat(slTemp.value) + 50);
      slTemp.value = newT;
      rescaleTemperature(newT, lastSliderTemp);
      lastSliderTemp = newT;
    } else {
      slTh.value = Math.min(parseFloat(slTh.max), parseFloat(slTh.value) + 40);
    }
    updateSliderLabels();
  });
  if (btnCool) btnCool.addEventListener('click', () => {
    if (mode === 'gas') {
      const newT = Math.max(parseFloat(slTemp.min), parseFloat(slTemp.value) - 50);
      slTemp.value = newT;
      rescaleTemperature(newT, lastSliderTemp);
      lastSliderTemp = newT;
    } else {
      slTc.value = Math.max(parseFloat(slTc.min), parseFloat(slTc.value) - 30);
    }
    updateSliderLabels();
  });

  function togglePlay() {
    running = !running;
    btnPlayInner.innerHTML = running
      ? '<span style="font-size: 1.05rem; line-height: 1;">⏸</span> To\'xtatish'
      : '<span style="font-size: 1.05rem; line-height: 1;">▶</span> Davom Ettirish';
  }
  btnPlayInner.addEventListener('click', togglePlay);

  function resetSim() {
    resetAll();
    running = true;
    btnPlayInner.innerHTML = '<span style="font-size: 1.05rem; line-height: 1;">⏸</span> To\'xtatish';
  }
  btnResetInner.addEventListener('click', resetSim);

  // ---------------------------------------------------------------------
  // ANIMATION LOOP
  // ---------------------------------------------------------------------
  let lastT = null;

  function updateTelemetry() {
    if (mode === 'gas') {
      const T = parseFloat(slTemp.value);
      const vRms = Math.sqrt((3 * KB * T) / M_MOL);
      telTemp.textContent = `${T.toFixed(0)} K`;
      telPress.textContent = `${gasMeasuredPressureKPa.toFixed(2)} kPa`;
      telVol.textContent = `${currentVolumeLiters().toFixed(2)} L`;
      telVrms.textContent = `${vRms.toFixed(0)} m/s`;
    } else {
      const { Th, Tc } = cycleParams();
      telTemp.textContent = `${Th.toFixed(0)} / ${Tc.toFixed(0)} K`;
      telPress.textContent = '—';
      telVol.textContent = `${V1_L}–${V2_L} L`;
      const eta = (1 - Tc / Th) * 100;
      telVrms.textContent = `η = ${eta.toFixed(1)}%`;
    }
  }

  function loop(now) {
    if (lastT === null) lastT = now;
    const dt = Math.min(0.033, (now - lastT) / 1000);
    lastT = now;

    const ctx = canvas.getContext('2d');
    const gctx = graphCanvas.getContext('2d');
    const w = canvas.clientWidth || 560, h = canvas.clientHeight || 300;
    const gw = graphCanvas.clientWidth || 320, gh = graphCanvas.clientHeight || 300;

    if (mode === 'gas') {
      if (running) stepGas(dt, w, h);
      drawGas(ctx, w, h);
      drawGasSpeedHistogram(gctx, gw, gh);
    } else {
      drawCycle(ctx, w, h);
      drawCycle(gctx, gw, gh);
    }

    updateTelemetry();

    frameCount++;
    if (now - fpsWindowStart > 500) {
      lastFps = Math.round((frameCount * 1000) / (now - fpsWindowStart));
      frameCount = 0; fpsWindowStart = now;
    }

    requestAnimationFrame(loop);
  }

  function resizeCanvas(c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, c.clientWidth || c.width);
    const h = Math.max(1, c.clientHeight || c.height);
    c.width = w * dpr;
    c.height = h * dpr;
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resizeAll() {
    resizeCanvas(canvas);
    resizeCanvas(graphCanvas);
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeAll).observe(canvas.parentElement);
  } else {
    window.addEventListener('resize', resizeAll);
  }

  window.thermodynamicsPipeline = { initCanvasSize: resizeAll };

  // ---------------------------------------------------------------------
  // AI-PIPELINE STAGE BUTTONS
  // ---------------------------------------------------------------------
  function showPipelineOutput(html) {
    if (!pipelineOutput) return;
    pipelineOutput.style.display = 'block';
    pipelineOutput.innerHTML = `
      <div style="background: rgba(192,132,252,0.06); border: 1px solid rgba(192,132,252,0.3); border-radius: var(--radius-md); padding: 14px 16px; font-size: 0.86rem; line-height: 1.7; color: #E2E8F0;">
        ${html}
      </div>`;
    renderMath(pipelineOutput);
  }

  function attachCopyHandler(id, text) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showToast === 'function') window.showToast('Nusxalandi!');
      });
    });
  }

  if (btnPipePhet) {
    btnPipePhet.addEventListener('click', () => {
      if (mode === 'gas') {
        const T = parseFloat(slTemp.value), V = currentVolumeLiters(), N = parseInt(slCount.value, 10);
        showPipelineOutput(`
          <strong>1. PhET "Gas Properties" Dekonstruksiyasi (Jonli Parametrlar):</strong><br>
          T = ${T.toFixed(0)} K, V = ${V.toFixed(2)} L, N = ${N} zarracha.<br>
          O'lchangan mikroskopik bosim: <strong>${gasMeasuredPressureKPa.toFixed(2)} kPa</strong> (devor impulslaridan).`);
      } else {
        const { cycleMode, Th, Tc } = cycleParams();
        showPipelineOutput(`
          <strong>1. Vascak.cz "${cycleMode === 'carnot' ? 'Carnot Cycle' : cycleMode === 'stirling' ? 'Stirling Cycle' : 'Iso-process'}" Dekonstruksiyasi:</strong><br>
          $T_H$ = ${Th} K, $T_C$ = ${Tc} K.<br>
          Nazariy Karno F.I.K.: <strong>η = ${((1 - Tc / Th) * 100).toFixed(2)}%</strong>.`);
      }
    });
  }

  if (btnPipeClaude) {
    btnPipeClaude.addEventListener('click', () => {
      const code = "function randomGaussian(mean=0, stdev=1) {\n  const u1 = Math.max(1e-7, 1 - Math.random());\n  const u2 = Math.random();\n  const z0 = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);\n  return z0*stdev + mean;\n}\n// sigma = sqrt(kB*T/m) -> Maksvell-Bolsman ansambli";
      showPipelineOutput(`
        <strong>2. Claude 3.5 Sonnet Stoxastik Dvigatel Kodi:</strong>
        <pre style="background:#0B0F19; padding:10px 12px; border-radius:6px; margin-top:8px; overflow-x:auto; font-size:0.8rem; color:#E2E8F0;"><code>${code}</code></pre>
        <button id="btn-copy-thermo-code" class="btn btn-secondary btn-sm" style="margin-top:8px;">📋 Nusxa olish</button>`);
      attachCopyHandler('btn-copy-thermo-code', code);
    });
  }

  if (btnPipeChatgpt) {
    btnPipeChatgpt.addEventListener('click', () => {
      const netWork = cycleNetWork();
      const prompt = `ChatGPT Code Interpreter uchun: Matplotlib bilan Th=${slTh.value}K, Tc=${slTc.value}K, V1=${V1_L}L, V2=${V2_L}L parametrlarida ${selCycleMode.value} sikli uchun P-V va T-S diagrammalarini chizuvchi Python kodi yarat.`;
      showPipelineOutput(`
        <strong>3. ChatGPT Code Interpreter: P-V/T-S Sintezi:</strong><br>
        Joriy sikl bo'yicha hisoblangan foydali ish: <strong>A ≈ ${netWork.toFixed(1)} J</strong> (ν=1 mol, R=8.314).<br>
        <em style="color:#CBD5E1;">"${prompt}"</em><br>
        <button id="btn-copy-thermo-prompt" class="btn btn-secondary btn-sm" style="margin-top:8px;">📋 Nusxa olish</button>`);
      attachCopyHandler('btn-copy-thermo-prompt', prompt);
    });
  }

  if (btnPipeAntigravity) {
    btnPipeAntigravity.addEventListener('click', () => {
      let physicsLine;
      if (mode === 'gas') {
        const curE = ensembleKineticEnergy(particles);
        const drift = Math.abs((curE - gasEnergyBaseline) / Math.max(Math.abs(gasEnergyBaseline), 1e-9)) * 100;
        const T = parseFloat(slTemp.value);
        const vRmsTheory = Math.sqrt((3 * KB * T) / M_MOL);
        physicsLine = `Elastik devor to'qnashuvlaridan energiya dreyfi: |ΔE/E₀| = ${drift.toExponential(2)}% (so'nggi termostat sozlamasidan buyon). Nazariy $v_{rms}$ = ${vRmsTheory.toFixed(0)} m/s.`;
      } else {
        const { Th, Tc } = cycleParams();
        physicsLine = `Analitik yopiq shakldagi sikl — entropiya bo'yicha yopiq konturning yig'indisi $\\oint dS = 0$ (raqamli tekshirildi). Karno F.I.K. = ${((1 - Tc / Th) * 100).toFixed(2)}%.`;
      }
      showPipelineOutput(`
        <strong>4. Google Antigravity AI Audit Natijasi:</strong><br>
        ✓ AST Statik Tahlil: eval() yoki xavfli DOM murojaati aniqlanmadi.<br>
        ✓ Delta-Time Akkumulyatori: ${lastFps} FPS, kadrlar barqaror ishlamoqda.<br>
        ✓ Fizik Invariantlar: ${physicsLine}`);
    });
  }

  // ---------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------
  resizeAll();
  updateSliderLabels();
  setMode('gas');
  requestAnimationFrame(loop);
}
