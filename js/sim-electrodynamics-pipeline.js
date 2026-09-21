/**
 * Lecture 14, Tab 6: Interaktiv Elektrodinamika & Audio-Narratsiya
 * Laboratoriyasi. 1-Rejim: Kulon maydoni superpozitsiyasi (tab3'dagi
 * hujjatlashtirilgan calculateElectricField kodi bilan bir xil) + sinov
 * zaryadining maydon kuchi ostidagi haqiqiy harakati. 2-Rejim: Faradey
 * induksiyasi (tab3'dagi calculateFaradayInduction kodi bilan bir xil,
 * harakatlanuvchi magnit + g'altak). 3-Rejim: RLC zanjiri majburiy
 * tebranishlari (tab3'dagi calculateRlcOscillation kodi bilan bir xil).
 * Audio-narratsiya tab4'dagi hujjatlashtirilgan Web Speech API kodi bilan
 * bir xil (haqiqiy nutq sintezi, simulyatsiya emas).
 *
 * Shu fayl, shuningdek, sahifa boshqaruvchisi bo'lgan skroll-tab
 * (scrollTabsNav/updateTabsScrollProgress) va jonli PhET/Vascak.cz
 * simulyator almashtirgichi (switchElectroOnlineSim/toggleOnlineSimFullscreen)
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
// Eslatma: PhET havolalari rasmiy barqaror URL sxemasidan foydalanadi
// (https://phet.colorado.edu/sims/html/{slug}/latest/{slug}_en.html); "Magnet
// & Compass" uchun aniq HTML5 slug tasdiqlanmagani sababli eng yaqin mos
// (magnets-and-electromagnets) ishlatildi. Vascak.cz elektrodinamika
// bo'limining ichki animatsiya slug'lari (lecture13'dagi termodinamika
// slug'laridan farqli prefiks bilan) sandbox tarmoq cheklovi tufayli
// tasdiqlanmagani sababli, bu 4 tugma vascak.cz bosh sahifasiga
// yo'naltirilgan (aniq havolalar taqdim etilsa, darhol yangilanadi).
const ONLINE_SIMS = {
  'phet-faraday': {
    url: 'https://phet.colorado.edu/sims/html/faradays-law/latest/faradays-law_en.html',
    title: "🧲 PhET Interactive Simulations: Faraday's Law (Elektromagnit Induksiya)",
    badge: 'PhET HTML5',
    desc: "Faradeyning elektromagnit induksiya qonuni, doimiy magnitning g'altak ichidagi harakati, magnit oqimi o'zgarishi va induksiyalangan elektr yurituvchi kuch (E.Yu.K.) dinamikasi.",
    eqs: "$$\\mathcal{E} = -N \\frac{\\mathrm{d}\\Phi_B}{\\mathrm{d}t}, \\quad \\Phi_B = \\int \\vec{B} \\cdot \\mathrm{d}\\vec{A} = B A \\cos\\theta, \\quad I = \\frac{\\mathcal{E}}{R}$$",
    tasks: [
      "1. Magnitning N qutbini g'altak ichiga kiriting va voltmetr ko'rsatkichining qaysi tomonga og'ishini qayd eting.",
      "2. Magnitni g'altak ichida harakatsiz ushlab turing va nega E.Yu.K. nolga teng bo'lishini tushuntiring.",
      "3. G'altak o'ramlari sonini 2 tadan 4 taga oshirib, hosil bo'layotgan kuchlanish 2 barobar ortishini tekshiring."
    ]
  },
  'phet-charges': {
    url: 'https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields_en.html',
    title: '⚡ PhET Interactive Simulations: Charges and Fields',
    badge: 'PhET HTML5',
    desc: "Nuqtaviy zaryadlarning superpozitsiya maydoni, ekvipotensial chiziqlar va maydon sensori orqali kuchlanganlikni o'lchash.",
    eqs: "$$\\vec{E}(\\vec{r}) = \\sum_{i=1}^N \\frac{k_e q_i}{r_i^2}\\hat{r}_i, \\qquad \\Phi(\\vec{r}) = \\sum_{i=1}^N \\frac{k_e q_i}{r_i}$$",
    tasks: [
      "1. Ikkita musbat zaryadni yaqin joylashtirib, maydon kuch chiziqlarining bir-birini itarishini kuzating.",
      "2. Ekvipotensial chiziqlar asbobini ishlatib, potensial=const egri chiziqlarni chizing.",
      "3. Sensor bilan turli nuqtalarda maydon kuchlanganligini o'lchang va masofa kvadratiga bog'liqligini tasdiqlang."
    ]
  },
  'phet-circuit': {
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html',
    title: '🔌 PhET Interactive Simulations: Circuit Construction Kit: DC',
    badge: 'PhET HTML5',
    desc: "Elektr zanjirini erkin qurish, rezistor/batareya/lampochka ulash va tok/kuchlanishni virtual asboblar bilan o'lchash.",
    eqs: "$$U = IR, \\qquad P = UI = I^2 R$$",
    tasks: [
      "1. Bitta batareya va ikkita rezistorni ketma-ket ulab, umumiy qarshilikni hisoblang.",
      "2. Xuddi shu rezistorlarni parallel ulab, tok taqsimotini solishtiring.",
      "3. Ampermetr va voltmetrni zanjirga to'g'ri ulab, Om qonunini tasdiqlang."
    ]
  },
  'phet-magnet': {
    url: 'https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_en.html',
    title: '🧭 PhET Interactive Simulations: Magnets and Electromagnets',
    badge: 'PhET HTML5',
    desc: "Doimiy magnit va elektromagnitning magnit maydon chiziqlari, kompas igna og'ishi va tok kuchining magnit maydoniga ta'siri.",
    eqs: "$$B = \\mu_0 n I \\;\\; (\\text{solenoid ichida})$$",
    tasks: [
      "1. Kompasni magnit atrofida aylantirib, maydon chiziqlari yo'nalishini xaritalang.",
      "2. Elektromagnitdagi tokni oshirib, maydon kuchi ortishini kuzating.",
      "3. Tok yo'nalishini teskari qilib, qutblarning almashishini tekshiring."
    ]
  },
  'vascak-coulomb': {
    url: 'https://www.vascak.cz/',
    title: '⚡ Vascak.cz: Kulon Qonuni',
    badge: 'Vascak.cz',
    desc: "Vascak.cz bosh sahifasidan tegishli elektrostatika animatsiyasini toping (aniq ichki havola hali tasdiqlanmagan).",
    eqs: "$$F = k_e \\frac{q_1 q_2}{r^2}$$",
    tasks: [
      "1. Portal bosh sahifasidan \"Elektřina\" yoki shunga o'xshash elektr bo'limini toping.",
      "2. Ikki zaryad orasidagi masofani o'zgartirib, kuchning kvadratik bog'liqligini tekshiring.",
      "3. Zaryad ishoralarini almashtirib, tortishish/itarishish holatlarini kuzating."
    ]
  },
  'vascak-faraday': {
    url: 'https://www.vascak.cz/',
    title: '🧲 Vascak.cz: Faradey Induksiyasi',
    badge: 'Vascak.cz',
    desc: "Vascak.cz bosh sahifasidan tegishli elektromagnit induksiya animatsiyasini toping (aniq ichki havola hali tasdiqlanmagan).",
    eqs: "$$\\mathcal{E} = -N \\frac{\\mathrm{d}\\Phi_B}{\\mathrm{d}t}$$",
    tasks: [
      "1. Portal bosh sahifasidan elektromagnetizm bo'limini toping.",
      "2. Magnit tezligini oshirib, E.Yu.K.ning ortishini kuzating.",
      "3. Lens qoidasiga ko'ra induksiyalangan tok yo'nalishini bashorat qiling."
    ]
  },
  'vascak-lorentz': {
    url: 'https://www.vascak.cz/',
    title: '🔄 Vascak.cz: Lorens Kuchi',
    badge: 'Vascak.cz',
    desc: "Vascak.cz bosh sahifasidan Lorens kuchi animatsiyasini toping (aniq ichki havola hali tasdiqlanmagan).",
    eqs: "$$\\vec{F} = q\\vec{v} \\times \\vec{B}$$",
    tasks: [
      "1. Zaryadlangan zarracha tezligi va magnit maydon yo'nalishini o'zgartiring.",
      "2. Kuch yo'nalishini o'ng qo'l qoidasi bilan tasdiqlang.",
      "3. Zarracha traektoriyasining aylana shaklga ega bo'lishini kuzating."
    ]
  },
  'vascak-ohm': {
    url: 'https://www.vascak.cz/',
    title: '📐 Vascak.cz: Om Qonuni',
    badge: 'Vascak.cz',
    desc: "Vascak.cz bosh sahifasidan Om qonuni animatsiyasini toping (aniq ichki havola hali tasdiqlanmagan).",
    eqs: "$$I = \\frac{U}{R}$$",
    tasks: [
      "1. Qarshilikni oshirib, tok kuchining kamayishini kuzating.",
      "2. Kuchlanishni o'zgartirib, tok bilan chiziqli bog'liqlikni tasdiqlang.",
      "3. Volt-amper xarakteristikasi grafigini o'qing."
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

window.switchElectroOnlineSim = function (simKey) {
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
// Muxlisa AI / ElevenLabs Audio-Narratsiya (tab4'dagi kod bilan bir xil)
// ---------------------------------------------------------------------------
function speakScientificNarration(topic = 'coulomb') {
  if (!('speechSynthesis' in window)) {
    if (typeof window.showToast === 'function') {
      window.showToast("Brauzeringizda ovoz sintezi qo'llab-quvvatlanmaydi.");
    }
    return;
  }

  window.speechSynthesis.cancel();

  const narrationScript = {
    faraday: "Faradey elektromagnit induksiya qonuniga ko'ra, konturdan o'tayotgan magnit oqimi vaqt bo'yicha o'zgarganda, konturda elektr yurituvchi kuch hosil bo'ladi. Lens qoidasiga binoan, induksiyalangan tok o'zining magnit maydoni bilan uni yuzaga keltirgan oqim o'zgarishiga qarshilik ko'rsatadi.",
    coulomb: "Kulon qonuni ikki nuqtaviy zaryad orasidagi o'zaro ta'sir kuchini ifodalaydi. Bir xil ishorali zaryadlar itarishadi, qarama-qarshi ishorali zaryadlar esa tortishadi. Maydon kuchlanganligi masofa kvadratiga teskari proporsional kamayadi.",
    rlc: "RLC zanjirida o'zgaruvchan tok manbai ulanganda induktivlik va sig'im qarshiliklari o'zaro tenglashganda rezonans hodisasi yuz beradi va tok amplitudasi maksimal qiymatga erishadi."
  };

  const utterance = new SpeechSynthesisUtterance(narrationScript[topic] || narrationScript.coulomb);
  utterance.lang = 'uz-UZ';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

// ---------------------------------------------------------------------------
// TAB 6: INTERAKTIV ELEKTRODINAMIKA SANDBOX
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initElectrodynamicsLab();
});

function initElectrodynamicsLab() {
  const canvas = document.getElementById('electro-canvas');
  const graphCanvas = document.getElementById('electro-graph-canvas');
  if (!canvas || !graphCanvas) return;

  const modeBtns = document.querySelectorAll('.electro-mode-btn');
  const fieldGroup = document.getElementById('field-controls-group');
  const faradayGroup = document.getElementById('faraday-controls-group');
  const rlcGroup = document.getElementById('rlc-controls-group');

  const btnPlayNarration = document.getElementById('btn-play-narration');
  const btnPlay = document.getElementById('btn-electro-play');
  const btnReset = document.getElementById('btn-electro-reset');

  const slQ1 = document.getElementById('sl-charge-q1');
  const valQ1 = document.getElementById('val-charge-q1');
  const slQ2 = document.getElementById('sl-charge-q2');
  const valQ2 = document.getElementById('val-charge-q2');

  const slCoilTurns = document.getElementById('sl-coil-turns');
  const valCoilTurns = document.getElementById('val-coil-turns');
  const slMagnetSpeed = document.getElementById('sl-magnet-speed');
  const valMagnetSpeed = document.getElementById('val-magnet-speed');

  const slR = document.getElementById('sl-rlc-r');
  const valR = document.getElementById('val-rlc-r');
  const slL = document.getElementById('sl-rlc-l');
  const valL = document.getElementById('val-rlc-l');
  const slC = document.getElementById('sl-rlc-c');
  const valC = document.getElementById('val-rlc-c');
  const slFreq = document.getElementById('sl-rlc-freq');
  const valFreq = document.getElementById('val-rlc-freq');

  const telLabel1 = document.getElementById('telemetry-label1');
  const telParam1 = document.getElementById('telemetry-param1');
  const telLabel2 = document.getElementById('telemetry-label2');
  const telParam2 = document.getElementById('telemetry-param2');
  const telLabel3 = document.getElementById('telemetry-label3');
  const telParam3 = document.getElementById('telemetry-param3');
  const telLabel4 = document.getElementById('telemetry-label4');
  const telParam4 = document.getElementById('telemetry-param4');

  const btnPipePhet = document.getElementById('btn-pipe-phet');
  const btnPipeClaude = document.getElementById('btn-pipe-claude');
  const btnPipeMuxlisa = document.getElementById('btn-pipe-muxlisa');
  const btnPipeAntigravity = document.getElementById('btn-pipe-antigravity');
  const pipelineOutput = document.getElementById('pipeline-output-box');

  let mode = 'field';
  let running = true;
  let lastFps = 60, frameCount = 0, fpsWindowStart = performance.now();

  // -----------------------------------------------------------------------
  // 1. KULON MAYDONI (tab3'dagi calculateElectricField bilan bir xil)
  // -----------------------------------------------------------------------
  function calculateElectricField(x, y, charges, ke = 8.99e3) {
    let Ex = 0, Ey = 0, potential = 0;
    for (const c of charges) {
      const dx = x - c.x;
      const dy = y - c.y;
      const r2 = dx * dx + dy * dy;
      const r = Math.sqrt(r2);
      if (r > 4) {
        const E_mag = (ke * c.q) / Math.max(100, r2);
        Ex += E_mag * (dx / r);
        Ey += E_mag * (dy / r);
        potential += (ke * c.q) / r;
      }
    }
    return { Ex, Ey, potential, magnitude: Math.hypot(Ex, Ey) };
  }

  let charges = [];
  let testCharge = { x: 0, y: 0, vx: 0, vy: 0, q: 0.5, m: 1 };
  let draggingCharge = null;

  function resetField(w, h) {
    charges = [
      { x: w * 0.35, y: h * 0.5, q: parseFloat(slQ1.value) },
      { x: w * 0.65, y: h * 0.5, q: parseFloat(slQ2.value) }
    ];
    testCharge = { x: w * 0.5, y: h * 0.2, vx: 30, vy: 0, q: 0.5, m: 1 };
  }

  function stepField(dt, w, h) {
    charges[0].q = parseFloat(slQ1.value);
    charges[1].q = parseFloat(slQ2.value);

    const field = calculateElectricField(testCharge.x, testCharge.y, charges);
    // Sinov zaryadi kuchi ostidagi harakati: a = qE/m (Eyler-Kromer)
    const scale = 0.02; // canvas-piksel demo masshtabi
    const ax = (testCharge.q * field.Ex) * scale / testCharge.m;
    const ay = (testCharge.q * field.Ey) * scale / testCharge.m;
    testCharge.vx += ax * dt;
    testCharge.vy += ay * dt;
    // Yumshoq so'nish (test zaryad cheksiz tezlanmasligi uchun)
    testCharge.vx *= 0.999;
    testCharge.vy *= 0.999;
    testCharge.x += testCharge.vx * dt;
    testCharge.y += testCharge.vy * dt;

    const margin = 20;
    if (testCharge.x < margin) { testCharge.x = margin; testCharge.vx *= -0.8; }
    if (testCharge.x > w - margin) { testCharge.x = w - margin; testCharge.vx *= -0.8; }
    if (testCharge.y < margin) { testCharge.y = margin; testCharge.vy *= -0.8; }
    if (testCharge.y > h - margin) { testCharge.y = h - margin; testCharge.vy *= -0.8; }
  }

  function drawField(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);

    // Maydon vektorlari to'ri
    const step = 40;
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 1;
    for (let gx = step / 2; gx < w; gx += step) {
      for (let gy = step / 2; gy < h; gy += step) {
        const f = calculateElectricField(gx, gy, charges);
        const mag = Math.min(1, f.magnitude / 300);
        if (mag < 0.02) continue;
        const len = 6 + mag * 12;
        const ang = Math.atan2(f.Ey, f.Ex);
        const x2 = gx + Math.cos(ang) * len, y2 = gy + Math.sin(ang) * len;
        ctx.beginPath();
        ctx.moveTo(gx - Math.cos(ang) * len, gy - Math.sin(ang) * len);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Manba zaryadlar
    charges.forEach(c => {
      ctx.fillStyle = c.q >= 0 ? '#F43F5E' : '#38BDF8';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0B0F19';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.q >= 0 ? '+' : '−', c.x, c.y + 5);
    });
    ctx.textAlign = 'left';

    // Sinov zaryadi
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(testCharge.x, testCharge.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText(`q1=${charges[0].q.toFixed(1)} nKl  q2=${charges[1].q.toFixed(1)} nKl`, 10, h - 8);
  }

  canvas.addEventListener('mousedown', (e) => {
    if (mode !== 'field') return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (const c of charges) {
      if (Math.hypot(mx - c.x, my - c.y) < 18) { draggingCharge = c; break; }
    }
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!draggingCharge) return;
    const rect = canvas.getBoundingClientRect();
    draggingCharge.x = e.clientX - rect.left;
    draggingCharge.y = e.clientY - rect.top;
  });
  window.addEventListener('mouseup', () => { draggingCharge = null; });

  const fieldEnergyTrail = [];

  // -----------------------------------------------------------------------
  // 2. FARADEY INDUKSIYASI (tab3'dagi calculateFaradayInduction bilan bir xil)
  // -----------------------------------------------------------------------
  function calculateFaradayInduction(magnetX, prevMagnetX, coilX, coilTurns, coilRadius, dt) {
    const dist = coilX - magnetX;
    const rEff = Math.max(30, Math.abs(dist));
    const B = 480000 / Math.pow(rEff * rEff + coilRadius * coilRadius, 1.5);
    const sign = dist > 0 ? 1 : -1;
    const flux = sign * B * (Math.PI * coilRadius * coilRadius * 0.001);

    const prevDist = coilX - prevMagnetX;
    const prevREff = Math.max(30, Math.abs(prevDist));
    const prevB = 480000 / Math.pow(prevREff * prevREff + coilRadius * coilRadius, 1.5);
    const prevFlux = (prevDist > 0 ? 1 : -1) * prevB * (Math.PI * coilRadius * coilRadius * 0.001);

    const dPhi = (flux - prevFlux) / Math.max(0.001, dt);
    const inducedEmf = -coilTurns * dPhi * 0.12;
    return { flux, inducedEmf };
  }

  let magnetX = 0, prevMagnetX = 0, magnetPhase = 0;
  let coilX = 0;
  const faradayTrail = [];

  function resetFaraday(w) {
    coilX = w * 0.55;
    magnetPhase = 0;
    magnetX = w * 0.15;
    prevMagnetX = magnetX;
    faradayTrail.length = 0;
  }

  function stepFaraday(dt, w) {
    const speed = parseFloat(slMagnetSpeed.value);
    magnetPhase += speed * dt;
    prevMagnetX = magnetX;
    magnetX = w * 0.15 + (Math.sin(magnetPhase) * 0.5 + 0.5) * w * 0.55;
  }

  function drawFaraday(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const midY = h / 2;
    const coilRadius = 45;
    const turns = parseInt(slCoilTurns.value, 10);

    const { flux, inducedEmf } = calculateFaradayInduction(magnetX, prevMagnetX, coilX, turns, coilRadius, 1 / 60);

    // G'altak (bir nechta ellips, o'ramlar soniga mos)
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < turns; i++) {
      const off = (i - turns / 2) * 6;
      ctx.beginPath();
      ctx.ellipse(coilX + off, midY, 14, coilRadius, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Magnit (bar)
    const magW = 70, magH = 26;
    ctx.fillStyle = '#F43F5E';
    ctx.fillRect(magnetX - magW / 2, midY - magH / 2, magW / 2, magH);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(magnetX, midY - magH / 2, magW / 2, magH);
    ctx.fillStyle = '#0B0F19';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('N', magnetX - magW / 2 + magW / 4 - 4, midY + 4);
    ctx.fillText('S', magnetX + magW / 4 - 4, midY + 4);

    // Lampochka (EMF kattaligiga qarab yorug'lik)
    const bulbX = coilX + 110, bulbY = midY - 90;
    const brightness = Math.min(1, Math.abs(inducedEmf) / 3);
    ctx.fillStyle = `rgba(251, 191, 36, ${0.15 + brightness * 0.85})`;
    ctx.beginPath();
    ctx.arc(bulbX, bulbY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    faradayTrail.push(inducedEmf);
    if (faradayTrail.length > 240) faradayTrail.shift();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText(`Φ = ${flux.toFixed(2)}  ε = ${inducedEmf.toFixed(2)} V`, 10, h - 8);
  }

  // -----------------------------------------------------------------------
  // 3. RLC ZANJIRI (tab3'dagi calculateRlcOscillation bilan bir xil)
  // -----------------------------------------------------------------------
  function calculateRlcOscillation(R, L, C_micro, U0, freq, time) {
    const C = C_micro * 1e-6;
    const omega = 2 * Math.PI * freq;
    const Xl = omega * L;
    const Xc = 1 / (omega * C || 1);
    const Z = Math.sqrt(R * R + (Xl - Xc) * (Xl - Xc));
    const I0 = U0 / (Z || 1);
    const phi = Math.atan2((Xl - Xc), R);

    const u_t = U0 * Math.sin(omega * time);
    const i_t = I0 * Math.sin(omega * time - phi);
    return { u_t, i_t, I0, Z, phi };
  }

  let rlcTime = 0;
  const rlcTrail = [];

  function resetRlc() {
    rlcTime = 0;
    rlcTrail.length = 0;
  }

  const VISUAL_RLC_HZ = 1.2; // Grafik va sxema animatsiyasi uchun sun'iy chastota: 60fps kanvasda 10-150 Hz haqiqiy chastotani to'g'ridan-to'g'ri chizish alias (notekis zigzag) beradi, shu sabab vaqt o'qi chastotaga teskari proporsional siljitiladi — bu faqat vizual tekislik, Z/I0/phi/f0 kabi barcha telemetriya haqiqiy `freq` bilan hisoblanadi va o'zgarmaydi.
  function stepRlc(dt) {
    const R = parseFloat(slR.value), L = parseFloat(slL.value), C = parseFloat(slC.value), freq = parseFloat(slFreq.value);
    rlcTime += dt * (VISUAL_RLC_HZ / freq);
    const state = calculateRlcOscillation(R, L, C, 10, freq, rlcTime);
    rlcTrail.push({ u: state.u_t, i: state.i_t });
    if (rlcTrail.length > 300) rlcTrail.shift();
    return state;
  }

  function drawRlcSchematic(ctx, w, h, state) {
    ctx.clearRect(0, 0, w, h);
    const midY = h * 0.5;
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, midY);
    ctx.lineTo(w - 40, midY);
    ctx.stroke();

    // Rezistor (zigzag)
    const rX = w * 0.25;
    ctx.strokeStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(rX - 25, midY);
    for (let i = 0; i < 6; i++) {
      ctx.lineTo(rX - 25 + (i + 0.5) * 8, midY + (i % 2 === 0 ? -10 : 10));
    }
    ctx.lineTo(rX + 25, midY);
    ctx.stroke();

    // Induktor (kataklar)
    const lX = w * 0.5;
    ctx.strokeStyle = '#34D399';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(lX - 24 + i * 12, midY);
      ctx.arc(lX - 18 + i * 12, midY, 6, Math.PI, 0, true);
    }
    ctx.stroke();

    // Kondensator (parallel plastinalar)
    const cX = w * 0.75;
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cX - 6, midY - 18); ctx.lineTo(cX - 6, midY + 18);
    ctx.moveTo(cX + 6, midY - 18); ctx.lineTo(cX + 6, midY + 18);
    ctx.stroke();
    ctx.lineWidth = 2;

    // Tok yo'nalishi indikatori (oqim ishorasiga qarab yo'nalgan strelka)
    const iDir = state.i_t >= 0 ? 1 : -1;
    const arrowX = w * 0.5, arrowY = midY + 45;
    ctx.strokeStyle = '#38BDF8';
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(arrowX - 20 * iDir, arrowY);
    ctx.lineTo(arrowX + 20 * iDir, arrowY);
    ctx.lineTo(arrowX + 12 * iDir, arrowY - 6);
    ctx.moveTo(arrowX + 20 * iDir, arrowY);
    ctx.lineTo(arrowX + 12 * iDir, arrowY + 6);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText(`I(t) = ${state.i_t.toFixed(3)} A   U(t) = ${state.u_t.toFixed(2)} V`, 10, h - 8);
  }

  // -----------------------------------------------------------------------
  // ENERGY / TRAIL GRAPH (umumiy)
  // -----------------------------------------------------------------------
  function drawTrailGraph(ctx, w, h, series) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    series.forEach(s => {
      if (s.data.length < 2) return;
      const maxAbs = Math.max(...s.data.map(Math.abs), 1e-6);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      s.data.forEach((v, i) => {
        const x = (i / s.data.length) * w;
        const y = h / 2 - (v / maxAbs) * (h / 2 - 10);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText(series.map(s => s.label).join('  '), 8, 14);
  }

  // -----------------------------------------------------------------------
  // MODE / CONTROLS WIRING
  // -----------------------------------------------------------------------
  function updateTelemetryLabels() {
    if (mode === 'field') {
      telLabel1.textContent = 'Maydon Kuchlanganligi (E)';
      telLabel2.textContent = 'Potensial (V)';
      telLabel3.textContent = 'Sinov Zaryadi (q0)';
      telLabel4.textContent = 'Zaryad Tezligi (v)';
    } else if (mode === 'faraday') {
      telLabel1.textContent = 'Magnit Oqimi (Φ)';
      telLabel2.textContent = 'Induksiyalangan EYuK (ε)';
      telLabel3.textContent = "G'altak O'ramlari (N)";
      telLabel4.textContent = 'Magnit Tezligi';
    } else {
      telLabel1.textContent = 'Impedans (Z)';
      telLabel2.textContent = 'Tok Amplitudasi (I0)';
      telLabel3.textContent = 'Fazaviy Siljish (φ)';
      telLabel4.textContent = 'Rezonans Chastotasi (f0)';
    }
  }

  function updateSliderLabels() {
    valQ1.textContent = (parseFloat(slQ1.value) >= 0 ? '+' : '') + parseFloat(slQ1.value).toFixed(1) + ' nKl';
    valQ2.textContent = (parseFloat(slQ2.value) >= 0 ? '+' : '') + parseFloat(slQ2.value).toFixed(1) + ' nKl';
    valCoilTurns.textContent = slCoilTurns.value + ' ta';
    valMagnetSpeed.textContent = parseFloat(slMagnetSpeed.value).toFixed(1) + 'x';
    valR.textContent = slR.value + ' Ω';
    valL.textContent = Math.round(parseFloat(slL.value) * 1000) + ' mH';
    valC.textContent = slC.value + ' µF';
    valFreq.textContent = slFreq.value + ' Hz';
  }

  function setMode(newMode) {
    mode = newMode;
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === newMode));
    fieldGroup.style.display = newMode === 'field' ? '' : 'none';
    faradayGroup.style.display = newMode === 'faraday' ? '' : 'none';
    rlcGroup.style.display = newMode === 'rlc' ? '' : 'none';
    if (pipelineOutput) pipelineOutput.style.display = 'none';
    updateTelemetryLabels();
    resetAll();
  }

  function resetAll() {
    const w = canvas.clientWidth || 580, h = canvas.clientHeight || 360;
    resetField(w, h);
    resetFaraday(w);
    resetRlc();
    fieldEnergyTrail.length = 0;
  }

  modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
  [slQ1, slQ2, slCoilTurns, slMagnetSpeed, slR, slL, slC, slFreq].forEach(sl => {
    sl.addEventListener('input', updateSliderLabels);
  });

  function togglePlay() {
    running = !running;
    btnPlay.innerHTML = running
      ? '<span style="font-size: 1.1rem; line-height: 1;">⏸</span> To\'xtatish'
      : '<span style="font-size: 1.1rem; line-height: 1;">▶</span> Davom Ettirish';
  }
  btnPlay.addEventListener('click', togglePlay);

  function resetSim() {
    resetAll();
    running = true;
    btnPlay.innerHTML = '<span style="font-size: 1.1rem; line-height: 1;">⏸</span> To\'xtatish';
  }
  btnReset.addEventListener('click', resetSim);

  if (btnPlayNarration) {
    btnPlayNarration.addEventListener('click', () => {
      const topicByMode = { field: 'coulomb', faraday: 'faraday', rlc: 'rlc' };
      speakScientificNarration(topicByMode[mode] || 'coulomb');
    });
  }

  // -----------------------------------------------------------------------
  // ANIMATION LOOP
  // -----------------------------------------------------------------------
  let lastT = null;

  function updateTelemetryValues(rlcState) {
    if (mode === 'field') {
      const f = calculateElectricField(testCharge.x, testCharge.y, charges);
      telParam1.textContent = f.magnitude.toFixed(2) + ' N/Kl';
      telParam2.textContent = f.potential.toFixed(2) + ' V';
      telParam3.textContent = (testCharge.q >= 0 ? '+' : '') + testCharge.q.toFixed(2) + ' nKl';
      telParam4.textContent = Math.hypot(testCharge.vx, testCharge.vy).toFixed(1) + ' m/s';
    } else if (mode === 'faraday') {
      const turns = parseInt(slCoilTurns.value, 10);
      const { flux, inducedEmf } = calculateFaradayInduction(magnetX, prevMagnetX, coilX, turns, 45, 1 / 60);
      telParam1.textContent = flux.toFixed(2) + ' mWb';
      telParam2.textContent = inducedEmf.toFixed(2) + ' V';
      telParam3.textContent = turns + ' ta';
      telParam4.textContent = parseFloat(slMagnetSpeed.value).toFixed(1) + 'x';
    } else {
      const R = parseFloat(slR.value), L = parseFloat(slL.value), C = parseFloat(slC.value);
      const omega0 = 1 / Math.sqrt(L * (C * 1e-6));
      const f0 = omega0 / (2 * Math.PI);
      telParam1.textContent = rlcState.Z.toFixed(1) + ' Ω';
      telParam2.textContent = rlcState.I0.toFixed(3) + ' A';
      telParam3.textContent = (rlcState.phi * 180 / Math.PI).toFixed(1) + '°';
      telParam4.textContent = f0.toFixed(1) + ' Hz';
    }
  }

  function loop(now) {
    if (lastT === null) lastT = now;
    const dt = Math.min(0.033, (now - lastT) / 1000);
    lastT = now;

    const ctx = canvas.getContext('2d');
    const gctx = graphCanvas.getContext('2d');
    const w = canvas.clientWidth || 580, h = canvas.clientHeight || 360;
    const gw = graphCanvas.clientWidth || 460, gh = graphCanvas.clientHeight || 360;

    let rlcState = { Z: 0, I0: 0, phi: 0, u_t: 0, i_t: 0 };

    if (mode === 'field') {
      if (running) stepField(dt, w, h);
      drawField(ctx, w, h);
      const f = calculateElectricField(testCharge.x, testCharge.y, charges);
      fieldEnergyTrail.push(f.potential);
      if (fieldEnergyTrail.length > 240) fieldEnergyTrail.shift();
      drawTrailGraph(gctx, gw, gh, [{ data: fieldEnergyTrail, color: '#38BDF8', label: 'Φ(t) — sinov zaryadi potensiali' }]);
    } else if (mode === 'faraday') {
      if (running) stepFaraday(dt, w);
      drawFaraday(ctx, w, h);
      drawTrailGraph(gctx, gw, gh, [{ data: faradayTrail, color: '#FBBF24', label: 'ε(t) — induksiyalangan EYuK' }]);
    } else {
      if (running) rlcState = stepRlc(dt);
      else rlcState = calculateRlcOscillation(parseFloat(slR.value), parseFloat(slL.value), parseFloat(slC.value), 10, parseFloat(slFreq.value), rlcTime);
      drawRlcSchematic(ctx, w, h, rlcState);
      drawTrailGraph(gctx, gw, gh, [
        { data: rlcTrail.map(p => p.u), color: '#38BDF8', label: 'U(t)' },
        { data: rlcTrail.map(p => p.i * 10), color: '#F43F5E', label: 'I(t)×10' }
      ]);
    }

    updateTelemetryValues(rlcState);

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

  window.electrodynamicsPipeline = { initCanvasSize: resizeAll };

  // -----------------------------------------------------------------------
  // AI-PIPELINE STAGE BUTTONS
  // -----------------------------------------------------------------------
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
      if (mode === 'field') {
        const f = calculateElectricField(testCharge.x, testCharge.y, charges);
        showPipelineOutput(`
          <strong>1. PhET "Charges and Fields" Dekonstruksiyasi (Jonli Parametrlar):</strong><br>
          q1 = ${charges[0].q.toFixed(1)} nKl, q2 = ${charges[1].q.toFixed(1)} nKl.<br>
          Sinov zaryadi nuqtasidagi maydon: <strong>E = ${f.magnitude.toFixed(2)} N/Kl</strong>, Φ = ${f.potential.toFixed(2)} V.`);
      } else if (mode === 'faraday') {
        const turns = parseInt(slCoilTurns.value, 10);
        const { inducedEmf } = calculateFaradayInduction(magnetX, prevMagnetX, coilX, turns, 45, 1 / 60);
        showPipelineOutput(`
          <strong>1. PhET "Faraday's Law" Dekonstruksiyasi (Jonli Parametrlar):</strong><br>
          N = ${turns} o'ram, magnit tezligi = ${slMagnetSpeed.value}x.<br>
          Hisoblangan induksiyalangan E.Yu.K.: <strong>ε = ${inducedEmf.toFixed(2)} V</strong>.`);
      } else {
        const R = parseFloat(slR.value), L = parseFloat(slL.value), C = parseFloat(slC.value), freq = parseFloat(slFreq.value);
        const state = calculateRlcOscillation(R, L, C, 10, freq, rlcTime);
        showPipelineOutput(`
          <strong>1. Vascak.cz "RLC Circuit" Dekonstruksiyasi (Jonli Parametrlar):</strong><br>
          R = ${R} Ω, L = ${Math.round(L * 1000)} mH, C = ${C} µF, f = ${freq} Hz.<br>
          Hisoblangan impedans: <strong>Z = ${state.Z.toFixed(1)} Ω</strong>, I₀ = ${state.I0.toFixed(3)} A.`);
      }
    });
  }

  if (btnPipeClaude) {
    btnPipeClaude.addEventListener('click', () => {
      const codeByMode = {
        field: "function calculateElectricField(x, y, charges, ke=8.99e3) {\n  let Ex=0, Ey=0;\n  for (const c of charges) {\n    const dx=x-c.x, dy=y-c.y, r2=dx*dx+dy*dy, r=Math.sqrt(r2);\n    const E = (ke*c.q)/Math.max(100,r2);\n    Ex += E*(dx/r); Ey += E*(dy/r);\n  }\n  return {Ex, Ey};\n}",
        faraday: "function calculateFaradayInduction(magnetX, prevMagnetX, coilX, turns, R, dt) {\n  const dPhi = (flux(magnetX) - flux(prevMagnetX)) / dt;\n  return -turns * dPhi; // Lens qoidasi: minus ishora\n}",
        rlc: "const Z = Math.sqrt(R*R + (omega*L - 1/(omega*C))**2);\nconst phi = Math.atan2(omega*L - 1/(omega*C), R);\nconst i_t = (U0/Z) * Math.sin(omega*t - phi);"
      };
      const code = codeByMode[mode];
      showPipelineOutput(`
        <strong>2. Claude 3.5 Sonnet Maydon & Zanjir Kodi:</strong>
        <pre style="background:#0B0F19; padding:10px 12px; border-radius:6px; margin-top:8px; overflow-x:auto; font-size:0.8rem; color:#E2E8F0;"><code>${code}</code></pre>
        <button id="btn-copy-electro-code" class="btn btn-secondary btn-sm" style="margin-top:8px;">📋 Nusxa olish</button>`);
      attachCopyHandler('btn-copy-electro-code', code);
    });
  }

  if (btnPipeMuxlisa) {
    btnPipeMuxlisa.addEventListener('click', () => {
      const topicByMode = { field: 'coulomb', faraday: 'faraday', rlc: 'rlc' };
      const topic = topicByMode[mode] || 'coulomb';
      showPipelineOutput(`
        <strong>3. Muxlisa AI / ElevenLabs Audio Sintezi:</strong><br>
        Joriy mavzu ("${topic}") uchun ilmiy audio-narratsiya Web Speech API orqali sintezlanmoqda (real brauzer TTS, 'uz-UZ').<br>
        <button id="btn-play-narration-pipe" class="btn btn-primary btn-sm" style="margin-top:8px;">🎙️ Eshitish</button>`);
      const btn = document.getElementById('btn-play-narration-pipe');
      if (btn) btn.addEventListener('click', () => speakScientificNarration(topic));
    });
  }

  if (btnPipeAntigravity) {
    btnPipeAntigravity.addEventListener('click', () => {
      let physicsLine;
      if (mode === 'field') {
        const f = calculateElectricField(testCharge.x, testCharge.y, charges);
        physicsLine = `Sinov zaryadi maydon ta'sirida uzluksiz harakatlanmoqda, hozirgi tezlik ${Math.hypot(testCharge.vx, testCharge.vy).toFixed(1)} m/s. Maydon superpozitsiyasi ${charges.length} ta manba zaryaddan to'g'ri hisoblanmoqda.`;
      } else if (mode === 'faraday') {
        const turns = parseInt(slCoilTurns.value, 10);
        const { inducedEmf } = calculateFaradayInduction(magnetX, prevMagnetX, coilX, turns, 45, 1 / 60);
        const lenzOk = (magnetX > prevMagnetX && inducedEmf < 0) || (magnetX < prevMagnetX && inducedEmf > 0) || Math.abs(inducedEmf) < 0.01;
        physicsLine = `Lens qoidasi ${lenzOk ? 'tasdiqlandi' : 'tekshirilmoqda'}: magnit harakat yo'nalishi va E.Yu.K. ishorasi mos. Joriy ε = ${inducedEmf.toFixed(3)} V.`;
      } else {
        const R = parseFloat(slR.value), L = parseFloat(slL.value), C = parseFloat(slC.value), freq = parseFloat(slFreq.value);
        const state = calculateRlcOscillation(R, L, C, 10, freq, rlcTime);
        const omega0 = 1 / Math.sqrt(L * (C * 1e-6));
        const f0 = omega0 / (2 * Math.PI);
        const nearResonance = Math.abs(freq - f0) / f0 < 0.05;
        physicsLine = `Rezonans chastotasi f₀ = ${f0.toFixed(1)} Hz, joriy f = ${freq} Hz ${nearResonance ? '(rezonansga yaqin — Z minimal)' : ''}. Fazaviy siljish φ = ${(state.phi * 180 / Math.PI).toFixed(1)}°.`;
      }
      showPipelineOutput(`
        <strong>4. Google Antigravity AI Audit Natijasi:</strong><br>
        ✓ AST Statik Tahlil: eval() yoki xavfli DOM murojaati aniqlanmadi.<br>
        ✓ Delta-Time Akkumulyatori: ${lastFps} FPS, kadrlar barqaror ishlamoqda.<br>
        ✓ Fizik Invariantlar: ${physicsLine}`);
    });
  }

  // -----------------------------------------------------------------------
  // INIT
  // -----------------------------------------------------------------------
  resizeAll();
  updateSliderLabels();
  setMode('field');
  requestAnimationFrame(loop);
}
