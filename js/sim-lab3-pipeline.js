/**
 * 3-Laboratoriya: AI ekotizimi va virtual ish muhitini sozlash.
 * 1. Diagnostik test → A/B/C klaster, individual reja va shaxsiy prompt.
 * 2. 7 vosita nazorat varaqasi → progress, jonli AI-Pipeline diagrammasi
 *    (HTML5 Canvas); belgilar brauzerda saqlanadi (localStorage).
 * 3. 100 ballik rubrika kalkulyatori va promptlarni nusxalash tugmalari.
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
  const DIAG_KEY = { diag3_q1: 'b', diag3_q2: 'c', diag3_q3: 'a', diag3_q4: 'c' };

  const CLUSTERS = {
    A: {
      title: 'Klaster "A" — Boshlang\'ich daraja',
      color: 'var(--accent-cyan)',
      plan: "Avval ro'yxatdan o'tishni talab qilmaydigan vositalardan boshlang: PhET/Vascak.cz (4-topshiriq) va Claude (1-topshiriq). Har bir vositaning vazifasini bir jumlada yozib boring, so'ng qolgan 5 ta vositaga o'ting. Xavfsizlik: har bir xizmatga alohida kuchli parol qo'ying va shaxsiy ma'lumotlarni kiritmang.",
      focus: "har bir AI vositaning vazifasi, ro'yxatdan o'tish va xavfsiz foydalanish, oddiy prompt yozish"
    },
    B: {
      title: 'Klaster "B" — Amaliyotchi daraja',
      color: 'var(--accent-emerald)',
      plan: "Barcha 7 ta mini-topshiriqni ketma-ket bajaring va har bir vosita natijasini keyingisiga kirish sifatida ulang (masalan, Claude kodi → Antigravity auditi → Otter hisobot). 5-bo'limdagi trekerda jarayonni belgilab boring.",
      focus: "vositalar orasidagi ma'lumot oqimi, Eyler-Kromer kodi auditi, ASR va TTS ning didaktik roli"
    },
    C: {
      title: 'Klaster "C" — Ilg\'or daraja',
      color: 'var(--accent-purple)',
      plan: "Pipeline'ni tanqidiy baholang: har bir vositaning cheklovlarini (xatolar, bepul tarif limitlari, maxfiylik, AI-detektorlar ishonchsizligi) jadvalga kiriting va vositalarni almashtirish variantlarini taklif qiling. Infografikada ma'lumot oqimi va nazorat nuqtalarini aniq ko'rsating.",
      focus: "AI vositalarning cheklovlari, agentik IDE (Antigravity) bilan kod auditi, akademik halollik va AI-detektorlarning ishonchliligi"
    }
  };

  function initDiagnostic() {
    const btn = document.getElementById('diag3-submit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const box = document.getElementById('diag3-result-box');
      const titleEl = document.getElementById('diag3-cluster-val');
      const scoreEl = document.getElementById('diag3-score-val');
      const planEl = document.getElementById('diag3-plan-desc');
      const promptEl = document.getElementById('diag3-personalized-prompt');

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
`Siz fizika o'qitishda AI vositalaridan foydalanish bo'yicha tyutorsiz. Men 3-laboratoriya diagnostik testidan ${score}/100 ball olib, "${key}" klasteriga kiritildim.
Asosiy mavzular: ${c.focus}.
Laboratoriyada 7 ta vosita bor: PhET/Vascak.cz, Claude, Google Antigravity, MagicSchool AI, ElevenLabs/Muxlisa, Otter.ai, Undetectable AI (faqat AI-detektor).
Iltimos:
1. Mening darajamga mos ravishda vositalarni o'rganish tartibini taklif qiling.
2. Har bir vosita uchun fizika darsiga oid bitta qisqa amaliy mashq bering.
3. Tayyor javob bermang — natijani o'zim tekshirishim uchun yo'naltiruvchi savollar bering.`;
    });
  }

  // -------------------------------------------------------------------------
  // 2. EKOTIZIM TREKERI VA JONLI PIPELINE DIAGRAMMASI
  // -------------------------------------------------------------------------
  // Tartib 4.1-bo'limdagi axborot oqimi bosqichlariga mos keladi.
  const NODES = [
    { tool: 't4_phet', label: 'PhET / Vascak', sub: 'Tajriba', color: '#38BDF8' },
    { tool: 't1_claude', label: 'Claude', sub: 'Model & kod', color: '#C084FC' },
    { tool: 't2_antigravity', label: 'Antigravity', sub: 'Agentik audit', color: '#34D399' },
    { tool: 't3_magicschool', label: 'MagicSchool', sub: 'Rubrika', color: '#FBBF24' },
    { tool: 't6_otter', label: 'Otter.ai', sub: 'Transkripsiya', color: '#38BDF8' },
    { tool: 't5_elevenlabs', label: 'ElevenLabs', sub: 'Audio', color: '#F43F5E' },
    { tool: 't7_undetectable', label: 'Undetectable', sub: 'AI-detektor', color: '#C084FC' }
  ];
  const STORAGE_KEY = 'lab3-ecosystem-tools';

  function initTracker() {
    const boxes = Array.from(document.querySelectorAll('.tool-checkbox'));
    const canvas = document.getElementById('pipeline-preview-canvas');
    if (!boxes.length || !canvas) return;
    const ctx = canvas.getContext('2d');
    const badge = document.getElementById('ecosystem-progress-badge');
    const bar = document.getElementById('ecosystem-progress-bar');
    const unlock = document.getElementById('pipeline-unlock-msg');

    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { saved = []; }
    boxes.forEach(b => { b.checked = saved.includes(b.dataset.tool); });

    const isDone = tool => boxes.some(b => b.dataset.tool === tool && b.checked);

    function update() {
      const done = boxes.filter(b => b.checked).map(b => b.dataset.tool);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(done)); } catch (e) { /* saqlash ixtiyoriy */ }
      const n = done.length, pct = Math.round((n / boxes.length) * 100);
      if (badge) {
        badge.textContent = `${n} / ${boxes.length} Vosita Sozlandi (${pct}%)`;
        badge.className = 'badge ' + (n === boxes.length ? 'badge-emerald' : n > 0 ? 'badge-cyan' : 'badge-amber');
      }
      if (bar) bar.style.width = pct + '%';
      if (unlock) unlock.style.display = n === boxes.length ? 'block' : 'none';
      boxes.forEach(b => {
        const label = b.closest('label');
        if (label) label.style.borderColor = b.checked ? 'var(--accent-emerald)' : 'var(--border-color)';
      });
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 750;
      const h = w < 500 ? Math.round(w * 1.75) : Math.round(w * 270 / 750);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function layout(W, H) {
      // Keng ekranda ikki qator ("ilon" shaklida), tor ekranda ikki ustun
      const pts = [];
      if (W >= 500) {
        const cols = 4, padX = 70, rowY = [H * 0.3, H * 0.72];
        const dx = (W - 2 * padX) / (cols - 1);
        for (let i = 0; i < 4; i++) pts.push({ x: padX + i * dx, y: rowY[0] });
        for (let i = 0; i < 3; i++) pts.push({ x: padX + (3 - i) * dx - dx / 2, y: rowY[1] });
      } else {
        const rows = 4, padTop = 40, padBottom = 70, colX = [W * 0.28, W * 0.72];
        const dy = (H - padTop - padBottom) / (rows - 1);
        for (let i = 0; i < 4; i++) pts.push({ x: colX[0], y: padTop + i * dy });
        for (let i = 0; i < 3; i++) pts.push({ x: colX[1], y: padTop + (3 - i) * dy - dy / 2 });
      }
      return pts;
    }

    function draw(now) {
      const W = canvas.clientWidth || 750;
      const H = parseFloat(canvas.style.height) || 270;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, W, H);
      const pts = layout(W, H);
      const r = Math.max(20, Math.min(30, W / 28));

      // Bog'lanishlar va ma'lumot impulslari
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const live = isDone(NODES[i].tool) && isDone(NODES[i + 1].tool);
        ctx.strokeStyle = live ? 'rgba(52,211,153,0.8)' : 'rgba(148,163,184,0.2)';
        ctx.lineWidth = live ? 2.5 : 1.5;
        ctx.setLineDash(live ? [] : [5, 5]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.setLineDash([]);
        if (live) {
          const t = ((now / 1400) + i * 0.15) % 1;
          ctx.fillStyle = '#A7F3D0';
          ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 4, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Tugunlar
      ctx.textAlign = 'center';
      pts.forEach((p, i) => {
        const n = NODES[i], on = isDone(n.tool);
        ctx.beginPath();
        ctx.fillStyle = on ? n.color : '#1E293B';
        if (on) { ctx.shadowColor = n.color; ctx.shadowBlur = 14; }
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = on ? '#F8FAFC' : 'rgba(148,163,184,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = on ? '#0B1120' : '#94A3B8';
        ctx.font = `bold ${Math.round(r * 0.6)}px ui-monospace, monospace`;
        ctx.fillText(on ? '✓' : String(i + 1), p.x, p.y + r * 0.22);
        ctx.fillStyle = on ? '#E2E8F0' : '#64748B';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(n.label, p.x, p.y + r + 15);
        ctx.fillStyle = '#64748B';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(n.sub, p.x, p.y + r + 28);
      });
      ctx.textAlign = 'left';

      requestAnimationFrame(draw);
    }

    boxes.forEach(b => b.addEventListener('change', update));
    window.triggerLab3PipelineRedraw = resize;
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas.parentElement);
    else window.addEventListener('resize', resize);

    resize();
    update();
    requestAnimationFrame(draw);
  }

  // -------------------------------------------------------------------------
  // 3. RUBRIKA KALKULYATORI (O'zbekiston OTM 5 ballik shkalasi)
  // -------------------------------------------------------------------------
  function initRubric() {
    const selects = document.querySelectorAll('.rubric3-select');
    const totalEl = document.getElementById('rubric3-total-score');
    const gradeEl = document.getElementById('rubric3-grade-badge');
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
    initTracker();
    initRubric();
  });
})();
