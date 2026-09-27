/**
 * 10-Laboratoriya: orbital elementlar asosida traektoriya va sinxron ovozli tushuntirish.
 * 1. Diagnostik test → A/B/C klaster, individual reja va shaxsiy prompt.
 * 2. Dastgoh: Kepler tenglamasi M = E − e·sin E (Nyuton-Rafson), teng vaqtlarda
 *    chiziladigan yuzalar (2-qonun), vis-viva tezligi. 30 s lik ssenariy 4 ta
 *    segmentga bo'lingan; animatsiya soati segmentlar bilan bir xil vaqt
 *    shkalasidan olinadi. Ovoz brauzerning Web Speech API sintezatori orqali
 *    (o'zbek ovozi bo'lmasa — subtitr rejimi).
 * 3. 100 ballik rubrika kalkulyatori va promptlarni nusxalash.
 */

(function () {
  const DURATION = 30;        // ssenariy davomiyligi, s (bir to'liq aylanish)
  const PERI_AT = 7;          // perigeliy o'tishi — 2-segment o'rtasida
  const V_EARTH = 29.78;      // km/s, √(GM☉/1 AU)
  const MAX_FRAME = 0.1;

  // Orbital elementlar (J2000, yaxlitlangan): NASA JPL SSD ma'lumotlari
  const BODIES = {
    halley: { name: 'Galley Kometasi (1P/Halley)', a: 17.83, e: 0.967, T: 75.3, color: '#38bdf8',
      desc: "O'ta cho'ziq elliptik orbita: perigeliy ≈ 0,59 AU (Merkuriy va Venera orbitalari orasida), afeliy ≈ 35 AU (Neptundan narida). Tezlik perigeliyda ≈ 54,5 km/s, afeliyda ≈ 0,9 km/s." },
    mars: { name: 'Mars', a: 1.524, e: 0.0934, T: 1.881, color: '#f97316',
      desc: "Sezilarli ekssentrisitet: Quyoshgacha masofa 1,38 dan 1,67 AU gacha o'zgaradi. Tezlik perigeliyda ≈ 26,5 km/s, afeliyda ≈ 22,0 km/s." },
    earth: { name: 'Yer', a: 1.000, e: 0.0167, T: 1.000, color: '#10b981',
      desc: "Deyarli aylanma orbita: perigeliy ≈ 0,983 AU (yanvar boshi), afeliy ≈ 1,017 AU (iyul boshi). Tezlik 29,3–30,3 km/s oralig'ida." },
    jupiter: { name: 'Yupiter', a: 5.203, e: 0.0484, T: 11.86, color: '#eab308',
      desc: "Gigant sayyora: masofa 4,95 dan 5,46 AU gacha o'zgaradi, bir aylanish ≈ 11,9 yil. Tezlik ≈ 12,4–13,7 km/s." }
  };

  const SEGMENTS = [
    { from: 0, to: 6, text: "Barcha sayyoralar va kometalar ellips bo'ylab harakatlanadi, Quyosh esa shu ellipsning fokuslaridan birida joylashgan. Bu — Keplerning birinchi qonuni." },
    { from: 6, to: 14, text: "Jism perigeliyga, ya'ni Quyoshga eng yaqin nuqtaga yaqinlashgan sari tortishish kuchi ortadi va uning tezligi keskin oshadi." },
    { from: 14, to: 22, text: "Afeliy tomon uzoqlashganda tortishish zaiflashadi, jism sekinlashadi va orbitaning uzoq qismida ko'p vaqt o'tkazadi." },
    { from: 22, to: 30, text: "Keplerning ikkinchi qonuniga ko'ra, Quyosh va jismni tutashtiruvchi radius-vektor teng vaqtlarda teng yuzalarni chizadi." }
  ];

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
  const DIAG_KEY = { diag10_q1: 'b', diag10_q2: 'c', diag10_q3: 'a', diag10_q4: 'c' };

  const CLUSTERS = {
    A: {
      title: 'Klaster "A" — Boshlang\'ich daraja',
      plan: "Avval 2.1-bo'limdagi Kepler qonunlarini takrorlang va dastgohda Yer hamda Galley kometasi orbitalarini solishtiring: nima uchun kometa perigeliy yaqinida juda tez o'tadi? So'ng 4-bo'limdagi ssenariy promptini Gemini'ga yuborib, 30 soniyalik matn oling.",
      focus: "Kepler qonunlari, perigeliy va afeliy, ekssentrisitet"
    },
    B: {
      title: 'Klaster "B" — Amaliyotchi daraja',
      plan: "NASA JPL Horizons'dan tanlagan jismingiz uchun $a$, $e$ va $T$ ni oling va dastgohdagi qiymatlar bilan solishtiring. Ssenariyni SSML bilan belgilab (4-bo'lim), TTS vositasida ovozga aylantiring va segment chegaralarini audio vaqtiga moslang.",
      focus: "orbital elementlar, SSML, ssenariy segmentlari va vaqt belgilari"
    },
    C: {
      title: 'Klaster "C" — Ilg\'or daraja',
      plan: "Kepler tenglamasi $M = E - e\\sin E$ ni Nyuton-Rafson usulida o'zingiz yechib, $e = 0.967$ da nechta iteratsiya kerakligini aniqlang. Tayyor audio faylning <code>currentTime</code> qiymatidan $M(t)$ ni hisoblaydigan sinxronizatsiya kodini yozing va dastgohdagi yondashuv bilan solishtiring.",
      focus: "Kepler tenglamasining sonli yechimi, audio-animatsiya sinxronizatsiyasi"
    }
  };

  function initDiagnostic() {
    const btn = document.getElementById('diag10-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const box = document.getElementById('diag10-result-box');
      const scoreEl = document.getElementById('diag10-score-val');
      const clusterEl = document.getElementById('diag10-cluster-val');
      const planEl = document.getElementById('diag10-plan-desc');
      const promptEl = document.getElementById('diag10-personalized-prompt');

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
        (wrong.length ? `<br><strong>Qayta ko'rib chiqing:</strong> ${wrong.join(', ')}-savol(lar). To'g'ri javoblar: 1-B, 2-C, 3-A, 4-C.` : '');
      renderMath(planEl);

      promptEl.value =
`Sen astronomiya va ilmiy-ommabop kontent bo'yicha Sokratik ustozsan. Men 10-laboratoriya diagnostik testidan ${score}/100 ball olib, "${key}" klasteriga kiritildim.
Asosiy mavzular: ${c.focus}.
Vazifa: NASA JPL Horizons orbital elementlari asosida bitta jism (sayyora yoki kometa) orbitasining animatsiyasi va unga 30 soniyalik o'zbekcha ovozli tushuntirish tayyorlash.
Iltimos:
1. Tayyor matnni darhol bermang — avval men yozgan ssenariy qoralamasidagi fizik xatolarni topishimga savollar bilan yordam bering.
2. Perigeliy va afeliy tezliklarini vis-viva formulasi bilan o'zim hisoblashim uchun yo'l ko'rsating.
3. Ssenariy segmentlarini animatsiya voqealariga (perigeliydan o'tish va h.k.) moslash bo'yicha tavsiya bering.`;
    });
  }

  // -------------------------------------------------------------------------
  // 2. ORBITA VA SINXRON OVOZ DASTGOHI
  // -------------------------------------------------------------------------
  function solveKepler(M, e) {
    // Nyuton-Rafson: f(E) = E − e·sin E − M
    let E = e < 0.8 ? M : Math.PI;
    for (let i = 0; i < 30; i++) {
      const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= d;
      if (Math.abs(d) < 1e-12) break;
    }
    return E;
  }

  function initLab() {
    const cv = document.getElementById('lab10-orbit-canvas');
    const tcv = document.getElementById('lab10-timeline-canvas');
    if (!cv || !tcv) return;
    const ctx = cv.getContext('2d');
    const tctx = tcv.getContext('2d');
    const W = cv.width, Hc = cv.height;

    const sel = document.getElementById('lab10-body-select');
    const slSpeed = document.getElementById('lab10-speed-slider');
    const vSpeed = document.getElementById('lab10-speed-val');
    const chkSweep = document.getElementById('lab10-sweep-check');
    const chkVec = document.getElementById('lab10-vector-check');
    const btnTts = document.getElementById('lab10-tts-voice-btn');
    const btnPlay = document.getElementById('lab10-play-btn');
    const btnPause = document.getElementById('lab10-pause-btn');
    const btnReset = document.getElementById('lab10-reset-btn');
    const subEl = document.getElementById('lab10-current-subtitle');
    const titleEl = document.getElementById('lab10-body-title');

    let t = 0;               // ssenariy vaqti, s (0…30)
    let running = false, rafId = 0, lastTs = 0;
    let narrate = false, lastSeg = -1;
    const synth = window.speechSynthesis || null;

    const body = () => BODIES[sel ? sel.value : 'halley'] || BODIES.halley;
    const speed = () => (slSpeed ? parseFloat(slSpeed.value) || 1 : 1);
    const segIndex = tt => SEGMENTS.findIndex(s => tt >= s.from && tt < s.to);

    function stateAt(tt) {
      const b = body();
      const M = 2 * Math.PI * (tt - PERI_AT) / DURATION;
      const E = solveKepler(((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), b.e);
      const bAxis = b.a * Math.sqrt(1 - b.e * b.e);
      const x = b.a * (Math.cos(E) - b.e);          // Quyosh (fokus) koordinata boshida
      const y = bAxis * Math.sin(E);
      const r = Math.hypot(x, y);
      const v = V_EARTH * Math.sqrt(2 / r - 1 / b.a); // vis-viva, km/s
      const dx = -b.a * Math.sin(E), dy = bAxis * Math.cos(E);
      const dl = Math.hypot(dx, dy) || 1;
      return { x, y, r, v, ux: dx / dl, uy: dy / dl };
    }

    function frameGeom() {
      const b = body();
      const bAxis = b.a * Math.sqrt(1 - b.e * b.e);
      const scale = Math.min((W - 80) / (2 * b.a), (Hc - 70) / (2 * bAxis));
      // ellips markazi (−a·e, 0) ekranda markazga
      const cx = W / 2 + b.a * b.e * scale;
      const cy = Hc / 2 + 10;
      return { scale, cx, cy, bAxis };
    }

    function updateInfo() {
      const b = body();
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('lab10-val-a', `${b.a < 2 ? b.a.toFixed(3) : b.a.toFixed(2)} AU`);
      set('lab10-val-e', b.e.toFixed(4));
      set('lab10-val-t', `${b.T < 2 ? b.T.toFixed(3) : b.T.toFixed(1)} yil`);
      set('lab10-body-desc', b.desc);
      if (titleEl) titleEl.textContent = b.name;
    }

    function draw() {
      const b = body();
      const g = frameGeom();
      const toS = (x, y) => [g.cx + x * g.scale, g.cy - y * g.scale];
      ctx.clearRect(0, 0, W, Hc);

      // Yulduzlar foni (deterministik)
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 80; i++) {
        const sx = (i * 173.3) % W, sy = (i * 97.7 + (i % 7) * 31) % Hc;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // Teng vaqt sektorlari (2-qonun): 12 ta sektor, har biri T/12
      if (!chkSweep || chkSweep.checked) {
        const n = 12;
        for (let k = 0; k < n; k++) {
          const t0 = PERI_AT + (k / n) * DURATION;
          ctx.beginPath();
          const [sx, sy] = toS(0, 0);
          ctx.moveTo(sx, sy);
          for (let j = 0; j <= 20; j++) {
            const p = stateAt(t0 + (j / 20) * (DURATION / n));
            const [px, py] = toS(p.x, p.y);
            ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = k % 2 ? 'rgba(56,189,248,0.10)' : 'rgba(168,85,247,0.10)';
          ctx.fill();
        }
      }

      // Orbita
      ctx.strokeStyle = 'rgba(148,163,184,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(g.cx - b.a * b.e * g.scale, g.cy, b.a * g.scale, g.bAxis * g.scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Quyosh (fokusda)
      const [sx, sy] = toS(0, 0);
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 16);
      grad.addColorStop(0, '#fff7cc');
      grad.addColorStop(1, 'rgba(250,204,21,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();

      // Perigeliy / afeliy belgilari
      ctx.font = '11px monospace';
      ctx.fillStyle = '#94a3b8';
      const [qx, qy] = toS(b.a * (1 - b.e), 0);
      const [Qx, Qy] = toS(-b.a * (1 + b.e), 0);
      ctx.textAlign = 'center';
      ctx.fillText('perigeliy', qx, qy + 18);
      ctx.fillText('afeliy', Qx + 22, Qy + 18);

      // Jism
      const s = stateAt(t);
      const [bx, by] = toS(s.x, s.y);
      ctx.strokeStyle = 'rgba(250,204,21,0.5)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(bx, by); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill();

      if (!chkVec || chkVec.checked) {
        const len = 18 + 2.2 * s.v * (b.a > 10 ? 1 : 2);
        const ex = bx + s.ux * len, ey = by - s.uy * len;
        ctx.strokeStyle = '#f43f5e';
        ctx.fillStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
        const ang = Math.atan2(ey - by, ex - bx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 8 * Math.cos(ang - 0.4), ey - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(ex - 8 * Math.cos(ang + 0.4), ey - 8 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
      }

      // HUD
      ctx.textAlign = 'left';
      ctx.font = '12px monospace';
      ctx.fillStyle = '#e2e8f0';
      const years = ((((t - PERI_AT) / DURATION) % 1 + 1) % 1) * b.T;
      ctx.fillText(`r = ${s.r.toFixed(3)} AU   v = ${s.v.toFixed(2)} km/s   perigeliydan: ${years.toFixed(b.T < 2 ? 3 : 1)} yil`, 12, 20);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Masshtab: 30 s ssenariy = 1 aylanish (T = ${b.T} yil)`, 12, Hc - 10);

      drawTimeline();
    }

    function drawTimeline() {
      const w = tcv.width, h = tcv.height;
      const padL = 10, padR = 10, barY = 34, barH = 28;
      const x = tt => padL + (tt / DURATION) * (w - padL - padR);
      tctx.clearRect(0, 0, w, h);
      const colors = ['#0ea5e9', '#10b981', '#a855f7', '#f59e0b'];
      tctx.font = '11px monospace';
      SEGMENTS.forEach((s, i) => {
        tctx.fillStyle = colors[i] + (segIndex(t) === i ? 'cc' : '55');
        tctx.fillRect(x(s.from) + 1, barY, x(s.to) - x(s.from) - 2, barH);
        tctx.fillStyle = '#e2e8f0';
        tctx.textAlign = 'left';
        tctx.fillText(`[${String(s.from).padStart(2, '0')}–${s.to}s] ${i + 1}-segment`, x(s.from) + 6, barY + 18);
      });
      tctx.fillStyle = '#94a3b8';
      tctx.textAlign = 'left';
      tctx.fillText('Ssenariy vaqt shkalasi — bosib kerakli joyga o\'ting', padL, 18);
      tctx.textAlign = 'right';
      tctx.fillText(`${t.toFixed(1)} / ${DURATION} s`, w - padR, 18);
      // perigeliy belgisi
      tctx.fillStyle = '#facc15';
      tctx.fillRect(x(PERI_AT) - 1, barY - 6, 2, barH + 12);
      tctx.textAlign = 'center';
      tctx.fillText('perigeliy', x(PERI_AT), barY + barH + 18);
      // kursor
      tctx.fillStyle = '#fff';
      tctx.fillRect(x(t) - 1.5, barY - 8, 3, barH + 16);
    }

    function showSubtitle(i) {
      if (!subEl) return;
      subEl.textContent = i >= 0 ? `"${SEGMENTS[i].text}"` : '"Animatsiya va ovoz ijrosini boshlash uchun tugmani bosing."';
    }

    function pickVoice() {
      if (!synth) return null;
      const voices = synth.getVoices();
      return voices.find(v => /^uz/i.test(v.lang)) || null;
    }

    function speakSegment(i) {
      if (!narrate || !synth || i < 0) return;
      const voice = pickVoice();
      if (!voice) return; // o'zbek ovozi yo'q — faqat subtitr
      synth.cancel();
      const u = new SpeechSynthesisUtterance(SEGMENTS[i].text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = Math.min(2, Math.max(0.5, speed()));
      synth.speak(u);
    }

    function frame(ts) {
      rafId = 0;
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      if (!lastTs) { lastTs = ts; return; }
      const dt = Math.min((ts - lastTs) / 1000, MAX_FRAME);
      lastTs = ts;
      t += dt * speed();
      if (t >= DURATION) {
        if (narrate) { // ssenariy tugadi
          t = DURATION - 1e-6;
          narrate = false;
          pause();
          if (btnTts) btnTts.textContent = '🎙️ Ovozli Tushuntirishni Qayta Boshlash';
        } else {
          t %= DURATION;
        }
      }
      const i = segIndex(t);
      if (i !== lastSeg) { lastSeg = i; showSubtitle(i); speakSegment(i); }
      draw();
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
      if (synth) synth.cancel();
      if (btnPlay) btnPlay.disabled = false;
      if (btnPause) btnPause.disabled = true;
    }

    function reset() {
      pause();
      narrate = false;
      t = 0;
      lastSeg = -1;
      showSubtitle(-1);
      if (btnTts) btnTts.textContent = '🎙️ Ovozli Tushuntirishni Boshlash';
      draw();
    }

    if (btnTts) btnTts.addEventListener('click', () => {
      pause();
      t = 0;
      lastSeg = -1;
      narrate = true;
      btnTts.textContent = '🎙️ Ijro etilmoqda…';
      if (!pickVoice()) {
        toast("Brauzeringizda o'zbek ovozi topilmadi — subtitr rejimi. Haqiqiy ovoz uchun Muxlisa AI yoki ElevenLabs faylidan foydalaning.");
      }
      play();
    });
    if (btnPlay) btnPlay.addEventListener('click', play);
    if (btnPause) btnPause.addEventListener('click', pause);
    if (btnReset) btnReset.addEventListener('click', reset);
    if (sel) sel.addEventListener('change', () => { updateInfo(); draw(); });
    if (slSpeed) slSpeed.addEventListener('input', () => { if (vSpeed) vSpeed.textContent = `${speed().toFixed(2)}x`; });
    if (chkSweep) chkSweep.addEventListener('change', draw);
    if (chkVec) chkVec.addEventListener('change', draw);
    tcv.addEventListener('click', ev => {
      const rect = tcv.getBoundingClientRect();
      const fx = (ev.clientX - rect.left) / rect.width * tcv.width;
      t = Math.min(DURATION - 1e-3, Math.max(0, (fx - 10) / (tcv.width - 20) * DURATION));
      lastSeg = -1;
      if (synth) synth.cancel();
      const i = segIndex(t);
      lastSeg = i;
      showSubtitle(i);
      if (running) speakSegment(i);
      draw();
    });
    if (synth && typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', () => {});

    window.triggerLab10CanvasRedraw = draw;
    updateInfo();
    draw();
  }

  // -------------------------------------------------------------------------
  // 3. RUBRIKA KALKULYATORI (O'zbekiston OTM 5 ballik shkalasi)
  // -------------------------------------------------------------------------
  function initRubric() {
    const ids = ['rubric10_c1', 'rubric10_c2', 'rubric10_c3', 'rubric10_c4', 'rubric10_c5'];
    const selects = ids.map(id => document.getElementById(id));
    const btn = document.getElementById('lab10-calc-rubric-btn');
    const totalEl = document.getElementById('lab10-total-score');
    const gradeEl = document.getElementById('lab10-grade-badge');
    const fbEl = document.getElementById('lab10-rubric-feedback');
    if (selects.some(s => !s) || !totalEl) return;

    function update() {
      const total = selects.reduce((a, s) => a + (parseInt(s.value, 10) || 0), 0);
      totalEl.textContent = `${total} / 100`;
      let g;
      if (total >= 86) g = { text: "A'LO (5)", cls: 'badge-emerald', fb: "Barcha mezonlar yuqori darajada bajarilgan." };
      else if (total >= 71) g = { text: 'YAXSHI (4)', cls: 'badge-cyan', fb: "Yaxshi natija. Eng past ball olgan mezonni qayta ko'rib chiqing." };
      else if (total >= 55) g = { text: 'QONIQARLI (3)', cls: 'badge-amber', fb: "Orbital ma'lumotlar tahlili va ovoz-animatsiya sinxronizatsiyasini kuchaytiring." };
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
