/**
 * SIM-LAB1-PIPELINE.JS - 1-Laboratoriya: AI Vizual Loyiha
 * Tab7'dagi 4 ta interaktiv blokni ishga tushiradi:
 * 1) Mavzuga qarab 5 ta AI prompt generatori (MagicSchool/Gemini/Midjourney/Runway/Claude)
 * 2) Deterministik Canvas vs "generativ AI video drift" qiyosiy simulyatori
 * 3) Capstone rubrika kalkulyatori
 * 4) Diagnostik test (3 savol)
 */

(function () {
  // -------------------------------------------------------------------------
  // 1. AI PIPELINE & PROMPT STUDIO
  // -------------------------------------------------------------------------
  const TOPICS = {
    'free-fall': {
      title: "Vakuumda va Muhitda Jismning Erkin Tushishi",
      math: "$$y(t) = v_0 t + \\frac{1}{2}g t^2, \\quad v(t) = v_0 + g t, \\quad F_{\\text{qarshilik}} = -k v$$",
      name: "jismning erkin tushishi (vakuum va havo qarshiligida)",
      formula: "y = v0*t + 0.5*g*t^2, F_drag = -k*v yoki -0.5*rho*Cd*A*v^2",
      params: "boshlang'ich tezlik v0, gravitatsiya g, qarshilik koeffitsienti k"
    },
    'pendulum': {
      title: "Matematik Mayatnikning Garmonik Tebranishlari",
      math: "$$T = 2\\pi\\sqrt{\\frac{l}{g}}, \\quad \\theta''(t) + \\frac{g}{l}\\sin\\theta + \\gamma\\theta' = 0$$",
      name: "matematik mayatnikning tebranishlari",
      formula: "theta'' = -(g/l)*sin(theta) - gamma*theta'",
      params: "ip uzunligi l, boshlang'ich burchak theta0, so'nish koeffitsienti gamma"
    },
    'refraction': {
      title: "Yorug'likning Sinishi va Snellius Qonuni",
      math: "$$n_1 \\sin\\alpha = n_2 \\sin\\beta, \\quad \\alpha_{\\text{crit}} = \\arcsin(n_2/n_1)$$",
      name: "yorug'likning ikki muhit chegarasida sinishi",
      formula: "n1*sin(alpha) = n2*sin(beta), to'la ichki qaytish: alpha >= asin(n2/n1)",
      params: "sindirish ko'rsatkichlari n1 va n2, tushish burchagi alpha"
    },
    'circular-motion': {
      title: "Tekis Aylanma Harakat va Markazga Intilma Kuch",
      math: "$$F = m\\omega^2 R = \\frac{mv^2}{R}, \\quad \\omega = \\frac{2\\pi}{T}$$",
      name: "tekis aylanma harakatdagi markazga intilma kuch",
      formula: "F = m*omega^2*R, a_c = omega^2*R = v^2/R",
      params: "radius R, burchak tezlik omega, massa m"
    }
  };

  function renderMath(el) {
    if (window.renderMathInElement && el) {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ]
      });
    }
  }

  function buildPrompts(topic) {
    const t = TOPICS[topic];
    return {
      magicschool: `Sen ta'limiy diagnostika sun'iy intellektisan (MagicSchool AI uslubida).
Vazifa: "${t.name}" mavzusi bo'yicha talabaning boshlang'ich matematik va dasturlash tayyorgarligini aniqlaydigan 5 ta savoldan iborat qisqa diagnostik so'rovnoma tuz.
Natijada talabani 3 ta klasterdan biriga ajrat: Bazaviy, Standart yoki Ilg'or (Vygotskiy ZPD modeli asosida) va har biriga mos individual o'quv trayektoriyasini taklif qil.`,
      gemini: `Sen Oliy ta'lim fizika professori va pedagogik dizaynersiz.
Mavzu: ${t.title}
Vazifa: Ushbu mavzuni 1-kurs talabalariga raqamli simulyatsiya orqali tushuntirish uchun 30 soniyalik ssenariy (Storyboard) va JSON formatidagi parametrlar xaritasini tuzib bering.
Talablar:
1. Ssenariy 4 ta sahnadan iborat bo'lsin: Muammo, Nazariya, Dinamik tahlil, Xulosa.
2. Formula: ${t.formula}
3. Boshqariladigan parametrlar (${t.params}) uchun slayder chegaralarini (min, max, default) JSON formatida bering.`,
      midjourney: `/imagine prompt: high precision physics laboratory experiment demonstrating ${t.name}, transparent scientific apparatus with glowing vector indicators, dark modern laboratory background, volumetric lighting, photorealistic 8k, raytracing reflections, digital HUD data overlay --ar 16:9 --v 6.0 --style raw`,
      runway: `Fizik jarayon: ${t.title}.
Motion Brush: harakatlanadigan asosiy jismni bo'yang va unga fizik jihatdan to'g'ri vektor tezlik yo'nalishini bering.
Camera Control: sekin zoom-in va parametrlarning eng nozik daqiqasida slow-motion 60fps qo'llang.
Eslatma: bu bosqich faqat vizual prototip uchun — yakuniy aniqlik Claude 3.5 Sonnet kod bosqichida ta'minlanadi.`,
      claude: `Siz tajribali Computational Physics (Hisoblash fizikasi) dasturchisisiz.
Vazifa: "${t.title}" mavzusi bo'yicha sof JavaScript va HTML5 Canvas orqali interaktiv simulyatsiya yozing.
Differensial tenglama: ${t.formula}
Boshqariladigan parametrlar: ${t.params}
Qoidalar:
1. Hech qanday tashqi kutubxonalarsiz (Pure Vanilla JS & Canvas 2D Context).
2. Sonli integrallash usuli: Euler-Cromer yoki RK4. Energiyaning saqlanish qonuni kafolatlansin.
3. Interfeys: Dark theme, slayderlar (Range inputs), Reset/Play tugmalari va real vaqtli telemetriya grafigi bo'lsin.`
    };
  }

  function initPromptStudio() {
    const select = document.getElementById('lab1-topic-select');
    const titleEl = document.getElementById('prompt-studio-title');
    const mathEl = document.getElementById('prompt-studio-math');
    const fields = {
      magicschool: document.getElementById('prompt-magicschool'),
      gemini: document.getElementById('prompt-gemini'),
      midjourney: document.getElementById('prompt-midjourney'),
      runway: document.getElementById('prompt-runway'),
      claude: document.getElementById('prompt-claude')
    };
    if (!select) return;

    function update() {
      const topic = select.value;
      const t = TOPICS[topic];
      if (!t) return;
      if (titleEl) titleEl.textContent = t.title;
      if (mathEl) {
        mathEl.textContent = t.math;
        renderMath(mathEl);
      }
      const prompts = buildPrompts(topic);
      Object.keys(fields).forEach(key => {
        if (fields[key]) fields[key].value = prompts[key];
      });
    }

    select.addEventListener('change', update);
    update();
  }

  // -------------------------------------------------------------------------
  // 2. COMPARATIVE CANVAS: DETERMINISTIC vs AI-VIDEO DRIFT
  // -------------------------------------------------------------------------
  function initComparativeSim() {
    const canvas = document.getElementById('lab1-sim-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const modeSelect = document.getElementById('comp-sim-mode');
    const playBtn = document.getElementById('comp-sim-play');
    const resetBtn = document.getElementById('comp-sim-reset');
    const noiseSlider = document.getElementById('comp-sim-noise');
    const noiseVal = document.getElementById('comp-sim-noise-val');
    const deltaEl = document.getElementById('comp-sim-delta');

    let running = true;
    let mode = modeSelect ? modeSelect.value : 'pendulum';
    let noise = noiseSlider ? parseFloat(noiseSlider.value) : 0.1;

    // Deterministik (haqiqiy fizik) holat
    let theta = 0.9, omega = 0; // pendulum: rad
    let y = 0, v = 0;           // free-fall: metr (yuqoridan pastga musbat)
    const L = 1.5, g = 9.81, gamma = 0.05;
    const DROP_HEIGHT = 4.5;

    // "AI video drift" holati — bir xil tenglama, lekin fazaga tasodifiy
    // sekin siljish (drift) qo'shiladi: generativ video modellari piksel
    // ehtimolligiga asoslangani uchun vaqt o'tishi bilan fazadan chetlashadi.
    let aiTheta = 0.9, aiOmega = 0;
    let aiY = 0, aiV = 0;
    let aiDriftPhase = 0;

    function resize() {
      setupResponsiveCanvas(canvas, 0.45);
    }
    resize();

    function resetSim() {
      theta = 0.9; omega = 0;
      aiTheta = 0.9; aiOmega = 0;
      y = 0; v = 0;
      aiY = 0; aiV = 0;
      aiDriftPhase = 0;
    }

    function stepPendulum(dt) {
      runSubsteps((subDt) => {
        const deriv = (t, state) => {
          const th = state[0], om = state[1];
          return [om, -(g / L) * Math.sin(th) - gamma * om];
        };
        const next = rk4Step([theta, omega], 0, subDt, deriv);
        theta = next[0]; omega = next[1];
      }, dt, 4);

      // AI drift: bir xil tenglama + tasodifiy fazaviy drift va sekin
      // amplituda so'nishi (energiyaning "sabab-oqibatsiz" yo'qolishi —
      // generativ videolarda odatiy uchraydigan artefakt).
      aiDriftPhase += dt * (0.4 + noise * 2);
      runSubsteps((subDt) => {
        const driftNoise = Math.sin(aiDriftPhase) * noise * 1.5;
        const deriv = (t, state) => {
          const th = state[0], om = state[1];
          return [om, -(g / L) * Math.sin(th) - (gamma + noise * 0.3) * om + driftNoise];
        };
        const next = rk4Step([aiTheta, aiOmega], 0, subDt, deriv);
        aiTheta = next[0]; aiOmega = next[1];
      }, dt, 4);
    }

    function stepFreeFall(dt) {
      const k = 0.15;
      const res = eulerCromerStep(y, v, dt, (x, vv) => g - k * vv * Math.abs(vv));
      y = res.x; v = res.v;
      if (y >= DROP_HEIGHT) { y = 0; v = 0; }

      aiDriftPhase += dt * (0.4 + noise * 2);
      const driftNoise = Math.sin(aiDriftPhase) * noise * 2.0;
      const aiRes = eulerCromerStep(aiY, aiV, dt, (x, vv) => g - (k + noise * 0.2) * vv * Math.abs(vv) + driftNoise);
      aiY = aiRes.x; aiV = aiRes.v;
      if (aiY >= DROP_HEIGHT || aiY < 0) { aiY = Math.max(0, Math.min(aiY, DROP_HEIGHT)); }
    }

    function render() {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '12px monospace';

      if (mode === 'pendulum') {
        const originLX = w * 0.28, originRX = w * 0.72, originY = h * 0.18;
        const scale = h * 0.6 / L;

        // Deterministik (chapda, moviy)
        drawPendulum(originLX, originY, theta, scale, '#38BDF8', 'Deterministik (Claude 3.5 kod)');
        // AI drift (o'ngda, amber)
        drawPendulum(originRX, originY, aiTheta, scale, '#FBBF24', "Generativ AI video (drift)");

        const deltaDeg = Math.abs((theta - aiTheta) * 180 / Math.PI);
        if (deltaEl) deltaEl.innerHTML = `Burchakli xatolik: <strong style="color:${deltaDeg > 8 ? '#F43F5E' : '#34D399'}">${deltaDeg.toFixed(2)}°</strong>`;
      } else {
        const groundY = h * 0.92;
        const topY = h * 0.08;
        const scaleY = (groundY - topY) / DROP_HEIGHT;
        const xL = w * 0.32, xR = w * 0.68;

        drawFallingBody(xL, topY, y, scaleY, '#38BDF8', 'Deterministik (Claude 3.5 kod)');
        drawFallingBody(xR, topY, aiY, scaleY, '#FBBF24', "Generativ AI video (drift)");

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();

        const deltaM = Math.abs(y - aiY);
        if (deltaEl) deltaEl.innerHTML = `Masofaviy xatolik: <strong style="color:${deltaM > 0.3 ? '#F43F5E' : '#34D399'}">${deltaM.toFixed(2)} m</strong>`;
      }
    }

    function drawPendulum(originX, originY, th, scale, color, label) {
      const bobX = originX + L * scale * Math.sin(th);
      const bobY = originY + L * scale * Math.cos(th);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(originX - 30, originY); ctx.lineTo(originX + 30, originY); ctx.stroke();

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(bobX, bobY); ctx.stroke();

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(bobX, bobY, 14, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(226,232,240,0.85)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, originX, originY + L * scale + 40);
      ctx.textAlign = 'left';
    }

    function drawFallingBody(cx, topY, yPos, scaleY, color, label) {
      const py = topY + yPos * scaleY;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(cx, py, 13, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(226,232,240,0.85)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, topY - 15);
      ctx.textAlign = 'left';
    }

    let lastTs = null;
    function loop(ts) {
      if (lastTs === null) lastTs = ts;
      const dt = Math.min(0.033, (ts - lastTs) / 1000);
      lastTs = ts;

      if (running) {
        if (mode === 'pendulum') stepPendulum(dt);
        else stepFreeFall(dt);
      }
      render();
      requestAnimationFrame(loop);
    }

    if (modeSelect) {
      modeSelect.addEventListener('change', () => {
        mode = modeSelect.value;
        resetSim();
      });
    }
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        running = !running;
        playBtn.textContent = running ? "⏸ To'xtatish" : "▶️ Davom Ettirish";
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', resetSim);
    }
    if (noiseSlider) {
      noiseSlider.addEventListener('input', () => {
        noise = parseFloat(noiseSlider.value);
        if (noiseVal) noiseVal.textContent = Math.round(noise * 100) + '%';
      });
    }

    requestAnimationFrame(loop);
  }

  // -------------------------------------------------------------------------
  // 3. CAPSTONE RUBRIC CALCULATOR
  // -------------------------------------------------------------------------
  function initRubricCalculator() {
    const ids = ['rubric-math', 'rubric-ai', 'rubric-code', 'rubric-audio', 'rubric-defense'];
    const sliders = ids.map(id => document.getElementById(id));
    if (sliders.some(s => !s)) return;
    const valEls = ids.map(id => document.getElementById(id + '-val'));
    const totalEl = document.getElementById('rubric-total-score');
    const gradeEl = document.getElementById('rubric-grade-badge');

    function grade(total) {
      if (total >= 90) return { text: "A (A'lo / Mukammal Portfolio)", cls: 'badge-emerald' };
      if (total >= 75) return { text: "B (Yaxshi)", cls: 'badge-cyan' };
      if (total >= 60) return { text: "C (Qoniqarli)", cls: 'badge-amber' };
      return { text: "D (Qayta Ishlash Talab Etiladi)", cls: 'badge-rose' };
    }

    function update() {
      let total = 0;
      sliders.forEach((s, i) => {
        const v = parseInt(s.value, 10);
        total += v;
        if (valEls[i]) valEls[i].textContent = v + ' ball';
      });
      if (totalEl) totalEl.textContent = `${total} / 100`;
      if (gradeEl) {
        const g = grade(total);
        gradeEl.textContent = g.text;
        gradeEl.className = 'badge ' + g.cls;
      }
    }

    sliders.forEach(s => s.addEventListener('input', update));
    update();
  }

  // -------------------------------------------------------------------------
  // 4. DIAGNOSTIC QUIZ
  // -------------------------------------------------------------------------
  function initQuiz() {
    const form = document.getElementById('lab1-quiz-form');
    const resultEl = document.getElementById('quiz-result');
    if (!form || !resultEl) return;

    const correct = { q1: 'C', q2: 'B', q3: 'D' };
    const explanations = {
      q1: "To'g'ri javob: C — MagicSchool AI talabaning boshlang'ich bilim darajasini aniqlab, Vygotskiy ZPD modeli asosida individual o'quv trayektoriyasini shakllantiradi.",
      q2: "To'g'ri javob: B — Generativ video ehtimoliy piksellardan iborat bo'lib, qat'iy matematik aniqlik va slayderlar orqali interaktivlikni ta'minlay olmaydi, shu sababli Claude 3.5 kod bosqichi zarur.",
      q3: "To'g'ri javob: D — Nazariya → Tayyor namunani tahlil → Kod yozish → Ovozlashtirish → Yakuniy loyiha (Capstone) himoyasi."
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      let score = 0;
      const feedback = [];
      Object.keys(correct).forEach(q => {
        const answer = data.get(q);
        const isCorrect = answer === correct[q];
        if (isCorrect) score++;
        feedback.push(`<div style="margin-bottom:8px; color:${isCorrect ? '#34D399' : '#F43F5E'}">${isCorrect ? '✅' : '❌'} ${explanations[q]}</div>`);
      });

      resultEl.style.display = 'block';
      resultEl.innerHTML = `<div style="margin-bottom:10px;">Natija: ${score} / 3 to'g'ri javob</div>` + feedback.join('');

      if (window.showToast) {
        window.showToast(score === 3 ? "Ajoyib! Barcha savollarga to'g'ri javob berdingiz!" : "Test yakunlandi, tushuntirishlarni ko'rib chiqing.");
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPromptStudio();
    initComparativeSim();
    initRubricCalculator();
    initQuiz();
  });
})();
