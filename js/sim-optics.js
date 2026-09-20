/**
 * SIM-OPTICS.JS - Young's Double Slit Wave Interference & Single Slit Diffraction Envelope
 */

class OpticsSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.wavelength = 532; // nm (Green Laser)
    this.slitDist = 0.25;  // mm (d)
    this.slitWidth = 0.04; // mm (a)
    this.screenDist = 1.0; // m (L)

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.render();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 600;
    this.canvas.height = (rect.width * 0.45) * window.devicePixelRatio || 300;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.render();
  }

  render() {
    if (!this.ctx) return;
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    const lambda = this.wavelength * 1e-9;
    const d = this.slitDist * 1e-3;
    const a = this.slitWidth * 1e-3;
    const L = this.screenDist;

    const baseColor = wavelengthToRGB(this.wavelength);

    // 1. Fringe intensity pattern on upper band
    const fringeHeight = 60;
    const screenY = 20;

    for (let x = 0; x < w; x++) {
      const yPos = (x - w / 2) * 0.0001; // screen coordinate
      const theta = Math.atan2(yPos, L);

      const beta = (Math.PI * d * Math.sin(theta)) / lambda;
      const alpha = (Math.PI * a * Math.sin(theta)) / lambda;

      const interference = Math.cos(beta) ** 2;
      const diffraction = alpha === 0 ? 1 : (Math.sin(alpha) / alpha) ** 2;
      const intensity = interference * diffraction;

      ctx.fillStyle = baseColor;
      ctx.globalAlpha = intensity;
      ctx.fillRect(x, screenY, 1, fringeHeight);
    }
    ctx.globalAlpha = 1.0;

    // 2. Intensity Curve Plot on lower half
    const curveY = h - 20;
    const curveH = h * 0.45;

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const yPos = (x - w / 2) * 0.0001;
      const theta = Math.atan2(yPos, L);
      const beta = (Math.PI * d * Math.sin(theta)) / lambda;
      const alpha = (Math.PI * a * Math.sin(theta)) / lambda;
      const intensity = (Math.cos(beta) ** 2) * (alpha === 0 ? 1 : (Math.sin(alpha) / alpha) ** 2);

      const py = curveY - intensity * curveH;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }
}
