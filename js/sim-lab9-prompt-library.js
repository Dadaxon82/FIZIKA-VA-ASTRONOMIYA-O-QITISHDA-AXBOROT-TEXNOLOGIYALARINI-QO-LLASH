/**
 * 9-Laboratoriya: kod generatsiyasi uchun promptlar va shaxsiy prompt-kutubxona.
 * 1. Diagnostik test → A/B/C klaster, individual reja va shaxsiy prompt.
 * 2. Prompt sandboksi: 4 darajadagi promptlardan odatda olinadigan mayatnik
 *    kodlari (tipik natija namunalari) bir xil parametrlarda ishga tushiriladi
 *    va RK4 (kichik qadam) etalon yechimi bilan solishtiriladi. Fazaviy portret
 *    va E/E0 grafigi, energiya xatoligi jonli o'lchanadi.
 * 3. Shaxsiy prompt-kutubxona (brauzer localStorage, JSON eksport).
 * 4. 100 ballik rubrika kalkulyatori va promptlarni nusxalash.
 */

(function () {
  const G = 9.81;
  const MAX_FRAME = 0.1;
  const REF_H = 1 / 1000;
  const THETA0 = 1.2; // rad (~69°) — katta amplituda: sin θ ≈ θ farazi sezilarli xato beradi
  const LIB_KEY = 'lab9-prompt-library';

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
  function copyText(text, btn) {
    const done = () => {
      if (btn) {
        const old = btn.textContent;
        btn.textContent = '✅ Nusxalandi!';
        setTimeout(() => { btn.textContent = old; }, 1500);
      }
      toast('Nusxalandi!');
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      done();
    }
  }

  function initCopyButtons() {
    document.querySelectorAll('.copy-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (target) copyText(target.value || target.textContent, btn);
      });
    });
  }

  // -------------------------------------------------------------------------
  // 1. DIAGNOSTIK TEST
  // -------------------------------------------------------------------------
  const DIAG_KEY = { diag9_q1: 'c', diag9_q2: 'b', diag9_q3: 'a', diag9_q4: 'c' };

  const CLUSTERS = {
    A: {
      title: 'Klaster "A" — Boshlang\'ich daraja',
      plan: "Avval 2.1-bo'limdagi promptning 5 ta ustunini (Rol, Kontekst, Ko'rsatma, Cheklovlar, Chiqish formati) o'z so'zlaringiz bilan yozing. 3-bo'limdagi 1- va 2-sinov promptlarini yuborib, natijalarni 5-bo'limdagi sandboksdagi 1- va 2-daraja bilan solishtiring: energiya grafigi nima uchun o'sib borishini tushuntiring.",
      focus: "prompt tuzilmasi, fizik cheklovlarni aniq yozish, oddiy Eyler usulining kamchiligi"
    },
    B: {
      title: 'Klaster "B" — Amaliyotchi daraja',
      plan: "3-sinov (Role + CoT) promptini o'z masalangizga moslang va modeldan avval tenglamani, keyin integratsiya usulini asoslashni talab qiling. Olingan kodni sandboksdagi 3-daraja bilan solishtirib, energiya xatoligini o'lchang. Eng yaxshi promptni kutubxonaga saqlang.",
      focus: "Chain-of-Thought, Eyler-Kromer usuli, natijani sonli tekshirish"
    },
    C: {
      title: 'Klaster "C" — Ilg\'or daraja',
      plan: "4-sinovdagi XML master promptni boshqa fizik tizim (masalan, ikki jismli orbita yoki prujinali mayatnik) uchun qayta yozing. Promptga avtomatik test talabini qo'shing: kod analitik yoki RK4 etalon yechim bilan solishtirilsin. Kutubxonangizni JSON ko'rinishida eksport qilib, guruhdoshlaringiz bilan almashing.",
      focus: "XML teglari, test talablari, velocity-Verlet va RK4, prompt-kutubxona"
    }
  };

  function initDiagnostic() {
    const btn = document.getElementById('diag9-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const box = document.getElementById('diag9-result-box');
      const scoreEl = document.getElementById('diag9-score-val');
      const clusterEl = document.getElementById('diag9-cluster-val');
      const planEl = document.getElementById('diag9-plan-desc');
      const promptEl = document.getElementById('diag9-personalized-prompt');

      const answers = Object.keys(DIAG_KEY).map(name => document.querySelector(`input[name="${name}"]:checked`));
      box.style.display = 'block';
      if (answers.some(a => !a)) {
        scoreEl.textContent = '—';
        clusterEl.textContent = '⚠️ Barcha 4 ta savolga javob bering';
        planEl.textContent = '';
        promptEl.value = '';
        return;
      }

      const correct = Object.keys(DIAG_KEY).filter((name, i) => answers[i].value === DIAG_KEY[name]).length;
      const score = correct * 25;
      const key = score >= 75 ? 'C' : score >= 50 ? 'B' : 'A';
      const c = CLUSTERS[key];
      const wrong = Object.keys(DIAG_KEY).map((name, i) => answers[i].value === DIAG_KEY[name] ? null : i + 1).filter(Boolean);

      scoreEl.textContent = `${score} / 100 (${correct}/4)`;
      clusterEl.textContent = c.title;
      planEl.innerHTML = c.plan +
        (wrong.length ? `<br><strong>Qayta ko'rib chiqing:</strong> ${wrong.join(', ')}-savol(lar). To'g'ri javoblar: 1-C, 2-B, 3-A, 4-C.` : '');
      renderMath(planEl);

      promptEl.value =
`<system_role>
Sen fizika o'qituvchilari uchun prompt-muhandislik bo'yicha Sokratik murabbiysan.
</system_role>
<student_profile>
9-laboratoriya diagnostik testi: ${score}/100, "${key}" klaster. Asosiy mavzular: ${c.focus}.
</student_profile>
<task>
Men matematik mayatnik simulyatsiyasi kodini olish uchun prompt yozmoqchiman. Tayyor promptni bermang:
1. Mening promptimni Rol, Kontekst, Ko'rsatma, Cheklovlar va Chiqish formati bo'yicha baholang.
2. Qaysi fizik cheklov (masalan, sin θ ≈ θ farazi, integratsiya usuli, qadam) yetishmayotganini savol orqali topishimga yordam bering.
3. Olingan kodni tekshirish uchun bitta sonli test taklif qiling (masalan, energiya saqlanishi).
</task>`;
    });
  }

  // -------------------------------------------------------------------------
  // 2. PROMPT SANDBOKSI: 4 daraja mayatnik kodlari
  // -------------------------------------------------------------------------
  // Har bir daraja — shu turdagi promptga modellar ko'pincha beradigan kodning
  // tipik xususiyatlari (namuna), aniq modelning kafolatlangan natijasi emas.
  const LEVELS = {
    level1: {
      title: "1-Daraja: Sodda Zero-shot Prompt",
      method: "Oshkor Eyler, sin θ ≈ θ, qadam kadrga bog'liq",
      quality: 35,
      features: "Kichik burchak farazi (sin θ ≈ θ), qarshilik e'tiborga olinmagan, har kadrda qat'iy 1/60 s qadam, oshkor Eyler — energiya o'sib boradi.",
      linear: true, damping: false, integrator: 'euler', h: 1 / 60, promptId: 'prompt-test1'
    },
    level2: {
      title: "2-Daraja: Fizik Chegaralari Ko'rsatilgan Prompt",
      method: "Oshkor Eyler, to'liq sin θ, h = 1/60 s",
      quality: 68,
      features: "Nochiziqli tenglama va qarshilik bor, lekin oshkor Eyler usuli: tebranish so'nishi o'rniga energiya sun'iy ortadi.",
      linear: false, damping: true, integrator: 'euler', h: 1 / 60, promptId: 'prompt-test2'
    },
    level3: {
      title: "3-Daraja: Role + Chain-of-Thought Prompt",
      method: "Eyler-Kromer (yarim-oshkor), h = 1/120 s",
      quality: 88,
      features: "Model tenglamani va usulni bosqichma-bosqich asoslaydi: Eyler-Kromer — energiya kichik amplitudada tebranadi, sun'iy o'sish yo'q.",
      linear: false, damping: true, integrator: 'cromer', h: 1 / 120, promptId: 'prompt-test3'
    },
    level4: {
      title: "4-Daraja: To'liq XML Master Prompt",
      method: "Velocity Verlet, h = 1/240 s",
      quality: 98,
      features: "To'liq tenglama, qarshilik, velocity-Verlet, qat'iy qadamli akkumulyator, fazaviy portret va energiya telemetriyasi.",
      linear: false, damping: true, integrator: 'verlet', h: 1 / 240, promptId: 'prompt-test4'
    }
  };

  function initLab() {
    const cv = document.getElementById('lab9-sim-canvas');
    const pcv = document.getElementById('lab9-phase-canvas');
    if (!cv || !pcv) return;
    const ctx = cv.getContext('2d');
    const pctx = pcv.getContext('2d');
    const W = cv.width, Hc = cv.height;

    const sel = document.getElementById('lab9-prompt-level-select');
    const slL = document.getElementById('lab9-length-slider');
    const slB = document.getElementById('lab9-damping-slider');
    const vL = document.getElementById('lab9-length-val');
    const vB = document.getElementById('lab9-damping-val');
    const btnPlay = document.getElementById('lab9-play-btn');
    const btnPause = document.getElementById('lab9-pause-btn');
    const btnReset = document.getElementById('lab9-reset-btn');
    const preview = document.getElementById('lab9-prompt-preview-text');
    const el = id => document.getElementById('lab9-profile-' + id);

    const HIST = 360;
    const phase = new Float32Array(HIST * 2);
    const eSim = new Float32Array(HIST);
    const eRef = new Float32Array(HIST);
    let histCount = 0, histHead = 0, sampleT = 0;

    const sim = { th: THETA0, om: 0, acc: 0 };
    const ref = { th: THETA0, om: 0, acc: 0 };
    let t = 0, lastTs = 0, running = false, rafId = 0;
    let errSum = 0, errN = 0;

    const level = () => LEVELS[sel ? sel.value : 'level4'] || LEVELS.level4;
    const L = () => (slL ? parseFloat(slL.value) / 100 : 1.8);
    const beta = () => (slB ? parseFloat(slB.value) : 0.05);

    function accel(th, om, lin, damp) {
      return -(G / L()) * (lin ? th : Math.sin(th)) - (damp ? beta() * om : 0);
    }

    function energy(s) { // birlik massaga, J/kg
      const l = L();
      return 0.5 * l * l * s.om * s.om + G * l * (1 - Math.cos(s.th));
    }

    function stepLevel(s, lv, h) {
      const lin = lv.linear, damp = lv.damping;
      if (lv.integrator === 'euler') {
        const a = accel(s.th, s.om, lin, damp);
        s.th += s.om * h;
        s.om += a * h;
      } else if (lv.integrator === 'cromer') {
        s.om += accel(s.th, s.om, lin, damp) * h;
        s.th += s.om * h;
      } else {
        const a0 = accel(s.th, s.om, lin, damp);
        const omHalf = s.om + 0.5 * a0 * h;
        s.th += omHalf * h;
        s.om = omHalf + 0.5 * accel(s.th, omHalf, lin, damp) * h;
      }
    }

    function stepRK4(s, h) {
      const f = (th, om) => accel(th, om, false, true);
      const k1t = s.om, k1o = f(s.th, s.om);
      const k2t = s.om + 0.5 * h * k1o, k2o = f(s.th + 0.5 * h * k1t, s.om + 0.5 * h * k1o);
      const k3t = s.om + 0.5 * h * k2o, k3o = f(s.th + 0.5 * h * k2t, s.om + 0.5 * h * k2o);
      const k4t = s.om + h * k3o, k4o = f(s.th + h * k3t, s.om + h * k3o);
      s.th += h / 6 * (k1t + 2 * k2t + 2 * k3t + k4t);
      s.om += h / 6 * (k1o + 2 * k2o + 2 * k3o + k4o);
    }

    function reset() {
      sim.th = ref.th = THETA0;
      sim.om = ref.om = 0;
      sim.acc = ref.acc = 0;
      t = 0; sampleT = 0; errSum = 0; errN = 0;
      histCount = 0; histHead = 0;
      pushSample();
      applyProfile();
      draw();
    }

    function applyProfile() {
      const lv = level();
      if (el('title')) el('title').textContent = lv.title;
      if (el('method')) el('method').textContent = lv.method;
      if (el('quality')) {
        el('quality').textContent = `${lv.quality} / 100`;
        el('quality').style.color = lv.quality >= 85 ? '#10b981' : lv.quality >= 60 ? '#f59e0b' : '#f43f5e';
      }
      if (el('features')) el('features').textContent = lv.features;
      if (preview) {
        const src = document.getElementById(lv.promptId);
        preview.value = src ? (src.value || src.textContent) : '';
      }
      updateMetrics();
    }

    function updateMetrics() {
      const e0 = G * L() * (1 - Math.cos(THETA0));
      const errPct = errN ? 100 * Math.sqrt(errSum / errN) : 0;
      const acc = el('accuracy');
      if (acc) {
        acc.textContent = errN ? `${Math.max(0, 100 - errPct).toFixed(1)} %` : '— %';
        acc.style.color = errPct < 1 ? '#10b981' : errPct < 10 ? '#f59e0b' : '#f43f5e';
      }
      const risk = el('risk');
      if (risk) {
        const cur = e0 > 0 ? 100 * Math.abs(energy(sim) - energy(ref)) / e0 : 0;
        risk.textContent = errN ? `Energiya xatoligi: ${cur.toFixed(2)} %` : 'Energiya xatoligi: —';
        risk.style.color = cur < 1 ? '#10b981' : cur < 10 ? '#f59e0b' : '#f43f5e';
      }
    }

    function pushSample() {
      const e0 = G * L() * (1 - Math.cos(THETA0));
      phase[2 * histHead] = sim.th;
      phase[2 * histHead + 1] = sim.om;
      eSim[histHead] = energy(sim) / e0;
      eRef[histHead] = energy(ref) / e0;
      histHead = (histHead + 1) % HIST;
      if (histCount < HIST) histCount++;
    }

    function advance(frameTime) {
      const lv = level();
      // 1-daraja kodi kadr vaqtini hisobga olmaydi: har kadrda qat'iy 1/60 s
      if (lv.h === 1 / 60 && lv.linear) {
        stepLevel(sim, lv, 1 / 60);
      } else {
        sim.acc += frameTime;
        while (sim.acc >= lv.h) { stepLevel(sim, lv, lv.h); sim.acc -= lv.h; }
      }
      ref.acc += frameTime;
      while (ref.acc >= REF_H) { stepRK4(ref, REF_H); ref.acc -= REF_H; }
      t += frameTime;
      const e0 = G * L() * (1 - Math.cos(THETA0));
      const d = (energy(sim) - energy(ref)) / e0;
      errSum += d * d; errN++;
      sampleT += frameTime;
      if (sampleT >= 1 / 30) { sampleT = 0; pushSample(); }
    }

    function frame(ts) {
      rafId = 0;
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      if (!lastTs) { lastTs = ts; return; }
      const dt = Math.min((ts - lastTs) / 1000, MAX_FRAME);
      lastTs = ts;
      advance(dt);
      draw();
      updateMetrics();
    }

    // ---------------- Chizish ----------------
    function drawPendulum(s, color, ghost) {
      const px = W / 2, py = 40;
      const scale = (Hc - 90) / 2.4; // 2.4 m maksimal uzunlik
      const len = L() * scale;
      const bx = px + len * Math.sin(s.th);
      const by = py + len * Math.cos(s.th);
      ctx.strokeStyle = ghost ? 'rgba(16,185,129,0.8)' : '#94a3b8';
      ctx.setLineDash(ghost ? [5, 4] : []);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx, by, 16, 0, Math.PI * 2);
      if (ghost) ctx.stroke(); else { ctx.fillStyle = color; ctx.fill(); }
      ctx.setLineDash([]);
    }

    function draw() {
      ctx.clearRect(0, 0, W, Hc);
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.fillRect(W / 2 - 60, 32, 120, 8);
      drawPendulum(ref, null, true);
      drawPendulum(sim, '#38bdf8', false);
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`t = ${t.toFixed(1)} s   θ = ${(sim.th * 180 / Math.PI).toFixed(1)}°   θ₀ = ${(THETA0 * 180 / Math.PI).toFixed(0)}°`, 12, 20);
      ctx.fillStyle = 'rgba(16,185,129,0.9)';
      ctx.textAlign = 'right';
      ctx.fillText('┄ RK4 etalon (h = 1 ms)', W - 12, 20);
      drawPhase();
    }

    function drawPhase() {
      const w = pcv.width, h = pcv.height;
      pctx.clearRect(0, 0, w, h);
      const half = w / 2;
      pctx.strokeStyle = 'rgba(255,255,255,0.1)';
      pctx.beginPath();
      pctx.moveTo(half, 0); pctx.lineTo(half, h);
      pctx.moveTo(0, h / 2); pctx.lineTo(half, h / 2);
      pctx.moveTo(half / 2, 0); pctx.lineTo(half / 2, h);
      pctx.stroke();
      pctx.font = '11px monospace';
      pctx.fillStyle = '#94a3b8';
      pctx.textAlign = 'left';
      pctx.fillText('θ →', half - 28, h / 2 - 4);
      pctx.fillText('ω', half / 2 + 4, 12);

      const omMax = Math.sqrt(2 * G / L() * (1 - Math.cos(THETA0))) * 1.6;
      const thMax = THETA0 * 1.6;
      if (histCount > 1) {
        pctx.strokeStyle = '#38bdf8';
        pctx.lineWidth = 1.5;
        pctx.beginPath();
        for (let i = 0; i < histCount; i++) {
          const idx = (histHead - histCount + i + HIST) % HIST;
          const x = half / 2 + (phase[2 * idx] / thMax) * (half / 2 - 6);
          const y = h / 2 - (phase[2 * idx + 1] / omMax) * (h / 2 - 6);
          if (i === 0) pctx.moveTo(x, y); else pctx.lineTo(x, y);
        }
        pctx.stroke();
      }

      // O'ng: E/E0
      const x0 = half + 36, x1 = w - 8, yTop = 8, yBot = h - 16;
      const eMax = 2.0;
      const ey = r => yBot - (Math.min(Math.max(r, 0), eMax) / eMax) * (yBot - yTop);
      pctx.textAlign = 'right';
      [0, 1, 2].forEach(r => {
        pctx.strokeStyle = r === 1 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)';
        pctx.beginPath(); pctx.moveTo(x0, ey(r)); pctx.lineTo(x1, ey(r)); pctx.stroke();
        pctx.fillStyle = '#94a3b8';
        pctx.fillText(r.toFixed(1), x0 - 4, ey(r) + 4);
      });
      const series = (arr, color, dash) => {
        if (histCount < 2) return;
        pctx.strokeStyle = color;
        pctx.setLineDash(dash);
        pctx.lineWidth = 1.5;
        pctx.beginPath();
        const dx = (x1 - x0) / (HIST - 1);
        for (let i = 0; i < histCount; i++) {
          const idx = (histHead - histCount + i + HIST) % HIST;
          const x = x0 + i * dx, y = ey(arr[idx]);
          if (i === 0) pctx.moveTo(x, y); else pctx.lineTo(x, y);
        }
        pctx.stroke();
        pctx.setLineDash([]);
      };
      series(eRef, 'rgba(16,185,129,0.9)', [4, 3]);
      series(eSim, '#38bdf8', []);
      pctx.textAlign = 'left';
      pctx.fillStyle = '#94a3b8';
      pctx.fillText('E/E₀ (ko\'k — kod, yashil — etalon)', x0, h - 3);
    }

    function play() {
      if (running) return;
      running = true;
      lastTs = 0;
      if (btnPlay) btnPlay.disabled = true;
      if (btnPause) btnPause.disabled = false;
      if (!rafId) rafId = requestAnimationFrame(frame);
    }

    function pause() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      if (btnPlay) btnPlay.disabled = false;
      if (btnPause) btnPause.disabled = true;
    }

    if (btnPlay) btnPlay.addEventListener('click', play);
    if (btnPause) btnPause.addEventListener('click', pause);
    if (btnReset) btnReset.addEventListener('click', reset);
    if (sel) sel.addEventListener('change', reset);
    if (slL) slL.addEventListener('input', () => { if (vL) vL.textContent = `${L().toFixed(2)} m`; reset(); });
    if (slB) slB.addEventListener('input', () => { if (vB) vB.textContent = beta().toFixed(3); reset(); });

    window.triggerLab9CanvasRedraw = draw;
    reset();
  }

  // -------------------------------------------------------------------------
  // 3. SHAXSIY PROMPT-KUTUBXONA (faqat shu brauzerda saqlanadi)
  // -------------------------------------------------------------------------
  function initLibrary() {
    const list = document.getElementById('lab9-prompt-library-list');
    const addBtn = document.getElementById('lab9-add-prompt-btn');
    const expBtn = document.getElementById('lab9-export-lib-btn');
    if (!list || !addBtn) return;
    const fTopic = document.getElementById('lab9-lib-topic');
    const fModel = document.getElementById('lab9-lib-model');
    const fTitle = document.getElementById('lab9-lib-title');
    const fContent = document.getElementById('lab9-lib-content');

    let items = [];
    try {
      const raw = localStorage.getItem(LIB_KEY);
      if (raw) items = JSON.parse(raw) || [];
    } catch (e) { items = []; }
    if (!Array.isArray(items)) items = [];

    function save() {
      try { localStorage.setItem(LIB_KEY, JSON.stringify(items)); } catch (e) { /* saqlab bo'lmasa ham ro'yxat ishlaydi */ }
    }

    function render() {
      list.innerHTML = '';
      if (!items.length) {
        const p = document.createElement('p');
        p.style.cssText = 'color: var(--text-secondary); font-size: 0.88rem;';
        p.textContent = "Hozircha saqlangan prompt yo'q. Yuqoridagi forma orqali birinchi promptingizni qo'shing (ro'yxat faqat shu brauzerda saqlanadi — muhimlarini JSON qilib eksport qiling).";
        list.appendChild(p);
        return;
      }
      items.forEach((it, i) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        const head = document.createElement('div');
        head.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px;';
        const title = document.createElement('strong');
        title.style.color = '#fff';
        title.textContent = it.title;
        const meta = document.createElement('span');
        meta.className = 'badge badge-cyan';
        meta.textContent = `${it.topic} · ${it.model}`;
        head.append(title, meta);
        const pre = document.createElement('pre');
        pre.style.cssText = 'white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 10px; max-height: 180px; overflow: auto;';
        pre.textContent = it.content;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; gap:8px;';
        const cp = document.createElement('button');
        cp.className = 'btn btn-secondary btn-sm';
        cp.textContent = '📋 Nusxa olish';
        cp.addEventListener('click', () => copyText(it.content, cp));
        const del = document.createElement('button');
        del.className = 'btn btn-secondary btn-sm';
        del.textContent = "🗑 O'chirish";
        del.addEventListener('click', () => { items.splice(i, 1); save(); render(); });
        row.append(cp, del);
        card.append(head, pre, row);
        list.appendChild(card);
      });
    }

    addBtn.addEventListener('click', () => {
      const title = (fTitle.value || '').trim();
      const content = (fContent.value || '').trim();
      if (!title || !content) { toast("Sarlavha va prompt matnini kiriting"); return; }
      items.unshift({ title, content, topic: fTopic.value, model: fModel.value, created: new Date().toISOString() });
      save();
      fTitle.value = '';
      fContent.value = '';
      render();
      toast('Prompt kutubxonaga saqlandi');
    });

    if (expBtn) expBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fizika-prompt-kutubxona.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });

    render();
  }

  // -------------------------------------------------------------------------
  // 4. RUBRIKA KALKULYATORI (O'zbekiston OTM 5 ballik shkalasi)
  // -------------------------------------------------------------------------
  function initRubric() {
    const ids = ['rubric9_c1', 'rubric9_c2', 'rubric9_c3', 'rubric9_c4', 'rubric9_c5'];
    const selects = ids.map(id => document.getElementById(id));
    const btn = document.getElementById('lab9-calc-rubric-btn');
    const totalEl = document.getElementById('lab9-total-score');
    const gradeEl = document.getElementById('lab9-grade-badge');
    const fbEl = document.getElementById('lab9-rubric-feedback');
    if (selects.some(s => !s) || !totalEl) return;

    function update() {
      const total = selects.reduce((a, s) => a + (parseInt(s.value, 10) || 0), 0);
      totalEl.textContent = `${total} / 100`;
      let g;
      if (total >= 86) g = { text: "A'LO (5)", cls: 'badge-emerald', fb: "Barcha mezonlar yuqori darajada bajarilgan." };
      else if (total >= 71) g = { text: 'YAXSHI (4)', cls: 'badge-cyan', fb: "Yaxshi natija. Eng past ball olgan mezonni qayta ko'rib chiqing." };
      else if (total >= 55) g = { text: 'QONIQARLI (3)', cls: 'badge-amber', fb: "Prompt tuzilmasi, fizik cheklovlar va natijani sonli tekshirishni kuchaytiring." };
      else g = { text: 'QONIQARSIZ (2)', cls: 'badge-rose', fb: "Laboratoriya ishini qayta bajarish tavsiya etiladi." };
      if (gradeEl) { gradeEl.textContent = g.text; gradeEl.className = 'badge ' + g.cls; }
      if (fbEl) fbEl.textContent = g.fb;
    }
    selects.forEach(s => s.addEventListener('change', update));
    if (btn) btn.addEventListener('click', update);
    update();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCopyButtons();
    initDiagnostic();
    initLab();
    initLibrary();
    initRubric();
  });
})();
