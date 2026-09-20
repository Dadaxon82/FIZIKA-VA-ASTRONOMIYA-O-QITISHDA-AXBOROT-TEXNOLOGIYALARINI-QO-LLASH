/**
 * SIM-DOPPLER.JS - Acoustic Doppler Effect & Supersonic Mach Cone
 */

class DopplerSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.mach = 0.7;        // Mach number (v_source / v_sound)
    this.vSound = 80;       // Sound speed (px/s)
    this.sourceX = 50;
    this.wavefronts = [];
    this.emitTimer = 0;
    this.emitInterval = 0.25;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 600;
    this.canvas.height = (rect.width * 0.45) * window.devicePixelRatio || 300;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  update(dt) {
    const w = this.canvas.width / window.devicePixelRatio;
    const vSource = this.mach * this.vSound;
    this.sourceX += vSource * dt;

    if (this.sourceX > w + 50) this.sourceX = -30;

    this.emitTimer += dt;
    if (this.emitTimer >= this.emitInterval) {
      this.wavefronts.push({ x: this.sourceX, r: 0 });
      this.emitTimer = 0;
    }

    // Expand wave fronts
    for (let wf of this.wavefronts) {
      wf.r += this.vSound * dt;
    }
    this.wavefronts = this.wavefronts.filter(wf => wf.r < w * 1.2);
  }

  render() {
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);
    const centerY = h / 2;

    // Draw Wavefront circles
    for (let wf of this.wavefronts) {
      const alpha = Math.max(0.05, 1.0 - wf.r / (w * 0.8));
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(wf.x, centerY, wf.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Supersonic Mach Cone Envelope
    if (this.mach > 1.0) {
      const mu = Math.asin(1.0 / this.mach); // Mach angle
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.sourceX, centerY);
      ctx.lineTo(this.sourceX - 350 * Math.cos(mu), centerY - 350 * Math.sin(mu));
      ctx.moveTo(this.sourceX, centerY);
      ctx.lineTo(this.sourceX - 350 * Math.cos(mu), centerY + 350 * Math.sin(mu));
      ctx.stroke();
    }

    // Source Jet
    ctx.fillStyle = '#FBBF24';
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.sourceX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  loop() {
    this.update(0.016);
    this.render();
    requestAnimationFrame(this.loop);
  }
}
