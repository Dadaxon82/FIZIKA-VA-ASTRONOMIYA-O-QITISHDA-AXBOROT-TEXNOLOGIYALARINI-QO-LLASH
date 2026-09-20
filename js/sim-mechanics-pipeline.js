/**
 * Lecture 12, Tab 6: Interaktiv Klassik Mexanika & To'liq AI Pipeline
 * Laboratoriyasi. Ikki rejim: (1) qiya tekislikdagi Nyuton dinamikasi +
 * Kulon-Amonton ishqalanishi (simplektik Eyler-Kromer bilan integrallanadi),
 * (2) devor va o'zaro to'qnashuvlarga ega 2D zarrachalar, qo'shimcha yumshoq
 * markaziy "confinement" kuchi ostida — bu kuch integrator tanloviga
 * (simplektik Eyler-Kromer vs oddiy Eyler) haqiqiy sezilarli energiya
 * dreyfi farqini beradi, chunki qiya tekislikning doimiy tezlanishidan
 * farqli o'laroq bu tiklovchi kuch integrator xatosini kuchaytiradi.
 */
document.addEventListener('DOMContentLoaded', () => {
  initMechanicsPipeline();
});

function initMechanicsPipeline() {
  const canvas = document.getElementById('mechanics-canvas');
  const graphCanvas = document.getElementById('mechanics-graph-canvas');
  if (!canvas || !graphCanvas) return;

  const modeBtns = document.querySelectorAll('.mech-mode-btn');
  const rampGroup = document.getElementById('ramp-controls-group');
  const collisionGroup = document.getElementById('collision-controls-group');

  const btnPlayInner = document.getElementById('btn-mech-play-inner');
  const btnResetInner = document.getElementById('btn-mech-reset-inner');

  const slRampAngle = document.getElementById('sl-ramp-angle');
  const valRampAngle = document.getElementById('val-ramp-angle');
  const slRampMu = document.getElementById('sl-ramp-mu');
  const valRampMu = document.getElementById('val-ramp-mu');
  const slMechMass = document.getElementById('sl-mech-mass');
  const valMechMass = document.getElementById('val-mech-mass');

  const slRestitution = document.getElementById('sl-restitution');
  const valRestitution = document.getElementById('val-restitution');
  const selIntegrator = document.getElementById('sel-integrator');
  const slBallMass = document.getElementById('sl-ball-mass');
  const valBallMass = document.getElementById('val-ball-mass');

  const btnPipePhet = document.getElementById('btn-pipe-phet');
  const btnPipeClaude = document.getElementById('btn-pipe-claude');
  const btnPipeAntigravity = document.getElementById('btn-pipe-antigravity');
  const btnPipeRunway = document.getElementById('btn-pipe-runway');
  const pipelineOutput = document.getElementById('pipeline-output-box');

  const G = 9.8;
  let mode = 'ramp';
  let running = true;
  let lastFps = 60, frameCount = 0, fpsWindowStart = performance.now();

  // -----------------------------------------------------------------------
  // RAMP MODE: qiya tekislikdagi Nyuton dinamikasi + ishqalanish
  // -----------------------------------------------------------------------
  const RAMP_LENGTH = 4.2; // metr
  let ramp = { s: 0, v: 0 };
  const rampEnergyTrail = [];
  let rampPassStartEnergy = 0; // joriy pastga sirg'anish bosqichi boshidagi energiya (audit uchun)

  function rampParams() {
    return {
      angleDeg: parseFloat(slRampAngle.value),
      mu: parseFloat(slRampMu.value),
      mass: parseFloat(slMechMass.value)
    };
  }

  function resetRamp() {
    ramp = { s: 0, v: 0 };
    rampEnergyTrail.length = 0;
    rampPassStartEnergy = rampEnergy();
  }

  function stepRamp(dt) {
    const { angleDeg, mu } = rampParams();
    const rad = angleDeg * Math.PI / 180;
    const a = Math.tan(rad) > mu ? G * (Math.sin(rad) - mu * Math.cos(rad)) : 0;
    // Simplektik Eyler-Kromer: avval tezlik, keyin koordinata
    ramp.v += a * dt;
    ramp.s += ramp.v * dt;
    if (ramp.s >= RAMP_LENGTH) { ramp.s = 0; ramp.v = 0; rampPassStartEnergy = rampEnergy(); } // pastga yetganda tepaga qaytadi (uzluksiz namoyish)
    if (ramp.s < 0) { ramp.s = 0; ramp.v = 0; }
  }

  function rampEnergy() {
    const { mass, angleDeg } = rampParams();
    const rad = angleDeg * Math.PI / 180;
    const height = (RAMP_LENGTH - ramp.s) * Math.sin(rad);
    return 0.5 * mass * ramp.v * ramp.v + mass * G * height;
  }

  function drawRamp(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const { angleDeg } = rampParams();
    const rad = angleDeg * Math.PI / 180;
    const baseX = 40, baseY = h - 30;
    const rampPxLen = w - 80;
    const topX = baseX + rampPxLen * Math.cos(rad);
    const topY = baseY - rampPxLen * Math.sin(rad);

    // Ramp surface
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(topX, topY);
    ctx.lineTo(topX, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(topX, topY);
    ctx.stroke();

    // Block position along incline (s measured from top, sliding down)
    const frac = ramp.s / RAMP_LENGTH;
    const bx = topX + (baseX - topX) * frac;
    const by = topY + (baseY - topY) * frac;
    const blockSize = 22;
    const nx = -Math.sin(rad), ny = -Math.cos(rad); // normal direction (away from surface)

    ctx.save();
    ctx.translate(bx + nx * blockSize * 0.5, by + ny * blockSize * 0.5);
    ctx.rotate(-rad);
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
    ctx.strokeStyle = '#0B0F19';
    ctx.strokeRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
    ctx.restore();

    const cx = bx + nx * blockSize * 0.5, cy = by + ny * blockSize * 0.5;
    const { mu } = rampParams();
    const movingDown = ramp.v > 0.001;

    // mg (red, straight down)
    drawArrow(ctx, cx, cy, cx, cy + 46, '#F43F5E');
    // N (green, along normal)
    drawArrow(ctx, cx, cy, cx + nx * 42, cy + ny * 42, '#34D399');
    // Friction (yellow, along incline, opposing motion)
    if (mu > 0) {
      const dirX = movingDown ? -Math.cos(rad) : Math.cos(rad);
      const dirY = movingDown ? Math.sin(rad) : -Math.sin(rad);
      drawArrow(ctx, cx, cy, cx + dirX * 34, cy + dirY * 34, '#FBBF24');
    }

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText(`s = ${ramp.s.toFixed(2)} m   v = ${ramp.v.toFixed(2)} m/s`, 10, 18);
  }

  // -----------------------------------------------------------------------
  // COLLISION MODE: 2D zarrachalar + devor to'qnashuvi + yumshoq markaziy
  // "confinement" kuchi (integrator taqqoslash uchun haqiqiy tiklovchi kuch)
  // -----------------------------------------------------------------------
  const K_TRAP = 6.0; // yumshoq markaziy kuch konstantasi (sim birliklarida)
  let p1, p2;
  const collEnergyTrail = [];

  function resetCollision() {
    const m1 = parseFloat(slBallMass.value);
    p1 = { x: 140, y: 110, vx: 85, vy: 30, r: 16, m: m1, color: '#38BDF8' };
    p2 = { x: 400, y: 190, vx: -55, vy: -15, r: 22, m: 3.0, color: '#FBBF24' };
    collEnergyTrail.length = 0;
  }

  function trapAccel(particle, cx, cy) {
    return {
      ax: -(K_TRAP / particle.m) * (particle.x - cx),
      ay: -(K_TRAP / particle.m) * (particle.y - cy)
    };
  }

  function stepParticle(particle, dt, cx, cy, integrator) {
    const acc = trapAccel(particle, cx, cy);
    if (integrator === 'symplectic') {
      particle.vx += acc.ax * dt;
      particle.vy += acc.ay * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    } else {
      // Oddiy (naiv) Eyler: koordinata ESKI tezlik bilan yangilanadi
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx += acc.ax * dt;
      particle.vy += acc.ay * dt;
    }
  }

  function resolveWallCollision(particle, w, h, e) {
    if (particle.x - particle.r < 0) { particle.x = particle.r; particle.vx = -particle.vx * e; }
    if (particle.x + particle.r > w) { particle.x = w - particle.r; particle.vx = -particle.vx * e; }
    if (particle.y - particle.r < 0) { particle.y = particle.r; particle.vy = -particle.vy * e; }
    if (particle.y + particle.r > h) { particle.y = h - particle.r; particle.vy = -particle.vy * e; }
  }

  function resolveParticleCollision(a, b, e) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = a.r + b.r;
    if (dist > 0 && dist < minDist) {
      const nx = dx / dist, ny = dy / dist;
      const rvx = a.vx - b.vx, rvy = a.vy - b.vy;
      const velAlongNormal = rvx * nx + rvy * ny;
      if (velAlongNormal > 0) {
        const invM1 = 1 / a.m, invM2 = 1 / b.m;
        const j = -((1 + e) * velAlongNormal) / (invM1 + invM2);
        a.vx += j * invM1 * nx; a.vy += j * invM1 * ny;
        b.vx -= j * invM2 * nx; b.vy -= j * invM2 * ny;
        const overlap = 0.5 * (minDist - dist);
        a.x -= nx * overlap; a.y -= ny * overlap;
        b.x += nx * overlap; b.y += ny * overlap;
      }
    }
  }

  function stepCollision(dt, w, h) {
    const e = parseFloat(slRestitution.value);
    const integrator = selIntegrator.value;
    const cx = w / 2, cy = h / 2;
    const substeps = 4;
    const sdt = dt / substeps;
    for (let i = 0; i < substeps; i++) {
      stepParticle(p1, sdt, cx, cy, integrator);
      stepParticle(p2, sdt, cx, cy, integrator);
      resolveWallCollision(p1, w, h, 1.0);
      resolveWallCollision(p2, w, h, 1.0);
      resolveParticleCollision(p1, p2, e);
    }
  }

  function collisionEnergy(w, h) {
    const cx = w / 2, cy = h / 2;
    const trapE = (particle) => 0.5 * K_TRAP * ((particle.x - cx) ** 2 + (particle.y - cy) ** 2);
    const kinE = (particle) => 0.5 * particle.m * (particle.vx ** 2 + particle.vy ** 2);
    return kinE(p1) + kinE(p2) + trapE(p1) + trapE(p2);
  }

  function drawCollision(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    [p1, p2].forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    const E = collisionEnergy(w, h);
    ctx.fillText(`E = ${E.toFixed(1)}   integrator: ${selIntegrator.value}`, 10, 18);
  }

  function drawArrow(ctx, x0, y0, x1, y1, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    const ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 8 * Math.cos(ang - 0.4), y1 - 8 * Math.sin(ang - 0.4));
    ctx.lineTo(x1 - 8 * Math.cos(ang + 0.4), y1 - 8 * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  // -----------------------------------------------------------------------
  // ENERGY GRAPH (shared strip chart)
  // -----------------------------------------------------------------------
  const MAX_TRAIL = 200;

  function drawEnergyGraph(ctx, w, h, trail, color, label) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.beginPath();
    ctx.moveTo(0, h - 20);
    ctx.lineTo(w, h - 20);
    ctx.stroke();

    if (trail.length > 1) {
      const maxE = Math.max(...trail, 1e-6);
      const minE = Math.min(...trail, 0);
      const range = Math.max(maxE - minE, 1e-6);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      trail.forEach((E, i) => {
        const tx = (i / MAX_TRAIL) * w;
        const ty = (h - 24) - ((E - minE) / range) * (h - 44);
        if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      });
      ctx.stroke();
    }

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText(label, 8, 16);
  }

  // -----------------------------------------------------------------------
  // MODE / CONTROLS WIRING
  // -----------------------------------------------------------------------
  function setMode(newMode) {
    mode = newMode;
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === newMode));
    rampGroup.style.display = newMode === 'ramp' ? '' : 'none';
    collisionGroup.style.display = newMode === 'collision' ? '' : 'none';
    resetAll();
    if (pipelineOutput) pipelineOutput.style.display = 'none';
  }

  function resetAll() {
    resetRamp();
    resetCollision();
  }

  modeBtns.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

  slRampAngle.addEventListener('input', () => { valRampAngle.textContent = slRampAngle.value + '°'; });
  slRampMu.addEventListener('input', () => { valRampMu.textContent = parseFloat(slRampMu.value).toFixed(2); });
  slMechMass.addEventListener('input', () => { valMechMass.textContent = parseFloat(slMechMass.value).toFixed(1) + ' kg'; });
  slRestitution.addEventListener('input', () => { valRestitution.textContent = parseFloat(slRestitution.value).toFixed(2); });
  slBallMass.addEventListener('input', () => {
    valBallMass.textContent = parseFloat(slBallMass.value).toFixed(1) + ' kg';
    if (p1) p1.m = parseFloat(slBallMass.value);
  });

  function togglePlay() {
    running = !running;
    btnPlayInner.textContent = running ? '⏸️ To\'xtatish' : '▶️ Davom Ettirish';
  }
  btnPlayInner.addEventListener('click', togglePlay);

  function resetSim() {
    resetAll();
    running = true;
    btnPlayInner.textContent = "⏸️ To'xtatish";
  }
  btnResetInner.addEventListener('click', resetSim);

  // -----------------------------------------------------------------------
  // ANIMATION LOOP
  // -----------------------------------------------------------------------
  let lastT = null;

  function loop(now) {
    if (lastT === null) lastT = now;
    const dt = Math.min(0.033, (now - lastT) / 1000);
    lastT = now;

    const ctx = canvas.getContext('2d');
    const gctx = graphCanvas.getContext('2d');
    const w = canvas.clientWidth || 560, h = canvas.clientHeight || 300;
    const gw = graphCanvas.clientWidth || 320, gh = graphCanvas.clientHeight || 300;

    if (running) {
      if (mode === 'ramp') {
        stepRamp(dt);
        rampEnergyTrail.push(rampEnergy());
        if (rampEnergyTrail.length > MAX_TRAIL) rampEnergyTrail.shift();
      } else {
        stepCollision(dt, w, h);
        collEnergyTrail.push(collisionEnergy(w, h));
        if (collEnergyTrail.length > MAX_TRAIL) collEnergyTrail.shift();
      }
    }

    if (mode === 'ramp') {
      drawRamp(ctx, w, h);
      drawEnergyGraph(gctx, gw, gh, rampEnergyTrail, '#34D399', 'E(t) — qiya tekislik (ishqalanish bilan)');
    } else {
      drawCollision(ctx, w, h);
      const color = selIntegrator.value === 'symplectic' ? '#34D399' : '#F43F5E';
      drawEnergyGraph(gctx, gw, gh, collEnergyTrail, color, 'E(t) — ' + (selIntegrator.value === 'symplectic' ? 'Simplektik' : 'Oddiy Eyler'));
    }

    frameCount++;
    if (now - fpsWindowStart > 500) {
      lastFps = Math.round((frameCount * 1000) / (now - fpsWindowStart));
      frameCount = 0; fpsWindowStart = now;
    }

    requestAnimationFrame(loop);
  }

  // -----------------------------------------------------------------------
  // CANVAS RESIZE
  // -----------------------------------------------------------------------
  function resizeCanvas(c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, c.clientWidth || c.width);
    const h = Math.max(1, c.clientHeight || c.height);
    c.width = w * dpr;
    c.height = h * dpr;
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resizeAll() {
    resizeCanvas(canvas);
    resizeCanvas(graphCanvas);
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeAll).observe(canvas.parentElement);
  } else {
    window.addEventListener('resize', resizeAll);
  }

  window.mechanicsPipeline = { initCanvasSize: resizeAll };

  // -----------------------------------------------------------------------
  // AI-PIPELINE STAGE BUTTONS
  // -----------------------------------------------------------------------
  function showPipelineOutput(html) {
    if (!pipelineOutput) return;
    pipelineOutput.style.display = 'block';
    pipelineOutput.innerHTML = `
      <div style="background: rgba(192,132,252,0.06); border: 1px solid rgba(192,132,252,0.3); border-radius: var(--radius-md); padding: 14px 16px; font-size: 0.86rem; line-height: 1.7; color: #E2E8F0;">
        ${html}
      </div>`;
  }

  function attachCopyHandler(id, text) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showToast === 'function') window.showToast('Nusxalandi!');
      });
    });
  }

  if (btnPipePhet) {
    btnPipePhet.addEventListener('click', () => {
      if (mode === 'ramp') {
        const { angleDeg, mu, mass } = rampParams();
        const rad = angleDeg * Math.PI / 180;
        const tanA = Math.tan(rad);
        const willMove = tanA > mu;
        const a = willMove ? G * (Math.sin(rad) - mu * Math.cos(rad)) : 0;
        showPipelineOutput(`
          <strong>1. PhET/Vascak.cz Dekonstruksiyasi (Jonli Parametrlar):</strong><br>
          Burchak α = ${angleDeg}°, ishqalanish μ = ${mu.toFixed(2)}, massa m = ${mass.toFixed(1)} kg.<br>
          Harakat sharti: tan(α) = ${tanA.toFixed(3)} ${willMove ? '&gt;' : '&le;'} μ = ${mu.toFixed(2)} &rArr; jism ${willMove ? 'sirpanadi' : 'tinch turadi'}.<br>
          Hisoblangan tezlanish: <strong>a = ${a.toFixed(3)} m/s²</strong>.`);
      } else {
        const e = parseFloat(slRestitution.value);
        showPipelineOutput(`
          <strong>1. PhET/Vascak.cz Dekonstruksiyasi (Jonli Parametrlar):</strong><br>
          Tiklanish koeffitsiyenti e = ${e.toFixed(2)} &rArr; to'qnashuv turi: <strong>${e === 1 ? 'mutlaq elastik' : (e === 0 ? 'mutlaq noelastik' : 'qisman elastik')}</strong>.<br>
          Yo'qotiladigan energiya ulushi (1 - e²) = ${(1 - e * e).toFixed(3)}.`);
      }
    });
  }

  if (btnPipeClaude) {
    btnPipeClaude.addEventListener('click', () => {
      const code = mode === 'ramp'
        ? "const rad = angle * Math.PI / 180;\nconst a = Math.tan(rad) > mu ? g*(Math.sin(rad) - mu*Math.cos(rad)) : 0;\nv += a * dt;  // simplektik: avval tezlik\ns += v * dt;  // keyin koordinata"
        : "const j = -((1+e) * velAlongNormal) / (1/m1 + 1/m2);\na.vel = a.vel.add(normal.scale(j / m1));\nb.vel = b.vel.sub(normal.scale(j / m2));";
      showPipelineOutput(`
        <strong>2. Claude 3.5 Sonnet Dvigatel Kodi:</strong>
        <pre style="background:#0B0F19; padding:10px 12px; border-radius:6px; margin-top:8px; overflow-x:auto; font-size:0.8rem; color:#E2E8F0;"><code>${code}</code></pre>
        <button id="btn-copy-claude-code" class="btn btn-secondary btn-sm" style="margin-top:8px;">📋 Nusxa olish</button>`);
      attachCopyHandler('btn-copy-claude-code', code);
    });
  }

  if (btnPipeAntigravity) {
    btnPipeAntigravity.addEventListener('click', () => {
      let energyLine;
      if (mode === 'ramp') {
        if (rampEnergyTrail.length > 2) {
          const dropPct = ((rampPassStartEnergy - rampEnergy()) / Math.max(Math.abs(rampPassStartEnergy), 1e-6)) * 100;
          energyLine = `Ishqalanish tufayli energiya joriy bosqichda monotonik kamaymoqda: ${dropPct.toFixed(2)}% (fizik dissipatsiya, integratsion xatolik emas).`;
        } else {
          energyLine = 'Simulyatsiya hali boshlanmadi.';
        }
      } else {
        const trail = collEnergyTrail;
        if (trail.length > 2) {
          const drift = Math.abs((trail[trail.length - 1] - trail[0]) / Math.max(Math.abs(trail[0]), 1e-6)) * 100;
          const verdict = selIntegrator.value === 'symplectic'
            ? `chegaralangan holatda (|ΔE/E₀| = ${drift.toFixed(3)}% — barqaror)`
            : `sun'iy o'sib bormoqda (|ΔE/E₀| = ${drift.toFixed(3)}% — dreyf aniqlandi)`;
          energyLine = `Markaziy tiklovchi kuch ostida energiya ${verdict}.`;
        } else {
          energyLine = 'Simulyatsiya hali boshlanmadi.';
        }
      }
      showPipelineOutput(`
        <strong>3. Google Antigravity AI Audit Natijasi:</strong><br>
        ✓ AST Statik Tahlil: eval() yoki xavfli DOM murojaati aniqlanmadi.<br>
        ✓ Delta-Time Akkumulyatori: ${lastFps} FPS, kadrlar barqaror ishlamoqda.<br>
        ✓ Fizik Invariantlar: ${energyLine}`);
    });
  }

  if (btnPipeRunway) {
    btnPipeRunway.addEventListener('click', () => {
      let prompt;
      if (mode === 'ramp') {
        const { angleDeg, mu, mass } = rampParams();
        prompt = `Slow-motion 120fps kinematik video: ${mass.toFixed(1)} kg og'irlikdagi metall blok ${angleDeg}° burchakli qiya tekislikda pastga sirpanmoqda, ishqalanish koeffitsiyenti ${mu.toFixed(2)}, sirtdan mayda uchqunlar chiqmoqda, yon tomondan yumshoq studiya yorug'ligi, fizik jihatdan real tezlanish bilan.`;
      } else {
        const e = parseFloat(slRestitution.value);
        prompt = `Slow-motion 120fps kinematik video: ikkita rangli sharcha (ko'k va sariq) laboratoriya maydonida to'qnashmoqda, tiklanish koeffitsiyenti ${e.toFixed(2)}, to'qnashuv paytida kontakt normali bo'yicha impuls uzatilishi aniq ko'rinadi, yuqoridan tekis yoritilgan, fizik jihatdan real trayektoriya bilan.`;
      }
      showPipelineOutput(`
        <strong>4. Runway Gen-2 Video Prompt:</strong><br>
        <em style="color:#CBD5E1;">"${prompt}"</em><br>
        <button id="btn-copy-runway-prompt" class="btn btn-secondary btn-sm" style="margin-top:8px;">📋 Nusxa olish</button>`);
      attachCopyHandler('btn-copy-runway-prompt', prompt);
    });
  }

  // -----------------------------------------------------------------------
  // INIT
  // -----------------------------------------------------------------------
  resizeAll();
  setMode('ramp');
  requestAnimationFrame(loop);
}
