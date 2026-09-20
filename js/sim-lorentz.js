/**
 * SIM-LORENTZ.JS - 3D Charged Particle Dynamics in (E, B) Fields with Boris Algorithm
 */

class LorentzSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Physical Constants
    this.q = 1.0;       // Charge (+1 e)
    this.m = 1.0;       // Mass (u)
    this.B = new Vec3(0, 0, 1.5);   // Magnetic Field (Tesla)
    this.E = new Vec3(0, 0, 0);     // Electric Field (V/m)
    
    // Initial conditions
    this.pos = new Vec3(0, 0, 0);
    this.vel = new Vec3(3.0, 0.0, 1.2); // Tangential + parallel velocity
    this.trail = [];
    this.maxTrail = 600;

    // 3D Camera Angles
    this.rotX = 0.45;
    this.rotY = -0.65;
    this.zoom = 18;

    this.isRunning = true;
    this.initEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 600;
    this.canvas.height = (rect.width * 0.6) * window.devicePixelRatio || 400;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  initEvents() {
    let isDragging = false;
    let lastX = 0, lastY = 0;

    const onStart = (e) => {
      isDragging = true;
      lastX = e.touches ? e.touches[0].clientX : e.clientX;
      lastY = e.touches ? e.touches[0].clientY : e.clientY;
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      this.rotY += (cx - lastX) * 0.01;
      this.rotX += (cy - lastY) * 0.01;
      lastX = cx; lastY = cy;
    };
    const onEnd = () => { isDragging = false; };

    this.canvas.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    this.canvas.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  }

  reset() {
    this.pos.set(0, 0, 0);
    this.vel.set(3.0, 0.0, 1.2);
    this.trail = [];
  }

  update(dt) {
    if (!this.isRunning) return;

    runSubsteps((subDt) => {
      const res = borisPusher(this.pos, this.vel, this.q, this.m, this.E, this.B, subDt);
      this.pos = res.pos;
      this.vel = res.vel;
    }, dt, 12);

    this.trail.push(this.pos.clone());
    if (this.trail.length > this.maxTrail) this.trail.shift();

    // Reset if it flies too far away
    if (this.pos.z > 25 || this.pos.mag() > 30) {
      this.reset();
    }
  }

  project(p3d, w, h) {
    // Rotation Y then X
    const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
    const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);

    const x1 = p3d.x * cosY - p3d.z * sinY;
    const z1 = p3d.x * sinY + p3d.z * cosY;

    const y2 = p3d.y * cosX - z1 * sinX;
    const z2 = p3d.y * sinX + z1 * cosX;

    const focal = 400;
    const depth = z2 + 25;
    const scale = (focal / (depth > 1 ? depth : 1)) * (this.zoom / 15);

    return {
      x: w / 2 + x1 * scale * 15,
      y: h / 2 - y2 * scale * 15,
      z: z2
    };
  }

  render() {
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Draw 3D Grid / B-Field Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    for (let x = -8; x <= 8; x += 4) {
      for (let y = -8; y <= 8; y += 4) {
        const p1 = this.project(new Vec3(x, y, -10), w, h);
        const p2 = this.project(new Vec3(x, y, 15), w, h);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Trajectory
    if (this.trail.length > 1) {
      for (let i = 1; i < this.trail.length; i++) {
        const pPrev = this.project(this.trail[i - 1], w, h);
        const pCurr = this.project(this.trail[i], w, h);
        const alpha = (i / this.trail.length);

        ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pPrev.x, pPrev.y);
        ctx.lineTo(pCurr.x, pCurr.y);
        ctx.stroke();
      }
    }

    // Particle
    const pCurrent = this.project(this.pos, w, h);
    ctx.fillStyle = '#38BDF8';
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(pCurrent.x, pCurrent.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Telemetry Calculations
    const vPerp = Math.hypot(this.vel.x, this.vel.y);
    const Bmag = this.B.mag();
    const rLarmor = Bmag > 1e-4 ? (this.m * vPerp) / (Math.abs(this.q) * Bmag) : 0;
    const omegaC = Bmag > 1e-4 ? (Math.abs(this.q) * Bmag) / this.m : 0;

    const rEl = document.getElementById('lorentz-radius');
    const wEl = document.getElementById('lorentz-omega');
    if (rEl) rEl.textContent = rLarmor.toFixed(2) + ' m';
    if (wEl) wEl.textContent = omegaC.toFixed(2) + ' rad/s';
  }

  loop() {
    this.update(0.016);
    this.render();
    requestAnimationFrame(this.loop);
  }
}
