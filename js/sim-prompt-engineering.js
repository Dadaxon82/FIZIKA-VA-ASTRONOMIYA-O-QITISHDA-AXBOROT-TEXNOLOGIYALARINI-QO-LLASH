/**
 * Lecture 9, Tab 6: HTML5 Canvas Prompt Workbench & Live Code Sandbox.
 * 4 preset stsenariy (projectile, spring, collision, wave), har biri
 * uchun "Noaniq" (vague) va "Aniq" (structured) promptlarga mos ikki xil
 * ES6 kod namunasi. Kod muharriridagi matn haqiqatan ham ishga tushiriladi
 * (Function konstruktori orqali sandboxlangan holda) — Noaniq namunalar
 * atayin fizik jihatdan beqaror (energiya drift, ekrandan chiqib ketish,
 * penetratsiya), Aniq namunalar esa barqaror va invariantlarni saqlaydi.
 */
document.addEventListener('DOMContentLoaded', () => {
  initPromptEngineeringLab();
});

function initPromptEngineeringLab() {
  const canvas = document.getElementById('prompt-sandbox-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const presetBtns = document.querySelectorAll('.preset-btn');
  const btnVague = document.getElementById('btn-prompt-vague');
  const btnStructured = document.getElementById('btn-prompt-structured');
  const modeBadge = document.getElementById('prompt-mode-badge');
  const promptTextEl = document.getElementById('current-prompt-text');
  const commentBoxEl = document.getElementById('prompt-comment-box');
  const codeEditor = document.getElementById('prompt-code-editor');
  const errorLog = document.getElementById('sandbox-error-log');
  const btnRun = document.getElementById('btn-run-code');
  const btnPlay = document.getElementById('btn-toggle-play');
  const btnReset = document.getElementById('btn-reset-sim');
  const chkVectors = document.getElementById('chk-show-vectors');
  const chkTrails = document.getElementById('chk-show-trails');

  const statFps = document.getElementById('stat-fps');
  const statEnergy = document.getElementById('stat-energy');
  const statVel = document.getElementById('stat-vel');
  const statStatus = document.getElementById('stat-status');

  let currentPreset = 'projectile';
  let currentMode = 'structured';
  let sim = null;
  let isRunning = true;
  let lastTime = null;
  let fpsCounter = 0, fpsTimer = 0, measuredFps = 60;

  const LIBRARY = {
    projectile: {
      vague: {
        prompt: "Menga snaryad otilishini Canvasda ko'rsatadigan JS kod yozib ber.",
        comment: "❌ Aniqlik past: havo qarshiligi yo'q, metr-piksel masshtabi yo'q, yerga urilganda chegara sharti aniqlanmagan — snaryad ekrandan tez chiqib ketadi.",
        code:
`class Sim {
  reset(w, h) {
    this.x = 20; this.y = h - 20;
    this.vx = 90; this.vy = -160;
    this.g = 60;
    this.trail = [];
  }
  update(dt, w, h) {
    this.vy += this.g * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 80) this.trail.shift();
    // Chegara sharti yo'q: snaryad yerdan pastga tushib ketaveradi.
  }
  render(ctx, w, h, opts) {
    if (opts.trails) {
      ctx.strokeStyle = 'rgba(244,63,94,0.4)'; ctx.beginPath();
      this.trail.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI * 2); ctx.fill();
  }
  getTelemetry() {
    const v = Math.hypot(this.vx, this.vy);
    const unstable = this.y > 900 || this.y < -400;
    return { energy: 0.5 * v * v, vel: v, stable: !unstable };
  }
}`
      },
      structured: {
        prompt: "Sen hisoblash mexanikasi mutaxassisisan. HTML5 Canvas uchun 2D snaryad harakatini Semi-implicit Euler usulida modellashtiruvchi ES6 klassini yoz. Parametrlar: g=9.81 m/s^2, aerodinamik qarshilik F_drag = -0.5*rho*Cd*A*|v|*v, restitutsiya e=0.7. Yerga urilganda elastik sakrasin, ekran chegarasidan chiqmasin.",
        comment: "✅ Aniq: havo qarshiligi, masshtablangan gravitatsiya va yerga elastik urilish (e=0.7) hisobga olingan — snaryad ekran ichida barqaror sakraydi.",
        code:
`class Sim {
  reset(w, h) {
    this.x = 20; this.y = h - 20;
    this.vx = 220; this.vy = -320;
    this.g = 480;
    this.drag = 0.35;
    this.restitution = 0.7;
    this.trail = [];
  }
  update(dt, w, h) {
    const speed = Math.hypot(this.vx, this.vy);
    const dragAx = -this.drag * speed * this.vx * 0.01;
    const dragAy = -this.drag * speed * this.vy * 0.01;
    this.vy += this.g * dt;
    this.vx += dragAx * dt;
    this.vy += dragAy * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y > h - 8) { this.y = h - 8; this.vy = -this.vy * this.restitution; }
    if (this.x < 8) { this.x = 8; this.vx = -this.vx * this.restitution; }
    if (this.x > w - 8) { this.x = w - 8; this.vx = -this.vx * this.restitution; }

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 80) this.trail.shift();
  }
  render(ctx, w, h, opts) {
    if (opts.trails) {
      ctx.strokeStyle = 'rgba(52,211,153,0.4)'; ctx.beginPath();
      this.trail.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
    ctx.fillStyle = '#34D399';
    ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI * 2); ctx.fill();
    if (opts.vectors) {
      ctx.strokeStyle = '#F8FAFC'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.vx * 0.15, this.y + this.vy * 0.15);
      ctx.stroke();
    }
  }
  getTelemetry() {
    const v = Math.hypot(this.vx, this.vy);
    return { energy: 0.5 * v * v, vel: v, stable: true };
  }
}`
      }
    },

    spring: {
      vague: {
        prompt: "Prujina harakatini Canvasda animatsiya qiladigan kod yoz.",
        comment: "❌ Noaniq: oddiy (Forward) Eyler integratori dempfirlashsiz ishlatilgan — har kadrda energiya sun'iy ravishda oshib, amplituda cheksiz kattalashadi (raqamli beqarorlik).",
        code:
`class Sim {
  reset(w, h) {
    this.x = 80;
    this.v = 0;
    this.k = 40;
    this.m = 1;
  }
  update(dt, w, h) {
    const a = -(this.k / this.m) * this.x;
    this.x += this.v * dt;
    this.v += a * dt;
  }
  render(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 200, cy); ctx.lineTo(cx + this.x - 20, cy); ctx.stroke();
    ctx.fillStyle = '#F43F5E';
    ctx.fillRect(cx + this.x - 20, cy - 18, 40, 36);
  }
  getTelemetry() {
    const e = 0.5 * this.m * this.v * this.v + 0.5 * this.k * this.x * this.x;
    return { energy: e, vel: Math.abs(this.v), stable: e < 5000 };
  }
}`
      },
      structured: {
        prompt: "HTML5 Canvasda vertikal so'nuvchi prujinali mayatnikni Velocity Verlet usulida modellashtir. Tenglama: m*x'' + c*x' + k*x = m*g. Canvasda prujina spirali dinamik chizilsin, kinetik va potensial energiya balansi real vaqtda monitoring qilinsin.",
        comment: "✅ Aniq: dempfirlash koeffitsiyenti (c) va simplektik (Semi-implicit Euler) integrator qo'llanilgan — tebranish energiyasi bashoratli tarzda kamayib, barqaror muvozanatga keladi.",
        code:
`class Sim {
  reset(w, h) {
    this.x = 100;
    this.v = 0;
    this.k = 30;
    this.m = 1;
    this.c = 0.6;
  }
  update(dt, w, h) {
    const a = (-(this.k / this.m) * this.x) - (this.c / this.m) * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
  }
  render(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 2;
    const coils = 14;
    ctx.beginPath(); ctx.moveTo(cx - 220, cy);
    for (let i = 0; i <= coils; i++) {
      const t = i / coils;
      const px = cx - 220 + t * (220 + this.x - 20);
      const py = cy + (i % 2 === 0 ? -10 : 10);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = '#34D399';
    ctx.fillRect(cx + this.x - 20, cy - 18, 40, 36);
  }
  getTelemetry() {
    const e = 0.5 * this.m * this.v * this.v + 0.5 * this.k * this.x * this.x;
    return { energy: e, vel: Math.abs(this.v), stable: true };
  }
}`
      }
    },

    collision: {
      vague: {
        prompt: "Ikkita to'p to'qnashuvini Canvasda ko'rsat.",
        comment: "❌ Noaniq: to'qnashuvda faqat tezliklar almashtiriladi, penetratsiya (bir-biriga kirib ketish) tuzatilmaydi — to'plar vaqti-vaqti bilan bir-birining ichiga yopishib qoladi.",
        code:
`class Sim {
  reset(w, h) {
    this.b1 = { x: 60, y: h / 2, vx: 140, r: 18 };
    this.b2 = { x: w - 60, y: h / 2, vx: -100, r: 24 };
  }
  update(dt, w, h) {
    for (const b of [this.b1, this.b2]) {
      b.x += b.vx * dt;
      if (b.x - b.r < 0 || b.x + b.r > w) b.vx = -b.vx;
    }
    const dx = this.b2.x - this.b1.x;
    if (Math.abs(dx) < this.b1.r + this.b2.r) {
      const t = this.b1.vx; this.b1.vx = this.b2.vx; this.b2.vx = t;
    }
  }
  render(ctx) {
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(this.b1.x, this.b1.y, this.b1.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath(); ctx.arc(this.b2.x, this.b2.y, this.b2.r, 0, Math.PI * 2); ctx.fill();
  }
  getTelemetry() {
    const v = Math.abs(this.b1.vx) + Math.abs(this.b2.vx);
    return { energy: 0.5 * v * v, vel: v, stable: Math.abs(this.b2.x - this.b1.x) > 2 };
  }
}`
      },
      structured: {
        prompt: "2D fazoda turli massali sharlar to'qnashuvi uchun JavaScript dvigatelini yoz. To'qnashuv impulsi j = -(1+e)*(v_rel . n)/(1/m1 + 1/m2) formulasi va Positional Correction (MTV) orqali penetratsiya bartaraf etilsin. Impuls va kinetik energiya saqlanishi tekshirilsin.",
        comment: "✅ Aniq: impuls asosidagi yechim va MTV positional correction qo'llanilgan — to'plar hech qachon bir-biriga kirib qolmaydi, impuls aniq saqlanadi.",
        code:
`class Sim {
  reset(w, h) {
    this.b1 = { x: 60, y: h / 2, vx: 160, m: 2, r: 18 };
    this.b2 = { x: w - 60, y: h / 2, vx: -110, m: 3, r: 24 };
  }
  update(dt, w, h) {
    for (const b of [this.b1, this.b2]) {
      b.x += b.vx * dt;
      if (b.x - b.r < 0) { b.x = b.r; b.vx = -b.vx; }
      if (b.x + b.r > w) { b.x = w - b.r; b.vx = -b.vx; }
    }
    const b1 = this.b1, b2 = this.b2;
    const dx = b2.x - b1.x;
    const dist = Math.abs(dx);
    const minDist = b1.r + b2.r;
    if (dist < minDist && dist > 0) {
      const n = dx / dist;
      const vRel = b1.vx - b2.vx;
      const vNorm = vRel * n;
      if (vNorm > 0) {
        const e = 0.9;
        const invM1 = 1 / b1.m, invM2 = 1 / b2.m;
        const j = -(1 + e) * vNorm / (invM1 + invM2);
        b1.vx += j * invM1 * n;
        b2.vx -= j * invM2 * n;
      }
      const penetration = minDist - dist;
      const totalInv = 1 / b1.m + 1 / b2.m;
      b1.x -= penetration * ((1 / b1.m) / totalInv) * n;
      b2.x += penetration * ((1 / b2.m) / totalInv) * n;
    }
  }
  render(ctx) {
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(this.b1.x, this.b1.y, this.b1.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath(); ctx.arc(this.b2.x, this.b2.y, this.b2.r, 0, Math.PI * 2); ctx.fill();
  }
  getTelemetry() {
    const p = this.b1.m * this.b1.vx + this.b2.m * this.b2.vx;
    const v = Math.abs(this.b1.vx) + Math.abs(this.b2.vx);
    return { energy: Math.abs(p), vel: v, stable: true };
  }
}`
      }
    },

    wave: {
      vague: {
        prompt: "Ikki tirqishli to'lqin naqshini Canvasda chiz.",
        comment: "❌ Noaniq: faqat bitta tirqish (yorug'lik nuqtasi) chizilgan, interferensiya hisoblanmagan — natija haqiqiy Yung tajribasi naqshini aks ettirmaydi.",
        code:
`class Sim {
  reset(w, h) { this.t = 0; }
  update(dt) { this.t += dt; }
  render(ctx, w, h) {
    ctx.fillStyle = '#0B0F19'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const bright = 128 + 100 * Math.sin(y * 0.05 + this.t);
      ctx.fillStyle = 'rgb(' + bright + ',' + bright + ',' + bright + ')';
      ctx.fillRect(w - 40, y, 30, 1);
    }
  }
  getTelemetry() { return { energy: 0, vel: 0, stable: false }; }
}`
      },
      structured: {
        prompt: "Yung tajribasidagi ikki tirqishli to'lqin interferensiyasini HTML5 Canvasda 2D fazoviy maydon sifatida render qil. O'ng tomonda ekran intensivligi I(y) = I0 * cos^2(delta/2) grafigi va rangli spektr chizilsin.",
        comment: "✅ Aniq: ikkala tirqishdan kelayotgan to'lqinlar yo'l farqiga asosan qo'shiladi va haqiqiy interferensiya chiziqlari (maksimum/minimumlar) hosil bo'ladi.",
        code:
`class Sim {
  reset(w, h) {
    this.t = 0;
    this.lambda = 22;
    this.d = 60;
    this.slitX = w * 0.3;
  }
  update(dt) { this.t += dt; }
  render(ctx, w, h) {
    ctx.fillStyle = '#0B0F19'; ctx.fillRect(0, 0, w, h);
    const s1y = h / 2 - this.d / 2, s2y = h / 2 + this.d / 2;
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(this.slitX, s1y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.slitX, s2y, 3, 0, Math.PI * 2); ctx.fill();

    for (let y = 0; y < h; y++) {
      const r1 = Math.hypot(w - 20 - this.slitX, y - s1y);
      const r2 = Math.hypot(w - 20 - this.slitX, y - s2y);
      const delta = (2 * Math.PI / this.lambda) * (r2 - r1);
      const intensity = Math.pow(Math.cos(delta / 2), 2);
      const bright = Math.round(255 * intensity);
      ctx.fillStyle = 'rgb(' + bright + ',' + bright + ',255)';
      ctx.fillRect(w - 40, y, 30, 1);
    }
  }
  getTelemetry() { return { energy: 1, vel: 0, stable: true }; }
}`
      }
    }
  };

  function loadPreset(preset, mode) {
    currentPreset = preset;
    currentMode = mode;
    const entry = LIBRARY[preset][mode];

    promptTextEl.textContent = entry.prompt;
    commentBoxEl.textContent = entry.comment;
    commentBoxEl.style.borderColor = mode === 'structured' ? '#34D399' : '#F43F5E';
    commentBoxEl.style.color = mode === 'structured' ? '#34D399' : '#FCA5A5';
    commentBoxEl.style.background = mode === 'structured' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(244, 63, 94, 0.08)';

    modeBadge.textContent = mode === 'structured' ? '✅ Aniq Fizik (Structured) Prompt' : "❌ Noaniq (Vague) Prompt";
    modeBadge.className = 'badge ' + (mode === 'structured' ? 'badge-emerald' : 'badge-rose');

    codeEditor.value = entry.code;
    runCode();
  }

  function runCode() {
    try {
      const factory = new Function(codeEditor.value + '\nreturn Sim;');
      const SimClass = factory();
      const instance = new SimClass();
      instance.reset(canvas.clientWidth || 700, canvas.clientHeight || 380);
      sim = instance;
      errorLog.textContent = '● Sandbox holati: Tayyor';
      errorLog.style.color = '#34D399';
    } catch (err) {
      sim = null;
      errorLog.textContent = '⚠ Xato: ' + err.message;
      errorLog.style.color = '#F43F5E';
    }
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPreset(btn.getAttribute('data-preset'), currentMode);
    });
  });

  if (btnVague) btnVague.addEventListener('click', () => {
    btnVague.classList.add('active'); btnStructured.classList.remove('active');
    loadPreset(currentPreset, 'vague');
  });
  if (btnStructured) btnStructured.addEventListener('click', () => {
    btnStructured.classList.add('active'); btnVague.classList.remove('active');
    loadPreset(currentPreset, 'structured');
  });
  if (btnRun) btnRun.addEventListener('click', runCode);
  if (btnReset) btnReset.addEventListener('click', () => {
    if (sim) sim.reset(canvas.clientWidth || 700, canvas.clientHeight || 380);
  });
  if (btnPlay) btnPlay.addEventListener('click', () => {
    isRunning = !isRunning;
    btnPlay.textContent = isRunning ? '⏸ Pauza' : '▶ Davom ettirish';
    lastTime = null;
  });

  function loop(currentTime) {
    if (lastTime === null) { lastTime = currentTime; requestAnimationFrame(loop); return; }
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    if (dt > 0.05) dt = 0.05;

    fpsCounter++; fpsTimer += dt;
    if (fpsTimer >= 0.5) { measuredFps = fpsCounter / fpsTimer; fpsCounter = 0; fpsTimer = 0; }

    const w = canvas.clientWidth || 700, h = canvas.clientHeight || 380;
    ctx.clearRect(0, 0, w, h);

    if (sim) {
      if (isRunning) {
        try { sim.update(dt, w, h); } catch (err) { errorLog.textContent = '⚠ Ishga tushirish xatosi: ' + err.message; errorLog.style.color = '#F43F5E'; }
      }
      try {
        sim.render(ctx, w, h, { vectors: chkVectors ? chkVectors.checked : true, trails: chkTrails ? chkTrails.checked : true });
      } catch (err) { /* render xatosi konsolga chiqmaydi, faqat sandbox jimgina to'xtaydi */ }

      const tel = (typeof sim.getTelemetry === 'function') ? sim.getTelemetry() : { energy: 0, vel: 0, stable: true };
      if (statEnergy) statEnergy.textContent = tel.energy.toFixed(2) + ' J';
      if (statVel) statVel.textContent = tel.vel.toFixed(2) + ' m/s';
      if (statStatus) {
        statStatus.textContent = tel.stable ? '● BARQAROR' : '● BEQAROR';
        statStatus.style.color = tel.stable ? '#34D399' : '#F43F5E';
      }
    }
    if (statFps) statFps.textContent = Math.round(measuredFps) + ' FPS';

    requestAnimationFrame(loop);
  }

  const resizeFn = setupResponsiveCanvas(canvas, null, () => {
    if (sim) sim.reset(canvas.clientWidth || 700, canvas.clientHeight || 380);
  });

  loadPreset(currentPreset, currentMode);
  requestAnimationFrame(loop);

  window.promptEngLab = {
    initCanvasSize: () => resizeFn()
  };
}
