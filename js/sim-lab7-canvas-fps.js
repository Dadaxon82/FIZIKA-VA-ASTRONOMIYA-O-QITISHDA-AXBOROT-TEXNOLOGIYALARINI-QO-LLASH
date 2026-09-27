/**
 * 7-Laboratoriya: HTML5 Canvas kadr sikli, Delta-Time va garmonik tebranishlar.
 * 1. Diagnostik test → A/B/C klaster, individual reja va shaxsiy prompt.
 * 2. Interaktiv dastgoh: requestAnimationFrame sikli, sun'iy FPS cheklovi,
 *    Delta-Time yoqilgan/o'chirilgan rejimlar. Fizika Fiedler akkumulyatori
 *    orqali qat'iy qadam (h = 1/240 s) bilan integratsiyalanadi (ossilyator
 *    uchun Eyler-Kromer). Punktir kontur — real vaqt bo'yicha hisoblangan
 *    etalon holat: Delta-Time o'chirilganda asosiy jism undan ortda qoladi
 *    yoki oldinga o'tib ketadi. O'ng oynada kadr oraliqlari ossillografi.
 * 3. 100 ballik rubrika kalkulyatori va promptlarni nusxalash.
 */

(function () {
  const H = 1 / 240;          // qat'iy fizik qadam, s
  const FRAME_REF = 1 / 60;   // Delta-Time o'chirilganda har kadrdagi "taxminiy" qadam, s
  const MAX_FRAME = 0.1;      // kadr vaqtining yuqori chegarasi, s
  const BALL_R = 14;
  const OSC_OMEGA = 2 * Math.PI / 1.6; // rad/s (davr 1,6 s)
  const OSC_AMP = 140;                 // piksel

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
  const DIAG_KEY = { diag7_q1: 'a', diag7_q2: 'b', diag7_q3: 'c', diag7_q4: 'b' };

  const CLUSTERS = {
    A: {
      title: 'Klaster "A" — Boshlang\'ich daraja',
      plan: "Avval 2-bo'limdagi kadr sikli skeletini qo'lda qayta yozing va har bir qatorini izohlang. 5-bo'limdagi dastgohda Delta-Time'ni o'chirib, FPS cheklovini 60 → 15 ga o'zgartiring va punktir etalon kontur bilan jism orasidagi farqni kuzating. So'ng $x \\mathrel{+}= v \\cdot \\Delta t$ formulasi nima uchun bu farqni yo'qotishini o'z so'zlaringiz bilan tushuntiring.",
      focus: "requestAnimationFrame, millisekunddan sekundga o'tish, x += v·dt formulasi"
    },
    B: {
      title: 'Klaster "B" — Amaliyotchi daraja',
      plan: "Skeletga Fiedler akkumulyatorini qo'shing (2-bo'limdagi ikkinchi kod) va 4-bo'limdagi Eyler-Kromer ossilyatorini ishga tushiring. Dastgohda ossilyator rejimida energiya nisbati $E/E_0$ ni 60 va 15 FPS da solishtiring. Antigravity agentiga 3-bo'limdagi promptni yuborib, uning o'lchov natijalarini o'zingiz takrorlab tekshiring.",
      focus: "Fiedler akkumulyatori, qat'iy fizik qadam, Eyler-Kromer sxemasi, agent natijalarini tekshirish"
    },
    C: {
      title: 'Klaster "C" — Ilg\'or daraja',
      plan: "Oddiy Eyler, Eyler-Kromer va velocity-Verlet sxemalarini bir xil $h$ da solishtirib, 60 s davomidagi energiya dreyfini grafikda ko'rsating. Akkumulyatorga $\\alpha = \\text{accumulator}/h$ bo'yicha interpolyatsiya qo'shing va 30 FPS da harakat silliqligini baholang. Kadr sikli ichida xotira ajratilmasligini DevTools «Memory» panelida isbotlang.",
      focus: "integratorlar barqarorligi, energiya dreyfi, holatlar interpolyatsiyasi, zero-allocation sikl"
    }
  };

  function initDiagnostic() {
    const btn = document.getElementById('diag7-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const box = document.getElementById('diag7-result-box');
      const scoreEl = document.getElementById('diag7-score-val');
      const clusterEl = document.getElementById('diag7-cluster-val');
      const planEl = document.getElementById('diag7-plan-desc');
      const promptEl = document.getElementById('diag7-personalized-prompt');

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
        (wrong.length ? `<br><strong>Qayta ko'rib chiqing:</strong> ${wrong.join(', ')}-savol(lar). To'g'ri javoblar: 1-A, 2-B, 3-C, 4-B.` : '');
      renderMath(planEl);

      promptEl.value =
`Siz JavaScript va kompyuter fizikasi bo'yicha Sokratik ustozsiz. Men 7-laboratoriya diagnostik testidan ${score}/100 ball olib, "${key}" klasteriga kiritildim.
Asosiy mavzular: ${c.focus}.
Vazifa: HTML5 Canvas'da requestAnimationFrame va delta-time asosida prujinali garmonik tebranish animatsiyasini yozish.
Iltimos:
1. Tayyor kodni darhol bermang — avval men yozgan kod bo'lagini tahlil qilib, yo'naltiruvchi savollar bering.
2. Mening kodimda FPS ga bog'liq joylarni topishimga yordam bering.
3. Natijani tekshirishim uchun bitta o'lchanadigan test taklif qiling (masalan, 60 va 15 FPS da 5 soniyadagi siljish).`;
    });
  }

  // -------------------------------------------------------------------------
  // 2. INTERAKTIV KADR & TEBRANISH DASTGOHI
  // -------------------------------------------------------------------------
  function initLab() {
    const main = document.getElementById('lab7-main-canvas');
    const fpsCv = document.getElementById('lab7-fps-canvas');
    if (!main || !fpsCv) return;
    const mctx = main.getContext('2d');
    const fctx = fpsCv.getContext('2d');

    const selMode = document.getElementById('lab7-mode-select');
    const selThr = document.getElementById('lab7-throttle-select');
    const slSpeed = document.getElementById('lab7-speed-slider');
    const vSpeed = document.getElementById('lab7-speed-val');
    const btnPlay = document.getElementById('lab7-play-btn');
    const btnPause = document.getElementById('lab7-pause-btn');
    const btnReset = document.getElementById('lab7-reset-btn');
    const chkDt = document.getElementById('lab7-dt-check');
    const chkLabel = chkDt ? chkDt.parentElement.querySelector('span') : null;
    const hud = id => document.getElementById('hud-lab7-' + id);

    const W = main.width, Hc = main.height;
    const HIST = 120;
    const intervals = new Float32Array(HIST); // kadr oraliqlari, ms (qayta ishlatiladigan bufer)
    let histCount = 0, histHead = 0;

    // Holat: asosiy (tanlangan rejim) va etalon (doimo real vaqt bo'yicha)
    const sim = { x: 0, y: 0, vx: 0, vy: 0, acc: 0, t: 0 };
    const ref = { x: 0, y: 0, vx: 0, vy: 0, acc: 0, t: 0 };
    const trail = new Float32Array(2 * 60);
    let trailCount = 0, trailHead = 0;

    let running = false;
    let lastRendered = 0;
    let fpsEma = 0, lastDtMs = 0;
    let rafId = 0;

    const mode = () => (selMode ? selMode.value : 'ball');
    const speed = () => (slSpeed ? parseFloat(slSpeed.value) || 1 : 1);
    const throttle = () => (selThr ? parseInt(selThr.value, 10) || 0 : 0);
    const dtOn = () => (chkDt ? chkDt.checked : true);

    function initState(s) {
      s.acc = 0; s.t = 0;
      if (mode() === 'ball') {
        s.x = 70; s.y = 80; s.vx = 180; s.vy = 130;
      } else {
        s.x = OSC_AMP; s.y = 0; s.vx = 0; s.vy = 0;
      }
    }

    function reset() {
      initState(sim);
      initState(ref);
      trailCount = 0; trailHead = 0;
      histCount = 0; histHead = 0;
      fpsEma = 0; lastDtMs = 0; lastRendered = 0;
      draw();
      updateHud();
    }

    function stepBall(s, h) {
      const k = speed();
      s.x += s.vx * k * h;
      s.y += s.vy * k * h;
      if (s.x - BALL_R < 0) { s.x = BALL_R; s.vx = Math.abs(s.vx); }
      if (s.x + BALL_R > W) { s.x = W - BALL_R; s.vx = -Math.abs(s.vx); }
      if (s.y - BALL_R < 0) { s.y = BALL_R; s.vy = Math.abs(s.vy); }
      if (s.y + BALL_R > Hc - 28) { s.y = Hc - 28 - BALL_R; s.vy = -Math.abs(s.vy); }
    }

    function stepOsc(s, h) {
      // Eyler-Kromer; "tezlik masshtabi" vaqtni tezlashtiradi
      const hh = h * speed();
      s.vx += -OSC_OMEGA * OSC_OMEGA * s.x * hh;
      s.x += s.vx * hh;
    }

    function advance(s, frameTime) {
      const step = mode() === 'ball' ? stepBall : stepOsc;
      s.acc += frameTime;
      while (s.acc >= H) {
        step(s, H);
        s.acc -= H;
        s.t += H * speed();
      }
    }

    function frame(ts) {
      rafId = 0;
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      if (!lastRendered) { lastRendered = ts; return; }
      const thr = throttle();
      const elapsedMs = ts - lastRendered;
      // Sun'iy FPS cheklovi: kadr oralig'i yetarli bo'lmaguncha chizmaymiz
      // (4 ms tolerantlik — rAF vaqt belgilaridagi mayda tebranishlar uchun)
      if (thr > 0 && elapsedMs < 1000 / thr - 4) return;
      lastRendered = ts;

      const frameTime = Math.min(elapsedMs / 1000, MAX_FRAME);
      lastDtMs = elapsedMs;
      intervals[histHead] = elapsedMs;
      histHead = (histHead + 1) % HIST;
      if (histCount < HIST) histCount++;
      const instFps = 1000 / Math.max(elapsedMs, 1);
      fpsEma = fpsEma ? fpsEma * 0.85 + instFps * 0.15 : instFps;

      // Etalon: har doim haqiqiy o'tgan vaqt bo'yicha
      advance(ref, frameTime);
      // Asosiy jism: Delta-Time yoqilgan → real vaqt; o'chirilgan → har kadrda qat'iy 1/60 s
      advance(sim, dtOn() ? frameTime : FRAME_REF);

      if (mode() === 'ball') {
        trail[2 * trailHead] = sim.x;
        trail[2 * trailHead + 1] = sim.y;
        trailHead = (trailHead + 1) % 60;
        if (trailCount < 60) trailCount++;
      }

      draw();
      updateHud();
    }

    // ---------------- Chizish ----------------
    function drawBall() {
      // Iz
      for (let i = 0; i < trailCount; i++) {
        const idx = (trailHead - 1 - i + 60) % 60;
        mctx.fillStyle = `rgba(56, 189, 248, ${0.35 * (1 - i / trailCount)})`;
        mctx.beginPath();
        mctx.arc(trail[2 * idx], trail[2 * idx + 1], 3, 0, Math.PI * 2);
        mctx.fill();
      }
      // Etalon kontur
      mctx.setLineDash([5, 4]);
      mctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      mctx.lineWidth = 2;
      mctx.beginPath();
      mctx.arc(ref.x, ref.y, BALL_R + 3, 0, Math.PI * 2);
      mctx.stroke();
      mctx.setLineDash([]);
      // To'p
      mctx.fillStyle = '#38bdf8';
      mctx.beginPath();
      mctx.arc(sim.x, sim.y, BALL_R, 0, Math.PI * 2);
      mctx.fill();
      // Tezlik vektori
      const k = 0.25 * speed();
      mctx.strokeStyle = '#f59e0b';
      mctx.lineWidth = 2;
      mctx.beginPath();
      mctx.moveTo(sim.x, sim.y);
      mctx.lineTo(sim.x + sim.vx * k, sim.y + sim.vy * k);
      mctx.stroke();
    }

    function drawSpring(x0, x1, y, color) {
      const coils = 12;
      mctx.strokeStyle = color;
      mctx.lineWidth = 2;
      mctx.beginPath();
      mctx.moveTo(x0, y);
      const len = x1 - x0;
      for (let i = 1; i < coils * 2; i++) {
        const px = x0 + (len * i) / (coils * 2);
        const py = y + (i % 2 ? -10 : 10);
        mctx.lineTo(px, py);
      }
      mctx.lineTo(x1, y);
      mctx.stroke();
    }

    function drawOsc() {
      const cy = (Hc - 28) / 2 + 10;
      const x0 = 24;
      const cxEq = W / 2;
      // Devor
      mctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      mctx.fillRect(10, cy - 40, 14, 80);
      // Muvozanat chizig'i
      mctx.strokeStyle = 'rgba(255,255,255,0.2)';
      mctx.lineWidth = 1;
      mctx.setLineDash([4, 4]);
      mctx.beginPath();
      mctx.moveTo(cxEq, 20);
      mctx.lineTo(cxEq, Hc - 36);
      mctx.stroke();
      mctx.setLineDash([]);
      // Prujina va yuk
      const bx = cxEq + sim.x;
      drawSpring(x0, bx - 18, cy, '#38bdf8');
      mctx.fillStyle = '#a855f7';
      mctx.fillRect(bx - 18, cy - 18, 36, 36);
      // Etalon kontur
      const rx = cxEq + ref.x;
      mctx.setLineDash([5, 4]);
      mctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      mctx.lineWidth = 2;
      mctx.strokeRect(rx - 21, cy - 21, 42, 42);
      mctx.setLineDash([]);
      // Energiya nisbati (m = 1, k = ω²)
      const E = 0.5 * OSC_OMEGA * OSC_OMEGA * sim.x * sim.x + 0.5 * sim.vx * sim.vx;
      const E0 = 0.5 * OSC_OMEGA * OSC_OMEGA * OSC_AMP * OSC_AMP;
      mctx.fillStyle = '#e2e8f0';
      mctx.font = '12px monospace';
      mctx.textAlign = 'left';
      mctx.fillText(`E/E0 = ${(E / E0).toFixed(4)}`, 12, 20);
    }

    function draw() {
      mctx.clearRect(0, 0, W, Hc);
      if (mode() === 'ball') drawBall(); else drawOsc();

      // Pastki ma'lumot qatori
      mctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      mctx.fillRect(0, Hc - 26, W, 26);
      mctx.font = '12px monospace';
      mctx.textAlign = 'left';
      mctx.fillStyle = '#10b981';
      mctx.fillText(`Real vaqt: ${ref.t.toFixed(1)} s`, 8, Hc - 9);
      const lag = ref.t > 0 ? sim.t / ref.t : 1;
      mctx.fillStyle = Math.abs(lag - 1) < 0.02 ? '#38bdf8' : '#f43f5e';
      mctx.fillText(`Fizik vaqt: ${sim.t.toFixed(1)} s (×${lag.toFixed(2)})`, 150, Hc - 9);
      mctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      mctx.textAlign = 'right';
      mctx.fillText('┄ etalon', W - 8, Hc - 9);

      drawFpsScope();
    }

    function drawFpsScope() {
      const w = fpsCv.width, h = fpsCv.height;
      const padL = 40, padR = 10, padT = 16, padB = 24;
      const maxMs = 80;
      const y = ms => padT + (h - padT - padB) * (1 - Math.min(ms, maxMs) / maxMs);
      fctx.clearRect(0, 0, w, h);

      // Mo'ljal chiziqlari
      fctx.font = '11px monospace';
      fctx.textAlign = 'right';
      [[16.67, '60 FPS'], [33.33, '30 FPS'], [66.67, '15 FPS']].forEach(([ms, label]) => {
        fctx.strokeStyle = 'rgba(255,255,255,0.15)';
        fctx.setLineDash([4, 4]);
        fctx.beginPath();
        fctx.moveTo(padL, y(ms));
        fctx.lineTo(w - padR, y(ms));
        fctx.stroke();
        fctx.setLineDash([]);
        fctx.fillStyle = '#94a3b8';
        fctx.fillText(ms.toFixed(1), padL - 4, y(ms) + 4);
      });
      fctx.fillStyle = '#94a3b8';
      fctx.textAlign = 'left';
      fctx.fillText('Kadr oralig\'i, ms (oxirgi 120 kadr)', padL, h - 7);

      if (!histCount) {
        fctx.fillStyle = '#64748b';
        fctx.textAlign = 'center';
        fctx.fillText('▶ tugmasini bosing', (w + padL) / 2, h / 2);
        drawScopeLabels();
        return;
      }
      const bw = (w - padL - padR) / HIST;
      for (let i = 0; i < histCount; i++) {
        const idx = (histHead - histCount + i + HIST) % HIST;
        const ms = intervals[idx];
        const x = padL + (HIST - histCount + i) * bw;
        fctx.fillStyle = ms > 50 ? '#f43f5e' : ms > 20 ? '#f59e0b' : '#10b981';
        const top = y(ms);
        fctx.fillRect(x, top, Math.max(bw - 1, 1), y(0) - top);
      }
      drawScopeLabels();
    }

    function drawScopeLabels() {
      const w = fpsCv.width;
      const padT = 16, padB = 24, maxMs = 80, h = fpsCv.height;
      const y = ms => padT + (h - padT - padB) * (1 - Math.min(ms, maxMs) / maxMs);
      fctx.font = '11px monospace';
      fctx.textAlign = 'left';
      [[16.67, '60 FPS'], [33.33, '30 FPS'], [66.67, '15 FPS']].forEach(([ms, label]) => {
        const lx = w - 60, ly = y(ms) - 4;
        fctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
        fctx.fillRect(lx - 3, ly - 10, 50, 13);
        fctx.fillStyle = '#cbd5e1';
        fctx.fillText(label, lx, ly);
      });
    }

    function updateHud() {
      const setT = (id, t) => { const el = hud(id); if (el) el.textContent = t; };
      setT('fps', fpsEma ? `${fpsEma.toFixed(1)} FPS` : '— FPS');
      setT('dt', lastDtMs ? `${lastDtMs.toFixed(2)} ms` : '— ms');
      setT('mode', mode() === 'ball' ? "2D Elastik To'p" : 'Garmonik Ossilyator');
      setT('speed', `${speed().toFixed(1)}x`);
      const st = hud('status');
      if (st) {
        if (dtOn()) {
          st.textContent = "Barqaror (FPS ga bog'liq emas)";
          st.style.color = '#10b981';
        } else {
          const ratio = lastDtMs ? (FRAME_REF * 1000) / lastDtMs : 1;
          st.textContent = `FPS ga bog'liq: fizika real vaqtdan ×${ratio.toFixed(2)} tezlikda (xato!)`;
          st.style.color = Math.abs(ratio - 1) < 0.05 ? '#f59e0b' : '#f43f5e';
        }
      }
    }

    function updateDtLabel() {
      if (!chkLabel) return;
      if (dtOn()) {
        chkLabel.textContent = "Delta-Time Integratsiyasi YOQILGAN (To'g'ri fizika)";
        chkLabel.style.color = 'var(--accent-emerald)';
      } else {
        chkLabel.textContent = "Delta-Time Integratsiyasi O'CHIRILGAN (Kadrga bog'liq fizika)";
        chkLabel.style.color = '#f43f5e';
      }
    }

    function play() {
      if (running) return;
      running = true;
      lastRendered = 0;
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
    if (selMode) selMode.addEventListener('change', reset);
    if (selThr) selThr.addEventListener('change', () => { histCount = 0; histHead = 0; fpsEma = 0; draw(); });
    if (slSpeed) slSpeed.addEventListener('input', () => {
      if (vSpeed) vSpeed.textContent = `${speed().toFixed(1)}x`;
      updateHud();
      if (!running) draw();
    });
    if (chkDt) chkDt.addEventListener('change', () => {
      // Taqqoslash toza bo'lishi uchun ikkala holatni sinxronlaymiz
      initState(sim); initState(ref);
      trailCount = 0; trailHead = 0;
      updateDtLabel();
      updateHud();
      draw();
    });

    window.triggerLab7CanvasRedraw = draw;
    updateDtLabel();
    reset();
  }

  // -------------------------------------------------------------------------
  // 3. RUBRIKA KALKULYATORI (O'zbekiston OTM 5 ballik shkalasi)
  // -------------------------------------------------------------------------
  function initRubric() {
    const ids = ['rubric7_c1', 'rubric7_c2', 'rubric7_c3', 'rubric7_c4', 'rubric7_c5'];
    const selects = ids.map(id => document.getElementById(id));
    const btn = document.getElementById('lab7-calc-rubric-btn');
    const totalEl = document.getElementById('lab7-total-score');
    const gradeEl = document.getElementById('lab7-grade-badge');
    const fbEl = document.getElementById('lab7-rubric-feedback');
    if (selects.some(s => !s) || !totalEl) return;

    function update() {
      const total = selects.reduce((a, s) => a + (parseInt(s.value, 10) || 0), 0);
      totalEl.textContent = `${total} / 100`;
      let g;
      if (total >= 86) g = { text: "A'LO (5)", cls: 'badge-emerald', fb: "Barcha mezonlar yuqori darajada bajarilgan." };
      else if (total >= 71) g = { text: 'YAXSHI (4)', cls: 'badge-cyan', fb: "Yaxshi natija. Eng past ball olgan mezonni qayta ko'rib chiqing." };
      else if (total >= 55) g = { text: 'QONIQARLI (3)', cls: 'badge-amber', fb: "Delta-Time va akkumulyator integratsiyasini hamda FPS o'lchovlarini kuchaytiring." };
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
    initRubric();
  });
})();
