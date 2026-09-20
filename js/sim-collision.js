/**
 * SIM-COLLISION.JS - 1D Elastic and Inelastic Momentum Collision
 */

class CollisionSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.m1 = 2.0; this.v1 = 4.0; this.x1 = 80;
    this.m2 = 1.0; this.v2 = -2.0; this.x2 = 380;
    this.eRestitution = 1.0; // Elastic = 1, Inelastic < 1

    this.r1 = 24; this.r2 = 18;
    this.isRunning = true;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 600;
    this.canvas.height = (rect.width * 0.4) * window.devicePixelRatio || 240;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  reset() {
    this.x1 = 80; this.v1 = 4.0;
    this.x2 = 380; this.v2 = -2.0;
  }

  update(dt) {
    if (!this.isRunning) return;
    const w = this.canvas.width / window.devicePixelRatio;

    this.x1 += this.v1 * dt * 40;
    this.x2 += this.v2 * dt * 40;

    // Wall bounce
    if (this.x1 - this.r1 < 20) { this.x1 = 20 + this.r1; this.v1 = Math.abs(this.v1); }
    if (this.x2 + this.r2 > w - 20) { this.x2 = w - 20 - this.r2; this.v2 = -Math.abs(this.v2); }

    // Inter-ball collision
    if (this.x2 - this.x1 <= this.r1 + this.r2) {
      const u1 = this.v1, u2 = this.v2;
      const m1 = this.m1, m2 = this.m2, e = this.eRestitution;
      
      // Exact 1D Collision formulas with coefficient of restitution e:
      this.v1 = (m1 * u1 + m2 * u2 - m2 * e * (u1 - u2)) / (m1 + m2);
      this.v2 = (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / (m1 + m2);

      // Separate bodies to prevent sticking
      const overlap = (this.r1 + this.r2) - (this.x2 - this.x1);
      this.x1 -= overlap / 2;
      this.x2 += overlap / 2;
    }
  }

  render() {
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    const trackY = h / 2;
    // Track line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, trackY + 30);
    ctx.lineTo(w - 20, trackY + 30);
    ctx.stroke();

    // Ball 1 (Cyan)
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(this.x1, trackY, this.r1, 0, Math.PI * 2);
    ctx.fill();

    // Ball 2 (Amber)
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(this.x2, trackY, this.r2, 0, Math.PI * 2);
    ctx.fill();

    // Total Momentum: P = m1*v1 + m2*v2
    const P = this.m1 * this.v1 + this.m2 * this.v2;
    const Ek = 0.5 * this.m1 * this.v1 * this.v1 + 0.5 * this.m2 * this.v2 * this.v2;

    const pEl = document.getElementById('collision-p');
    const eEl = document.getElementById('collision-e');
    if (pEl) pEl.textContent = P.toFixed(2) + ' kg·m/s';
    if (eEl) eEl.textContent = Ek.toFixed(2) + ' J';
  }

  loop() {
    this.update(0.016);
    this.render();
    requestAnimationFrame(this.loop);
  }
}
