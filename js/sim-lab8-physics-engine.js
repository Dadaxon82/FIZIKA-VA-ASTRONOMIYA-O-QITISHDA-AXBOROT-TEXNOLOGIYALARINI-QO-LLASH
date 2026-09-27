/**
 * 8-Laboratoriya: AI bilan juftlikda yozilgan kichik 2D fizika dvigateli.
 * 1. Diagnostik test → A/B/C klaster, individual reja va shaxsiy prompt.
 * 2. Interaktiv to'qnashuv arenasi: Vector2D, impuls skalyari J (2-bo'limdagi
 *    formula), massalarga teskari proporsional overlap resolution, faqat
 *    yaqinlashayotgan jismlarga impuls (v_n > 0) va sub-stepping. Pastki
 *    grafikda Ek/Ek0 nisbati. Masshtab: 100 px = 1 m.
 * 3. 100 ballik rubrika kalkulyatori va promptlarni nusxalash.
 */

(function () {
  const PX_PER_M = 100;
  const H = 1 / 120;       // qat'iy fizik qadam, s
  const SUBSTEPS = 4;      // tunnel effektiga qarshi ichki qadamlar
  const MAX_FRAME = 0.1;   // kadr vaqtining yuqori chegarasi, s

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
  // VECTOR2D (2-bo'limdagi klass bilan bir xil interfeys)
  // -------------------------------------------------------------------------
  class Vector2D {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { return new Vector2D(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2D(this.x - v.x, this.y - v.y); }
    mult(s) { return new Vector2D(this.x * s, this.y * s); }
    div(s) { return s !== 0 ? new Vector2D(this.x / s, this.y / s) : new Vector2D(); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    magSq() { return this.x * this.x + this.y * this.y; }
    mag() { return Math.sqrt(this.magSq()); }
    normalize() { const m = this.mag(); return m > 0 ? this.div(m) : new Vector2D(); }
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
  const DIAG_KEY = { diag8_q1: 'c', diag8_q2: 'b', diag8_q3: 'a', diag8_q4: 'c' };

  const CLUSTERS = {
    A: {
      title: 'Klaster "A" — Boshlang\'ich daraja',
      plan: "Avval 2.1-bo'limdagi <code>Vector2D</code> klassini qo'lda qayta yozing va har bir metodni bitta sonli misolda tekshiring. So'ng bir o'lchamli markaziy to'qnashuv uchun impuls va energiya saqlanishidan $v_1'$ va $v_2'$ ni qog'ozda chiqaring. 5-bo'limdagi «Bilyard» stsenariysida teng massali sharlar tezlik almashishini kuzating.",
      focus: "vektor amallari, skalyar ko'paytma, bir o'lchamli elastik to'qnashuv"
    },
    B: {
      title: 'Klaster "B" — Amaliyotchi daraja',
      plan: "2.2–2.3-bo'limlardagi $J$ formulasi va overlap resolution'ni JavaScript'da yozing. 3-bo'limdagi 1- va 2-nosozlik promptlarini Claude'ga yuborib, uning tavsiyalarini o'z kodingizda sinab ko'ring. Dastgohda $e$ ni 1 dan 0,5 gacha kamaytirib, $E_k/E_{k0}$ grafigining o'zgarishini tushuntiring.",
      focus: "impuls skalyari J, pozitsiyani to'g'rilash, v_n > 0 sharti, tiklanish koeffitsiyenti"
    },
    C: {
      title: 'Klaster "C" — Ilg\'or daraja',
      plan: "Dvigatelga sub-stepping va uzluksiz to'qnashuv aniqlash (CCD) variantlarini qo'shib, tunnel effektini solishtiring. 4-bo'limdagi Python skriptini $e = 0.7$ uchun kengaytirib, yo'qotilgan energiyani $\\Delta E = \\tfrac{1}{2}\\mu(1-e^2)v_n^2$ formulasi bilan tekshiring. Keyingi qadam sifatida aylanish (inersiya momenti) va ishqalanishni qo'shishni rejalashtiring (Hecker, 1997).",
      focus: "sub-stepping va CCD, noelastik to'qnashuvda energiya yo'qotilishi, aylanma harakat"
    }
  };

  function initDiagnostic() {
    const btn = document.getElementById('diag8-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const box = document.getElementById('diag8-result-box');
      const scoreEl = document.getElementById('diag8-score-val');
      const clusterEl = document.getElementById('diag8-cluster-val');
      const planEl = document.getElementById('diag8-plan-desc');
      const promptEl = document.getElementById('diag8-personalized-prompt');

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
`Sen mening juftlikdagi dasturlash sherigimsan (Navigator), men esa Driver'man. Men 8-laboratoriya diagnostik testidan ${score}/100 ball olib, "${key}" klasteriga kiritildim.
Asosiy mavzular: ${c.focus}.
Vazifa: JavaScript'da 2D doiralar uchun elastik to'qnashuvli kichik fizika dvigatelini yozish (Vector2D, impuls skalyari J, overlap resolution).
Qoidalar:
1. Kodni men yozaman — sen avval men yuborgan bo'lakni tahlil qilib, xatoni o'zim topishim uchun yo'naltiruvchi savol ber.
2. Har bir tavsiyangni fizik qonun (impuls yoki energiya saqlanishi) bilan asosla.
3. Tuzatishdan keyin tekshirish uchun bitta sonli test taklif qil (masalan, to'qnashuvdan oldin va keyin to'liq impulsni solishtirish).`;
    });
  }

  // -------------------------------------------------------------------------
  // 2. INTERAKTIV TO'QNASHUV ARENASI
  // -------------------------------------------------------------------------
  function initLab() {
    const cv = document.getElementById('lab8-engine-canvas');
    const gcv = document.getElementById('lab8-conservation-canvas');
    if (!cv || !gcv) return;
    const ctx = cv.getContext('2d');
    const gctx = gcv.getContext('2d');
    const W = cv.width, Hc = cv.height;

    const selScen = document.getElementById('lab8-scenario-select');
    const slE = document.getElementById('lab8-restitution-slider');
    const vE = document.getElementById('lab8-restitution-val');
    const chkVec = document.getElementById('lab8-show-vectors');
    const chkTrail = document.getElementById('lab8-show-trails');
    const btnPlay = document.getElementById('lab8-play-btn');
    const btnPause = document.getElementById('lab8-pause-btn');
    const btnReset = document.getElementById('lab8-reset-btn');
    const hud = id => document.getElementById('hud-lab8-' + id);

    const COLORS = ['#38bdf8', '#f59e0b', '#a855f7', '#10b981', '#f43f5e'];
    const TRAIL_LEN = 90;
    const GRAPH_LEN = 400;

    let bodies = [];
    let collisions = 0;
    let ek0 = 0;
    let running = false;
    let rafId = 0;
    let lastTs = 0;
    let acc = 0;
    let simTime = 0;
    const ratioHist = new Float32Array(GRAPH_LEN);
    let histCount = 0, histHead = 0, sampleTimer = 0;

    const restitution = () => (slE ? parseFloat(slE.value) : 1);

    function body(x, y, vx, vy, m, r, color) {
      // x, y — piksel; vx, vy — m/s; m — kg; r — piksel
      return { pos: new Vector2D(x, y), vel: new Vector2D(vx, vy), m, r, color, trail: [] };
    }

    function buildScenario() {
      const s = selScen ? selScen.value : 'billiard';
      const cy = Hc / 2;
      if (s === 'billiard') {
        bodies = [body(140, cy, 3, 0, 1, 26, COLORS[0]), body(480, cy, 0, 0, 1, 26, COLORS[1])];
      } else if (s === 'heavy_light') {
        bodies = [body(140, cy, 2.5, 0, 10, 42, COLORS[2]), body(480, cy, 0, 0, 1, 20, COLORS[1])];
      } else if (s === 'oblique') {
        bodies = [body(140, cy + 22, 3, 0, 1, 26, COLORS[0]), body(480, cy - 4, 0, 0, 1, 26, COLORS[1])];
      } else {
        // 5 ta "gaz molekulasi" — takrorlanuvchan boshlang'ich shartlar
        const init = [
          [120, 110, 2.2, 1.4, 1.0, 20], [320, 300, 2.0, 1.6, 1.5, 24], [520, 140, -1.8, 2.1, 1.0, 20],
          [660, 320, -2.4, -1.2, 2.0, 28], [420, 220, 1.1, -2.6, 0.8, 18]
        ];
        bodies = init.map((p, i) => body(p[0], p[1], p[2], p[3], p[4], p[5], COLORS[i]));
      }
    }

    function kinetic() {
      let e = 0;
      for (const b of bodies) e += 0.5 * b.m * b.vel.magSq();
      return e;
    }

    function momentum() {
      let p = new Vector2D();
      for (const b of bodies) p = p.add(b.vel.mult(b.m));
      return p;
    }

    function reset() {
      buildScenario();
      collisions = 0;
      simTime = 0;
      acc = 0;
      ek0 = kinetic();
      histCount = 0; histHead = 0; sampleTimer = 0;
      pushSample();
      draw();
      updateHud();
    }

    // Ikki doira to'qnashuvi: 2.2–2.3-bo'limdagi formulalar
    function resolvePair(a, b, e) {
      const delta = b.pos.sub(a.pos);           // piksel
      const d = delta.mag();
      const rSum = a.r + b.r;
      if (d >= rSum || d === 0) return;
      const n = delta.div(d);                   // 1 → 2 birlik normal

      // Overlap resolution: massalarga teskari proporsional siljitish
      const depth = rSum - d;
      const mSum = a.m + b.m;
      a.pos = a.pos.sub(n.mult(depth * b.m / mSum));
      b.pos = b.pos.add(n.mult(depth * a.m / mSum));

      // Impuls faqat yaqinlashayotgan jismlarga (v_n > 0)
      const vRel = a.vel.sub(b.vel);
      const vn = vRel.dot(n);
      if (vn <= 0) return;
      const J = -(1 + e) * vn / (1 / a.m + 1 / b.m);
      a.vel = a.vel.add(n.mult(J / a.m));
      b.vel = b.vel.sub(n.mult(J / b.m));
      collisions++;
    }

    function wallBounce(b) {
      // Devorlar mutlaq elastik (tashqi jism): energiya saqlanadi, impuls o'zgaradi
      if (b.pos.x - b.r < 0) { b.pos.x = b.r; b.vel.x = Math.abs(b.vel.x); }
      if (b.pos.x + b.r > W) { b.pos.x = W - b.r; b.vel.x = -Math.abs(b.vel.x); }
      if (b.pos.y - b.r < 0) { b.pos.y = b.r; b.vel.y = Math.abs(b.vel.y); }
      if (b.pos.y + b.r > Hc) { b.pos.y = Hc - b.r; b.vel.y = -Math.abs(b.vel.y); }
    }

    function step(h) {
      const e = restitution();
      const hs = h / SUBSTEPS;
      for (let k = 0; k < SUBSTEPS; k++) {
        for (const b of bodies) b.pos = b.pos.add(b.vel.mult(hs * PX_PER_M));
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) resolvePair(bodies[i], bodies[j], e);
        }
        for (const b of bodies) wallBounce(b);
      }
      simTime += h;
    }

    function pushSample() {
      ratioHist[histHead] = ek0 > 0 ? kinetic() / ek0 : 1;
      histHead = (histHead + 1) % GRAPH_LEN;
      if (histCount < GRAPH_LEN) histCount++;
    }

    function frame(ts) {
      rafId = 0;
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      if (!lastTs) { lastTs = ts; return; }
      const dt = Math.min((ts - lastTs) / 1000, MAX_FRAME);
      lastTs = ts;
      acc += dt;
      while (acc >= H) {
        step(H);
        acc -= H;
        sampleTimer += H;
        if (sampleTimer >= 0.05) { sampleTimer = 0; pushSample(); }
      }
      for (const b of bodies) {
        b.trail.push(b.pos.x, b.pos.y);
        if (b.trail.length > TRAIL_LEN * 2) b.trail.splice(0, 2);
      }
      draw();
      updateHud();
    }

    // ---------------- Chizish ----------------
    function arrow(x0, y0, x1, y1, color) {
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 2) return;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - 9 * Math.cos(ang - 0.4), y1 - 9 * Math.sin(ang - 0.4));
      ctx.lineTo(x1 - 9 * Math.cos(ang + 0.4), y1 - 9 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, W, Hc);
      // 1 m to'r
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let x = PX_PER_M; x < W; x += PX_PER_M) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Hc); ctx.stroke(); }
      for (let y = PX_PER_M; y < Hc; y += PX_PER_M) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const showTrail = !chkTrail || chkTrail.checked;
      const showVec = !chkVec || chkVec.checked;

      if (showTrail) {
        for (const b of bodies) {
          const t = b.trail;
          if (t.length < 4) continue;
          ctx.strokeStyle = b.color + '66';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(t[0], t[1]);
          for (let i = 2; i < t.length; i += 2) ctx.lineTo(t[i], t[i + 1]);
          ctx.stroke();
        }
      }

      ctx.textAlign = 'center';
      ctx.font = '12px monospace';
      for (const b of bodies) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b1120';
        ctx.fillText(`${b.m} kg`, b.pos.x, b.pos.y + 4);
        if (showVec) {
          const k = 25; // 1 m/s → 25 px strelka
          arrow(b.pos.x, b.pos.y, b.pos.x + b.vel.x * k, b.pos.y + b.vel.y * k, '#e2e8f0');
        }
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(226,232,240,0.75)';
      ctx.fillText(`t = ${simTime.toFixed(2)} s   |   katak = 1 m   |   ${SUBSTEPS} ta sub-step`, 10, 18);
      drawGraph();
    }

    function drawGraph() {
      const w = gcv.width, h = gcv.height;
      const padL = 44, padR = 10, padT = 10, padB = 16;
      const yMax = 1.2;
      const y = r => padT + (h - padT - padB) * (1 - Math.min(Math.max(r, 0), yMax) / yMax);
      gctx.clearRect(0, 0, w, h);
      gctx.font = '11px monospace';
      gctx.textAlign = 'right';
      [0, 0.5, 1].forEach(r => {
        gctx.strokeStyle = r === 1 ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)';
        gctx.setLineDash(r === 1 ? [] : [4, 4]);
        gctx.beginPath();
        gctx.moveTo(padL, y(r));
        gctx.lineTo(w - padR, y(r));
        gctx.stroke();
        gctx.setLineDash([]);
        gctx.fillStyle = '#94a3b8';
        gctx.fillText(r.toFixed(1), padL - 6, y(r) + 4);
      });
      if (histCount > 1) {
        gctx.strokeStyle = '#38bdf8';
        gctx.lineWidth = 2;
        gctx.beginPath();
        const dx = (w - padL - padR) / (GRAPH_LEN - 1);
        for (let i = 0; i < histCount; i++) {
          const idx = (histHead - histCount + i + GRAPH_LEN) % GRAPH_LEN;
          const px = padL + i * dx;
          const py = y(ratioHist[idx]);
          if (i === 0) gctx.moveTo(px, py); else gctx.lineTo(px, py);
        }
        gctx.stroke();
      }
      gctx.textAlign = 'left';
      gctx.fillStyle = '#94a3b8';
      gctx.fillText('Ek / Ek0 (vaqt bo\'yicha, har 0,05 s)', padL + 4, h - 4);
    }

    function updateHud() {
      const setT = (id, t) => { const el = hud(id); if (el) el.textContent = t; };
      const ek = kinetic();
      const p = momentum();
      setT('ek', `${ek.toFixed(3)} J`);
      setT('p', `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}) kg·m/s`);
      setT('collisions', String(collisions));
      const ratio = ek0 > 0 ? ek / ek0 : 1;
      const rEl = hud('ratio');
      if (rEl) {
        rEl.textContent = `${(ratio * 100).toFixed(1)} %`;
        rEl.style.color = Math.abs(ratio - 1) < 0.005 ? '#10b981' : ratio < 1 ? '#f59e0b' : '#f43f5e';
      }
      const e = restitution();
      const st = hud('status');
      if (st) {
        if (e >= 0.999) { st.textContent = 'Mutlaq Elastik (e = 1.00)'; st.style.color = '#10b981'; }
        else if (e <= 0.001) { st.textContent = 'Mutlaq Noelastik (e = 0.00)'; st.style.color = '#f43f5e'; }
        else { st.textContent = `Noelastik (e = ${e.toFixed(2)})`; st.style.color = '#f59e0b'; }
      }
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
    if (selScen) selScen.addEventListener('change', reset);
    if (slE) slE.addEventListener('input', () => {
      if (vE) vE.textContent = restitution().toFixed(2);
      updateHud();
    });
    if (chkVec) chkVec.addEventListener('change', draw);
    if (chkTrail) chkTrail.addEventListener('change', draw);

    window.triggerLab8CanvasRedraw = draw;
    reset();
  }

  // -------------------------------------------------------------------------
  // 3. RUBRIKA KALKULYATORI (O'zbekiston OTM 5 ballik shkalasi)
  // -------------------------------------------------------------------------
  function initRubric() {
    const ids = ['rubric8_c1', 'rubric8_c2', 'rubric8_c3', 'rubric8_c4', 'rubric8_c5'];
    const selects = ids.map(id => document.getElementById(id));
    const btn = document.getElementById('lab8-calc-rubric-btn');
    const totalEl = document.getElementById('lab8-total-score');
    const gradeEl = document.getElementById('lab8-grade-badge');
    const fbEl = document.getElementById('lab8-rubric-feedback');
    if (selects.some(s => !s) || !totalEl) return;

    function update() {
      const total = selects.reduce((a, s) => a + (parseInt(s.value, 10) || 0), 0);
      totalEl.textContent = `${total} / 100`;
      let g;
      if (total >= 86) g = { text: "A'LO (5)", cls: 'badge-emerald', fb: "Barcha mezonlar yuqori darajada bajarilgan." };
      else if (total >= 71) g = { text: 'YAXSHI (4)', cls: 'badge-cyan', fb: "Yaxshi natija. Eng past ball olgan mezonni qayta ko'rib chiqing." };
      else if (total >= 55) g = { text: 'QONIQARLI (3)', cls: 'badge-amber', fb: "Impuls formulasi, overlap resolution va saqlanish qonunlari tekshiruvini kuchaytiring." };
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
