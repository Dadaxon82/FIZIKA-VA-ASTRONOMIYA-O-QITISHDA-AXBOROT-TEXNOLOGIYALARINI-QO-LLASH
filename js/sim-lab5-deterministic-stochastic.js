/**
 * 5-Laboratoriya: deterministik va stoxastik modellarni taqqoslash.
 * 1. Diagnostik test → A/B/C klaster, individual reja va shaxsiy prompt.
 * 2. Chap dastgoh (deterministik): markaziy yulduz atrofida sayyora, Nyuton
 *    gravitatsiyasi, simplektik velocity-Verlet integratori. Boshlang'ich
 *    holat har safar bir xil — orbita aynan takrorlanadi.
 * 3. O'ng dastgoh (stoxastik tavsif): 2D idishdagi elastik to'qnashuvchi
 *    molekulalar va og'ir zarraning Broun harakati. Boshlang'ich tezliklar
 *    tasodifiy (2D Maksvell taqsimoti); gaz dastlab idishning chap qismida
 *    joylashadi, shuning uchun aralashish entropiyasining o'sishi ko'rinadi.
 * 4. 100 ballik rubrika kalkulyatori va promptlarni nusxalash.
 */

(function () {
  function renderMath(el) {
    if (el && typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
      });
    }
  }

  function toast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  }

  // -------------------------------------------------------------------------
  // PROMPTLARNI NUSXALASH
  // -------------------------------------------------------------------------
  function initCopyButtons() {
    document.querySelectorAll('.copy-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        const text = target.value || target.textContent;
        const done = () => {
          const old = btn.textContent;
          btn.textContent = '✅ Nusxalandi!';
          setTimeout(() => { btn.textContent = old; }, 1500);
          toast('Nusxalandi!');
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done).catch(() => { target.select(); document.execCommand('copy'); done(); });
        } else {
          target.select();
          document.execCommand('copy');
          done();
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // 1. DIAGNOSTIK TEST
  // -------------------------------------------------------------------------
  const DIAG_KEY = { diag5_q1: 'a', diag5_q2: 'c', diag5_q3: 'b', diag5_q4: 'c' };

  const CLUSTERS = {
    A: {
      title: 'Klaster "A" — Boshlang\'ich daraja',
      color: 'var(--accent-cyan)',
      plan: "Avval 5-bo'limdagi dastgohda \"Qayta o'rnatish\" tugmasini bir necha marta bosib, orbita har safar aynan takrorlanishini, gaz esa har safar boshqacha boshlanishini kuzating. So'ng 2-bo'limdagi jadvalning 1–4-mezonlarini o'z so'zlaringiz bilan to'ldiring.",
      focus: "deterministik va stoxastik model ta'rifi, takrorlanuvchanlik, kirish va chiqish parametrlari"
    },
    B: {
      title: 'Klaster "B" — Amaliyotchi daraja',
      color: 'var(--accent-emerald)',
      plan: "PhET «Gravity and Orbits» da orbital tezlikni o'zgartirib aylanma, elliptik va ochiq traektoriyalarni oling; «Gas Properties» da haroratni oshirib, tezlik gistogrammasi va bosim fluktuatsiyalarini qayd eting. Natijalarni 8 mezonli jadvalga kiriting.",
      focus: "Kepler orbitalari, Maksvell-Bolsman taqsimoti, bosim fluktuatsiyalari, 8 mezonli taqqoslash"
    },
    C: {
      title: 'Klaster "C" — Ilg\'or daraja',
      color: 'var(--accent-purple)',
      plan: "Gaz modeli ichki jihatdan deterministik (Nyuton + elastik to'qnashuvlar) bo'lsa-da, nima uchun uni statistik tavsiflash zarurligini tushuntiring. Dastgohda Broun zarrasining $\\langle r^2 \\rangle$ ning vaqtga chiziqli o'sishini baholang va entropiya o'sishini qaytmaslik bilan bog'lang.",
      focus: "mikroskopik determinizm va makroskopik statistika, ergodik gipoteza, Broun harakati (<r^2> = 4Dt), entropiya va qaytmaslik"
    }
  };

  function initDiagnostic() {
    const btn = document.getElementById('diag5-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const box = document.getElementById('diag5-result-box');
      const titleEl = document.getElementById('diag5-cluster-val');
      const scoreEl = document.getElementById('diag5-score-val');
      const planEl = document.getElementById('diag5-plan-desc');
      const promptEl = document.getElementById('diag5-personalized-prompt');

      const answers = Object.keys(DIAG_KEY).map(name => document.querySelector(`input[name="${name}"]:checked`));
      box.style.display = 'block';
      if (answers.some(a => !a)) {
        titleEl.textContent = '⚠️ Barcha 4 ta savolga javob bering';
        titleEl.style.color = 'var(--accent-amber)';
        scoreEl.textContent = '';
        planEl.textContent = '';
        promptEl.value = '';
        return;
      }

      const correct = Object.keys(DIAG_KEY).filter((name, i) => answers[i].value === DIAG_KEY[name]).length;
      const score = correct * 25;
      const key = score >= 75 ? 'C' : score >= 50 ? 'B' : 'A';
      const c = CLUSTERS[key];
      const wrong = Object.keys(DIAG_KEY).map((name, i) => answers[i].value === DIAG_KEY[name] ? null : i + 1).filter(Boolean);

      box.style.borderColor = c.color;
      titleEl.textContent = c.title;
      titleEl.style.color = c.color;
      scoreEl.textContent = `${score} / 100 ball (${correct}/4 to'g'ri)`;
      planEl.innerHTML = `<strong>Individual reja:</strong> ${c.plan}` +
        (wrong.length ? `<br><strong>Qayta ko'rib chiqing:</strong> ${wrong.join(', ')}-savol(lar). To'g'ri javoblar: 1-A, 2-C, 3-B, 4-C.` : '');
      renderMath(planEl);

      promptEl.value =
`Siz fizikada kompyuterli modellashtirish bo'yicha Sokratik konsultantsiz. Men 5-laboratoriya diagnostik testidan ${score}/100 ball olib, "${key}" klasteriga kiritildim.
Asosiy mavzular: ${c.focus}.
Laboratoriya ob'yektlari: PhET «Gravity and Orbits» (deterministik) va «Gas Properties» (stoxastik tavsif).
Iltimos:
1. Tayyor jadval yoki xulosa bermang — ikkala modelni o'zim taqqoslashim uchun bosqichma-bosqich yo'naltiruvchi savollar bering.
2. PhET'da qaysi o'lchovlarni olishim kerakligini ayting.
3. Mening darajamga mos bitta qo'shimcha tajriba taklif qiling.`;
    });
  }

  // -------------------------------------------------------------------------
  // 2–3. PARALLEL DASTGOH
  // -------------------------------------------------------------------------
  function initLab() {
    const detCanvas = document.getElementById('lab5-det-canvas');
    const stoCanvas = document.getElementById('lab5-stoch-canvas');
    if (!detCanvas || !stoCanvas) return;
    const dctx = detCanvas.getContext('2d');
    const sctx = stoCanvas.getContext('2d');

    const slMass = document.getElementById('lab5-mass-slider');
    const slVel = document.getElementById('lab5-vel-slider');
    const slTemp = document.getElementById('lab5-temp-slider');
    const slCount = document.getElementById('lab5-count-slider');
    const vMass = document.getElementById('lab5-mass-val');
    const vVel = document.getElementById('lab5-vel-val');
    const vTemp = document.getElementById('lab5-temp-val');
    const vCount = document.getElementById('lab5-count-val');
    const outPeriod = document.getElementById('lab5-det-period');
    const outEnergy = document.getElementById('lab5-det-energy');
    const outSpeed = document.getElementById('lab5-stoch-avgspeed');
    const outEntropy = document.getElementById('lab5-stoch-entropy');

    let running = false;

    // ---------------- Deterministik model (o'lchamsiz birliklar) ----------
    // r₀ = 1, GM = 2.8² → v₀ = 2.8 da aylanma orbita; v₀ ≥ 2.8·√2 ≈ 3.96 da ochiq orbita.
    const GM = 2.8 * 2.8;
    const R0 = 1.0;
    let planet, trail;

    function resetDet() {
      const v0 = parseFloat(slVel.value);
      planet = { x: R0, y: 0, vx: 0, vy: v0, t: 0 };
      trail = [];
    }

    function accelG(x, y) {
      const r2 = x * x + y * y, r = Math.sqrt(r2);
      const f = -GM / (r2 * r);
      return { ax: f * x, ay: f * y };
    }

    function stepDet(dt) {
      // velocity-Verlet (simplektik, vaqt bo'yicha qaytaruvchan)
      const a1 = accelG(planet.x, planet.y);
      planet.x += planet.vx * dt + 0.5 * a1.ax * dt * dt;
      planet.y += planet.vy * dt + 0.5 * a1.ay * dt * dt;
      const a2 = accelG(planet.x, planet.y);
      planet.vx += 0.5 * (a1.ax + a2.ax) * dt;
      planet.vy += 0.5 * (a1.ay + a2.ay) * dt;
      planet.t += dt;
    }

    function orbitInfo() {
      const m = parseFloat(slMass.value);
      const r = Math.hypot(planet.x, planet.y);
      const eps = 0.5 * (planet.vx ** 2 + planet.vy ** 2) - GM / r; // solishtirma energiya
      if (eps >= 0) return { closed: false, E: m * eps };
      const a = -GM / (2 * eps);
      return { closed: true, E: m * eps, a, T: 2 * Math.PI * Math.sqrt(a ** 3 / GM) };
    }

    function drawDet() {
      const W = detCanvas.clientWidth || 460, H = Math.round(W * 260 / 460);
      dctx.fillStyle = '#060911'; dctx.fillRect(0, 0, W, H);
      const cx = W * 0.42, cy = H / 2;
      const scale = Math.min(W, H) * 0.3;

      // yulduz
      const g = dctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
      g.addColorStop(0, '#FEF3C7'); g.addColorStop(1, 'rgba(251,191,36,0)');
      dctx.fillStyle = g; dctx.beginPath(); dctx.arc(cx, cy, 18, 0, Math.PI * 2); dctx.fill();
      dctx.fillStyle = '#FBBF24'; dctx.beginPath(); dctx.arc(cx, cy, 7, 0, Math.PI * 2); dctx.fill();

      // iz
      dctx.strokeStyle = 'rgba(56,189,248,0.55)'; dctx.lineWidth = 1.5;
      dctx.beginPath();
      trail.forEach((p, i) => { const x = cx + p.x * scale, y = cy - p.y * scale; i ? dctx.lineTo(x, y) : dctx.moveTo(x, y); });
      dctx.stroke();

      // sayyora (radiusi massaga bog'liq — faqat ko'rinish uchun)
      const m = parseFloat(slMass.value);
      const px = cx + planet.x * scale, py = cy - planet.y * scale;
      dctx.fillStyle = '#38BDF8';
      dctx.beginPath(); dctx.arc(px, py, 4 + 2 * Math.sqrt(m), 0, Math.PI * 2); dctx.fill();

      // tezlik vektori
      dctx.strokeStyle = '#34D399'; dctx.lineWidth = 2;
      dctx.beginPath(); dctx.moveTo(px, py); dctx.lineTo(px + planet.vx * 10, py - planet.vy * 10); dctx.stroke();

      dctx.fillStyle = '#94A3B8'; dctx.font = '11px ui-monospace, monospace';
      dctx.fillText(`t = ${planet.t.toFixed(2)}`, 8, 16);
      const info = orbitInfo();
      dctx.fillText(info.closed ? `yopiq orbita, a = ${info.a.toFixed(2)}` : 'ochiq orbita (E ≥ 0)', 8, 30);
    }

    // ---------------- Stoxastik tavsif: 2D gaz + Broun zarrasi -------------
    const K_B = 1.380649e-23, M_N2 = 28 * 1.66054e-27;
    const R_SMALL = 3, R_BIG = 10, M_BIG = 10;
    const GRID_X = 6, GRID_Y = 4;
    let gas, big, bigTrail, bigStart, simW = 460, simH = 260, stoTime;

    // Simulyatsiya birligidagi tezlik → m/s: σ_sim(T) · K = √(kT/m_N₂)
    const SIGMA_300 = 60; // px/s, T = 300 K da
    const sigmaSim = T => SIGMA_300 * Math.sqrt(T / 300);
    const toMs = v => v * Math.sqrt(K_B * 300 / M_N2) / SIGMA_300;

    function gauss() {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function resetSto() {
      const T = parseFloat(slTemp.value), N = parseInt(slCount.value, 10);
      const s = sigmaSim(T);
      simW = stoCanvas.clientWidth || 460; simH = Math.round(simW * 260 / 460);
      gas = [];
      // Gaz dastlab idishning chap uchdan bir qismida (aralashish tajribasi)
      for (let i = 0; i < N; i++) {
        gas.push({
          x: R_SMALL + Math.random() * (simW / 3 - 2 * R_SMALL),
          y: R_SMALL + Math.random() * (simH - 2 * R_SMALL),
          vx: s * gauss(), vy: s * gauss(), m: 1, r: R_SMALL
        });
      }
      big = { x: simW * 0.65, y: simH / 2, vx: 0, vy: 0, m: M_BIG, r: R_BIG };
      bigStart = { x: big.x, y: big.y };
      bigTrail = [];
      stoTime = 0;
    }

    function collide(a, b) {
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy), minD = a.r + b.r;
      if (d === 0 || d >= minD) return;
      const nx = dx / d, ny = dy / d;
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      // ustma-ust tushishni ajratish
      const overlap = (minD - d) / 2;
      a.x -= nx * overlap; a.y -= ny * overlap;
      b.x += nx * overlap; b.y += ny * overlap;
      if (rel <= 0) return;
      const j = (2 * rel) / (a.m + b.m);
      a.vx -= j * b.m * nx; a.vy -= j * b.m * ny;
      b.vx += j * a.m * nx; b.vy += j * a.m * ny;
    }

    function wall(p) {
      if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx); }
      if (p.x > simW - p.r) { p.x = simW - p.r; p.vx = -Math.abs(p.vx); }
      if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy); }
      if (p.y > simH - p.r) { p.y = simH - p.r; p.vy = -Math.abs(p.vy); }
    }

    function stepSto(dt) {
      const all = gas.concat([big]);
      for (const p of all) { p.x += p.vx * dt; p.y += p.vy * dt; wall(p); }
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) collide(all[i], all[j]);
      }
      stoTime += dt;
      const last = bigTrail[bigTrail.length - 1];
      if (!last || Math.hypot(big.x - last.x, big.y - last.y) > 1.5) bigTrail.push({ x: big.x, y: big.y });
      if (bigTrail.length > 800) bigTrail.shift();
    }

    function setTemperature(Tnew) {
      // Haroratni o'zgartirish — barcha tezliklarni √(T_yangi / T_joriy) ga masshtablash
      const s2 = gas.reduce((acc, p) => acc + p.vx * p.vx + p.vy * p.vy, 0) / (2 * gas.length);
      const target = sigmaSim(Tnew) ** 2;
      const k = s2 > 0 ? Math.sqrt(target / s2) : 1;
      for (const p of gas.concat([big])) { p.vx *= k; p.vy *= k; }
    }

    function entropy() {
      const counts = new Array(GRID_X * GRID_Y).fill(0);
      for (const p of gas) {
        const i = Math.min(GRID_X - 1, Math.floor(p.x / simW * GRID_X));
        const j = Math.min(GRID_Y - 1, Math.floor(p.y / simH * GRID_Y));
        counts[j * GRID_X + i]++;
      }
      let S = 0;
      for (const c of counts) if (c > 0) { const q = c / gas.length; S -= q * Math.log(q); }
      return S;
    }

    function drawSto() {
      const W = stoCanvas.clientWidth || 460, H = Math.round(W * 260 / 460);
      sctx.fillStyle = '#060911'; sctx.fillRect(0, 0, W, H);
      const sx = W / simW, sy = H / simH;
      sctx.strokeStyle = 'rgba(148,163,184,0.3)'; sctx.strokeRect(0.5, 0.5, W - 1, H - 1);

      // Broun izi
      sctx.strokeStyle = 'rgba(244,63,94,0.55)'; sctx.lineWidth = 1.2;
      sctx.beginPath();
      bigTrail.forEach((p, i) => i ? sctx.lineTo(p.x * sx, p.y * sy) : sctx.moveTo(p.x * sx, p.y * sy));
      sctx.stroke();

      sctx.fillStyle = '#A78BFA';
      for (const p of gas) { sctx.beginPath(); sctx.arc(p.x * sx, p.y * sy, R_SMALL * sx, 0, Math.PI * 2); sctx.fill(); }
      sctx.fillStyle = '#F43F5E';
      sctx.beginPath(); sctx.arc(big.x * sx, big.y * sy, R_BIG * sx, 0, Math.PI * 2); sctx.fill();

      // Tezliklar gistogrammasi va 2D Maksvell (Reley) egri chizig'i
      const T = parseFloat(slTemp.value), s = sigmaSim(T);
      const hx = W - 132, hy = H - 62, hw = 124, hh = 54, bins = 12, vmax = 4 * s;
      const counts = new Array(bins).fill(0);
      for (const p of gas) {
        const v = Math.hypot(p.vx, p.vy);
        const b = Math.min(bins - 1, Math.floor(v / vmax * bins));
        counts[b]++;
      }
      sctx.fillStyle = 'rgba(6,9,17,0.85)'; sctx.fillRect(hx - 4, hy - 14, hw + 8, hh + 18);
      const bw = hw / bins, dv = vmax / bins;
      const peak = Math.max(1, ...counts, gas.length * dv * (1 / s) * Math.exp(-0.5));
      sctx.fillStyle = 'rgba(167,139,250,0.7)';
      counts.forEach((c, i) => { const h = c / peak * hh; sctx.fillRect(hx + i * bw, hy + hh - h, bw - 1, h); });
      sctx.strokeStyle = '#FBBF24'; sctx.lineWidth = 1.5;
      sctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const v = vmax * i / 40;
        const f = gas.length * dv * (v / (s * s)) * Math.exp(-v * v / (2 * s * s));
        const x = hx + (v / vmax) * hw, y = hy + hh - f / peak * hh;
        i ? sctx.lineTo(x, y) : sctx.moveTo(x, y);
      }
      sctx.stroke();
      sctx.fillStyle = '#94A3B8'; sctx.font = '10px ui-monospace, monospace';
      sctx.fillText('f(v): gist. vs Maksvell', hx - 2, hy - 4);

      const r2 = (big.x - bigStart.x) ** 2 + (big.y - bigStart.y) ** 2;
      sctx.fillText(`t = ${stoTime.toFixed(1)} s   r² = ${r2.toFixed(0)} px²`, 8, 14);
    }

    function updateReadouts() {
      const info = orbitInfo();
      outPeriod.textContent = info.closed ? `${info.T.toFixed(2)} (o'lch. birl.)` : '∞ (ochiq orbita)';
      outEnergy.textContent = `${info.E.toFixed(2)} (o'lch. birl.)`;
      const mean = gas.reduce((a, p) => a + Math.hypot(p.vx, p.vy), 0) / gas.length;
      outSpeed.textContent = `${toMs(mean).toFixed(0)} m/s (N₂, 2D)`;
      outEntropy.textContent = `${entropy().toFixed(2)} / ${Math.log(GRID_X * GRID_Y).toFixed(2)}`;
    }

    function resizeCanvas(c) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth || 460, h = Math.round(w * 260 / 460);
      c.width = w * dpr; c.height = h * dpr;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function redraw() {
      resizeCanvas(detCanvas); resizeCanvas(stoCanvas);
      drawDet(); drawSto(); updateReadouts();
    }

    function resetAll() {
      resetDet();
      resetSto();
      redraw();
    }

    function updateLabels() {
      vMass.textContent = parseFloat(slMass.value).toFixed(1) + ' M⊕';
      vVel.textContent = parseFloat(slVel.value).toFixed(1);
      vTemp.textContent = slTemp.value + ' K';
      vCount.textContent = slCount.value + ' ta';
    }

    slMass.addEventListener('input', () => { updateLabels(); updateReadouts(); });
    slVel.addEventListener('input', () => { updateLabels(); resetDet(); updateReadouts(); });
    slTemp.addEventListener('input', () => { updateLabels(); setTemperature(parseFloat(slTemp.value)); });
    slCount.addEventListener('input', () => { updateLabels(); resetSto(); updateReadouts(); });

    document.getElementById('lab5-btn-play').addEventListener('click', () => { running = true; });
    document.getElementById('lab5-btn-pause').addEventListener('click', () => { running = false; });
    document.getElementById('lab5-btn-reset').addEventListener('click', () => { running = false; resetAll(); });

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (running) {
        const sub = 20;
        for (let i = 0; i < sub; i++) stepDet(dt / sub);
        trail.push({ x: planet.x, y: planet.y });
        if (trail.length > 1500) trail.shift();
        for (let i = 0; i < 4; i++) stepSto(dt / 4);
        updateReadouts();
      }
      drawDet();
      drawSto();
      requestAnimationFrame(loop);
    }

    window.triggerLab5CanvasRedraw = () => {
      const oldW = simW, oldH = simH;
      resizeCanvas(detCanvas); resizeCanvas(stoCanvas);
      const w = stoCanvas.clientWidth || 460, h = Math.round(w * 260 / 460);
      if (Math.abs(w - oldW) > 1 && gas) {
        // idish o'lchami o'zgarsa, zarralarni proporsional ko'chirish
        const kx = w / oldW, ky = h / oldH;
        for (const p of gas.concat([big])) { p.x *= kx; p.y *= ky; }
        bigTrail = bigTrail.map(p => ({ x: p.x * kx, y: p.y * ky }));
        bigStart = { x: bigStart.x * kx, y: bigStart.y * ky };
        simW = w; simH = h;
      }
      drawDet(); drawSto();
    };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => window.triggerLab5CanvasRedraw()).observe(stoCanvas.parentElement);
    else window.addEventListener('resize', window.triggerLab5CanvasRedraw);

    updateLabels();
    resizeCanvas(detCanvas); resizeCanvas(stoCanvas);
    resetAll();
    requestAnimationFrame(loop);
  }

  // -------------------------------------------------------------------------
  // 4. RUBRIKA KALKULYATORI (O'zbekiston OTM 5 ballik shkalasi)
  // -------------------------------------------------------------------------
  function initRubric() {
    const selects = document.querySelectorAll('.rubric5-select');
    const totalEl = document.getElementById('rubric5-total-score');
    const gradeEl = document.getElementById('rubric5-grade-badge');
    if (!selects.length || !totalEl) return;

    function grade(total) {
      if (total >= 86) return { text: "A (A'lo — 5)", cls: 'badge-emerald' };
      if (total >= 71) return { text: 'B (Yaxshi — 4)', cls: 'badge-cyan' };
      if (total >= 55) return { text: 'C (Qoniqarli — 3)', cls: 'badge-amber' };
      return { text: 'D (Qoniqarsiz — 2)', cls: 'badge-rose' };
    }

    function update() {
      let total = 0;
      selects.forEach(s => { total += parseInt(s.value, 10) || 0; });
      totalEl.textContent = `${total} / 100 ball`;
      if (gradeEl) {
        const g = grade(total);
        gradeEl.textContent = g.text;
        gradeEl.className = 'badge ' + g.cls;
      }
    }
    selects.forEach(s => s.addEventListener('change', update));
    update();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCopyButtons();
    initDiagnostic();
    initLab();
    initRubric();
  });
})();
