/**
 * SIM-PROJECTILE.JS - Aerodynamic Quadratic Drag vs Theoretical Vacuum Parabola
 * Solves: mdv/dt = mg - 0.5*Cd*rho*A*v*|v| with RK4
 */

class ProjectileSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parameters
    this.v0 = 35.0;     // Initial velocity (m/s)
    this.angleDeg = 45; // Launch angle (deg)
    this.g = 9.81;
    this.kDrag = 0.08;  // Drag factor = 0.5*Cd*rho*A / m
    this.mass = 1.0;

    // States
    this.dragPos = new Vec2(0, 0);
    this.dragVel = new Vec2(0, 0);
    this.vacPos = new Vec2(0, 0);
    this.vacVel = new Vec2(0, 0);
    
    this.dragTrail = [];
    this.vacTrail = [];
    this.time = 0;
    this.isFinished = false;

    this.reset();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = (rect.width * dpr) || 600;
    this.canvas.height = ((rect.height || rect.width * 0.5) * dpr) || 350;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  reset() {
    const rad = this.angleDeg * Math.PI / 180;
    this.dragPos.set(0, 0);
    this.dragVel.set(this.v0 * Math.cos(rad), this.v0 * Math.sin(rad));
    this.vacPos.set(0, 0);
    this.vacVel.set(this.v0 * Math.cos(rad), this.v0 * Math.sin(rad));
    this.dragTrail = [];
    this.vacTrail = [];
    this.time = 0;
    this.isFinished = false;
    this.dragLanded = false;
    this.vacLanded = false;
  }

  update(dt) {
    if (this.isFinished) return;

    runSubsteps((subDt) => {
      // 1. Drag integration via RK4
      if (!this.dragLanded) {
        const deriv = (t, state) => {
          const vx = state[2], vy = state[3];
          const speed = Math.hypot(vx, vy);
          const ax = -this.kDrag * speed * vx;
          const ay = -this.g - this.kDrag * speed * vy;
          return [vx, vy, ax, ay];
        };
        const next = rk4Step(
          [this.dragPos.x, this.dragPos.y, this.dragVel.x, this.dragVel.y],
          this.time, subDt, deriv
        );
        if (next[1] < 0 && this.time > 0) {
          // qo‘nish nuqtasi: chiziqli interpolyatsiya, integrallash to‘xtatiladi
          const f = this.dragPos.y / (this.dragPos.y - next[1]);
          this.dragPos.set(this.dragPos.x + f * (next[0] - this.dragPos.x), 0);
          this.dragVel.set(0, 0);
          this.dragLanded = true;
        } else {
          this.dragPos.set(next[0], next[1]);
          this.dragVel.set(next[2], next[3]);
        }
        this.dragTrail.push(this.dragPos.clone());
      }

      // 2. Vacuum analytic step
      if (!this.vacLanded) {
        const rad = this.angleDeg * Math.PI / 180;
        const tFlight = 2 * this.v0 * Math.sin(rad) / this.g;
        const tt = Math.min(this.time, tFlight);
        this.vacPos.set(this.v0 * Math.cos(rad) * tt,
                        Math.max(0, this.v0 * Math.sin(rad) * tt - 0.5 * this.g * tt * tt));
        this.vacTrail.push(this.vacPos.clone());
        if (this.time >= tFlight) this.vacLanded = true;
      }

      this.time += subDt;
    }, dt, 10);

    if (this.dragLanded && this.vacLanded) {
      this.isFinished = true;
    }
  }

  render() {
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    const originX = 40;
    const originY = h - 35;
    const scale = (w - 80) / 130; // 130 meters max range viewport

    // Ground Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(w - 20, originY);
    ctx.stroke();

    // Range markings
    ctx.fillStyle = '#64748B';
    ctx.font = '10px JetBrains Mono, monospace';
    for (let d = 20; d <= 120; d += 20) {
      const gx = originX + d * scale;
      ctx.beginPath();
      ctx.moveTo(gx, originY);
      ctx.lineTo(gx, originY + 5);
      ctx.stroke();
      ctx.fillText(`${d} m`, gx - 12, originY + 18);
    }

    // 1. Vacuum Ghost Parabola (Dashed, Amber)
    if (this.vacTrail.length > 1) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < this.vacTrail.length; i++) {
        const px = originX + this.vacTrail[i].x * scale;
        const py = originY - this.vacTrail[i].y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Real Drag Trajectory (Solid, Cyan)
    if (this.dragTrail.length > 1) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < this.dragTrail.length; i++) {
        const px = originX + this.dragTrail[i].x * scale;
        const py = originY - this.dragTrail[i].y * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Projectile Head
    const curX = originX + this.dragPos.x * scale;
    const curY = originY - this.dragPos.y * scale;
    ctx.fillStyle = '#34D399';
    ctx.shadowColor = '#34D399';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Telemetry HUD
    const rangeEl = document.getElementById('proj-range');
    const apexEl = document.getElementById('proj-apex');
    const vtermEl = document.getElementById('proj-vterm');
    
    let maxH = 0;
    for (let p of this.dragTrail) if (p.y > maxH) maxH = p.y;
    const vTerm = Math.sqrt(this.g / Math.max(1e-4, this.kDrag));

    const c1 = (v) => v.toFixed(1).replace('.', ',');
    if (rangeEl) rangeEl.textContent = c1(this.dragPos.x) + ' m';
    if (apexEl) apexEl.textContent = c1(maxH) + ' m';
    if (vtermEl) vtermEl.textContent = c1(vTerm) + ' m/s';
  }

  loop() {
    this.update(0.016);
    this.render();
    requestAnimationFrame(this.loop);
  }
}
