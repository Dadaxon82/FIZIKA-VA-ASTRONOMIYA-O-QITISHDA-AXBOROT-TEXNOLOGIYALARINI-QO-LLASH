/**
 * 4-Laboratoriya: kompyuter modelining hisoblash aniqligi (mayatnik).
 * 1. Diagnostik test → A/B/C klaster, individual reja va shaxsiy prompt.
 * 2. Jonli dastgoh: nochiziqli mayatnik θ'' = −(g/L)·sin θ ni Eyler,
 *    Eyler-Kromer yoki RK4 bilan yechadi. Etalon — o'sha tenglamaning juda
 *    kichik qadamli (10⁻⁴ s) RK4 yechimi, shuning uchun katta burchaklarda
 *    ham xatolik faqat sonli usulning o'ziga tegishli bo'ladi.
 * 3. t = 5 s dagi 4 xil qadam uchun qiyosiy xatoliklar jadvali.
 * 4. 100 ballik rubrika kalkulyatori va promptlarni nusxalash.
 */

(function () {
  const G = 9.8;
  const REF_DT = 1e-4;

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
  // SONLI INTEGRATORLAR (tab3'dagi jadval formulalari bilan bir xil)
  // -------------------------------------------------------------------------
  function accel(theta, L) { return -(G / L) * Math.sin(theta); }

  function step(method, s, dt, L) {
    if (method === 'euler') {
      const a = accel(s.th, L);
      return { th: s.th + s.om * dt, om: s.om + a * dt };
    }
    if (method === 'cromer') {
      const om = s.om + accel(s.th, L) * dt;
      return { th: s.th + om * dt, om };
    }
    // RK4
    const k1t = s.om, k1o = accel(s.th, L);
    const k2t = s.om + 0.5 * dt * k1o, k2o = accel(s.th + 0.5 * dt * k1t, L);
    const k3t = s.om + 0.5 * dt * k2o, k3o = accel(s.th + 0.5 * dt * k2t, L);
    const k4t = s.om + dt * k3o, k4o = accel(s.th + dt * k3t, L);
    return {
      th: s.th + dt / 6 * (k1t + 2 * k2t + 2 * k3t + k4t),
      om: s.om + dt / 6 * (k1o + 2 * k2o + 2 * k3o + k4o)
    };
  }

  function integrate(method, th0, L, dt, T) {
    let s = { th: th0, om: 0 };
    const n = Math.round(T / dt);
    for (let i = 0; i < n; i++) s = step(method, s, dt, L);
    return s.th;
  }

  function energy(s, L) {
    // m = 1 kg: E = ½ m (Lω)² + m g L (1 − cos θ)
    return 0.5 * (L * s.om) ** 2 + G * L * (1 - Math.cos(s.th));
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
  const DIAG_KEY = { diag4_q1: 'b', diag4_q2: 'c', diag4_q3: 'a', diag4_q4: 'c' };

  const CLUSTERS = {
    A: {
      title: 'Klaster "A" — Boshlang\'ich daraja',
      color: 'var(--accent-cyan)',
      plan: "Avval mayatnik tenglamasini ikkita 1-tartibli tenglamaga ajratishni o'rganing (2-bo'lim). So'ng dastgohda faqat Eyler va Eyler-Kromer usullarini $\\Delta t = 0.05$ va $0.01$ s da solishtiring va xatolik qadamga qanday bog'liqligini jadvalga yozing.",
      focus: "Eyler usuli, lokal va global xatolik farqi, integratsiya qadamining ta'siri"
    },
    B: {
      title: 'Klaster "B" — Amaliyotchi daraja',
      color: 'var(--accent-emerald)',
      plan: "WolframAlpha'da analitik yechim va Taylor qatorini oling, 3-bo'limdagi Python skriptini ishga tushirib, log-log grafikdan Eyler va Eyler-Kromer uchun $p \\approx 1$ ekanini tasdiqlang. Dastgohda energiya dreyfini kuzating.",
      focus: "xatolik tartibi p, log-log konvergentsiya grafigi, energiya dreyfi va simplektik usullar"
    },
    C: {
      title: 'Klaster "C" — Ilg\'or daraja',
      color: 'var(--accent-purple)',
      plan: "RK4 uchun $p \\approx 4$ ni isbotlang va nima uchun juda kichik $\\Delta t$ da xatolik mashina aniqligi darajasida to'xtashini tushuntiring. Katta burchak ($\\theta_0 = 0.8$ rad) uchun chiziqli analitik yechim nega etalon bo'la olmasligini dastgoh orqali ko'rsating.",
      focus: "RK4 konvergentsiyasi, yaxlitlash xatoligi, chiziqli va nochiziqli model farqi, elliptik integral orqali davr"
    }
  };

  function initDiagnostic() {
    const btn = document.getElementById('diag4-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const box = document.getElementById('diag4-result-box');
      const titleEl = document.getElementById('diag4-cluster-val');
      const scoreEl = document.getElementById('diag4-score-val');
      const planEl = document.getElementById('diag4-plan-desc');
      const promptEl = document.getElementById('diag4-personalized-prompt');

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
        (wrong.length ? `<br><strong>Qayta ko'rib chiqing:</strong> ${wrong.join(', ')}-savol(lar). To'g'ri javoblar: 1-B, 2-C, 3-A, 4-C.` : '');
      renderMath(planEl);

      promptEl.value =
`Siz hisoblash fizikasi bo'yicha Sokratik konsultantsiz. Men 4-laboratoriya diagnostik testidan ${score}/100 ball olib, "${key}" klasteriga kiritildim.
Asosiy mavzular: ${c.focus}.
Model: matematik mayatnik, L = 1.0 m, g = 9.8 m/s^2, theta0 = 0.2 rad.
Iltimos:
1. Tayyor javob bermang — xatolik tartibini o'zim aniqlashim uchun bosqichma-bosqich yo'naltiruvchi savollar bering.
2. Men yozgan kodni tekshirishda WolframAlpha'da qaysi natija bilan solishtirishim kerakligini ayting.
3. Mening darajamga mos bitta qo'shimcha tajriba taklif qiling.`;
    });
  }

  // -------------------------------------------------------------------------
  // 2. JONLI DASTGOH
  // -------------------------------------------------------------------------
  function initLab() {
    const pCanvas = document.getElementById('lab4-pendulum-canvas');
    const eCanvas = document.getElementById('lab4-error-canvas');
    if (!pCanvas || !eCanvas) return;
    const pctx = pCanvas.getContext('2d');
    const ectx = eCanvas.getContext('2d');

    const slDt = document.getElementById('lab4-dt-slider');
    const slTh = document.getElementById('lab4-theta0-slider');
    const slL = document.getElementById('lab4-length-slider');
    const selMethod = document.getElementById('lab4-method-select');
    const vDt = document.getElementById('lab4-dt-val');
    const vTh = document.getElementById('lab4-theta0-val');
    const vL = document.getElementById('lab4-length-val');
    const out = {
      t: document.getElementById('lab4-cur-time'),
      ex: document.getElementById('lab4-cur-exact'),
      num: document.getElementById('lab4-cur-num'),
      err: document.getElementById('lab4-cur-error'),
      en: document.getElementById('lab4-cur-energy')
    };
    const tableBody = document.getElementById('lab4-error-table-body');

    const T_WINDOW = 10; // grafikda ko'rsatiladigan vaqt oralig'i, s
    let running = false;
    let sim, ref, history, simTime, wallTime, E0;

    const P = () => ({ dt: parseFloat(slDt.value), th0: parseFloat(slTh.value), L: parseFloat(slL.value), method: selMethod.value });

    function reset() {
      const { th0, L } = P();
      sim = { th: th0, om: 0 };
      ref = { th: th0, om: 0 };
      simTime = 0;
      wallTime = 0;
      E0 = energy(sim, L);
      history = [{ t: 0, num: th0, om: 0, ref: th0, err: 0 }];
      updateReadout();
    }

    function advance(realDt) {
      const { dt, L, method } = P();
      // Real vaqt yig'iladi va unga yetguncha sonli qadamlar bajariladi
      // (Δt kadr vaqtidan katta bo'lsa ham simulyatsiya real tezlikda yuradi)
      wallTime += realDt;
      while (simTime + dt <= wallTime + 1e-12) {
        sim = step(method, sim, dt, L);
        const nRef = Math.round(dt / REF_DT);
        for (let i = 0; i < nRef; i++) ref = step('rk4', ref, REF_DT, L);
        simTime += dt;
        history.push({ t: simTime, num: sim.th, om: sim.om, ref: ref.th, err: Math.abs(sim.th - ref.th) });
        if (!isFinite(sim.th) || Math.abs(sim.th) > 1e3) { running = false; break; }
      }
      while (history.length && history[0].t < simTime - T_WINDOW) history.shift();
    }

    function updateReadout() {
      const { L } = P();
      const E = energy(sim, L);
      out.t.textContent = simTime.toFixed(2) + ' s';
      out.ex.textContent = ref.th.toFixed(4) + ' rad';
      out.num.textContent = isFinite(sim.th) ? sim.th.toFixed(4) + ' rad' : '∞';
      out.err.textContent = Math.abs(sim.th - ref.th).toExponential(2) + ' rad';
      out.en.textContent = `${E.toFixed(3)} J (${E0 > 0 ? ((E / E0 - 1) * 100 >= 0 ? '+' : '') + ((E / E0 - 1) * 100).toFixed(2) : '0.00'}%)`;
    }

    function resize(c) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth || 460;
      const h = Math.round(w * 240 / 460);
      c.width = w * dpr; c.height = h * dpr;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function resizeAll() { resize(pCanvas); resize(eCanvas); }

    function drawPendulum() {
      const W = pCanvas.clientWidth || 460, H = Math.round(W * 240 / 460);
      const { th0, L } = P();
      pctx.fillStyle = '#090d16'; pctx.fillRect(0, 0, W, H);

      // Chap yarmi: mayatnik
      const half = W * 0.48;
      const px = half / 2, py = 18;
      const len = (H - 50) * (L / 2.0);
      const drawBob = (th, color, alpha) => {
        const x = px + len * Math.sin(th), y = py + len * Math.cos(th);
        pctx.globalAlpha = alpha;
        pctx.strokeStyle = color; pctx.lineWidth = 2;
        pctx.beginPath(); pctx.moveTo(px, py); pctx.lineTo(x, y); pctx.stroke();
        pctx.fillStyle = color;
        pctx.beginPath(); pctx.arc(x, y, 10, 0, Math.PI * 2); pctx.fill();
        pctx.globalAlpha = 1;
      };
      pctx.fillStyle = '#475569'; pctx.fillRect(px - 30, py - 4, 60, 4);
      drawBob(ref.th, '#38BDF8', 0.45);
      if (isFinite(sim.th)) drawBob(sim.th, '#F43F5E', 1);
      pctx.font = '11px ui-monospace, monospace';
      pctx.fillStyle = '#38BDF8'; pctx.fillText('● etalon', 8, H - 22);
      pctx.fillStyle = '#F43F5E'; pctx.fillText('● sonli', 8, H - 8);

      // O'ng yarmi: fazaviy portret (θ, ω)
      const ox = half + 10, ow = W - ox - 8, oy = 10, oh = H - 26;
      const cx = ox + ow / 2, cy = oy + oh / 2;
      const thMax = th0 * 1.6, omMax = th0 * Math.sqrt(G / L) * 1.6;
      pctx.strokeStyle = 'rgba(148,163,184,0.25)'; pctx.lineWidth = 1;
      pctx.strokeRect(ox, oy, ow, oh);
      pctx.beginPath(); pctx.moveTo(ox, cy); pctx.lineTo(ox + ow, cy); pctx.moveTo(cx, oy); pctx.lineTo(cx, oy + oh); pctx.stroke();
      const mapX = th => cx + (th / thMax) * (ow / 2);
      const mapY = om => cy - (om / omMax) * (oh / 2);
      // Etalon egri chiziq: energiya saqlanishidan ω(θ)
      pctx.strokeStyle = 'rgba(56,189,248,0.6)'; pctx.setLineDash([4, 3]);
      pctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const th = th0 * Math.cos(a);
        const om2 = 2 * (G / L) * (Math.cos(th) - Math.cos(th0));
        const om = -Math.sign(Math.sin(a)) * Math.sqrt(Math.max(0, om2));
        i ? pctx.lineTo(mapX(th), mapY(om)) : pctx.moveTo(mapX(th), mapY(om));
      }
      pctx.closePath(); pctx.stroke(); pctx.setLineDash([]);
      // Sonli trayektoriya (so'nggi nuqtalar)
      pctx.save();
      pctx.beginPath(); pctx.rect(ox, oy, ow, oh); pctx.clip();
      pctx.strokeStyle = '#F43F5E'; pctx.lineWidth = 1.5;
      pctx.beginPath();
      let started = false;
      for (const p of history.slice(-600)) {
        if (!isFinite(p.num) || !isFinite(p.om)) break;
        const x = mapX(p.num), y = mapY(p.om);
        started ? pctx.lineTo(x, y) : (pctx.moveTo(x, y), started = true);
      }
      pctx.stroke();
      if (isFinite(sim.th)) {
        pctx.fillStyle = '#F43F5E';
        pctx.beginPath(); pctx.arc(mapX(sim.th), mapY(sim.om), 4, 0, Math.PI * 2); pctx.fill();
      }
      pctx.restore();
      pctx.fillStyle = '#94A3B8'; pctx.font = '10px ui-monospace, monospace';
      pctx.fillText('θ →', ox + ow - 26, cy - 4);
      pctx.fillText('ω ↑', cx + 4, oy + 12);
      pctx.fillText('Fazaviy portret', ox + 4, oy + oh + 12);
    }

    function drawGraph() {
      const W = eCanvas.clientWidth || 460, H = Math.round(W * 240 / 460);
      const { th0 } = P();
      ectx.fillStyle = '#090d16'; ectx.fillRect(0, 0, W, H);
      const padL = 34, padR = 8, topH = H * 0.58, gap = 18;
      const t0 = Math.max(0, simTime - T_WINDOW);
      const X = t => padL + ((t - t0) / T_WINDOW) * (W - padL - padR);

      // Yuqori panel: θ(t)
      const yMax = th0 * 1.5;
      const Y1 = th => 8 + topH / 2 - (th / yMax) * (topH / 2 - 4);
      ectx.strokeStyle = 'rgba(148,163,184,0.2)';
      ectx.strokeRect(padL, 8, W - padL - padR, topH);
      ectx.beginPath(); ectx.moveTo(padL, 8 + topH / 2); ectx.lineTo(W - padR, 8 + topH / 2); ectx.stroke();
      ectx.save();
      ectx.beginPath(); ectx.rect(padL, 8, W - padL - padR, topH); ectx.clip();
      [['ref', '#38BDF8', [5, 3]], ['num', '#F43F5E', []]].forEach(([k, color, dash]) => {
        ectx.strokeStyle = color; ectx.lineWidth = 1.8; ectx.setLineDash(dash);
        ectx.beginPath();
        history.forEach((p, i) => { const v = isFinite(p[k]) ? p[k] : 0; i ? ectx.lineTo(X(p.t), Y1(v)) : ectx.moveTo(X(p.t), Y1(v)); });
        ectx.stroke();
      });
      ectx.setLineDash([]);
      ectx.restore();

      // Pastki panel: |Δθ| (logarifmik)
      const by = 8 + topH + gap, bh = H - by - 18;
      const LOG_MIN = -10, LOG_MAX = 1;
      const Y2 = e => by + bh - ((Math.log10(Math.max(e, 1e-10)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * bh;
      ectx.strokeStyle = 'rgba(148,163,184,0.2)';
      ectx.strokeRect(padL, by, W - padL - padR, bh);
      ectx.strokeStyle = '#FBBF24'; ectx.lineWidth = 1.6;
      ectx.beginPath();
      history.forEach((p, i) => { const y = Y2(isFinite(p.err) ? p.err : 10); i ? ectx.lineTo(X(p.t), y) : ectx.moveTo(X(p.t), y); });
      ectx.stroke();

      ectx.font = '10px ui-monospace, monospace';
      ectx.fillStyle = '#38BDF8'; ectx.fillText('θ etalon', padL + 4, 20);
      ectx.fillStyle = '#F43F5E'; ectx.fillText('θ sonli', padL + 70, 20);
      ectx.fillStyle = '#FBBF24'; ectx.fillText('|Δθ| (log)', padL + 4, by + 12);
      ectx.fillStyle = '#94A3B8';
      ectx.fillText('1', 22, Y2(1) + 4);
      ectx.fillText('1e-5', 4, Y2(1e-5) + 4);
      ectx.fillText('1e-10', 2, Y2(1e-10));
      ectx.textAlign = 'right';
      ectx.fillText(`t = ${t0.toFixed(1)}…${(t0 + T_WINDOW).toFixed(1)} s`, W - padR, H - 4);
      ectx.textAlign = 'left';
    }

    // -------------------------------------------------------------------
    // 3. QIYOSIY XATOLIKLAR JADVALI (t = 5 s)
    // -------------------------------------------------------------------
    function buildTable() {
      if (!tableBody) return;
      const { th0, L } = P();
      const T = 5.0;
      const refTh = integrate('rk4', th0, L, REF_DT, T);
      const fmt = (v) => {
        if (!isFinite(v)) return '<span style="color:#F43F5E;">∞ (portlash)</span>';
        const e = Math.abs(v - refTh);
        const color = e < 1e-4 ? '#34D399' : e < 1e-2 ? '#FBBF24' : '#F43F5E';
        return `${v.toFixed(5)}<br><span style="color:${color}; font-size:0.8rem;">|Δθ| = ${e.toExponential(2)}</span>`;
      };
      tableBody.innerHTML = [0.2, 0.1, 0.05, 0.01].map(dt => `
        <tr>
          <td><strong>${dt} s</strong></td>
          <td>${refTh.toFixed(5)}</td>
          <td>${fmt(integrate('euler', th0, L, dt, T))}</td>
          <td>${fmt(integrate('cromer', th0, L, dt, T))}</td>
          <td>${fmt(integrate('rk4', th0, L, dt, T))}</td>
        </tr>`).join('');
    }

    function updateLabels() {
      const { dt, th0, L } = P();
      vDt.textContent = dt.toFixed(3) + ' s';
      vTh.textContent = `${th0.toFixed(2)} rad (${(th0 * 180 / Math.PI).toFixed(1)}°)`;
      vL.textContent = L.toFixed(2) + ' m';
    }

    [slDt, slTh, slL, selMethod].forEach(el => el.addEventListener('input', () => {
      updateLabels();
      reset();
      if (el !== slDt && el !== selMethod) buildTable();
    }));
    selMethod.addEventListener('change', () => { updateLabels(); reset(); });

    document.getElementById('lab4-btn-play').addEventListener('click', () => { running = true; });
    document.getElementById('lab4-btn-pause').addEventListener('click', () => { running = false; });
    document.getElementById('lab4-btn-reset').addEventListener('click', () => { running = false; reset(); });

    let last = performance.now();
    function loop(now) {
      const real = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (running) { advance(real); updateReadout(); }
      drawPendulum();
      drawGraph();
      requestAnimationFrame(loop);
    }

    window.triggerLab4CanvasRedraw = () => { resizeAll(); drawPendulum(); drawGraph(); };
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => window.triggerLab4CanvasRedraw()).observe(pCanvas.parentElement);
    } else {
      window.addEventListener('resize', window.triggerLab4CanvasRedraw);
    }

    updateLabels();
    reset();
    resizeAll();
    buildTable();
    requestAnimationFrame(loop);
  }

  // -------------------------------------------------------------------------
  // 4. RUBRIKA KALKULYATORI (O'zbekiston OTM 5 ballik shkalasi)
  // -------------------------------------------------------------------------
  function initRubric() {
    const selects = document.querySelectorAll('.rubric4-select');
    const totalEl = document.getElementById('rubric4-total-score');
    const gradeEl = document.getElementById('rubric4-grade-badge');
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
