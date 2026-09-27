/**
 * 11-Laboratoriya: ovozli qaydlar → transkripsiya → LMS.
 * Sahifa tugmalari inline onclick orqali global funksiyalarni chaqiradi:
 *   generateLmsPrompt, copyPrompt, startRecordingSim, stopRecordingSim,
 *   sendToLmsSim, calcLmsScore.
 * 1. Diagnostik test → klaster va AI uchun shaxsiy prompt.
 * 2. Otter.ai jarayoni simulyatsiyasi (mikrofon ishlatilmaydi): sintetik nutq
 *    to'lqini, ASR natijasi va uning WER = (S + D + I) / N ko'rsatkichi so'zlar
 *    bo'yicha Levenshtein masofasi orqali haqiqatan hisoblanadi.
 * 3. Adaptiv tahlil simulyatsiyasi: Rasch modeli P = 1 / (1 + e^−(θ − b)),
 *    har bir mashg'ulot uchun θ maksimal o'xshashlik usulida baholanadi.
 * 4. 100 ballik rubrika.
 */

(function () {
  function toast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => toast('Nusxalandi!')).catch(() => toast('Nusxalandi!'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('Nusxalandi!');
    }
  }

  window.copyPrompt = function (id) {
    const el = document.getElementById(id);
    if (el) copyText(el.value || el.textContent);
  };

  // -------------------------------------------------------------------------
  // 1. DIAGNOSTIK TEST
  // -------------------------------------------------------------------------
  const DIAG_KEY = { diag11_q1: 'B', diag11_q2: 'C', diag11_q3: 'A', diag11_q4: 'B' };

  const CLUSTERS = {
    A: {
      title: 'Boshlang\'ich daraja',
      focus: "LMS tuzilmasi (mavzu, material, topshiriq, rubrika), SCORM/xAPI tushunchasi, WER formulasi",
      plan: "Avval 2- va 3-bo'limlarni o'qing, 5-bo'limdagi simulyatorda WER qanday hisoblanishini kuzating va Google Classroom'da bitta mavzu (Topic) va bitta topshiriq (Assignment) yarating."
    },
    B: {
      title: 'Amaliyotchi daraja',
      focus: "transkripsiya xatolarini tahrirlash, konspektni LMS topshirig'iga biriktirish, rubrika tuzish",
      plan: "O'z laboratoriya izohingizni yozib oling, transkripsiyadagi xatolarni tuzatib WER ni hisoblang va natijani Moodle yoki Google Classroom topshirig'iga rubrika bilan joylang."
    },
    C: {
      title: 'Ilg\'or daraja',
      focus: "adaptiv baholash (Rasch/IRT), xAPI orqali o'quv faoliyatini kuzatish, ma'lumotlar tahlili",
      plan: "Guruh natijalari bo'yicha savollar qiyinligini ($b$) baholang, har bir talaba uchun $\\theta$ ni hisoblang va keyingi topshiriqni $b \\approx \\theta$ bo'yicha tanlash rejasini tuzing."
    }
  };

  window.generateLmsPrompt = function () {
    const res = document.getElementById('diagnostic-result');
    const scoreEl = document.getElementById('diagnostic-score');
    const out = document.getElementById('ai-prompt-output');
    const answers = Object.keys(DIAG_KEY).map(n => document.querySelector(`input[name="${n}"]:checked`));
    if (res) res.style.display = 'block';
    if (answers.some(a => !a)) {
      if (scoreEl) scoreEl.textContent = '⚠️ Iltimos, barcha 4 ta savolga javob bering.';
      if (out) out.value = '';
      return;
    }
    const correct = Object.keys(DIAG_KEY).filter((n, i) => answers[i].value === DIAG_KEY[n]).length;
    const score = correct * 25;
    const key = score >= 75 ? 'C' : score >= 50 ? 'B' : 'A';
    const c = CLUSTERS[key];
    const wrong = Object.keys(DIAG_KEY).map((n, i) => answers[i].value === DIAG_KEY[n] ? null : i + 1).filter(Boolean);
    if (scoreEl) {
      scoreEl.textContent = `Natija: ${score} / 100 (${correct}/4) — ${c.title}. ${c.plan}` +
        (wrong.length ? ` Qayta ko'rib chiqing: ${wrong.join(', ')}-savol(lar). To'g'ri javoblar: 1-B, 2-C, 3-A, 4-B.` : '');
      if (typeof window.renderMathInElement === 'function') {
        window.renderMathInElement(scoreEl, { delimiters: [{ left: '$', right: '$', display: false }] });
      }
    }
    if (out) out.value =
`Sen oliy ta'limda raqamli kurs dizayni va LMS (Google Classroom, Moodle) bo'yicha metodist-murabbiysan.
Men 11-laboratoriya diagnostikasidan ${score}/100 ball oldim (${c.title}).
Asosiy mavzular: ${c.focus}.
Vazifa: "Mexanik tebranishlar" mavzusidagi laboratoriya ishim uchun LMS'da mavzu, material, topshiriq va baholash rubrikasini tuzish.
Iltimos:
1. Tayyor kursni darhol bermang — avval mening rejamni savollar orqali takomillashtirishga yordam bering.
2. Ovozli qaydimning transkripsiyasidagi fizik atamalar xatolarini qanday tekshirishni tushuntiring.
3. Talabalar shaxsiy ma'lumotlari va AI vositalaridan foydalanishda nimalarga e'tibor berish kerakligini eslatib o'ting.`;
  };

  // -------------------------------------------------------------------------
  // 2. OVOZLI YOZUV VA TRANSKRIPSIYA SIMULYATSIYASI
  // -------------------------------------------------------------------------
  const REFERENCE = "matematik mayatnikning tebranish davri ip uzunligining kvadrat ildiziga to'g'ri proporsional va amplitudaga deyarli bog'liq emas biz o'n marta tebranish vaqtini o'lchab davrni hisobladik";
  const HYPOTHESIS = "matematik mayatnikning tebranish davri ip uzunligi kvadrat ildiziga to'g'ri proporsional va amplitudaga bog'liq emas biz o'n marta tebranish vaqtini o'lchab davrini hisobladik";

  function wer(ref, hyp) {
    const r = ref.split(/\s+/).filter(Boolean);
    const h = hyp.split(/\s+/).filter(Boolean);
    // d[i][j] — r[0..i) va h[0..j) orasidagi minimal tahrir soni; (S, D, I) ham kuzatiladi
    const d = [];
    for (let i = 0; i <= r.length; i++) {
      d.push([]);
      for (let j = 0; j <= h.length; j++) {
        if (i === 0) d[i].push({ c: j, s: 0, del: 0, ins: j });
        else if (j === 0) d[i].push({ c: i, s: 0, del: i, ins: 0 });
        else d[i].push(null);
      }
    }
    for (let i = 1; i <= r.length; i++) {
      for (let j = 1; j <= h.length; j++) {
        const same = r[i - 1] === h[j - 1];
        const sub = d[i - 1][j - 1], del = d[i - 1][j], ins = d[i][j - 1];
        const cands = [
          { c: sub.c + (same ? 0 : 1), s: sub.s + (same ? 0 : 1), del: sub.del, ins: sub.ins },
          { c: del.c + 1, s: del.s, del: del.del + 1, ins: del.ins },
          { c: ins.c + 1, s: ins.s, del: ins.del, ins: ins.ins + 1 }
        ];
        d[i][j] = cands.reduce((a, b) => (b.c < a.c ? b : a));
      }
    }
    const e = d[r.length][h.length];
    return { S: e.s, D: e.del, I: e.ins, N: r.length, wer: e.c / r.length };
  }

  let recTimer = 0, recStart = 0, recRaf = 0, recording = false;
  const WAVE_LEN = 400;
  const wave = new Float32Array(WAVE_LEN);
  let waveHead = 0;

  function drawWave() {
    const cv = document.getElementById('lab11-audio-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    ctx.fillStyle = recording ? '#38bdf8' : 'rgba(56,189,248,0.5)';
    const bw = w / WAVE_LEN;
    for (let i = 0; i < WAVE_LEN; i++) {
      const v = wave[(waveHead + i) % WAVE_LEN];
      const bh = v * (h / 2 - 4);
      ctx.fillRect(i * bw, h / 2 - bh, Math.max(bw - 0.5, 0.5), 2 * bh);
    }
    if (!recording) {
      const label = 'Simulyatsiya: mikrofon ishlatilmaydi, to\'lqin sintetik';
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(4, 2, ctx.measureText(label).width + 12, 17);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(label, 10, 14);
    }
  }

  function recLoop(ts) {
    if (!recording) return;
    const t = (ts - recStart) / 1000;
    // Nutqqa o'xshash signal: bo'g'inlar (≈4 Hz) va so'z pauzalari (≈0,6 Hz) bilan modulyatsiya
    for (let k = 0; k < 3; k++) {
      const tt = t + k * 0.005;
      const syll = Math.max(0, Math.sin(2 * Math.PI * 4 * tt));
      const words = Math.sin(2 * Math.PI * 0.6 * tt) > -0.6 ? 1 : 0.08;
      wave[waveHead] = Math.min(1, (0.15 + 0.85 * syll) * words * (0.6 + 0.4 * Math.random()));
      waveHead = (waveHead + 1) % WAVE_LEN;
    }
    const el = document.getElementById('rec-time');
    if (el) {
      const s = Math.floor(t);
      el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
    drawWave();
    recRaf = requestAnimationFrame(recLoop);
  }

  window.startRecordingSim = function () {
    if (recording) return;
    recording = true;
    recStart = performance.now();
    const out = document.getElementById('transcription-output');
    if (out) out.value = '';
    const bStart = document.getElementById('btn-start-rec');
    const bStop = document.getElementById('btn-stop-rec');
    const bSend = document.getElementById('btn-send-lms');
    if (bStart) bStart.disabled = true;
    if (bStop) bStop.disabled = false;
    if (bSend) bSend.disabled = true;
    recRaf = requestAnimationFrame(recLoop);
  };

  window.stopRecordingSim = function () {
    if (!recording) return;
    recording = false;
    cancelAnimationFrame(recRaf);
    drawWave();
    const bStart = document.getElementById('btn-start-rec');
    const bStop = document.getElementById('btn-stop-rec');
    const bSend = document.getElementById('btn-send-lms');
    if (bStart) bStart.disabled = false;
    if (bStop) bStop.disabled = true;

    const r = wer(REFERENCE, HYPOTHESIS);
    const text =
`[Talaba 1, 00:00] ${HYPOTHESIS}

— ASR sifat tahlili (asl matn bilan solishtirish) —
Asl matn: ${REFERENCE}
S (almashtirilgan) = ${r.S}, D (tushib qolgan) = ${r.D}, I (qo'shilgan) = ${r.I}, N = ${r.N}
WER = (S + D + I) / N = ${(r.wer * 100).toFixed(1)} %
Eslatma: "amplitudaga deyarli bog'liq emas" → "bog'liq emas" — bitta tushib qolgan so'z fizik ma'noni o'zgartirdi (davr faqat kichik amplitudalarda amplitudaga bog'liq emas). Transkripsiyani doim tahrirlang.`;
    const out = document.getElementById('transcription-output');
    if (!out) return;
    out.value = '';
    let i = 0;
    clearInterval(recTimer);
    recTimer = setInterval(() => {
      i += 6;
      out.value = text.slice(0, i);
      out.scrollTop = out.scrollHeight;
      if (i >= text.length) {
        clearInterval(recTimer);
        if (bSend) bSend.disabled = false;
      }
    }, 16);
  };

  // -------------------------------------------------------------------------
  // 3. ADAPTIV TAHLIL (RASCH MODELI) VA LMS TRAYEKTORIYASI
  // -------------------------------------------------------------------------
  const ITEM_B = [-1.5, -0.75, 0, 0.5, 1.0, 1.75];
  // 6 ta mashg'ulot, har birida 6 ta savolga javoblar (1 — to'g'ri)
  const SESSIONS = [
    [1, 1, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0],
    [1, 1, 0, 1, 0, 0],
    [1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 0],
    [1, 1, 1, 0, 1, 1]
  ];
  let lmsShown = false;

  function rasch(theta, b) { return 1 / (1 + Math.exp(-(theta - b))); }

  function estimateTheta(resp) {
    // Maksimal o'xshashlik (Nyuton-Rafson); barcha javob to'g'ri/noto'g'ri bo'lmagan holat uchun
    let th = 0;
    for (let k = 0; k < 50; k++) {
      let g = 0, info = 0;
      for (let i = 0; i < ITEM_B.length; i++) {
        const p = rasch(th, ITEM_B[i]);
        g += resp[i] - p;
        info += p * (1 - p);
      }
      const step = g / info;
      th += step;
      if (Math.abs(step) < 1e-8) break;
    }
    let info = 0;
    for (const b of ITEM_B) { const p = rasch(th, b); info += p * (1 - p); }
    return { theta: th, se: 1 / Math.sqrt(info) };
  }

  function drawLms() {
    const cv = document.getElementById('lab11-lms-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    const padL = 46, padR = 16, padT = 16, padB = 28;
    ctx.clearRect(0, 0, w, h);
    const yMin = -3, yMax = 3;
    const Y = v => padT + (h - padT - padB) * (1 - (v - yMin) / (yMax - yMin));
    const X = i => padL + (i + 0.5) * (w - padL - padR) / SESSIONS.length;
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    for (let v = -3; v <= 3; v++) {
      ctx.strokeStyle = v === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)';
      ctx.beginPath(); ctx.moveTo(padL, Y(v)); ctx.lineTo(w - padR, Y(v)); ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(v.toString(), padL - 6, Y(v) + 4);
    }
    ctx.save();
    ctx.translate(12, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('qobiliyat θ (logit)', 0, 0);
    ctx.restore();
    ctx.textAlign = 'center';
    SESSIONS.forEach((_, i) => { ctx.fillStyle = '#94a3b8'; ctx.fillText(`${i + 1}-mashg'ulot`, X(i), h - 8); });

    if (!lmsShown) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText("Konspektni yuborgandan so'ng trayektoriya shu yerda chiziladi", w / 2, h / 2 - 10);
      return;
    }
    const est = SESSIONS.map(estimateTheta);
    // noaniqlik (±SE)
    ctx.strokeStyle = 'rgba(56,189,248,0.45)';
    ctx.lineWidth = 2;
    est.forEach((e, i) => {
      ctx.beginPath();
      ctx.moveTo(X(i), Y(Math.min(yMax, e.theta + e.se)));
      ctx.lineTo(X(i), Y(Math.max(yMin, e.theta - e.se)));
      ctx.stroke();
    });
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    est.forEach((e, i) => { if (i === 0) ctx.moveTo(X(i), Y(e.theta)); else ctx.lineTo(X(i), Y(e.theta)); });
    ctx.stroke();
    est.forEach((e, i) => {
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(X(i), Y(e.theta), 5, 0, Math.PI * 2); ctx.fill();
    });
    const last = est[est.length - 1];
    const fb = document.getElementById('lms-feedback');
    if (fb) {
      const next = ITEM_B.reduce((a, b) => (Math.abs(b - last.theta) < Math.abs(a - last.theta) ? b : a));
      fb.textContent = `Rasch baholashi: θ₁ = ${est[0].theta.toFixed(2)} → θ₆ = ${last.theta.toFixed(2)} ± ${last.se.toFixed(2)} logit. ` +
        `Keyingi topshiriq uchun eng informativ qiyinlik b ≈ θ (P ≈ 50%): mavjud savollardan b = ${next.toFixed(2)}. ` +
        `(Simulyatsiya: javoblar namunaviy; haqiqiy LMS'da talabaning o'z natijalari ishlatiladi.)`;
    }
  }

  window.sendToLmsSim = function () {
    lmsShown = true;
    drawLms();
    toast("Konspekt LMS topshirig'iga biriktirildi (simulyatsiya)");
  };

  window.triggerLab11CanvasRedraw = function () { drawWave(); drawLms(); };

  // -------------------------------------------------------------------------
  // 4. RUBRIKA
  // -------------------------------------------------------------------------
  window.calcLmsScore = function () {
    const spec = [['rubric11_1', 30], ['rubric11_2', 30], ['rubric11_3', 40]];
    let total = 0;
    spec.forEach(([id, max]) => {
      const el = document.getElementById(id);
      if (!el) return;
      let v = parseFloat(el.value);
      if (!isFinite(v)) v = 0;
      const clamped = Math.min(max, Math.max(0, v));
      if (clamped !== v) el.value = clamped; // chegaradan tashqari ball kiritilsa, maydonni tuzatamiz
      total += clamped;
    });
    const grade = total >= 86 ? "A'lo (5)" : total >= 71 ? 'Yaxshi (4)' : total >= 55 ? 'Qoniqarli (3)' : 'Qoniqarsiz (2)';
    const out = document.getElementById('rubric11-total');
    if (out) {
      out.textContent = `${total} / 100 ball — ${grade}`;
      out.style.color = total >= 86 ? 'var(--accent-emerald)' : total >= 71 ? 'var(--accent-cyan)' : total >= 55 ? 'var(--accent-amber)' : '#f43f5e';
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    drawWave();
    drawLms();
    window.calcLmsScore();
  });
})();
