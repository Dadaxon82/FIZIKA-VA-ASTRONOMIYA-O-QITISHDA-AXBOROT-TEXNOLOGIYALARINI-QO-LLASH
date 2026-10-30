/**
 * Qo‘shimcha astronomiya mavzulari (A1–A3) uchun interaktiv modellar.
 *  A1 — Gertsshprung–Rassel diagrammasi va yulduz evolyutsiyasining sxematik treki
 *  A2 — Qora jism spektri (Plank qonuni), yutilish chiziqlari va Doppler siljishi
 *  A3 — Fotometrik kuzatuvlar: yorug‘lik egri chizig‘i, davrni topish (fazaga yig‘ish) va masofa
 * Har bir model faqat o‘z canvas elementi sahifada bo‘lsa ishga tushadi.
 */
(function () {
  'use strict';

  // ---------- umumiy yordamchilar ----------
  const COLORS = {
    bg: '#0B1120', grid: 'rgba(148,163,184,0.15)', axis: '#94A3B8', text: '#CBD5E1',
    cyan: '#38BDF8', emerald: '#34D399', amber: '#FBBF24', rose: '#F43F5E', purple: '#C084FC', white: '#F8FAFC'
  };

  function fitCanvas(canvas, ratio, maxH) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    if (!w) return null; // yashirin tabda — chizmaymiz
    const h = Math.min(Math.round(w * ratio), maxH || 560);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = h + 'px';
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function fmt(x, d) {
    return Number(x).toFixed(d).replace('.', ',').replace('-', '−');
  }

  function fmtExp(x) {
    if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= -2 && e <= 4) return fmt(x, e >= 2 ? 0 : 2);
    const m = x / Math.pow(10, e);
    return fmt(m, 2) + '·10' + supNum(e);
  }

  function supNum(n) {
    const map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).split('').map(c => map[c] || c).join('');
  }

  // Qora jism haroratiga mos taxminiy RGB rang (Tanner Helland yaqinlashuvi)
  function tempToRGB(T) {
    const t = Math.max(1000, Math.min(40000, T)) / 100;
    let r, g, b;
    if (t <= 66) {
      r = 255;
      g = 99.4708025861 * Math.log(t) - 161.1195681661;
      b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    } else {
      r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
      g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
      b = 255;
    }
    const c = v => Math.round(Math.max(0, Math.min(255, v)));
    return `rgb(${c(r)},${c(g)},${c(b)})`;
  }

  // To‘lqin uzunligi (nm) bo‘yicha ko‘rinadigan rang
  function wavelengthToRGB(l) {
    let r = 0, g = 0, b = 0;
    if (l >= 380 && l < 440) { r = -(l - 440) / 60; b = 1; }
    else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = -(l - 645) / 65; }
    else if (l <= 750) { r = 1; }
    let f = 1;
    if (l < 420) f = 0.3 + 0.7 * (l - 380) / 40;
    else if (l > 700) f = 0.3 + 0.7 * (750 - l) / 50;
    const c = v => Math.round(255 * Math.pow(v * f, 0.8));
    return `rgb(${c(r)},${c(g)},${c(b)})`;
  }

  const $ = id => document.getElementById(id);

  // =====================================================================
  // A1. Gertsshprung–Rassel diagrammasi
  // =====================================================================
  function initHR() {
    const canvas = $('hr-canvas');
    if (!canvas) return;
    const T_SUN = 5772;
    // Taxminiy qiymatlar (T — effektiv harorat, K; L — Quyosh yorqinligi birligida)
    const STARS = [
      { n: 'Quyosh', T: 5772, L: 1 },
      { n: 'Sirius A', T: 9940, L: 25.4 },
      { n: 'Vega', T: 9600, L: 40 },
      { n: 'Arktur', T: 4290, L: 170 },
      { n: 'Aldebaran', T: 3900, L: 440 },
      { n: 'Betelgeyze', T: 3600, L: 1.0e5 },
      { n: 'Rigel', T: 12100, L: 1.2e5 },
      { n: 'Qutb yulduzi', T: 6000, L: 1260 },
      { n: 'Proksima Sentavra', T: 3040, L: 0.0017 },
      { n: 'Barnard yulduzi', T: 3130, L: 0.0035 },
      { n: 'Sirius B', T: 25000, L: 0.056 },
      { n: 'Prosion B', T: 7740, L: 0.00049 }
    ];

    // Asosiy ketma-ketlik uchun soddalashtirilgan munosabatlar (M — Quyosh massasi birligida)
    function msLum(M) {
      if (M < 0.43) return 0.23 * Math.pow(M, 2.3);
      if (M < 2) return Math.pow(M, 4);
      if (M < 55) return 1.4 * Math.pow(M, 3.5);
      return 32000 * M;
    }
    function msRad(M) { return M < 1 ? Math.pow(M, 0.8) : Math.pow(M, 0.57); }
    function msTemp(M) { return T_SUN * Math.pow(msLum(M) / Math.pow(msRad(M), 2), 0.25); }
    function msLife(M) { return 1e10 * M / msLum(M); } // yil

    const AGE_UNIVERSE = 1.38e10;
    const massInput = $('hr-mass');
    const playBtn = $('hr-play');
    const resetBtn = $('hr-reset');
    const info = $('hr-info');
    const stage = $('hr-stage');

    let track = [];
    let anim = null; // {start, dur}
    let progress = 0;

    function buildTrack(M) {
      const L0 = msLum(M), T0 = msTemp(M), tMS = msLife(M);
      const pts = [{ T: T0, L: L0, label: 'Asosiy ketma-ketlik (vodorod yonishi)', t: 0 }];
      if (tMS > AGE_UNIVERSE) {
        pts.push({ T: T0 * 1.01, L: L0 * 1.05, label: 'Koinot yoshidan ham uzoq yashaydi — hali asosiy ketma-ketlikda', t: AGE_UNIVERSE });
        return { pts, end: 'Qizil mitti: hali birorta ham shunday yulduz asosiy ketma-ketlikni tark etmagan.' };
      }
      if (M < 8) {
        const wd = 0.109 * M + 0.394; // boshlang‘ich–oxirgi massa munosabati (Kalirai va b., 2008)
        pts.push({ T: T0 * 0.93, L: L0 * 1.8, label: 'Asosiy ketma-ketlik oxiri', t: tMS });
        pts.push({ T: 5000, L: L0 * 2.2, label: 'Subgigant: yadroda vodorod tugadi', t: tMS * 1.05 });
        pts.push({ T: 4000, L: Math.max(L0 * 30, 100), label: 'Qizil gigant: qobiqda vodorod yonadi', t: tMS * 1.1 });
        pts.push({ T: 3700, L: Math.min(Math.max(L0 * 300, 2000), 3000), label: 'Qizil gigant tarmog‘i uchi: geliy chaqnashi', t: tMS * 1.12 });
        pts.push({ T: 5200, L: Math.max(L0 * 15, 50), label: 'Yadroda geliy yonishi', t: tMS * 1.13 });
        pts.push({ T: 3300, L: Math.max(L0 * 1000, 5000), label: 'Asimptotik gigantlar tarmog‘i', t: tMS * 1.2 });
        pts.push({ T: 38000, L: Math.max(L0 * 600, 3000), label: 'Planetar tumanlik: qobiq tashlanadi', t: tMS * 1.2001 });
        pts.push({ T: 30000, L: 0.3, label: `Oq mitti (massasi ≈ ${fmt(wd, 2)} M☉) soviy boshlaydi`, t: tMS * 1.2002 });
        pts.push({ T: 7000, L: 3e-4, label: 'Oq mitti milliardlab yil davomida soviydi', t: tMS * 1.2002 + 5e9 });
        return { pts, end: `Yakuni: oq mitti, massasi ≈ ${fmt(wd, 2)} M☉ (Chandrasekar chegarasi 1,4 M☉ dan kichik).` };
      }
      pts.push({ T: T0 * 0.85, L: L0 * 1.3, label: 'Asosiy ketma-ketlik oxiri', t: tMS });
      pts.push({ T: 9000, L: L0 * 1.5, label: 'Gertsshprung bo‘shlig‘i orqali tez o‘tish', t: tMS * 1.02 });
      pts.push({ T: 3500, L: L0 * 1.7, label: 'Qizil supergigant: og‘ir elementlar sintezi temirgacha', t: tMS * 1.1 });
      const remnant = M < 20
        ? 'neytron yulduz (1,4–2 M☉ atrofida)'
        : 'qora tuynuk (taxminan 20 M☉ dan katta yulduzlar uchun; aniq chegara metallik va aylanishga bog‘liq)';
      return { pts, end: `Yakuni: o‘ta yangi yulduz portlashi (II tur), qoldig‘i — ${remnant}.`, sn: true };
    }

    function xOf(T, pad, w) { // harorat chapdan o‘ngga kamayadi, logarifmik
      const a = Math.log10(40000), b = Math.log10(2500);
      return pad.l + (a - Math.log10(T)) / (a - b) * (w - pad.l - pad.r);
    }
    function yOf(L, pad, h) {
      const a = 6, b = -4.5;
      return pad.t + (a - Math.log10(L)) / (a - b) * (h - pad.t - pad.b);
    }

    function interp(p) {
      const n = track.pts.length - 1;
      if (n === 0) return track.pts[0];
      const f = p * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
      const A = track.pts[i], B = track.pts[i + 1];
      return {
        T: Math.pow(10, Math.log10(A.T) + (Math.log10(B.T) - Math.log10(A.T)) * u),
        L: Math.pow(10, Math.log10(A.L) + (Math.log10(B.L) - Math.log10(A.L)) * u),
        label: u < 0.5 ? A.label : B.label,
        t: A.t + (B.t - A.t) * u
      };
    }

    function draw() {
      const c = fitCanvas(canvas, 0.72, 600);
      if (!c) return;
      const { ctx, w, h } = c;
      const pad = { l: 64, r: 18, t: 18, b: 46 };
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);
      ctx.font = '12px system-ui, sans-serif';
      // to‘r
      ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1; ctx.fillStyle = COLORS.axis;
      [40000, 20000, 10000, 5000, 3000].forEach(T => {
        const x = xOf(T, pad, w);
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, h - pad.b); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillText(T.toLocaleString('uz-UZ').replace(/,/g, ' '), x, h - pad.b + 16);
      });
      for (let e = -4; e <= 6; e += 2) {
        const y = yOf(Math.pow(10, e), pad, h);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText('10' + supNum(e), pad.l - 8, y + 4);
      }
      ctx.fillStyle = COLORS.text; ctx.textAlign = 'center';
      ctx.fillText('Effektiv harorat T, K (logarifmik shkala, chapga qarab ortadi)', (pad.l + w - pad.r) / 2, h - 10);
      ctx.save(); ctx.translate(16, (pad.t + h - pad.b) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('Yorqinlik L / L☉', 0, 0); ctx.restore();

      // spektral sinflar
      const cls = [['O', 40000, 30000], ['B', 30000, 10000], ['A', 10000, 7500], ['F', 7500, 6000], ['G', 6000, 5200], ['K', 5200, 3700], ['M', 3700, 2500]];
      ctx.font = 'bold 12px system-ui, sans-serif';
      cls.forEach(([s, a, b]) => {
        const x = (xOf(a, pad, w) + xOf(b, pad, w)) / 2;
        ctx.fillStyle = tempToRGB(Math.sqrt(a * b)); ctx.fillText(s, x, pad.t + 12);
      });

      // asosiy ketma-ketlik chizig‘i (chizma maydoni bilan kesiladi)
      ctx.save();
      ctx.beginPath(); ctx.rect(pad.l, pad.t, w - pad.l - pad.r, h - pad.t - pad.b); ctx.clip();
      ctx.strokeStyle = 'rgba(56,189,248,0.45)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let lm = Math.log10(0.1); lm <= Math.log10(40); lm += 0.02) {
        const M = Math.pow(10, lm);
        const x = xOf(msTemp(M), pad, w), y = yOf(msLum(M), pad, h);
        if (lm === Math.log10(0.1)) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      ctx.lineWidth = 1;
      ctx.fillStyle = COLORS.cyan; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Asosiy ketma-ketlik', xOf(msTemp(3), pad, w) + 12, yOf(msLum(3), pad, h) + 18);
      ctx.fillStyle = COLORS.amber; ctx.fillText('Gigantlar', xOf(5400, pad, w), yOf(25, pad, h));
      ctx.fillText('Supergigantlar', xOf(9000, pad, w), yOf(3e5, pad, h));
      ctx.fillStyle = COLORS.white; ctx.fillText('Oq mittilar', xOf(30000, pad, w), yOf(5e-4, pad, h));

      // katalog yulduzlari
      STARS.forEach(s => {
        const x = xOf(s.T, pad, w), y = yOf(s.L, pad, h);
        ctx.fillStyle = tempToRGB(s.T);
        ctx.beginPath(); ctx.arc(x, y, s.n === 'Quyosh' ? 6 : 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.text; ctx.font = '11px system-ui, sans-serif';
        const right = x > w - 130;
        ctx.textAlign = right ? 'right' : 'left';
        ctx.fillText(s.n, right ? x - 7 : x + 7, y - 5);
      });

      // trek
      if (track.pts.length > 1) {
        ctx.strokeStyle = 'rgba(251,191,36,0.85)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
        ctx.beginPath();
        track.pts.forEach((p, i) => {
          const x = xOf(Math.min(p.T, 40000), pad, w), y = yOf(p.L, pad, h);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
      }
      const cur = interp(progress);
      const x = xOf(Math.min(cur.T, 40000), pad, w), y = yOf(cur.L, pad, h);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 18);
      glow.addColorStop(0, tempToRGB(cur.T)); glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COLORS.white; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();

      if (track.sn && progress >= 0.999) {
        ctx.fillStyle = 'rgba(244,63,94,0.9)'; ctx.font = 'bold 14px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('💥 O‘ta yangi yulduz', x - 60, y + 30);
      }
      stage.textContent = cur.label + (cur.t > 0 ? ` · yoshi ≈ ${fmtExp(cur.t)} yil` : '');
    }

    function updateInfo() {
      const M = parseFloat(massInput.value);
      $('hr-mass-val').textContent = fmt(M, M < 1 ? 2 : 1) + ' M☉';
      const L = msLum(M), T = msTemp(M), R = msRad(M), t = msLife(M);
      info.innerHTML =
        `<div>Yorqinlik: <strong>${fmtExp(L)} L☉</strong></div>` +
        `<div>Effektiv harorat: <strong>${Math.round(T).toLocaleString('uz-UZ').replace(/,/g, ' ')} K</strong></div>` +
        `<div>Radius: <strong>${fmt(R, 2)} R☉</strong></div>` +
        `<div>Asosiy ketma-ketlikdagi umri: <strong>${fmtExp(t)} yil</strong></div>` +
        `<div style="margin-top:6px;color:#FBBF24">${track.end}</div>`;
    }

    function rebuild() {
      track = buildTrack(parseFloat(massInput.value));
      progress = 0; anim = null; playBtn.textContent = '▶ Evolyutsiyani boshlash';
      updateInfo(); draw();
    }

    function loop(ts) {
      if (anim) {
        if (anim.start === null) anim.start = ts;
        progress = Math.min(1, (ts - anim.start) / anim.dur);
        if (progress >= 1) { anim = null; playBtn.textContent = '↻ Qayta ko‘rish'; }
      }
      draw();
      requestAnimationFrame(loop);
    }

    massInput.addEventListener('input', rebuild);
    playBtn.addEventListener('click', () => {
      if (progress >= 1) progress = 0;
      anim = { start: null, dur: 9000 * (1 - progress) };
      playBtn.textContent = '⏳ Evolyutsiya ketmoqda…';
    });
    resetBtn.addEventListener('click', rebuild);
    rebuild();
    requestAnimationFrame(loop);
  }

  // =====================================================================
  // A2. Spektral tahlil
  // =====================================================================
  function initSpectrum() {
    const canvas = $('spec-canvas');
    if (!canvas) return;
    const h = 6.62607015e-34, c = 2.99792458e8, k = 1.380649e-23, b = 2.897771955e-3;
    const LINES = [
      { n: 'Hα', l: 656.28 }, { n: 'Hβ', l: 486.13 }, { n: 'Hγ', l: 434.05 }, { n: 'Hδ', l: 410.17 },
      { n: 'Na D', l: 589.29 }, { n: 'Mg b', l: 518.36 }, { n: 'Ca II K', l: 393.37 }, { n: 'Ca II H', l: 396.85 }
    ];
    const tIn = $('spec-T'), vIn = $('spec-v'), linesIn = $('spec-lines');
    const out = $('spec-info');
    let mystery = null;

    function planck(lnm, T) {
      const l = lnm * 1e-9;
      return 2 * h * c * c / Math.pow(l, 5) / (Math.exp(h * c / (l * k * T)) - 1);
    }
    function shift(l0, vkm) {
      const beta = vkm * 1000 / c;
      return l0 * Math.sqrt((1 + beta) / (1 - beta));
    }

    function draw() {
      const C = fitCanvas(canvas, 0.62, 520);
      if (!C) return;
      const { ctx, w, h: H } = C;
      const T = mystery ? mystery.T : parseFloat(tIn.value);
      const v = mystery ? mystery.v : parseFloat(vIn.value);
      const pad = { l: 56, r: 16, t: 16, b: 40 };
      const plotH = H * 0.62;
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, H);
      const L0 = 100, L1 = 2000;
      const X = l => pad.l + (l - L0) / (L1 - L0) * (w - pad.l - pad.r);
      // ko‘rinadigan diapazon
      for (let l = 380; l <= 750; l += 2) {
        ctx.fillStyle = wavelengthToRGB(l).replace('rgb', 'rgba').replace(')', ',0.18)');
        ctx.fillRect(X(l), pad.t, X(l + 2) - X(l) + 0.5, plotH - pad.t);
      }
      // Plank egri chizig‘i (normallashtirilgan)
      const lmax = b / T * 1e9;
      const Bmax = planck(Math.max(lmax, L0), T);
      ctx.strokeStyle = tempToRGB(T); ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let l = L0; l <= L1; l += 4) {
        const y = plotH - (planck(l, T) / Bmax) * (plotH - pad.t - 6);
        if (l === L0) ctx.moveTo(X(l), y); else ctx.lineTo(X(l), y);
      }
      ctx.stroke(); ctx.lineWidth = 1;
      if (lmax >= L0 && lmax <= L1) {
        ctx.strokeStyle = COLORS.amber; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(X(lmax), pad.t); ctx.lineTo(X(lmax), plotH); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = COLORS.amber; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(mystery ? 'λ_max' : `λ_max = ${Math.round(lmax)} nm`, X(lmax) + 5, pad.t + 14);
      }
      // o‘q
      ctx.strokeStyle = COLORS.axis; ctx.beginPath(); ctx.moveTo(pad.l, plotH); ctx.lineTo(w - pad.r, plotH); ctx.stroke();
      ctx.fillStyle = COLORS.axis; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
      for (let l = 200; l <= 2000; l += 200) ctx.fillText(l, X(l), plotH + 14);
      ctx.fillText('λ, nm', w - pad.r - 14, plotH + 28);
      ctx.save(); ctx.translate(14, (pad.t + plotH) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.text; ctx.fillText('B_λ (normallashtirilgan)', 0, 0); ctx.restore();

      // spektr chizig‘i (380–750 nm), yutilish chiziqlari bilan
      const sy = plotH + 40, sh = H - sy - 26;
      const XS = l => pad.l + (l - 380) / 370 * (w - pad.l - pad.r);
      for (let l = 380; l <= 750; l += 1) {
        const I = planck(l, T) / Math.max(planck(380, T), planck(750, T), planck(Math.min(Math.max(lmax, 380), 750), T));
        ctx.globalAlpha = 0.25 + 0.75 * Math.min(1, I);
        ctx.fillStyle = wavelengthToRGB(l);
        ctx.fillRect(XS(l), sy, XS(l + 1) - XS(l) + 0.6, sh);
      }
      ctx.globalAlpha = 1;
      const showLines = mystery ? true : linesIn.checked;
      if (showLines) {
        ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'center';
        LINES.forEach(L => {
          const ls = shift(L.l, v);
          if (ls < 380 || ls > 750) return;
          ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(XS(ls) - 1.2, sy, 2.4, sh);
          ctx.fillStyle = COLORS.text; ctx.fillText(L.n, XS(ls), sy - 4);
          if (!mystery && Math.abs(v) > 1) {
            ctx.strokeStyle = 'rgba(248,250,252,0.35)'; ctx.setLineDash([2, 3]);
            ctx.beginPath(); ctx.moveTo(XS(L.l), sy + sh); ctx.lineTo(XS(L.l), sy + sh + 6); ctx.stroke(); ctx.setLineDash([]);
          }
        });
      }
      ctx.fillStyle = COLORS.axis; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
      [400, 450, 500, 550, 600, 650, 700, 750].forEach(l => ctx.fillText(l, XS(l), sy + sh + 16));

      // ma’lumot
      if (mystery) {
        out.innerHTML = 'Noma’lum obyekt: Hα chizig‘ining kuzatilgan to‘lqin uzunligini spektrdan o‘lchang (pastdagi shkala), so‘ng radial tezlikni hisoblang. ' +
          `Ko‘rsatma: Hα laboratoriyada 656,28 nm. Kuzatilgan Hα ≈ <strong>${fmt(shift(656.28, v), 1)} nm</strong>.`;
      } else {
        const z = shift(1, v) - 1;
        out.innerHTML =
          `<div>Vin qonuni: λ_max = b / T = <strong>${Math.round(lmax)} nm</strong></div>` +
          `<div>Stefan–Bolsman: sirt birligidan nurlanish oqimi σT⁴ = <strong>${fmtExp(5.670374419e-8 * Math.pow(T, 4))} Vt/m²</strong></div>` +
          `<div>Qizil siljish z = Δλ/λ₀ = <strong>${fmt(z, 4)}</strong>; Hα: 656,28 → <strong>${fmt(shift(656.28, v), 2)} nm</strong></div>` +
          `<div>${v > 0 ? 'Obyekt bizdan uzoqlashmoqda (qizil siljish)' : v < 0 ? 'Obyekt bizga yaqinlashmoqda (binafsha siljish)' : 'Radial tezlik nolga teng'}</div>`;
      }
    }

    function labels() {
      $('spec-T-val').textContent = parseInt(tIn.value, 10).toLocaleString('uz-UZ').replace(/,/g, ' ') + ' K';
      $('spec-v-val').textContent = fmt(parseFloat(vIn.value), 0) + ' km/s';
    }
    [tIn, vIn, linesIn].forEach(el => el.addEventListener('input', () => { mystery = null; $('spec-check-out').textContent = ''; labels(); draw(); }));
    $('spec-mystery').addEventListener('click', () => {
      const T = 3500 + Math.random() * 16500;
      const v = Math.round((Math.random() < 0.25 ? -1 : 1) * (2000 + Math.random() * 28000));
      mystery = { T, v };
      $('spec-check-out').textContent = '';
      $('spec-answer').value = '';
      draw();
    });
    $('spec-check').addEventListener('click', () => {
      const res = $('spec-check-out');
      if (!mystery) { res.textContent = 'Avval “Noma’lum obyekt” tugmasini bosing.'; return; }
      const ans = parseFloat(String($('spec-answer').value).replace(',', '.').replace('−', '-'));
      if (!isFinite(ans)) { res.textContent = 'Tezlikni km/s da kiriting.'; return; }
      const err = Math.abs(ans - mystery.v) / Math.abs(mystery.v);
      res.style.color = err < 0.05 ? COLORS.emerald : COLORS.rose;
      res.textContent = err < 0.05
        ? `To‘g‘ri! Haqiqiy qiymat ${mystery.v} km/s (xatolik ${fmt(err * 100, 1)} %).`
        : `Hali aniq emas (xatolik ${fmt(err * 100, 0)} %). v ≈ c·Δλ/λ₀ formulasini qo‘llang.`;
    });
    labels();
    function loop() { draw(); requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
  }

  // =====================================================================
  // A3. Fotometriya: yorug‘lik egri chizig‘i va davrni topish
  // =====================================================================
  function initLightCurve() {
    const canvas = $('lc-canvas');
    if (!canvas) return;
    const fold = $('fold-canvas');
    const typeIn = $('lc-type'), dIn = $('lc-D'), expIn = $('lc-exp'), pIn = $('lc-P');
    const info = $('lc-info'), tel = $('lc-tel');
    let star = null, obs = [];

    // Mulberry32 — takrorlanuvchi tasodifiy sonlar
    function rng(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    function gauss(r) {
      let u = 0, v = 0;
      while (u === 0) u = r();
      while (v === 0) v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function cepheidShape(ph) { // tez yorishib, sekin xiralashadi: 0 — eng yorug‘
      ph = ph - Math.floor(ph);
      return ph < 0.15 ? 1 - ph / 0.15 : (ph - 0.15) / 0.85;
    }

    function newStar(seed) {
      const r = rng(seed);
      if (typeIn.value === 'cepheid') {
        const P = 3 + r() * 37;
        const M = -2.43 * (Math.log10(P) - 1) - 4.05; // Leavitt qonuni (Benedict va b., 2007)
        const d = 500 + r() * 9500; // pk
        const m = M + 5 * Math.log10(d) - 5;
        star = { type: 'cepheid', P, M, d, m, A: 0.4 + r() * 0.5, seed };
      } else {
        const P = 1 + r() * 9;
        const k = 0.08 + r() * 0.08; // Rp/R*
        star = { type: 'transit', P, k, dur: 0.04 + r() * 0.04, m: 9 + r() * 2, seed };
      }
      simulate();
    }

    function sigmaMag() {
      // Soddalashtirilgan shovqin modeli: σ ∝ 1/(D·√t) va xira yulduzda ortadi
      const D = parseFloat(dIn.value), t = parseFloat(expIn.value);
      return 0.004 * (100 / D) * Math.sqrt(60 / t) * Math.pow(10, 0.2 * (star.m - 10));
    }

    function simulate() {
      const r = rng(star.seed + 7);
      const N = star.type === 'cepheid' ? 260 : 400, span = star.type === 'cepheid' ? 120 : 40;
      const s = sigmaMag();
      obs = [];
      for (let i = 0; i < N; i++) {
        const t = r() * span;
        let mag;
        if (star.type === 'cepheid') {
          mag = star.m + star.A * (cepheidShape(t / star.P) - 0.5);
        } else {
          const ph = (t / star.P) % 1;
          const inTr = Math.min(ph, 1 - ph) < star.dur / 2;
          const flux = inTr ? 1 - star.k * star.k : 1;
          mag = star.m - 2.5 * Math.log10(flux);
        }
        obs.push({ t, mag: mag + gauss(r) * s });
      }
      obs.sort((a, b) => a.t - b.t);
      pIn.min = star.type === 'cepheid' ? 2 : 0.8;
      pIn.max = star.type === 'cepheid' ? 45 : 11;
      pIn.step = 0.001;
      pIn.value = star.type === 'cepheid' ? 10 : 5;
      updateTel();
      drawAll();
    }

    function pdm(P) { // faza dispersiyasi: 10 ta bin dispersiyalari yig‘indisining umumiy dispersiyaga nisbati
      const bins = Array.from({ length: 10 }, () => []);
      obs.forEach(o => bins[Math.floor(((o.t / P) % 1) * 10)].push(o.mag));
      const all = obs.map(o => o.mag);
      const varOf = a => { const m = a.reduce((x, y) => x + y, 0) / a.length; return a.reduce((x, y) => x + (y - m) * (y - m), 0) / a.length; };
      const tot = varOf(all);
      let s = 0, n = 0;
      bins.forEach(bn => { if (bn.length > 1) { s += varOf(bn) * bn.length; n += bn.length; } });
      return (s / n) / tot;
    }

    function plot(cv, pts, xLabel, xMax, ratio) {
      const C = fitCanvas(cv, ratio, 340);
      if (!C) return;
      const { ctx, w, h } = C;
      const pad = { l: 56, r: 14, t: 14, b: 38 };
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);
      const mags = pts.map(p => p.y);
      let lo = Math.min(...mags), hi = Math.max(...mags);
      const m = (hi - lo) * 0.1 || 0.01; lo -= m; hi += m;
      const X = x => pad.l + x / xMax * (w - pad.l - pad.r);
      const Y = y => pad.t + (y - lo) / (hi - lo) * (h - pad.t - pad.b); // kattalik: yuqoriga — yorug‘roq
      ctx.strokeStyle = COLORS.grid;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + i / 4 * (h - pad.t - pad.b);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        ctx.fillStyle = COLORS.axis; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(fmt(lo + i / 4 * (hi - lo), 2), pad.l - 6, y + 4);
      }
      ctx.textAlign = 'center';
      for (let i = 0; i <= 5; i++) ctx.fillText(fmt(xMax * i / 5, xMax < 3 ? 1 : 0), X(xMax * i / 5), h - pad.b + 15);
      ctx.fillStyle = COLORS.text; ctx.fillText(xLabel, (pad.l + w - pad.r) / 2, h - 6);
      ctx.save(); ctx.translate(14, (pad.t + h - pad.b) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('Yulduz kattaligi m', 0, 0); ctx.restore();
      ctx.fillStyle = COLORS.cyan;
      pts.forEach(p => { ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 2.2, 0, Math.PI * 2); ctx.fill(); });
    }

    function drawAll() {
      if (!star) return;
      const span = star.type === 'cepheid' ? 120 : 40;
      plot(canvas, obs.map(o => ({ x: o.t, y: o.mag })), 'Kuzatuv vaqti, sutka', span, 0.42);
      const P = parseFloat(pIn.value);
      const ph = [];
      obs.forEach(o => { const f = (o.t / P) % 1; ph.push({ x: f, y: o.mag }); ph.push({ x: f + 1, y: o.mag }); });
      plot(fold, ph, 'Faza (sinov davri bo‘yicha)', 2, 0.42);
      $('lc-P-val').textContent = fmt(P, 3) + ' sutka';
      const theta = pdm(P);
      let html = `<div>Faza dispersiyasi Θ = <strong>${fmt(theta, 3)}</strong> (to‘g‘ri davrda eng kichik bo‘ladi)</div>`;
      const meanM = obs.reduce((a, o) => a + o.mag, 0) / obs.length;
      html += `<div>O‘rtacha kuzatilgan kattalik: <strong>${fmt(meanM, 2)}<sup>m</sup></strong></div>`;
      if (star.type === 'cepheid') {
        const M = -2.43 * (Math.log10(P) - 1) - 4.05;
        const d = Math.pow(10, (meanM - M + 5) / 5);
        html += `<div>Sinov davri bo‘yicha absolyut kattalik M<sub>V</sub> = <strong>${fmt(M, 2)}</strong></div>`;
        html += `<div>Masofa d = 10<sup>(m−M+5)/5</sup> ≈ <strong>${Math.round(d).toLocaleString('uz-UZ').replace(/,/g, ' ')} pk</strong> (yulduzlararo yutilish hisobga olinmagan)</div>`;
      } else {
        // fazani 50 ta bin ga bo‘lib, eng xira binni tranzit, qolganlarining medianasini fon deb olamiz
        const NB = 50, sums = new Array(NB).fill(0), cnt = new Array(NB).fill(0);
        obs.forEach(o => { const k = Math.floor(((o.t / P) % 1) * NB); sums[k] += o.mag; cnt[k]++; });
        const means = sums.map((v, k) => cnt[k] > 1 ? v / cnt[k] : null);
        const valid = means.filter(v => v !== null).sort((a, b) => a - b);
        const base = valid.length ? valid[Math.floor(valid.length / 2)] : meanM;
        const minMag = valid.length ? valid[valid.length - 1] : meanM;
        const depth = 1 - Math.pow(10, -0.4 * (minMag - base));
        html += `<div>Tranzit chuqurligining taxminiy bahosi ΔF/F ≈ <strong>${fmt(Math.max(0, depth) * 100, 2)} %</strong> → R<sub>p</sub>/R<sub>*</sub> ≈ √(ΔF/F) = <strong>${fmt(Math.sqrt(Math.max(0, depth)), 3)}</strong></div>`;
        html += '<div style="color:#94A3B8">Baho fazaga yig‘ilgan egri chiziqning eng xira qismi (faza bo‘yicha 1/50 bin) bo‘yicha olinadi, shuning uchun u faqat to‘g‘ri davrda ma’noli.</div>';
      }
      info.innerHTML = html;
    }

    function updateTel() {
      const D = parseFloat(dIn.value), t = parseFloat(expIn.value);
      $('lc-D-val').textContent = D + ' mm';
      $('lc-exp-val').textContent = t + ' s';
      const theta = 1.22 * 550e-9 / (D / 1000) * 206265;
      const gain = Math.pow(D / 7, 2);
      const mlim = 2.7 + 5 * Math.log10(D);
      tel.innerHTML =
        `<div>Ajrata olish chegarasi (550 nm): θ = 1,22·λ/D ≈ <strong>${fmt(theta, 2)}″</strong></div>` +
        `<div>Yorug‘lik yig‘ish ko‘zga nisbatan (ko‘z qorachig‘i 7 mm): <strong>${Math.round(gain).toLocaleString('uz-UZ').replace(/,/g, ' ')} marta</strong></div>` +
        `<div>Vizual chegaraviy kattalik (taxminiy): <strong>${fmt(mlim, 1)}<sup>m</sup></strong></div>` +
        `<div>Bitta o‘lchash xatoligi (model): σ ≈ <strong>${fmt(sigmaMag(), 3)}<sup>m</sup></strong></div>`;
    }

    typeIn.addEventListener('change', () => newStar((Math.random() * 1e9) | 0));
    [dIn, expIn].forEach(el => el.addEventListener('input', () => { if (star) simulate(); }));
    pIn.addEventListener('input', drawAll);
    $('lc-new').addEventListener('click', () => newStar((Math.random() * 1e9) | 0));
    function boxPower(P) { // soddalashtirilgan BLS: eng xira faza bini chuqurligi × √(nuqtalar soni)
      const NB = 50, sums = new Array(NB).fill(0), cnt = new Array(NB).fill(0);
      let tot = 0;
      obs.forEach(o => { const k = Math.floor(((o.t / P) % 1) * NB); sums[k] += o.mag; cnt[k]++; tot += o.mag; });
      const mean = tot / obs.length;
      let best = 0;
      for (let k = 0; k < NB; k++) {
        // ikki qo‘shni binni birga olamiz (tranzit bin chegarasiga tushib qolmasligi uchun)
        const k2 = (k + 1) % NB, n = cnt[k] + cnt[k2];
        if (n < 3) continue;
        const d = (sums[k] + sums[k2]) / n - mean;
        best = Math.max(best, d * Math.sqrt(n));
      }
      return best;
    }

    $('lc-search').addEventListener('click', () => {
      const lo = parseFloat(pIn.min), hi = parseFloat(pIn.max);
      let best = lo;
      if (star.type === 'transit') {
        // tranzit uchun "quti" shaklidagi signalni izlash (BLS g‘oyasi, Kovács va b., 2002)
        let bp = -Infinity;
        for (let P = lo; P <= hi; P += (hi - lo) / 8000) {
          const pw = boxPower(P);
          if (pw > bp) { bp = pw; best = P; }
        }
      } else {
        // Sefeid uchun faza dispersiyasini minimallashtirish (PDM, Stellingwerf, 1978)
        let bt = Infinity;
        for (let P = lo; P <= hi; P += (hi - lo) / 6000) {
          const th = pdm(P);
          if (th < bt) { bt = th; best = P; }
        }
        // PDM davrning karralilarida (2P, 3P) ham minimum beradi — eng qisqa mos davrni tanlaymiz
        for (const k of [3, 2]) {
          const cand = best / k;
          if (cand >= lo && pdm(cand) <= bt * 1.15) { best = cand; break; }
        }
      }
      pIn.value = best;
      drawAll();
    });
    $('lc-answer').addEventListener('click', () => {
      if (!star) return;
      const txt = star.type === 'cepheid'
        ? `Haqiqiy davr ${fmt(star.P, 3)} sutka, masofa ${Math.round(star.d).toLocaleString('uz-UZ').replace(/,/g, ' ')} pk.`
        : `Haqiqiy davr ${fmt(star.P, 3)} sutka, R_p/R_* = ${fmt(star.k, 3)} (chuqurlik ${fmt(star.k * star.k * 100, 2)} %).`;
      $('lc-answer-out').textContent = txt;
    });
    newStar(20261030);
    window.addEventListener('resize', drawAll);
    window.astroLcRedraw = drawAll;
  }

  function init() { initHR(); initSpectrum(); initLightCurve(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
