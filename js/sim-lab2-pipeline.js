/**
 * 2-Laboratoriya: LLM yordamida fizik jarayonning matematik modelini tuzish.
 * 1. Diagnostik test → A/B/C kognitiv klaster va shaxsiylashtirilgan prompt.
 * 2. So'nuvchi prujinali tebranish dastgohi (tab4'dagi Eyler-Kromer
 *    blok-sxemasi bilan bir xil algoritm: avval v, keyin yangi v bilan x).
 * 3. Formulalar validatori: talaba kiritgan ω_d, β, T joriy slayder
 *    qiymatlaridan analitik hisoblangan qiymatlar bilan solishtiriladi
 *    (hisob brauzerda bajariladi; tashqi AI xizmatiga so'rov yuborilmaydi).
 * 4. 100 ballik rubrika kalkulyatori va promptlarni nusxalash tugmalari.
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
          toast('Prompt nusxalandi!');
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
  const DIAG_KEY = { diag_q1: 'c', diag_q2: 'b', diag_q3: 'a', diag_q4: 'c' };

  const CLUSTERS = {
    A: {
      title: 'Klaster "A" — Boshlang\'ich daraja',
      color: 'var(--accent-cyan)',
      object: 'PhET "Pendulum Lab" (matematik mayatnik) yoki erkin tushish',
      plan: "Nyutonning 2-qonuni va garmonik tebranish davri $T = 2\\pi\\sqrt{l/g}$ dan boshlang. Avval ishqalanishsiz holatda energiya saqlanishini kuzating, so'ngra oddiy va Eyler-Kromer algoritmlarini solishtiring.",
      focus: "matematik mayatnik, kichik burchak yaqinlashuvi, T = 2*pi*sqrt(l/g), Eyler va Eyler-Kromer usullarining farqi"
    },
    B: {
      title: 'Klaster "B" — Amaliyotchi daraja',
      color: 'var(--accent-emerald)',
      object: 'PhET "Masses and Springs" (so\'nuvchi prujinali tebranish)',
      plan: "So'nuvchi tebranish tenglamasi $m\\ddot{x} + b\\dot{x} + kx = 0$ ni tiklang, $\\beta = b/(2m)$ va $\\omega_d = \\sqrt{\\omega_0^2 - \\beta^2}$ ni o'lchov natijalari bilan tasdiqlang. 5-bo'limdagi dastgohda o'z qiymatlaringizni validatorda tekshiring.",
      focus: "so'nuvchi tebranish, beta = b/(2m), omega_d, amplitudaning eksponensial so'nishi, Eyler-Kromer algoritmi"
    },
    C: {
      title: 'Klaster "C" — Ilg\'or daraja',
      color: 'var(--accent-purple)',
      object: 'PhET "Charges and Fields" yoki Vascak.cz Lorens kuchi / mass-spektrometr animatsiyasi',
      plan: "Zaryadli zarrachaning $\\vec{F} = q\\vec{v} \\times \\vec{B}$ ta'siridagi harakatini tiklang, siklotron radiusi $r = mv/(qB)$ ni tekshiring va RK4 integratorini Eyler-Kromer bilan aniqlik bo'yicha solishtiring.",
      focus: "Lorens kuchi, siklotron chastotasi omega_c = qB/m, 2D/3D trayektoriya, RK4 va Eyler-Kromer aniqligini solishtirish"
    }
  };

  function initDiagnostic() {
    const btn = document.getElementById('diag-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const answers = Object.keys(DIAG_KEY).map(name => document.querySelector(`input[name="${name}"]:checked`));
      if (answers.some(a => !a)) {
        toast("Iltimos, barcha 4 ta savolga javob bering!");
        const box = document.getElementById('diag-result-box');
        box.style.display = 'block';
        document.getElementById('diag-cluster-val').textContent = "⚠️ Barcha 4 ta savolga javob bering";
        document.getElementById('diag-score-val').textContent = '';
        document.getElementById('diag-plan-desc').textContent = '';
        document.getElementById('diag-personalized-prompt').value = '';
        return;
      }
      const correct = Object.keys(DIAG_KEY).filter((name, i) => answers[i].value === DIAG_KEY[name]).length;
      const score = correct * 25;
      const key = score >= 75 ? 'C' : score >= 50 ? 'B' : 'A';
      const c = CLUSTERS[key];

      const box = document.getElementById('diag-result-box');
      box.style.display = 'block';
      box.style.borderColor = c.color;
      const titleEl = document.getElementById('diag-cluster-val');
      titleEl.textContent = c.title;
      titleEl.style.color = c.color;
      document.getElementById('diag-score-val').textContent = `${score} / 100 ball (${correct}/4 to'g'ri)`;

      const wrong = Object.keys(DIAG_KEY).map((name, i) => answers[i].value === DIAG_KEY[name] ? null : i + 1).filter(Boolean);
      const planEl = document.getElementById('diag-plan-desc');
      planEl.innerHTML = `<strong>Tavsiya etilgan ob'yekt:</strong> ${c.object}.<br><strong>Individual reja:</strong> ${c.plan}` +
        (wrong.length ? `<br><strong>Qayta ko'rib chiqing:</strong> ${wrong.join(', ')}-savol(lar) mavzusi. To'g'ri javoblar: 1-C, 2-B, 3-A, 4-C.` : '');
      renderMath(planEl);

      document.getElementById('diag-personalized-prompt').value =
`Siz fizika bo'yicha Sokratik ilmiy konsultantsiz. Men 2-laboratoriya diagnostik testidan ${score}/100 ball olib, "${key}" klasteriga kiritildim.
Mening o'rganish ob'yektim: ${c.object}.
Asosiy mavzular: ${c.focus}.
Iltimos:
1. Tayyor javob yoki formulani to'g'ridan-to'g'ri bermang.
2. Simulyatsiyani teskari muhandislik qilishim uchun bosqichma-bosqich 3 ta yo'naltiruvchi savol bering.
3. Men tiklagan formulani o'lchov birliklari va limit holatlar orqali o'zim tekshirishimga yordam bering.`;
    });
  }

  // -------------------------------------------------------------------------
  // 2. SO'NUVCHI TEBRANISH DASTGOHI (Eyler-Kromer)
  // -------------------------------------------------------------------------
  function initOscillator() {
    const canvas = document.getElementById('rev-eng-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const slM = document.getElementById('sim-mass');
    const slK = document.getElementById('sim-spring');
    const slB = document.getElementById('sim-damping');
    const valM = document.getElementById('val-sim-mass');
    const valK = document.getElementById('val-sim-spring');
    const valB = document.getElementById('val-sim-damping');
    const btnPlay = document.getElementById('sim-play-pause');
    const btnReset = document.getElementById('sim-reset');
    const tel = {
      t: document.getElementById('tel-time'), x: document.getElementById('tel-x'), v: document.getElementById('tel-v'),
      ek: document.getElementById('tel-ek'), ep: document.getElementById('tel-ep'), et: document.getElementById('tel-etot')
    };

    const X0 = 1.2, DT = 0.002, HISTORY = 8; // s
    let state, running = true, history = [];

    function params() {
      return { m: parseFloat(slM.value), k: parseFloat(slK.value), b: parseFloat(slB.value) };
    }

    function reset() {
      state = { x: X0, v: 0, t: 0 };
      history = [{ t: 0, x: X0, v: 0 }];
    }

    function step(dt) {
      const { m, k, b } = params();
      const a = -(k * state.x + b * state.v) / m;
      state.v += a * dt;          // 1) yangi tezlik
      state.x += state.v * dt;    // 2) yangi tezlik bilan koordinata (simplektik qadam)
      state.t += dt;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 850;
      const h = Math.round(w * 280 / 850);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawSpring(x1, x2, y, coils, amp) {
      ctx.beginPath();
      ctx.moveTo(x1, y);
      const lead = 10, len = x2 - x1 - 2 * lead;
      ctx.lineTo(x1 + lead, y);
      for (let i = 0; i <= coils * 2; i++) {
        ctx.lineTo(x1 + lead + (len * i) / (coils * 2), y + (i % 2 ? -amp : amp) * (i === 0 || i === coils * 2 ? 0 : 1));
      }
      ctx.lineTo(x2, y);
      ctx.stroke();
    }

    function draw() {
      const W = canvas.clientWidth || 850;
      const H = parseFloat(canvas.style.height) || 280;
      const { m, k, b } = params();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, W, H);

      // Chap panel: prujina-yuk tizimi
      const leftW = W * 0.42;
      const wallX = 16, floorY = H * 0.68, eqX = wallX + leftW * 0.5;
      const scale = (leftW * 0.36) / 1.5; // 1.5 m → panel kengligining 36%
      ctx.fillStyle = '#334155';
      ctx.fillRect(wallX - 8, floorY - 70, 8, 80);
      ctx.fillRect(wallX - 8, floorY + 10, leftW, 3);
      ctx.strokeStyle = 'rgba(148,163,184,0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(eqX, floorY - 70); ctx.lineTo(eqX, floorY + 12); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#94A3B8'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
      ctx.fillText('x = 0', eqX, floorY + 28);

      const box = 26 + 10 * Math.sqrt(m);
      const bx = eqX + state.x * scale;
      ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 2;
      drawSpring(wallX, bx - box / 2, floorY - box / 2 + 10, 10, 8 + k / 10);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(bx - box / 2, floorY + 10 - box, box, box);
      ctx.fillStyle = '#0b1120'; ctx.font = 'bold 12px ui-monospace, monospace';
      ctx.fillText(`${m.toFixed(1)} kg`, bx, floorY + 10 - box / 2 + 4);

      // Tezlik vektori
      if (Math.abs(state.v) > 0.01) {
        const vy = floorY - box - 4, vx2 = bx + state.v * scale * 0.25;
        ctx.strokeStyle = '#34D399'; ctx.fillStyle = '#34D399'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, vy); ctx.lineTo(vx2, vy); ctx.stroke();
        const d = Math.sign(state.v);
        ctx.beginPath(); ctx.moveTo(vx2, vy); ctx.lineTo(vx2 - 7 * d, vy - 4); ctx.lineTo(vx2 - 7 * d, vy + 4); ctx.fill();
      }

      // Parametrlar
      const beta = b / (2 * m), w0 = Math.sqrt(k / m);
      ctx.textAlign = 'left'; ctx.fillStyle = '#CBD5E1'; ctx.font = '11px ui-monospace, monospace';
      ctx.fillText(`ω₀ = √(k/m) = ${w0.toFixed(3)} rad/s`, 12, 18);
      ctx.fillText(`β = b/(2m) = ${beta.toFixed(3)} s⁻¹`, 12, 34);
      ctx.fillText(beta < w0 ? 'Rejim: so\'nuvchi tebranish (β < ω₀)' : beta === w0 ? 'Rejim: kritik so\'nish' : 'Rejim: aperiodik (β > ω₀)', 12, 50);

      // O'ng panel: x(t) va v(t) grafiklari
      const gx = leftW + 30, gw = W - gx - 14, gy = 14, gh = H - 40;
      ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);
      const midY = gy + gh / 2;
      ctx.beginPath(); ctx.moveTo(gx, midY); ctx.lineTo(gx + gw, midY); ctx.stroke();

      const t0 = Math.max(0, state.t - HISTORY);
      const vMax = Math.max(X0 * w0, 0.1);
      const px = t => gx + ((t - t0) / HISTORY) * gw;

      // Nazariy o'rovchi ±x0·e^(−βt)
      ctx.strokeStyle = 'rgba(251,191,36,0.35)'; ctx.setLineDash([4, 4]);
      [1, -1].forEach(sgn => {
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const t = t0 + (HISTORY * i) / 60;
          const y = midY - sgn * (X0 * Math.exp(-beta * t) / (X0 * 1.1)) * (gh / 2);
          i ? ctx.lineTo(px(t), y) : ctx.moveTo(px(t), y);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);

      [['x', '#FBBF24', X0 * 1.1], ['v', '#34D399', vMax * 1.1]].forEach(([key, color, maxAbs]) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        for (const p of history) {
          if (p.t < t0) continue;
          const y = midY - (p[key] / maxAbs) * (gh / 2);
          started ? ctx.lineTo(px(p.t), y) : (ctx.moveTo(px(p.t), y), started = true);
        }
        ctx.stroke();
      });
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillStyle = '#FBBF24'; ctx.fillText('x(t), m', gx + 8, gy + 14);
      ctx.fillStyle = '#34D399'; ctx.fillText('v(t), m/s', gx + 70, gy + 14);
      ctx.fillStyle = 'rgba(251,191,36,0.7)'; ctx.fillText('±x₀e^(−βt)', gx + 150, gy + 14);
      ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'right';
      ctx.fillText(`t = ${t0.toFixed(1)} … ${(t0 + HISTORY).toFixed(1)} s`, gx + gw - 6, gy + gh + 16);
      ctx.textAlign = 'left';

      // Telemetriya
      const ek = 0.5 * m * state.v * state.v, ep = 0.5 * k * state.x * state.x;
      const sign = v => (v >= 0 ? '+' : '') + v.toFixed(3);
      tel.t.textContent = state.t.toFixed(2) + ' s';
      tel.x.textContent = sign(state.x) + ' m';
      tel.v.textContent = sign(state.v) + ' m/s';
      tel.ek.textContent = ek.toFixed(3) + ' J';
      tel.ep.textContent = ep.toFixed(3) + ' J';
      tel.et.textContent = (ek + ep).toFixed(3) + ' J';
    }

    let last = performance.now();
    function loop(now) {
      const frame = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (running) {
        const n = Math.round(frame / DT);
        for (let i = 0; i < n; i++) step(DT);
        history.push({ t: state.t, x: state.x, v: state.v });
        while (history.length && history[0].t < state.t - HISTORY - 0.5) history.shift();
      }
      draw();
      requestAnimationFrame(loop);
    }

    function updateLabels() {
      valM.textContent = parseFloat(slM.value).toFixed(1) + ' kg';
      valK.textContent = parseFloat(slK.value).toFixed(1) + ' N/m';
      valB.textContent = parseFloat(slB.value).toFixed(2) + ' kg/s';
    }

    [slM, slK, slB].forEach(sl => sl.addEventListener('input', () => { updateLabels(); reset(); }));
    btnPlay.addEventListener('click', () => {
      running = !running;
      btnPlay.textContent = running ? "⏸️ To'xtatish" : '▶️ Davom Etish';
    });
    btnReset.addEventListener('click', reset);

    window.triggerLab2CanvasRedraw = () => { resize(); draw(); };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => { resize(); draw(); }).observe(canvas.parentElement);
    else window.addEventListener('resize', () => { resize(); draw(); });

    updateLabels();
    reset();
    resize();
    requestAnimationFrame(loop);
  }

  // -------------------------------------------------------------------------
  // 3. FORMULALAR VALIDATORI
  // -------------------------------------------------------------------------
  function initValidator() {
    const btn = document.getElementById('btn-claude-verify');
    if (!btn) return;
    const out = document.getElementById('claude-verify-feedback');

    btn.addEventListener('click', () => {
      const m = parseFloat(document.getElementById('sim-mass').value);
      const k = parseFloat(document.getElementById('sim-spring').value);
      const b = parseFloat(document.getElementById('sim-damping').value);
      const sw = parseFloat(document.getElementById('input-student-omega').value);
      const sb = parseFloat(document.getElementById('input-student-beta').value);
      const sT = parseFloat(document.getElementById('input-student-period').value);

      const w0 = Math.sqrt(k / m), beta = b / (2 * m);
      const underdamped = beta < w0;
      const wd = underdamped ? Math.sqrt(w0 * w0 - beta * beta) : NaN;
      const T = underdamped ? (2 * Math.PI) / wd : NaN;

      if ([sw, sb, sT].some(v => isNaN(v))) {
        out.innerHTML = box('#F59E0B', "⚠️ Iltimos, uchala qiymatni ham kiriting: $\\omega_d$, $\\beta$ va $T$.");
        renderMath(out);
        return;
      }

      const err = (s, t) => Math.abs(s - t) / Math.abs(t) * 100;
      const TOL = 2; // %
      const rows = [];
      const hints = [];

      // β
      const eb = err(sb, beta);
      rows.push(row('β', sb, beta, 's⁻¹', eb, TOL));
      if (eb > TOL) {
        if (Math.abs(sb - b / m) / (b / m || 1) * 100 < TOL) hints.push("β uchun $b/m$ ni topdingiz. Tenglamani $\\ddot{x} + 2\\beta\\dot{x} + \\omega_0^2 x = 0$ ko'rinishiga keltiring: $\\dot{x}$ oldidagi koeffitsiyent $b/m$ ga teng bo'lsa, $\\beta$ nimaga teng bo'ladi?");
        else hints.push("$\\beta$ ning o'lchov birligi s⁻¹. $b$ (kg/s) va $m$ (kg) dan qanday kombinatsiya s⁻¹ beradi? Ko'paytuvchi 2 qayerdan kelishini o'ylab ko'ring.");
      }

      if (!underdamped) {
        out.innerHTML = box('#F59E0B',
          `Joriy parametrlarda $\\beta = ${beta.toFixed(3)} \\ge \\omega_0 = ${w0.toFixed(3)}$ — tizim tebranmaydi (kritik yoki aperiodik so'nish), shuning uchun $\\omega_d$ va $T$ mavjud emas. ` +
          `Nega $\\omega_0^2 - \\beta^2 < 0$ bo'lganda ildiz haqiqiy son bo'lmasligini tushuntirib bering va $b$ ni kamaytirib qayta urinib ko'ring.`);
        renderMath(out);
        return;
      }

      // ω_d
      const ew = err(sw, wd);
      rows.push(row('ω_d', sw, wd, 'rad/s', ew, TOL));
      if (ew > TOL) {
        if (err(sw, w0) < 0.5 && err(w0, wd) > 0.5) hints.push("Siz $\\omega_0 = \\sqrt{k/m}$ ni kiritdingiz. So'nish tebranish chastotasiga qanday ta'sir qiladi? $b \\to 0$ limitida sizning formulangiz nimaga aylanishi kerak?");
        else hints.push("$\\omega_d$ ni $\\omega_0$ va $\\beta$ orqali ifodalang. $b$ ortganda tebranish tezlashadimi yoki sekinlashadimi — dastgohda tekshiring.");
      }

      // T
      const eT = err(sT, T);
      rows.push(row('T', sT, T, 's', eT, TOL));
      if (eT > TOL) {
        if (Math.abs(sT - 1 / wd) / (1 / wd) * 100 < TOL) hints.push("$T = 1/\\omega_d$ deb oldingiz. Siklik chastota (rad/s) va davr (s) orasidagi bog'liqlikda $2\\pi$ qayerdan keladi?");
        else hints.push("Grafikda ketma-ket ikki maksimum orasidagi vaqtni o'lchang va uni $2\\pi/\\omega_d$ bilan solishtiring.");
      }

      const allOk = rows.every(r => r.ok);
      out.innerHTML = box(allOk ? '#34D399' : '#F87171',
        `<strong>${allOk ? "✅ Barcha formulalar tasdiqlandi!" : "🔍 Ba'zi qiymatlarni qayta ko'rib chiqing"}</strong>
         <span style="font-size:0.8rem; color: var(--text-muted);"> (m = ${m} kg, k = ${k} N/m, b = ${b} kg/s; ruxsat etilgan xatolik ${TOL}%)</span>
         <table style="width:100%; margin: 10px 0; border-collapse: collapse; font-family: var(--font-mono); font-size: 0.85rem;">
           <tr style="color: var(--text-muted);"><td>Kattalik</td><td>Sizniki</td><td>Nazariy</td><td>Xatolik ε</td><td></td></tr>
           ${rows.map(r => r.html).join('')}
         </table>
         ${allOk
          ? "Sokratik savol: agar massani 4 marta oshirsangiz, $\\beta$ va $\\omega_0$ qanday o'zgaradi? Avval bashorat qiling, so'ng slayder bilan tekshiring."
          : '<strong>Yo\'naltiruvchi savollar:</strong><ul style="margin: 6px 0 0 18px;">' + hints.map(h => `<li>${h}</li>`).join('') + '</ul>'}
         <div style="margin-top: 10px; font-size: 0.78rem; color: var(--text-muted);">Eslatma: tekshiruv brauzerda analitik formulalar asosida bajariladi. Chuqurroq muhokama uchun 3-bo'limdagi promptni Claude'ga yuboring.</div>`);
      renderMath(out);
    });

    function row(name, s, t, unit, e, tol) {
      const ok = e <= tol;
      return {
        ok,
        html: `<tr><td>${name}</td><td>${s.toFixed(3)} ${unit}</td><td>${t.toFixed(3)} ${unit}</td><td>${e.toFixed(2)}%</td><td>${ok ? '✅' : '❌'}</td></tr>`
      };
    }

    function box(color, html) {
      return `<div style="margin-top: 16px; padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid ${color}; background: rgba(15,23,42,0.6); color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">${html}</div>`;
    }
  }

  // -------------------------------------------------------------------------
  // 4. RUBRIKA KALKULYATORI (O'zbekiston OTM 5 ballik shkalasi)
  // -------------------------------------------------------------------------
  function initRubric() {
    const selects = document.querySelectorAll('.rubric-select');
    const totalEl = document.getElementById('rubric-total-score');
    const gradeEl = document.getElementById('rubric-grade-badge');
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
    initOscillator();
    initValidator();
    initRubric();
  });
})();
