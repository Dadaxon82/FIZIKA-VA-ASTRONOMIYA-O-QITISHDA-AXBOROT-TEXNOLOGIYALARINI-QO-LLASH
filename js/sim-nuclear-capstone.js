/**
 * Lecture 15, Tab 7: Interaktiv Yadro Fizikasi & Capstone Laboratoriyasi.
 * 1-Rejim: Radioaktiv yemirilish — 4x4x4 kristall panjaradagi 64 ta yadro
 * (tab3'dagi simulateRadioactiveDecay bilan bir xil Monte-Karlo qoidasi:
 * P = 1 - e^{-λΔt}). 2-Rejim: U-235 zanjirli bo'linishi (tab3'dagi
 * updateFissionChainReaction mantig'i, 3D fazoda: har bo'linishda 200 MeV va
 * 3 ta yangi neytron, kadmiy sterjenlari neytronlarni yutadi). 3-Rejim: D-T
 * termoyadroviy sintez (Tokamak torusi, har reaksiyada 17.6 MeV).
 * 4-Rejim: Capstone monitoring konsoli (A, Z saqlanishi va Q = Δmc²).
 * Audio-narratsiya Web Speech API orqali (haqiqiy nutq sintezi).
 *
 * Shu fayl, shuningdek, sahifada chaqirilgan skroll-tab
 * (scrollTabsNav/updateTabsScrollProgress) va jonli PhET/Vascak.cz
 * simulyator almashtirgichi (switchNuclearOnlineSim/
 * toggleNuclearOnlineSimFullscreen) funksiyalarini ta'minlaydi.
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
// Eslatma: Vascak.cz'ning "jadro_rozpad", "jadro_reakce" va "jadro_zareni"
// sahifalari tasdiqlangan. "Quyosh sintezi" va "Radioaktiv qatorlar" uchun
// aniq ichki havola tasdiqlanmagani sababli, bu ikki tugma Vascak.cz'ning
// animatsiyalar ro'yxatiga (Nuclear physics bo'limi) yo'naltirilgan.
const VASCAK_BASE = 'https://www.vascak.cz/data/android/physicsatschool/template.php?l=uz&s=';
const VASCAK_INDEX = 'https://www.vascak.cz/physicsanimations.php';

const NUCLEAR_ONLINE_SIMS = {
  'phet-fission': {
    url: 'https://phet.colorado.edu/sims/html/build-a-nucleus/latest/build-a-nucleus_all.html',
    title: "☢️ PhET Interactive Simulations: Build a Nucleus (Atom Yadrosi Tuzilishi & Bog'lanish)",
    desc: "Atom yadrosining proton va neytronlardan tuzilishi, nuklidlar xaritasidagi barqarorlik yo'lagi (Band of Stability), bog'lanish energiyasi va radioaktiv yemirilish turlarini o'rganish.",
    eqs: "$$E_b = [Z m_p + (A-Z) m_n - M(A,Z)] c^2 = \\Delta m c^2$$",
    tasks: [
      "1. Proton va neytronlarni qo'shib, barqaror va radioaktiv beqaror izotoplar hosil bo'lishini kuzating.",
      "2. Neytronlar soni ortiqcha bo'lganda $\\beta^-$, yetishmaganda $\\beta^+$ yemirilish yuz berishini tekshiring.",
      "3. Nuklidlar xaritasida og'ir yadrolar uchun barqarorlik yo'lagi $N > Z$ tomonga siljishini tushuntiring."
    ]
  },
  'phet-decay': {
    url: 'https://phet.colorado.edu/sims/html/isotopes-and-atomic-mass/latest/isotopes-and-atomic-mass_all.html',
    title: '⏳ PhET Interactive Simulations: Isotopes and Atomic Mass',
    desc: "Izotoplar tushunchasi, neytronlar sonining yadro barqarorligiga ta'siri va tabiiy izotop tarkibi asosida o'rtacha atom massasini hisoblash.",
    eqs: "$$\\bar{M} = \\sum_i w_i M_i, \\qquad \\sum_i w_i = 1$$",
    tasks: [
      "1. Uglerod atomiga neytron qo'shib, C-12, C-13 va beqaror C-14 izotoplarini hosil qiling.",
      "2. Tabiiy izotop tarkibi asosida o'rtacha atom massasini hisoblang.",
      "3. C-14 ning yarim yemirilish davri ($\\approx 5730$ yil) radiouglerod usulida qanday qo'llanishini tushuntiring."
    ]
  },
  'phet-rutherford': {
    url: 'https://phet.colorado.edu/sims/html/rutherford-scattering/latest/rutherford-scattering_all.html',
    title: '🎯 PhET Interactive Simulations: Rutherford Scattering',
    desc: "Alfa-zarrachalarning oltin folgadagi sochilishi: Tomson (\"mayizli puding\") modeli va Rezerford yadroviy modelini taqqoslash.",
    eqs: "$$\\frac{d\\sigma}{d\\Omega} = \\left(\\frac{Z_1 Z_2 e^2}{16\\pi\\varepsilon_0 E_k}\\right)^2 \\frac{1}{\\sin^4(\\theta/2)}$$",
    tasks: [
      "1. Tomson modelida alfa-zarrachalar deyarli og'masligini kuzating.",
      "2. Rezerford modelida katta burchakli sochilishlar paydo bo'lishini qayd eting.",
      "3. Alfa-zarracha energiyasini oshirib, sochilish burchagi kamayishini tushuntiring."
    ]
  },
  'vascak-decay': {
    url: VASCAK_BASE + 'jadro_rozpad',
    title: '☢️ Vascak.cz: Radioaktiv Yemirilish Qonuni',
    desc: "Radioaktiv yadrolar sonining vaqt bo'yicha eksponensial kamayishi va yarim yemirilish davrining vizual modeli.",
    eqs: "$$N(t) = N_0 \\, 2^{-t/T_{1/2}}, \\qquad \\lambda = \\frac{\\ln 2}{T_{1/2}}$$",
    tasks: [
      "1. Har bir $T_{1/2}$ oralig'ida yadrolar soni taxminan ikki marta kamayishini tekshiring.",
      "2. Kichik $N_0$ da stoxastik tebranishlar kuchliroq bo'lishini kuzating.",
      "3. Grafikdan $\\lambda$ ni aniqlab, $T_{1/2}$ bilan solishtiring."
    ]
  },
  'vascak-reactions': {
    url: VASCAK_BASE + 'jadro_reakce',
    title: '💥 Vascak.cz: Yadro Reaksiyasi',
    desc: "Neytron ta'sirida og'ir yadroning bo'linishi, bo'linish mahsulotlari va yangi neytronlarning ajralishi.",
    eqs: "$$^{235}_{92}\\text{U} + ^{1}_{0}n \\rightarrow ^{141}_{56}\\text{Ba} + ^{92}_{36}\\text{Kr} + 3\\,^{1}_{0}n$$",
    tasks: [
      "1. Reaksiyadan oldin va keyin massa soni $A$ saqlanishini tekshiring.",
      "2. Zaryad soni $Z$ saqlanishini tekshiring.",
      "3. Ajralgan neytronlar zanjirli reaksiyani qanday davom ettirishini tushuntiring."
    ]
  },
  'vascak-radiation': {
    url: VASCAK_BASE + 'jadro_zareni',
    title: '🛡️ Vascak.cz: Radioaktiv Nurlanish',
    desc: "$\\alpha$, $\\beta$ va $\\gamma$ nurlanishlarning magnit maydonda og'ishi va turli materiallardan o'tish qobiliyati.",
    eqs: "$$\\alpha = {}^{4}_{2}\\text{He}^{2+}, \\quad \\beta^- = e^-, \\quad \\gamma = \\text{foton}$$",
    tasks: [
      "1. Magnit maydonda $\\alpha$ va $\\beta$ nurlarining qarama-qarshi tomonga og'ishini kuzating.",
      "2. $\\gamma$ nurlar nega og'maydi — tushuntiring.",
      "3. Qog'oz, alyuminiy va qo'rg'oshin to'siqlarning himoya qobiliyatini solishtiring."
    ]
  },
  'vascak-fusion': {
    url: VASCAK_INDEX,
    title: '🌌 Vascak.cz: Termoyadroviy Sintez',
    desc: "Vascak.cz animatsiyalar ro'yxatining \"Nuclear physics\" bo'limidan termoyadroviy sintezga oid animatsiyani toping (aniq ichki havola hali tasdiqlanmagan).",
    eqs: "$$^{2}_{1}\\text{H} + ^{3}_{1}\\text{H} \\rightarrow ^{4}_{2}\\text{He} + ^{1}_{0}n + 17.6\\text{ MeV}$$",
    tasks: [
      "1. Ro'yxatdan \"Nuclear physics\" bo'limini oching.",
      "2. Sintez uchun nega juda yuqori harorat (Kulon to'sig'ini yengish) kerakligini tushuntiring.",
      "3. 17.6 MeV energiyaning He-4 (3.5 MeV) va neytron (14.1 MeV) orasida taqsimlanishini tahlil qiling."
    ]
  },
  'vascak-series': {
    url: VASCAK_INDEX,
    title: '📜 Vascak.cz: Radioaktiv Qatorlar',
    desc: "Vascak.cz animatsiyalar ro'yxatining \"Nuclear physics\" bo'limidan radioaktiv qatorlarga oid animatsiyani toping (aniq ichki havola hali tasdiqlanmagan).",
    eqs: "$$^{238}_{92}\\text{U} \\rightarrow \\dots \\rightarrow ^{206}_{82}\\text{Pb} \\quad (8\\alpha,\\ 6\\beta^-)$$",
    tasks: [
      "1. Ro'yxatdan \"Nuclear physics\" bo'limini oching.",
      "2. U-238 qatorida nechta $\\alpha$ va $\\beta^-$ yemirilish borligini $A$ va $Z$ balansidan hisoblang.",
      "3. Har bir $\\alpha$-yemirilishda $A$ 4 ga, $Z$ 2 ga kamayishini tekshiring."
    ]
  }
};

function renderNuclearMath(el) {
  if (el && typeof window.renderMathInElement === 'function') {
    window.renderMathInElement(el, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
    });
  }
}

window.switchNuclearOnlineSim = function (simKey) {
  const sim = NUCLEAR_ONLINE_SIMS[simKey];
  if (!sim) return;

  document.querySelectorAll('.nuclear-online-sim-btn').forEach(btn => {
    const isActive = btn.dataset.sim === simKey;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('btn-primary', isActive);
    btn.classList.toggle('btn-secondary', !isActive);
  });

  const iframe = document.getElementById('nuclear-sim-iframe');
  const directLink = document.getElementById('link-nuclear-sim-direct');
  if (iframe) iframe.src = sim.url;
  if (directLink) directLink.href = sim.url;

  const titleEl = document.getElementById('nuclear-sim-title');
  const descEl = document.getElementById('nuclear-sim-desc');
  const eqsEl = document.getElementById('nuclear-sim-eqs');
  const tasksEl = document.getElementById('nuclear-sim-tasks');

  if (titleEl) titleEl.textContent = sim.title;
  if (descEl) { descEl.textContent = sim.desc; renderNuclearMath(descEl); }
  if (eqsEl) { eqsEl.innerHTML = sim.eqs; renderNuclearMath(eqsEl); }
  if (tasksEl) {
    tasksEl.innerHTML = sim.tasks.map(t => `<li>${t}</li>`).join('');
    renderNuclearMath(tasksEl);
  }
};

window.toggleNuclearOnlineSimFullscreen = function () {
  const container = document.getElementById('nuclear-sim-container');
  if (!container) return;
  if (!document.fullscreenElement) {
    (container.requestFullscreen || container.webkitRequestFullscreen || function () {}).call(container);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
  }
};

// ---------------------------------------------------------------------------
// Muxlisa AI / ElevenLabs Audio-Narratsiya (Web Speech API)
// ---------------------------------------------------------------------------
function speakNuclearNarration(topic) {
  if (!('speechSynthesis' in window)) {
    if (typeof window.showToast === 'function') {
      window.showToast("Brauzeringizda ovoz sintezi qo'llab-quvvatlanmaydi.");
    }
    return;
  }

  window.speechSynthesis.cancel();

  const narrationScript = {
    decay: "Radioaktiv yemirilish stoxastik jarayondir. Har bir yadroning qachon yemirilishini oldindan aytib bo'lmaydi, lekin ko'p yadrolar uchun ularning soni eksponensial qonun bo'yicha kamayadi. Har bir yarim yemirilish davrida qolgan yadrolar soni ikki marta kamayadi.",
    fission: "Uran-235 yadrosi sekin neytronni yutib, ikki bo'lakka bo'linadi va o'rtacha ikki-uchta yangi neytron hamda taxminan ikki yuz megaelektronvolt energiya ajraladi. Kadmiy yoki bor sterjenlari ortiqcha neytronlarni yutib, ko'payish koeffitsiyentini birga teng ushlab turadi.",
    fusion: "Termoyadroviy sintezda deyteriy va tritiy yadrolari qo'shilib, geliy-to'rt yadrosi va neytron hosil bo'ladi hamda o'n yetti yarim megaelektronvolt energiya ajraladi. Tokamak qurilmasida yuz million darajadan yuqori haroratli plazma magnit maydon yordamida ushlab turiladi.",
    capstone: "Yakuniy mustaqil loyihada talaba yetti bosqichli sun'iy intellekt konveyeridan foydalanadi: diagnostika, teskari muhandislik, kod generatsiyasi, monitoring, audio-narratsiya, himoya transkripsiyasi va akademik halollik nazorati. Har bir bosqich natijasi talabaning o'z tahlili bilan boyitilishi shart."
  };

  const utterance = new SpeechSynthesisUtterance(narrationScript[topic] || narrationScript.fission);
  utterance.lang = 'uz-UZ';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

// ---------------------------------------------------------------------------
// TAB 7: INTERAKTIV 3D YADRO FIZIKASI SANDBOX
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initNuclearLab();
});

function initNuclearLab() {
  const canvas = document.getElementById('nuclear-canvas');
  const graphCanvas = document.getElementById('nuclear-graph-canvas');
  if (!canvas || !graphCanvas) return;
  const ctx = canvas.getContext('2d');
  const gctx = graphCanvas.getContext('2d');

  const modeBtns = document.querySelectorAll('.nuclear-mode-btn');
  const fissionGroup = document.getElementById('fission-controls-group');
  const decayGroup = document.getElementById('decay-controls-group');

  const btnAutorotate = document.getElementById('btn-nuclear-autorotate');
  const btnResetCam = document.getElementById('btn-nuclear-reset-cam');
  const btnNarration = document.getElementById('btn-nuclear-play-narration');
  const btnPlay = document.getElementById('btn-nuclear-play');
  const btnReset = document.getElementById('btn-nuclear-reset');
  const btnInject = document.getElementById('btn-nuclear-inject-neutron');

  const slRods = document.getElementById('sl-control-rods');
  const valRods = document.getElementById('val-control-rods');
  const slHalf = document.getElementById('sl-decay-halflife');
  const valHalf = document.getElementById('val-decay-halflife');

  const tel = [1, 2, 3, 4].map(i => ({
    label: document.getElementById('telemetry-label' + i),
    param: document.getElementById('telemetry-param' + i)
  }));

  let mode = 'fission';
  let running = true;
  let autoRotate = true;
  let simTime = 0;

  // -----------------------------------------------------------------------
  // 3D KAMERA (perspektiv proyeksiya, sichqoncha/sensor bilan aylantirish)
  // -----------------------------------------------------------------------
  const cam = { yaw: 0.6, pitch: 0.35, dist: 3.4 };
  const CAM_DEFAULT = { yaw: 0.6, pitch: 0.35, dist: 3.4 };

  function project(p, w, h) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const x1 = p.x * cy - p.z * sy;
    const z1 = p.x * sy + p.z * cy;
    const y2 = p.y * cp - z1 * sp;
    const z2 = p.y * sp + z1 * cp;
    const depth = cam.dist + z2;
    const f = Math.min(w, h) * 1.45 / Math.max(0.3, depth);
    return { sx: w / 2 + x1 * f, sy: h / 2 - y2 * f, scale: f, depth };
  }

  let dragging = false, lastX = 0, lastY = 0;
  function pointerDown(x, y) { dragging = true; lastX = x; lastY = y; canvas.style.cursor = 'grabbing'; }
  function pointerMove(x, y) {
    if (!dragging) return;
    cam.yaw += (x - lastX) * 0.01;
    cam.pitch = Math.max(-1.4, Math.min(1.4, cam.pitch + (y - lastY) * 0.01));
    lastX = x; lastY = y;
  }
  function pointerUp() { dragging = false; canvas.style.cursor = 'grab'; }

  canvas.addEventListener('mousedown', e => pointerDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => pointerMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', pointerUp);
  canvas.addEventListener('touchstart', e => { const t = e.touches[0]; pointerDown(t.clientX, t.clientY); }, { passive: true });
  canvas.addEventListener('touchmove', e => { const t = e.touches[0]; pointerMove(t.clientX, t.clientY); }, { passive: true });
  canvas.addEventListener('touchend', pointerUp);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    cam.dist = Math.max(1.8, Math.min(7, cam.dist * (e.deltaY > 0 ? 1.08 : 0.92)));
  }, { passive: false });

  // -----------------------------------------------------------------------
  // 1. RADIOAKTIV YEMIRILISH (tab3'dagi simulateRadioactiveDecay qoidasi)
  // -----------------------------------------------------------------------
  let decay = null;
  function resetDecay() {
    const nuclei = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) {
      nuclei.push({ x: (i - 1.5) * 0.42, y: (j - 1.5) * 0.42, z: (k - 1.5) * 0.42, state: 'active', flash: 0 });
    }
    decay = { nuclei, N0: nuclei.length, t: 0, history: [{ t: 0, n: nuclei.length }], particles: [] };
  }

  function stepDecay(dt) {
    const T = parseFloat(slHalf.value);
    const lambda = Math.LN2 / T;
    const prob = 1 - Math.exp(-lambda * dt);
    decay.t += dt;
    for (const n of decay.nuclei) {
      if (n.flash > 0) n.flash -= dt;
      if (n.state === 'active' && Math.random() < prob) {
        n.state = 'decayed';
        n.flash = 0.6;
        const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
        decay.particles.push({
          x: n.x, y: n.y, z: n.z, life: 1.2,
          vx: Math.sin(b) * Math.cos(a) * 1.4, vy: Math.cos(b) * 1.4, vz: Math.sin(b) * Math.sin(a) * 1.4
        });
      }
    }
    for (let i = decay.particles.length - 1; i >= 0; i--) {
      const p = decay.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= dt;
      if (p.life <= 0) decay.particles.splice(i, 1);
    }
    const last = decay.history[decay.history.length - 1];
    if (decay.t - last.t > 0.1) decay.history.push({ t: decay.t, n: countActive() });
  }
  function countActive() { return decay.nuclei.filter(n => n.state === 'active').length; }

  // -----------------------------------------------------------------------
  // 2. U-235 ZANJIRLI BO'LINISHI (tab3'dagi updateFissionChainReaction, 3D)
  // -----------------------------------------------------------------------
  const BOX = 0.9;               // reaktor faol zonasi yarim-o'lchami
  const ROD_X = [-0.45, 0, 0.45]; // boshqaruv sterjenlari tekisliklari
  const NEUTRON_SPEED = 0.7;
  const MAX_NEUTRONS = 400;
  let fission = null;

  function resetFission() {
    const nuclei = [];
    let attempts = 0;
    while (nuclei.length < 52 && attempts < 5000) {
      attempts++;
      const p = { x: (Math.random() * 2 - 1) * BOX * 0.9, y: (Math.random() * 2 - 1) * BOX * 0.9, z: (Math.random() * 2 - 1) * BOX * 0.9 };
      if (ROD_X.some(rx => Math.abs(p.x - rx) < 0.1)) continue;
      if (nuclei.every(q => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) > 0.2)) {
        nuclei.push({ ...p, r: 0.065, state: 'stable', flash: 0 });
      }
    }
    fission = { nuclei, neutrons: [], fragments: [], energy: 0, fissions: 0, t: 0, events: [], k: 1.0, history: [] };
    injectNeutron(); injectNeutron();
  }

  function injectNeutron() {
    if (!fission) return;
    const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
    fission.neutrons.push({
      x: -BOX, y: (Math.random() - 0.5) * 0.6, z: (Math.random() - 0.5) * 0.6,
      vx: Math.abs(Math.sin(b) * Math.cos(a)) * NEUTRON_SPEED, vy: Math.cos(b) * NEUTRON_SPEED, vz: Math.sin(b) * Math.sin(a) * NEUTRON_SPEED,
      life: 8.0
    });
  }

  function stepFission(dt) {
    const depth = parseFloat(slRods.value);
    const rodBottom = BOX - 2 * BOX * depth;
    fission.t += dt;
    let fissionsNow = 0, lossesNow = 0;

    for (let i = fission.neutrons.length - 1; i >= 0; i--) {
      const n = fission.neutrons[i];
      n.x += n.vx * dt; n.y += n.vy * dt; n.z += n.vz * dt;
      n.life -= dt;

      // Neytron qaytargich (reflektor) devorlari
      for (const ax of ['x', 'y', 'z']) {
        const v = 'v' + ax;
        if (n[ax] > BOX) { n[ax] = BOX; n[v] = -Math.abs(n[v]); }
        if (n[ax] < -BOX) { n[ax] = -BOX; n[v] = Math.abs(n[v]); }
      }

      // Boshqaruv sterjeni yutishi (Kadmiy / Bor)
      if (depth > 0 && n.y > rodBottom && ROD_X.some(rx => Math.abs(n.x - rx) < 0.04)) n.life = 0;

      // Uran-235 yadrosi bilan to'qnashuv
      if (n.life > 0) {
        for (const nucl of fission.nuclei) {
          if (nucl.state === 'stable' && Math.hypot(n.x - nucl.x, n.y - nucl.y, n.z - nucl.z) < nucl.r + 0.05) {
            nucl.state = 'fissioned';
            nucl.flash = 0.8;
            fission.energy += 200; // MeV
            fission.fissions++;
            fissionsNow++;
            for (let k = 0; k < 3 && fission.neutrons.length < MAX_NEUTRONS; k++) {
              const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1);
              fission.neutrons.push({
                x: nucl.x, y: nucl.y, z: nucl.z,
                vx: Math.sin(b) * Math.cos(a) * NEUTRON_SPEED, vy: Math.cos(b) * NEUTRON_SPEED, vz: Math.sin(b) * Math.sin(a) * NEUTRON_SPEED,
                life: 8.0
              });
            }
            // Bo'linish parchalari: Ba-141 va Kr-92 qarama-qarshi yo'nalishda
            const a = Math.random() * Math.PI * 2;
            fission.fragments.push({ x: nucl.x, y: nucl.y, z: nucl.z, vx: Math.cos(a) * 0.25, vy: 0.05, vz: Math.sin(a) * 0.25, life: 1.5, color: '#FBBF24' });
            fission.fragments.push({ x: nucl.x, y: nucl.y, z: nucl.z, vx: -Math.cos(a) * 0.25, vy: -0.05, vz: -Math.sin(a) * 0.25, life: 1.5, color: '#A78BFA' });
            n.life = 0;
            break;
          }
        }
      }
      if (n.life <= 0) { fission.neutrons.splice(i, 1); lossesNow++; }
    }

    for (const nucl of fission.nuclei) if (nucl.flash > 0) nucl.flash -= dt;
    for (let i = fission.fragments.length - 1; i >= 0; i--) {
      const f = fission.fragments[i];
      f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt; f.life -= dt;
      if (f.life <= 0) fission.fragments.splice(i, 1);
    }

    // Ko'payish koeffitsiyenti: oxirgi 2 s dagi (tug'ilgan neytronlar) / (yo'qolgan neytronlar)
    fission.events.push({ t: fission.t, born: fissionsNow * 3, lost: lossesNow });
    while (fission.events.length && fission.t - fission.events[0].t > 2) fission.events.shift();
    const born = fission.events.reduce((s, e) => s + e.born, 0);
    const lost = fission.events.reduce((s, e) => s + e.lost, 0);
    if (lost >= 3) fission.k = born / lost;
    else if (fission.neutrons.length === 0) fission.k = 0;

    const last = fission.history[fission.history.length - 1];
    if (!last || fission.t - last.t > 0.1) fission.history.push({ t: fission.t, n: fission.neutrons.length, e: fission.energy });
    if (fission.history.length > 300) fission.history.shift();
  }

  // -----------------------------------------------------------------------
  // 3. D-T TERMOYADROVIY SINTEZ (Tokamak torusi)
  // -----------------------------------------------------------------------
  const TORUS_R = 0.62, TORUS_r = 0.2;
  let fusion = null;

  function newIon(type) {
    return { type, phi: Math.random() * Math.PI * 2, theta: Math.random() * Math.PI * 2, rho: Math.random() * TORUS_r * 0.8, omega: 0.9 + Math.random() * 0.8 };
  }
  function ionPos(ion) {
    const R = TORUS_R + ion.rho * Math.cos(ion.theta);
    return { x: R * Math.cos(ion.phi), y: ion.rho * Math.sin(ion.theta), z: R * Math.sin(ion.phi) };
  }
  function resetFusion() {
    const ions = [];
    for (let i = 0; i < 30; i++) { ions.push(newIon('D')); ions.push(newIon('T')); }
    fusion = { ions, products: [], energy: 0, reactions: 0, t: 0, events: [], history: [] };
  }

  function stepFusion(dt) {
    fusion.t += dt;
    for (const ion of fusion.ions) {
      ion.phi += ion.omega * dt;
      ion.theta += 2.5 * dt;
      ion.rho = Math.max(0, Math.min(TORUS_r * 0.9, ion.rho + (Math.random() - 0.5) * 0.08 * dt));
      ion.pos = ionPos(ion);
    }

    let fusedNow = 0;
    const used = new Set();
    for (let i = 0; i < fusion.ions.length; i++) {
      const a = fusion.ions[i];
      if (a.type !== 'D' || used.has(i)) continue;
      for (let j = 0; j < fusion.ions.length; j++) {
        const b = fusion.ions[j];
        if (b.type !== 'T' || used.has(j)) continue;
        const d = Math.hypot(a.pos.x - b.pos.x, a.pos.y - b.pos.y, a.pos.z - b.pos.z);
        if (d < 0.06 && Math.random() < 0.35) {
          used.add(i); used.add(j);
          fusedNow++;
          fusion.energy += 17.6; // MeV
          fusion.reactions++;
          const p = a.pos;
          const ang = Math.random() * Math.PI * 2;
          // He-4 (3.5 MeV) plazmada qoladi, neytron (14.1 MeV) torusdan chiqib ketadi
          fusion.products.push({ x: p.x, y: p.y, z: p.z, vx: Math.cos(ang) * 0.15, vy: 0, vz: Math.sin(ang) * 0.15, life: 1.4, kind: 'He' });
          fusion.products.push({ x: p.x, y: p.y, z: p.z, vx: -Math.cos(ang) * 1.3, vy: (Math.random() - 0.5) * 0.6, vz: -Math.sin(ang) * 1.3, life: 1.4, kind: 'n' });
          break;
        }
      }
    }
    if (used.size) {
      fusion.ions = fusion.ions.filter((_, idx) => !used.has(idx));
    }
    // Yoqilg'i quyish: D va T ionlari soni tiklanadi
    while (fusion.ions.filter(x => x.type === 'D').length < 30) fusion.ions.push(newIon('D'));
    while (fusion.ions.filter(x => x.type === 'T').length < 30) fusion.ions.push(newIon('T'));
    for (const ion of fusion.ions) if (!ion.pos) ion.pos = ionPos(ion);

    for (let i = fusion.products.length - 1; i >= 0; i--) {
      const p = fusion.products[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= dt;
      if (p.life <= 0) fusion.products.splice(i, 1);
    }

    fusion.events.push({ t: fusion.t, n: fusedNow });
    while (fusion.events.length && fusion.t - fusion.events[0].t > 2) fusion.events.shift();
    const last = fusion.history[fusion.history.length - 1];
    if (!last || fusion.t - last.t > 0.1) fusion.history.push({ t: fusion.t, p: fusionRate() * 17.6, e: fusion.energy });
    if (fusion.history.length > 300) fusion.history.shift();
  }
  function fusionRate() {
    if (!fusion.events.length) return 0;
    const span = Math.max(0.5, fusion.t - fusion.events[0].t);
    return fusion.events.reduce((s, e) => s + e.n, 0) / span;
  }

  // -----------------------------------------------------------------------
  // 4. CAPSTONE MONITORING KONSOLI (A, Z saqlanishi va Q = Δmc²)
  // -----------------------------------------------------------------------
  // Atom massalari (u): AME2020 jadvali qiymatlari
  const MASS = { U235: 235.0439299, n: 1.00866492, Ba141: 140.914411, Kr92: 91.926156 };
  const U_TO_MEV = 931.494;
  const CAP_STAGES = ['MagicSchool', 'PhET/Vascak', 'Claude', 'Antigravity', 'Muxlisa/11Labs', 'Otter.ai', 'Undetectable'];
  const capstone = { t: 0 };

  function capstoneAudit() {
    const A0 = 235 + 1, A1 = 141 + 92 + 3;
    const Z0 = 92, Z1 = 56 + 36;
    const dm = (MASS.U235 + MASS.n) - (MASS.Ba141 + MASS.Kr92 + 3 * MASS.n);
    return { A0, A1, Z0, Z1, dm, Q: dm * U_TO_MEV };
  }

  // -----------------------------------------------------------------------
  // CHIZISH
  // -----------------------------------------------------------------------
  function sphere(p, r, color, w, h, glow) {
    const s = project(p, w, h);
    const rad = Math.max(1, r * s.scale);
    ctx.beginPath();
    ctx.fillStyle = color;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.arc(s.sx, s.sy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function line3(a, b, color, w, h, width = 1) {
    const s1 = project(a, w, h), s2 = project(b, w, h);
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(s1.sx, s1.sy); ctx.lineTo(s2.sx, s2.sy); ctx.stroke();
  }

  function drawBox(size, color, w, h) {
    const c = [];
    for (const x of [-size, size]) for (const y of [-size, size]) for (const z of [-size, size]) c.push({ x, y, z });
    const edges = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]];
    for (const [a, b] of edges) line3(c[a], c[b], color, w, h);
  }

  function drawDepthSorted(items, w, h) {
    items.sort((a, b) => project(b.p, w, h).depth - project(a.p, w, h).depth);
    for (const it of items) sphere(it.p, it.r, it.color, w, h, it.glow);
  }

  function label(text, x, y, color = '#94A3B8', size = 12) {
    ctx.fillStyle = color;
    ctx.font = `${size}px ui-monospace, monospace`;
    ctx.fillText(text, x, y);
  }

  function drawDecayScene(w, h) {
    drawBox(0.85, 'rgba(148,163,184,0.25)', w, h);
    const items = decay.nuclei.map(n => ({
      p: n, r: 0.07,
      color: n.state === 'active' ? '#34D399' : (n.flash > 0 ? '#FDE68A' : 'rgba(100,116,139,0.55)'),
      glow: n.flash > 0 ? 18 : 0
    }));
    for (const p of decay.particles) items.push({ p, r: 0.025, color: '#F43F5E', glow: 10 });
    drawDepthSorted(items, w, h);
    label(`N = ${countActive()} / ${decay.N0}   t = ${decay.t.toFixed(1)} s`, 12, 20, '#E2E8F0');
    label('● faol yadro   ● yemirilgan   ● nurlanish zarrasi', 12, h - 12);
  }

  function drawFissionScene(w, h) {
    drawBox(BOX, 'rgba(56,189,248,0.25)', w, h);
    const depth = parseFloat(slRods.value);
    const rodBottom = BOX - 2 * BOX * depth;
    for (const rx of ROD_X) {
      if (depth <= 0) continue;
      const pts = [
        { x: rx, y: BOX, z: -BOX }, { x: rx, y: BOX, z: BOX },
        { x: rx, y: rodBottom, z: BOX }, { x: rx, y: rodBottom, z: -BOX }
      ].map(p => project(p, w, h));
      ctx.fillStyle = 'rgba(148,163,184,0.22)';
      ctx.strokeStyle = 'rgba(203,213,225,0.6)';
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    const items = fission.nuclei.map(n => ({
      p: n, r: n.r,
      color: n.state === 'stable' ? '#34D399' : (n.flash > 0 ? '#FDE68A' : 'rgba(100,116,139,0.35)'),
      glow: n.flash > 0 ? 24 : 0
    }));
    for (const f of fission.fragments) items.push({ p: f, r: 0.04, color: f.color, glow: 8 });
    for (const n of fission.neutrons) items.push({ p: n, r: 0.018, color: '#38BDF8', glow: 8 });
    drawDepthSorted(items, w, h);
    label(`Kadmiy sterjenlari: ${Math.round(depth * 100)}%   k ≈ ${fission.k.toFixed(2)}`, 12, 20, '#E2E8F0');
    label('● U-235   ● neytron   ● Ba-141 / Kr-92 parchalari', 12, h - 12);
  }

  function drawFusionScene(w, h) {
    // Tokamak torusi karkasi
    for (let k = 0; k < 16; k++) {
      const phi = (k / 16) * Math.PI * 2;
      let prev = null;
      for (let s = 0; s <= 20; s++) {
        const th = (s / 20) * Math.PI * 2;
        const R = TORUS_R + TORUS_r * Math.cos(th);
        const p = { x: R * Math.cos(phi), y: TORUS_r * Math.sin(th), z: R * Math.sin(phi) };
        if (prev) line3(prev, p, 'rgba(168,85,247,0.18)', w, h);
        prev = p;
      }
    }
    const items = fusion.ions.map(ion => ({ p: ion.pos, r: ion.type === 'D' ? 0.022 : 0.026, color: ion.type === 'D' ? '#38BDF8' : '#F472B6', glow: 6 }));
    for (const p of fusion.products) items.push({ p, r: p.kind === 'He' ? 0.035 : 0.018, color: p.kind === 'He' ? '#FDE68A' : '#E2E8F0', glow: 14 });
    drawDepthSorted(items, w, h);
    label(`D-T sintez reaksiyalari: ${fusion.reactions}`, 12, 20, '#E2E8F0');
    label('● D   ● T   ● He-4 (3.5 MeV)   ● n (14.1 MeV)', 12, h - 12);
  }

  function drawCapstoneScene(w, h) {
    const n = CAP_STAGES.length;
    const active = Math.floor(capstone.t / 1.2) % n;
    const pts = CAP_STAGES.map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      return { x: Math.cos(a) * 0.85, y: 0, z: Math.sin(a) * 0.85 };
    });
    for (let i = 0; i < n; i++) line3(pts[i], pts[(i + 1) % n], i === active ? '#F43F5E' : 'rgba(148,163,184,0.35)', w, h, i === active ? 2.5 : 1);
    const items = pts.map((p, i) => ({ p, r: i === active ? 0.09 : 0.065, color: i === active ? '#F43F5E' : '#38BDF8', glow: i === active ? 20 : 4 }));
    items.push({ p: { x: 0, y: 0, z: 0 }, r: 0.12, color: '#34D399', glow: 16 });
    drawDepthSorted(items, w, h);
    ctx.textAlign = 'center';
    pts.forEach((p, i) => {
      const s = project(p, w, h);
      label(`${i + 1}. ${CAP_STAGES[i]}`, s.sx, s.sy - 14, i === active ? '#FDA4AF' : '#CBD5E1', 11);
    });
    ctx.textAlign = 'left';
    const au = capstoneAudit();
    label(`A: ${au.A0} → ${au.A1}  ✓   Z: ${au.Z0} → ${au.Z1}  ✓`, 12, 20, '#E2E8F0');
    label(`Δm = ${au.dm.toFixed(4)} u  →  Q = ${au.Q.toFixed(1)} MeV (tezkor energiya)`, 12, 38, '#FBBF24');
  }

  function drawGraph() {
    const w = graphCanvas.clientWidth || graphCanvas.width;
    const h = graphCanvas.clientHeight || graphCanvas.height;
    gctx.clearRect(0, 0, w, h);
    gctx.fillStyle = '#0B1120';
    gctx.fillRect(0, 0, w, h);
    const padL = 44, padR = 12, padT = 28, padB = 30;
    const pw = w - padL - padR, ph = h - padT - padB;

    if (mode !== 'capstone') drawAxes();
    function drawAxes() {
    gctx.strokeStyle = 'rgba(148,163,184,0.15)';
    gctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (ph * i) / 4;
      gctx.beginPath(); gctx.moveTo(padL, y); gctx.lineTo(padL + pw, y); gctx.stroke();
    }
    gctx.strokeStyle = 'rgba(148,163,184,0.5)';
    gctx.beginPath(); gctx.moveTo(padL, padT); gctx.lineTo(padL, padT + ph); gctx.lineTo(padL + pw, padT + ph); gctx.stroke();
    }

    function series(data, xMax, yMax, color, dashed) {
      if (data.length < 2 || yMax <= 0) return;
      gctx.strokeStyle = color; gctx.lineWidth = 2;
      gctx.setLineDash(dashed ? [6, 4] : []);
      gctx.beginPath();
      data.forEach((d, i) => {
        const x = padL + (d.x / xMax) * pw;
        const y = padT + ph - (Math.min(d.y, yMax) / yMax) * ph;
        i ? gctx.lineTo(x, y) : gctx.moveTo(x, y);
      });
      gctx.stroke();
      gctx.setLineDash([]);
    }
    function legend(items) {
      gctx.font = '11px ui-monospace, monospace';
      let x = padL;
      for (const it of items) {
        gctx.fillStyle = it.color; gctx.fillRect(x, 10, 12, 3);
        gctx.fillStyle = '#CBD5E1'; gctx.fillText(it.text, x + 16, 15);
        x += gctx.measureText(it.text).width + 30;
      }
    }
    function axisLabels(xText, yMax, yUnit) {
      gctx.fillStyle = '#94A3B8'; gctx.font = '10px ui-monospace, monospace';
      gctx.fillText(xText, padL + pw - gctx.measureText(xText).width, h - 8);
      gctx.fillText(String(Math.round(yMax)) + yUnit, 4, padT + 4);
      gctx.fillText('0', 30, padT + ph);
    }

    if (mode === 'decay') {
      const T = parseFloat(slHalf.value);
      const xMax = Math.max(4 * T, decay.t);
      const sim = decay.history.map(p => ({ x: p.t, y: p.n }));
      const theory = [];
      for (let i = 0; i <= 80; i++) { const t = (xMax * i) / 80; theory.push({ x: t, y: decay.N0 * Math.pow(2, -t / T) }); }
      series(theory, xMax, decay.N0, '#FBBF24', true);
      series(sim, xMax, decay.N0, '#34D399', false);
      for (let k = 1; k * T <= xMax; k++) {
        const x = padL + ((k * T) / xMax) * pw;
        gctx.fillStyle = 'rgba(148,163,184,0.6)'; gctx.font = '10px ui-monospace, monospace';
        gctx.fillText(`${k}T½`, x - 8, padT + ph + 12);
      }
      legend([{ color: '#34D399', text: 'N(t) Monte-Karlo' }, { color: '#FBBF24', text: 'N₀·2^(−t/T½)' }]);
      axisLabels(`t, s (max ${xMax.toFixed(0)})`, decay.N0, '');
    } else if (mode === 'fission') {
      const hist = fission.history;
      const t0 = hist.length ? hist[0].t : 0;
      const xMax = Math.max(1, (hist.length ? hist[hist.length - 1].t : 1) - t0);
      const nMax = Math.max(10, ...hist.map(p => p.n));
      const eMax = Math.max(200, ...hist.map(p => p.e));
      series(hist.map(p => ({ x: p.t - t0, y: p.n })), xMax, nMax, '#38BDF8', false);
      series(hist.map(p => ({ x: p.t - t0, y: (p.e / eMax) * nMax })), xMax, nMax, '#F43F5E', true);
      legend([{ color: '#38BDF8', text: 'Neytronlar soni' }, { color: '#F43F5E', text: `E (max ${Math.round(eMax)} MeV)` }]);
      axisLabels('t, s', nMax, ' n');
    } else if (mode === 'fusion') {
      const hist = fusion.history;
      const t0 = hist.length ? hist[0].t : 0;
      const xMax = Math.max(1, (hist.length ? hist[hist.length - 1].t : 1) - t0);
      const pMax = Math.max(20, ...hist.map(p => p.p));
      series(hist.map(p => ({ x: p.t - t0, y: p.p })), xMax, pMax, '#A855F7', false);
      legend([{ color: '#A855F7', text: 'Sintez quvvati, MeV/s' }]);
      axisLabels('t, s', pMax, '');
    } else {
      const au = capstoneAudit();
      gctx.font = '13px ui-monospace, monospace';
      const rows = [
        ['[AUDIT] Massa soni A', `${au.A0} = ${au.A1}`, '#34D399'],
        ['[AUDIT] Zaryad soni Z', `${au.Z0} = ${au.Z1}`, '#34D399'],
        ['[ENERGY] Δm', `${au.dm.toFixed(4)} u`, '#FBBF24'],
        ['[ENERGY] Q = Δm·c²', `${au.Q.toFixed(1)} MeV`, '#FBBF24'],
        ['[NOTE] β/γ bilan jami', '≈ 200 MeV', '#94A3B8'],
        ['[PIPELINE] Bosqich', `${Math.floor(capstone.t / 1.2) % 7 + 1} / 7`, '#F43F5E']
      ];
      rows.forEach((r, i) => {
        gctx.fillStyle = '#CBD5E1'; gctx.fillText(r[0], 14, 40 + i * 30);
        gctx.fillStyle = r[2]; gctx.fillText(r[1], Math.max(200, w * 0.5), 40 + i * 30);
      });
    }
  }

  // -----------------------------------------------------------------------
  // TELEMETRIYA
  // -----------------------------------------------------------------------
  function setTel(i, labelText, value) {
    if (tel[i].label) tel[i].label.textContent = labelText;
    if (tel[i].param) tel[i].param.textContent = value;
  }

  function updateTelemetry() {
    if (mode === 'decay') {
      const T = parseFloat(slHalf.value);
      const N = countActive();
      setTel(0, 'Faol Yadrolar N(t)', `${N} ta`);
      setTel(1, 'Nazariy N₀·2^(−t/T)', (decay.N0 * Math.pow(2, -decay.t / T)).toFixed(1));
      setTel(2, 'Aktivlik A = λN', `${((Math.LN2 / T) * N).toFixed(2)} Bq`);
      setTel(3, 'Vaqt t', `${decay.t.toFixed(1)} s`);
    } else if (mode === 'fission') {
      setTel(0, 'Ajralgan Energiya', `${fission.energy} MeV`);
      setTel(1, 'Koeffitsiyent (k)', fission.k.toFixed(2));
      setTel(2, 'U-235 Yadrolari', `${fission.nuclei.filter(n => n.state === 'stable').length} ta`);
      setTel(3, 'Erkin Neytronlar', `${fission.neutrons.length} ta`);
    } else if (mode === 'fusion') {
      setTel(0, 'Ajralgan Energiya', `${fusion.energy.toFixed(1)} MeV`);
      setTel(1, 'Reaksiyalar Soni', `${fusion.reactions} ta`);
      setTel(2, 'Sintez Tezligi', `${fusionRate().toFixed(1)} 1/s`);
      setTel(3, 'D + T Ionlari', `${fusion.ions.length} ta`);
    } else {
      const au = capstoneAudit();
      setTel(0, 'Massa Soni A', `${au.A0} = ${au.A1}`);
      setTel(1, 'Zaryad Soni Z', `${au.Z0} = ${au.Z1}`);
      setTel(2, 'Q = Δm·c²', `${au.Q.toFixed(1)} MeV`);
      setTel(3, 'Pipeline Bosqichi', `${Math.floor(capstone.t / 1.2) % 7 + 1} / 7`);
    }
  }

  // -----------------------------------------------------------------------
  // BOSHQARUV
  // -----------------------------------------------------------------------
  function resetMode() {
    simTime = 0;
    if (mode === 'decay') resetDecay();
    else if (mode === 'fission') resetFission();
    else if (mode === 'fusion') resetFusion();
    else capstone.t = 0;
  }

  function setMode(m) {
    mode = m;
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    if (fissionGroup) fissionGroup.style.display = m === 'fission' ? '' : 'none';
    if (decayGroup) decayGroup.style.display = m === 'decay' ? '' : 'none';
    resetMode();
  }

  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  if (btnAutorotate) btnAutorotate.addEventListener('click', () => {
    autoRotate = !autoRotate;
    btnAutorotate.classList.toggle('active', autoRotate);
    btnAutorotate.textContent = autoRotate ? '🔄 3D Aylanish: ON' : '🔄 3D Aylanish: OFF';
  });
  if (btnResetCam) btnResetCam.addEventListener('click', () => Object.assign(cam, CAM_DEFAULT));
  if (btnNarration) btnNarration.addEventListener('click', () => speakNuclearNarration(mode));
  if (btnPlay) btnPlay.addEventListener('click', () => {
    running = !running;
    btnPlay.innerHTML = running
      ? '<span style="font-size: 1.1rem; line-height: 1;">⏸</span> To\'xtatish'
      : '<span style="font-size: 1.1rem; line-height: 1;">▶</span> Davom Etish';
  });
  if (btnReset) btnReset.addEventListener('click', resetMode);
  if (btnInject) btnInject.addEventListener('click', () => { if (mode === 'fission') injectNeutron(); });

  if (slRods) slRods.addEventListener('input', () => { valRods.textContent = Math.round(parseFloat(slRods.value) * 100) + '%'; });
  if (slHalf) slHalf.addEventListener('input', () => { valHalf.textContent = parseFloat(slHalf.value).toFixed(1) + ' s'; });

  // -----------------------------------------------------------------------
  // ASOSIY TSIKL
  // -----------------------------------------------------------------------
  let lastTs = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTs) / 1000);
    lastTs = now;

    if (autoRotate && !dragging) cam.yaw += dt * 0.25;

    if (running) {
      simTime += dt;
      if (mode === 'decay') stepDecay(dt);
      else if (mode === 'fission') stepFission(dt);
      else if (mode === 'fusion') stepFusion(dt);
      else capstone.t += dt;
    }

    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#050816';
    ctx.fillRect(0, 0, w, h);

    if (mode === 'decay') drawDecayScene(w, h);
    else if (mode === 'fission') drawFissionScene(w, h);
    else if (mode === 'fusion') drawFusionScene(w, h);
    else drawCapstoneScene(w, h);

    drawGraph();
    updateTelemetry();
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

  window.nuclearCapstonePipeline = { initCanvasSize: resizeAll };

  resizeAll();
  setMode('fission');
  requestAnimationFrame(loop);
}
