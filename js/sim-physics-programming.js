/**
 * Lecture 8, Tab 6: 2D Vektorlar va To'qnashuvlar Interaktiv Laboratoriyasi.
 * Sahifaning 4-bo'limida keltirilgan Vector2D / RigidBody2D / resolveCollision
 * pseudokodiga mos ravishda: impuls asosidagi 2D elastik/noelastik to'qnashuv
 * yechimi (v_norm shartli tekshiruv) va MTV positional correction (penetratsiyani
 * massalarga mutanosib yo'qotish) amalga oshirilgan.
 */
document.addEventListener('DOMContentLoaded', () => {
  initPhysicsProgrammingLab();
});

function initPhysicsProgrammingLab() {
  const canvas = document.getElementById('collision-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const presetSelect = document.getElementById('prog-preset');
  const restitutionSlider = document.getElementById('prog-restitution');
  const restitutionVal = document.getElementById('prog-restitution-val');
  const m1Slider = document.getElementById('prog-m1');
  const m1Val = document.getElementById('prog-m1-val');
  const m2Slider = document.getElementById('prog-m2');
  const m2Val = document.getElementById('prog-m2-val');
  const vecToggle = document.getElementById('prog-vec-toggle');
  const trailToggle = document.getElementById('prog-trail-toggle');
  const btnPlay = document.getElementById('prog-play-btn');
  const btnReset = document.getElementById('prog-reset-btn');

  const hudEnergy = document.getElementById('prog-hud-energy');
  const hudMom = document.getElementById('prog-hud-mom');
  const hudColl = document.getElementById('prog-hud-coll');
  const hudV1 = document.getElementById('prog-hud-v1');
  const hudV2 = document.getElementById('prog-hud-v2');

  class Vector2D {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  }

  class RigidBody2D {
    constructor(x, y, vx, vy, mass, radius, color) {
      this.pos = new Vector2D(x, y);
      this.vel = new Vector2D(vx, vy);
      this.m = mass;
      this.invM = mass > 0 ? 1 / mass : 0;
      this.r = radius;
      this.color = color;
      this.trail = [];
    }
  }

  let bodies = [];
  let isRunning = true;
  let collisionCount = 0;
  let lastTime = null;

  function radiusForMass(m) {
    return 10 + Math.sqrt(m) * 6;
  }

  function buildPreset() {
    const preset = presetSelect.value;
    const m1 = parseFloat(m1Slider.value);
    const m2 = parseFloat(m2Slider.value);
    const w = canvas.clientWidth || 900;
    const h = canvas.clientHeight || 450;
    collisionCount = 0;

    if (preset === 'head-on') {
      return [
        new RigidBody2D(w * 0.2, h * 0.5, 140, 0, m1, radiusForMass(m1), '#38BDF8'),
        new RigidBody2D(w * 0.8, h * 0.5, -140, 0, m2, radiusForMass(m2), '#FBBF24')
      ];
    }
    if (preset === 'heavy-light') {
      m1Slider.value = 15.0; m1Val.textContent = '15.0 kg';
      m2Slider.value = 3.0; m2Val.textContent = '3.0 kg';
      return [
        new RigidBody2D(w * 0.2, h * 0.5, 100, 0, 15.0, radiusForMass(15.0), '#38BDF8'),
        new RigidBody2D(w * 0.8, h * 0.5, -60, 0, 3.0, radiusForMass(3.0), '#FBBF24')
      ];
    }
    if (preset === 'oblique') {
      return [
        new RigidBody2D(w * 0.18, h * 0.25, 120, 70, m1, radiusForMass(m1), '#38BDF8'),
        new RigidBody2D(w * 0.82, h * 0.75, -110, -50, m2, radiusForMass(m2), '#FBBF24')
      ];
    }
    // multi: ko'p zarrachali gaz/bilyard modeli
    const colors = ['#38BDF8', '#FBBF24', '#34D399', '#F43F5E', '#C084FC', '#F97316'];
    const list = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const m = 1.5 + Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 90;
      list.push(new RigidBody2D(
        60 + Math.random() * (w - 120),
        60 + Math.random() * (h - 120),
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        m,
        radiusForMass(m),
        colors[i % colors.length]
      ));
    }
    return list;
  }

  function resetSimulation() {
    bodies = buildPreset();
    lastTime = null;
  }

  // ---- Boshqaruvlar ----
  if (presetSelect) presetSelect.addEventListener('change', resetSimulation);
  if (btnReset) btnReset.addEventListener('click', resetSimulation);
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      isRunning = !isRunning;
      btnPlay.textContent = isRunning ? "⏸ To'xtatish" : "▶ Davom ettirish";
      lastTime = null;
    });
  }
  if (restitutionSlider) {
    restitutionSlider.addEventListener('input', () => {
      restitutionVal.textContent = parseFloat(restitutionSlider.value).toFixed(2);
    });
  }
  if (m1Slider) {
    m1Slider.addEventListener('input', () => {
      const m = parseFloat(m1Slider.value);
      m1Val.textContent = m.toFixed(1) + ' kg';
      if (bodies[0] && presetSelect.value !== 'multi') {
        bodies[0].m = m; bodies[0].invM = 1 / m; bodies[0].r = radiusForMass(m);
      }
    });
  }
  if (m2Slider) {
    m2Slider.addEventListener('input', () => {
      const m = parseFloat(m2Slider.value);
      m2Val.textContent = m.toFixed(1) + ' kg';
      if (bodies[1] && presetSelect.value !== 'multi') {
        bodies[1].m = m; bodies[1].invM = 1 / m; bodies[1].r = radiusForMass(m);
      }
    });
  }

  // ---- Fizika: sahifaning 4-bo'limidagi resolveCollision pseudokodi ----
  function resolveCollision(b1, b2, restitution) {
    const dx = b1.pos.x - b2.pos.x;
    const dy = b1.pos.y - b2.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = b1.r + b2.r;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const vRelX = b1.vel.x - b2.vel.x;
      const vRelY = b1.vel.y - b2.vel.y;
      const vNorm = vRelX * nx + vRelY * ny;

      if (vNorm < 0) {
        const impulse = -(1 + restitution) * vNorm / (b1.invM + b2.invM);
        b1.vel.x += (impulse * b1.invM) * nx;
        b1.vel.y += (impulse * b1.invM) * ny;
        b2.vel.x -= (impulse * b2.invM) * nx;
        b2.vel.y -= (impulse * b2.invM) * ny;
        collisionCount++;
      }

      const penetration = minDist - dist;
      const totalInvM = b1.invM + b2.invM;
      if (totalInvM > 0) {
        b1.pos.x += (penetration * (b1.invM / totalInvM)) * nx;
        b1.pos.y += (penetration * (b1.invM / totalInvM)) * ny;
        b2.pos.x -= (penetration * (b2.invM / totalInvM)) * nx;
        b2.pos.y -= (penetration * (b2.invM / totalInvM)) * ny;
      }
    }
  }

  function resolveWallCollision(b, w, h, restitution) {
    if (b.pos.x - b.r < 0) { b.pos.x = b.r; b.vel.x = -b.vel.x * restitution; }
    else if (b.pos.x + b.r > w) { b.pos.x = w - b.r; b.vel.x = -b.vel.x * restitution; }
    if (b.pos.y - b.r < 0) { b.pos.y = b.r; b.vel.y = -b.vel.y * restitution; }
    else if (b.pos.y + b.r > h) { b.pos.y = h - b.r; b.vel.y = -b.vel.y * restitution; }
  }

  function updatePhysics(dt) {
    const restitution = parseFloat(restitutionSlider.value);
    const w = canvas.clientWidth || 900;
    const h = canvas.clientHeight || 450;

    for (const b of bodies) {
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      resolveWallCollision(b, w, h, restitution);

      b.trail.push({ x: b.pos.x, y: b.pos.y });
      if (b.trail.length > 60) b.trail.shift();
    }

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        resolveCollision(bodies[i], bodies[j], restitution);
      }
    }
  }

  // ---- Chizish ----
  function drawArrow(fromX, fromY, toX, toY, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 9 * Math.cos(angle - 0.4), toY - 9 * Math.sin(angle - 0.4));
    ctx.lineTo(toX - 9 * Math.cos(angle + 0.4), toY - 9 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  function drawScene() {
    const w = canvas.clientWidth || 900;
    const h = canvas.clientHeight || 450;
    ctx.clearRect(0, 0, w, h);

    const showVec = vecToggle ? vecToggle.checked : true;
    const showTrail = trailToggle ? trailToggle.checked : true;

    for (const b of bodies) {
      if (showTrail && b.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 2;
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) ctx.lineTo(b.trail[i].x, b.trail[i].y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.arc(b.pos.x, b.pos.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      if (showVec) {
        const speed = b.vel.mag();
        if (speed > 1) {
          const scale = 0.35;
          drawArrow(b.pos.x, b.pos.y, b.pos.x + b.vel.x * scale, b.pos.y + b.vel.y * scale, '#F8FAFC');
        }
      }
    }
  }

  function updateHUD() {
    let totalEnergy = 0;
    let px = 0, py = 0;
    for (const b of bodies) {
      const v2 = b.vel.x * b.vel.x + b.vel.y * b.vel.y;
      totalEnergy += 0.5 * b.m * v2;
      px += b.m * b.vel.x;
      py += b.m * b.vel.y;
    }
    if (hudEnergy) hudEnergy.textContent = (totalEnergy / 1000).toFixed(2) + ' kJ';
    if (hudMom) hudMom.textContent = `(${px.toFixed(0)}, ${py.toFixed(0)})`;
    if (hudColl) hudColl.textContent = collisionCount + ' marta';
    if (hudV1 && bodies[0]) hudV1.textContent = bodies[0].vel.mag().toFixed(1) + ' px/s';
    if (hudV2 && bodies[1]) hudV2.textContent = bodies[1].vel.mag().toFixed(1) + ' px/s';
  }

  function loop(currentTime) {
    if (lastTime === null) {
      lastTime = currentTime;
      requestAnimationFrame(loop);
      return;
    }
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    if (dt > 0.05) dt = 0.05;

    if (isRunning) updatePhysics(dt);
    drawScene();
    updateHUD();

    requestAnimationFrame(loop);
  }

  restitutionVal.textContent = parseFloat(restitutionSlider.value).toFixed(2);
  m1Val.textContent = parseFloat(m1Slider.value).toFixed(1) + ' kg';
  m2Val.textContent = parseFloat(m2Slider.value).toFixed(1) + ' kg';

  const resizeFn = setupResponsiveCanvas(canvas, 450 / 900, resetSimulation);
  requestAnimationFrame(loop);

  window.physProgSim = {
    initCanvasSize: () => resizeFn()
  };
}
