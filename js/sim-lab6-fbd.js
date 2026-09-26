/**
 * 6-Laboratoriya: qiya tekislikdagi jismning erkin jism diagrammasi (FBD).
 * 1. Diagnostik test → A/B/C klaster, individual reja va shaxsiy prompt.
 * 2. Interaktiv dastgoh: qiya tekislik, stick-slip mantiqi va Eyler-Kromer
 *    qadami (4-bo'limdagi psevdokod bilan bir xil; soddalik uchun μs = μk = μ).
 *    Chap oynada jism va kuch vektorlari, o'ng oynada izolyatsiya qilingan
 *    FBD burilgan (X', Y') o'qlarda.
 * 3. 100 ballik rubrika kalkulyatori va promptlarni nusxalash.
 */

(function () {
  const G = 9.81;
  const RAMP_LEN = 3.0; // m

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
  const DIAG_KEY = { diag6_q1: 'b', diag6_q2: 'a', diag6_q3: 'c', diag6_q4: 'b' };

  const CLUSTERS = {
    A: {
      title: 'Klaster "A" — Boshlang\'ich daraja',
      plan: "Avval 2-bo'limdagi FBD qoidalarini o'rganing va qog'ozda gorizontal sirtdagi, so'ng qiya tekislikdagi jism uchun FBD chizing. 5-bo'limdagi dastgohda ishqalanishni nolga tushirib, faqat $m\\vec{g}$ va $\\vec{N}$ qolganda tezlanish $g\\sin\\alpha$ ga teng ekanini tekshiring.",
      focus: "FBD qoidalari, og'irlik va normal reaksiya kuchlari, qiya tekislikda og'irlik kuchining proyeksiyalari"
    },
    B: {
      title: 'Klaster "B" — Amaliyotchi daraja',
      plan: "Midjourney yoki DALL-E'da FBD yarating, uni 2-bo'limdagi qoidalar bo'yicha tekshirib xatolarini belgilang, so'ng Claude'ga 1-promptni yuboring. Dastgohda $\\tan\\alpha = \\mu$ chegarasini topib, stick va slip holatlarini tenglamalar bilan solishtiring.",
      focus: "Kulon-Amonton ishqalanishi, stick-slip sharti, AI yaratgan diagrammadagi xatolarni aniqlash"
    },
    C: {
      title: 'Klaster "C" — Ilg\'or daraja',
      plan: "Tizimga burchak ostida tortuvchi tashqi kuch qo'shilgan holat uchun FBD va tenglamalarni tuzing ($N$ o'zgarishiga e'tibor bering). 4-bo'limdagi psevdokod asosida kod yozdirib, uni analitik yechim $x(t) = \\tfrac{1}{2} a t^2$ bilan test qiling va $\\mu_s \\neq \\mu_k$ holatiga kengaytiring.",
      focus: "tashqi kuch qo'shilgan FBD, μs va μk farqi, psevdokoddan kodga o'tish va analitik test"
    }
  };

  function initDiagnostic() {
    const btn = document.getElementById('diag6-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const box = document.getElementById('diag6-result-box');
      const scoreEl = document.getElementById('diag6-score-val');
      const clusterEl = document.getElementById('diag6-cluster-val');
      const planEl = document.getElementById('diag6-plan-desc');
      const promptEl = document.getElementById('diag6-personalized-prompt');

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
        (wrong.length ? `<br><strong>Qayta ko'rib chiqing:</strong> ${wrong.join(', ')}-savol(lar). To'g'ri javoblar: 1-B, 2-A, 3-C, 4-B.` : '');
      renderMath(planEl);

      promptEl.value =
`Siz fizika bo'yicha Sokratik konsultantsiz. Men 6-laboratoriya diagnostik testidan ${score}/100 ball olib, "${key}" klasteriga kiritildim.
Asosiy mavzular: ${c.focus}.
Masala: massasi m bo'lgan jism alpha burchakli qiya tekislikda, ishqalanish koeffitsiyenti mu.
Iltimos:
1. FBD'ni men o'zim chizishim uchun tayyor javob bermasdan yo'naltiruvchi savollar bering.
2. Men yuklagan diagrammadagi xatolarni topishimga yordam bering, lekin to'g'ri variantni darhol aytmang.
3. Mening darajamga mos bitta qo'shimcha masala taklif qiling.`;
    });
  }

  // -------------------------------------------------------------------------
  // 2. INTERAKTIV FBD DASTGOHI
  // -------------------------------------------------------------------------
  function initLab() {
    const incCanvas = document.getElementById('lab6-incline-canvas');
    const fbdCanvas = document.getElementById('lab6-fbd-canvas');
    if (!incCanvas || !fbdCanvas) return;
    const ictx = incCanvas.getContext('2d');
    const fctx = fbdCanvas.getContext('2d');

    const slAngle = document.getElementById('lab6-angle-slider');
    const slMu = document.getElementById('lab6-mu-slider');
    const slMass = document.getElementById('lab6-mass-slider');
    const vAngle = document.getElementById('lab6-angle-val');
    const vMu = document.getElementById('lab6-mu-val');
    const vMass = document.getElementById('lab6-mass-val');
    const btnPlay = document.getElementById('lab6-play-btn');
    const btnPause = document.getElementById('lab6-pause-btn');
    const btnReset = document.getElementById('lab6-reset-btn');
    const chkComp = document.getElementById('lab6-show-comp-check');
    const hud = id => document.getElementById('hud-lab6-' + id);

    let running = false;
    let x = 0, v = 0, t = 0;

    const P = () => ({
      alpha: parseFloat(slAngle.value) * Math.PI / 180,
      mu: parseFloat(slMu.value),
      m: parseFloat(slMass.value)
    });

    // 4-bo'limdagi psevdokod bilan bir xil kuchlar hisobi
    function forces() {
      const { alpha, mu, m } = P();
      const Fg = m * G;
      const N = Fg * Math.cos(alpha);
      const Fpar = Fg * Math.sin(alpha);
      const FsMax = mu * N;
      const atBottom = x >= RAMP_LEN - 1e-9;
      let Ffr, a, state;
      if (atBottom) {
        // Qiya oxirida jism to'xtatilgan: kuchlar muvozanatda deb ko'rsatiladi
        Ffr = Fpar; a = 0; state = 'bottom';
      } else if (Math.abs(v) < 1e-9 && Fpar <= FsMax + 1e-12) {
        Ffr = Fpar; a = 0; state = 'stick';
      } else {
        const dir = v !== 0 ? Math.sign(v) : 1;
        Ffr = mu * N * dir;
        a = (Fpar - Ffr) / m;
        state = 'slip';
      }
      return { Fg, N, Fpar, Fperp: N, FsMax, Ffr, Fnet: Fpar - Ffr, a, state };
    }

    function step(dt) {
      const f = forces();
      if (f.state !== 'slip') return;
      v += f.a * dt;          // Eyler-Kromer: avval tezlik,
      x += v * dt;            // so'ng yangi tezlik bilan koordinata
      t += dt;
      if (x >= RAMP_LEN) { x = RAMP_LEN; v = 0; running = false; syncButtons(); }
    }

    function reset() {
      x = 0; v = 0; t = 0;
      running = false;
      syncButtons();
      updateHud();
      draw();
    }

    function syncButtons() {
      btnPlay.disabled = running;
      btnPause.disabled = !running;
    }

    function updateHud() {
      const f = forces();
      const { alpha, mu } = P();
      hud('fg').textContent = f.Fg.toFixed(1) + ' N';
      hud('n').textContent = f.N.toFixed(1) + ' N';
      hud('fpar').textContent = f.Fpar.toFixed(1) + ' N';
      hud('ffr').textContent = Math.abs(f.Ffr).toFixed(2) + ' N';
      hud('fnet').textContent = f.Fnet.toFixed(2) + ' N';
      // Hali boshlanmagan bo'lsa, sirpanish sharti bajarilganda kutilayotgan tezlanishni ko'rsatamiz
      const willSlip = Math.tan(alpha) > mu;
      const aShow = f.state === 'slip' ? f.a : (f.state === 'stick' && willSlip ? G * (Math.sin(alpha) - mu * Math.cos(alpha)) : 0);
      hud('acc').textContent = aShow.toFixed(2) + ' m/s²';
      hud('vel').textContent = v.toFixed(2) + ' m/s';
      const st = hud('status');
      if (f.state === 'bottom') { st.textContent = `Qiya pastiga yetdi (t = ${t.toFixed(2)} s)`; st.style.color = '#38bdf8'; }
      else if (!willSlip) { st.textContent = `Tinch: tan α = ${Math.tan(alpha).toFixed(2)} ≤ μ (statik ishqalanish)`; st.style.color = '#fbbf24'; }
      else if (running || v > 0) { st.textContent = 'Sirpanmoqda (kinetik ishqalanish)'; st.style.color = '#10b981'; }
      else { st.textContent = `Sirpanishga tayyor: tan α = ${Math.tan(alpha).toFixed(2)} > μ`; st.style.color = '#10b981'; }
    }

    function resize(c) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth || 460, h = Math.round(w * 320 / 460);
      c.width = w * dpr; c.height = h * dpr;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function arrow(ctx, x1, y1, x2, y2, color, label, dashed) {
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len < 2) return;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = dashed ? 1.6 : 2.6;
      ctx.setLineDash(dashed ? [5, 4] : []);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      const ang = Math.atan2(y2 - y1, x2 - x1), h = dashed ? 7 : 10;
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - h * Math.cos(ang - 0.4), y2 - h * Math.sin(ang - 0.4));
      ctx.lineTo(x2 - h * Math.cos(ang + 0.4), y2 - h * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
      if (label) {
        ctx.font = (dashed ? '11px' : 'bold 12px') + ' ui-monospace, monospace';
        ctx.fillText(label, x2 + 6 * Math.cos(ang) + 4, y2 + 6 * Math.sin(ang) + 4);
      }
    }

    function drawIncline() {
      const W = incCanvas.clientWidth || 460, H = Math.round(W * 320 / 460);
      const { alpha } = P();
      const f = forces();
      ictx.fillStyle = '#0b1120'; ictx.fillRect(0, 0, W, H);

      // Qiya tekislik uchburchagi: pastki o'ng burchak asos
      const baseY = H - 30, rightX = W - 24;
      const maxLenPx = Math.min((W - 60) / Math.max(Math.cos(alpha), 0.3), (H - 70) / Math.max(Math.sin(alpha), 0.01), W * 1.2);
      const Lpx = Math.min(maxLenPx, W - 48);
      const topX = rightX - Lpx * Math.cos(alpha), topY = baseY - Lpx * Math.sin(alpha);
      ictx.fillStyle = '#1e293b'; ictx.strokeStyle = '#475569';
      ictx.beginPath(); ictx.moveTo(topX, topY); ictx.lineTo(rightX, baseY); ictx.lineTo(topX, baseY); ictx.closePath();
      ictx.fill(); ictx.stroke();
      // burchak yoyi
      ictx.strokeStyle = '#fbbf24'; ictx.beginPath();
      ictx.arc(rightX, baseY, 34, Math.PI, Math.PI + alpha); ictx.stroke();
      ictx.fillStyle = '#fbbf24'; ictx.font = '12px ui-monospace, monospace';
      ictx.fillText(`α = ${slAngle.value}°`, rightX - 92, baseY - 8);

      // Jism: qiya bo'ylab (tepadan pastga) x/RAMP_LEN ulushda
      const ux = Math.cos(alpha), uy = Math.sin(alpha); // pastga-o'ngga birlik vektor (ekranda y pastga)
      const nx = Math.sin(alpha), ny = -Math.cos(alpha); // sirtga tik, yuqoriga
      const s = 0.12 + 0.76 * (x / RAMP_LEN);
      const bw = 34, bh = 22;
      const cx = topX + ux * Lpx * s + nx * bh / 2, cy = topY + uy * Lpx * s + ny * bh / 2;
      ictx.save(); ictx.translate(cx, cy); ictx.rotate(alpha);
      ictx.fillStyle = '#38bdf8'; ictx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ictx.fillStyle = '#0b1120'; ictx.font = 'bold 10px ui-monospace, monospace';
      ictx.fillText(`${slMass.value}kg`, -14, 4);
      ictx.restore();

      // Kuch vektorlari (masshtab: eng katta kuch ≈ 70 px)
      const k = 70 / Math.max(f.Fg, 1e-6);
      arrow(ictx, cx, cy, cx, cy + f.Fg * k, '#f43f5e', 'mg');
      arrow(ictx, cx, cy, cx + nx * f.N * k, cy + ny * f.N * k, '#38bdf8', 'N');
      if (Math.abs(f.Ffr) > 1e-6) arrow(ictx, cx, cy, cx - ux * f.Ffr * k, cy - uy * f.Ffr * k, '#eab308', 'F_fr');
      if (chkComp.checked) {
        arrow(ictx, cx, cy, cx + ux * f.Fpar * k, cy + uy * f.Fpar * k, '#a855f7', 'mg sinα', true);
        arrow(ictx, cx, cy, cx - nx * f.Fperp * k, cy - ny * f.Fperp * k, '#a855f7', 'mg cosα', true);
      }
      ictx.fillStyle = '#94A3B8'; ictx.font = '11px ui-monospace, monospace';
      ictx.fillText(`x = ${x.toFixed(2)} m   t = ${t.toFixed(2)} s`, 10, 18);
    }

    function drawFBD() {
      const W = fbdCanvas.clientWidth || 460, H = Math.round(W * 320 / 460);
      const { alpha } = P();
      const f = forces();
      fctx.fillStyle = '#0b1120'; fctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;

      // Burilgan o'qlar: X' qiya bo'ylab pastga, Y' sirtga tik yuqoriga
      const ux = Math.cos(alpha), uy = Math.sin(alpha);
      const nx = Math.sin(alpha), ny = -Math.cos(alpha);
      const A = Math.min(W, H) * 0.44;
      fctx.strokeStyle = 'rgba(148,163,184,0.35)'; fctx.setLineDash([4, 4]); fctx.lineWidth = 1;
      fctx.beginPath(); fctx.moveTo(cx - ux * A, cy - uy * A); fctx.lineTo(cx + ux * A, cy + uy * A); fctx.stroke();
      fctx.beginPath(); fctx.moveTo(cx - nx * A, cy - ny * A); fctx.lineTo(cx + nx * A, cy + ny * A); fctx.stroke();
      fctx.setLineDash([]);
      fctx.fillStyle = '#94A3B8'; fctx.font = '12px ui-monospace, monospace';
      fctx.fillText("X'", cx + ux * A + 4, cy + uy * A);
      fctx.fillText("Y'", cx + nx * A + 4, cy + ny * A);

      // Nuqtaviy jism
      fctx.fillStyle = '#e2e8f0'; fctx.beginPath(); fctx.arc(cx, cy, 6, 0, Math.PI * 2); fctx.fill();

      const k = (Math.min(W, H) * 0.38) / Math.max(f.Fg, 1e-6);
      arrow(fctx, cx, cy, cx, cy + f.Fg * k, '#f43f5e', `mg = ${f.Fg.toFixed(1)} N`);
      arrow(fctx, cx, cy, cx + nx * f.N * k, cy + ny * f.N * k, '#38bdf8', `N = ${f.N.toFixed(1)} N`);
      if (Math.abs(f.Ffr) > 1e-6) arrow(fctx, cx, cy, cx - ux * f.Ffr * k, cy - uy * f.Ffr * k, '#eab308', `F_fr = ${Math.abs(f.Ffr).toFixed(1)} N`);
      if (chkComp.checked) {
        arrow(fctx, cx, cy, cx + ux * f.Fpar * k, cy + uy * f.Fpar * k, '#a855f7', 'mg sinα', true);
        arrow(fctx, cx, cy, cx - nx * f.Fperp * k, cy - ny * f.Fperp * k, '#a855f7', 'mg cosα', true);
      }
      // mg va −Y' orasidagi α burchagi
      if (alpha > 0.01) {
        fctx.strokeStyle = '#fbbf24'; fctx.lineWidth = 1.5;
        fctx.beginPath(); fctx.arc(cx, cy, 30, Math.PI / 2, Math.PI / 2 + alpha, false); fctx.stroke();
        fctx.fillStyle = '#fbbf24'; fctx.fillText('α', cx - 40 * Math.sin(alpha / 2) - 4, cy + 40 * Math.cos(alpha / 2) + 4);
      }

      fctx.fillStyle = '#94A3B8'; fctx.font = '11px ui-monospace, monospace';
      fctx.fillText(`ΣF_y' = N − mg cosα = ${(f.N - f.Fperp).toFixed(2)} N`, 10, H - 26);
      fctx.fillText(`ΣF_x' = mg sinα − F_fr = ${f.Fnet.toFixed(2)} N`, 10, H - 10);
    }

    function draw() { drawIncline(); drawFBD(); }

    function updateLabels() {
      vAngle.textContent = slAngle.value + '°';
      vMu.textContent = parseFloat(slMu.value).toFixed(2);
      vMass.textContent = parseFloat(slMass.value).toFixed(1) + ' kg';
    }

    [slAngle, slMu, slMass].forEach(sl => sl.addEventListener('input', () => { updateLabels(); reset(); }));
    chkComp.addEventListener('change', draw);
    btnPlay.addEventListener('click', () => { if (x >= RAMP_LEN) reset(); running = true; syncButtons(); });
    btnPause.addEventListener('click', () => { running = false; syncButtons(); updateHud(); });
    btnReset.addEventListener('click', reset);

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (running) {
        const sub = 8;
        for (let i = 0; i < sub && running; i++) step(dt / sub);
        updateHud();
      }
      draw();
      requestAnimationFrame(loop);
    }

    window.triggerLab6CanvasRedraw = () => { resize(incCanvas); resize(fbdCanvas); draw(); };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => window.triggerLab6CanvasRedraw()).observe(incCanvas.parentElement);
    else window.addEventListener('resize', window.triggerLab6CanvasRedraw);

    updateLabels();
    resize(incCanvas); resize(fbdCanvas);
    reset();
    requestAnimationFrame(loop);
  }

  // -------------------------------------------------------------------------
  // 3. RUBRIKA KALKULYATORI (O'zbekiston OTM 5 ballik shkalasi)
  // -------------------------------------------------------------------------
  function initRubric() {
    const ids = ['rubric6_c1', 'rubric6_c2', 'rubric6_c3', 'rubric6_c4', 'rubric6_c5'];
    const selects = ids.map(id => document.getElementById(id));
    const btn = document.getElementById('lab6-calc-rubric-btn');
    const totalEl = document.getElementById('lab6-total-score');
    const gradeEl = document.getElementById('lab6-grade-badge');
    const fbEl = document.getElementById('lab6-rubric-feedback');
    if (selects.some(s => !s) || !totalEl) return;

    function update() {
      const total = selects.reduce((a, s) => a + (parseInt(s.value, 10) || 0), 0);
      totalEl.textContent = `${total} / 100`;
      let g;
      if (total >= 86) g = { text: "A'LO (5)", cls: 'badge-emerald', fb: "Barcha mezonlar yuqori darajada bajarilgan." };
      else if (total >= 71) g = { text: 'YAXSHI (4)', cls: 'badge-cyan', fb: "Yaxshi natija. Eng past ball olgan mezonni qayta ko'rib chiqing." };
      else if (total >= 55) g = { text: 'QONIQARLI (3)', cls: 'badge-amber', fb: "FBD qoidalari va AI yaratgan diagrammadagi xatolarni tahlil qilishni kuchaytiring." };
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
