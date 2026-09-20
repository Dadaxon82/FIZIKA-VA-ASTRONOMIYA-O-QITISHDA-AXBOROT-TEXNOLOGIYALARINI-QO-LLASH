/**
 * SIM-SPRING.JS - Real-Time Numerical Integrator Benchmark & Phase Space Orbits
 * Compares: Forward Euler (Exploding), Euler-Cromer (Symplectic), RK4 (Exact)
 */

class SpringSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.k = 4.0;
    this.m = 1.0;
    this.dt = 0.08;

    this.eulerState = { x: 1.5, v: 0.0 };
    this.cromerState = { x: 1.5, v: 0.0 };
    this.rk4State = [1.5, 0.0];

    this.eulerHistory = [];
    this.cromerHistory = [];
    this.rk4History = [];
    this.maxPts = 350;

    this.time = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio || 600;
    this.canvas.height = (rect.width * 0.5) * window.devicePixelRatio || 320;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  reset() {
    this.eulerState = { x: 1.5, v: 0.0 };
    this.cromerState = { x: 1.5, v: 0.0 };
    this.rk4State = [1.5, 0.0];
    this.eulerHistory = [];
    this.cromerHistory = [];
    this.rk4History = [];
    this.time = 0;
  }

  update() {
    const dt = this.dt;

    // 1. Forward Euler (Naive - Explodes)
    const aE = -(this.k / this.m) * this.eulerState.x;
    this.eulerState.x += this.eulerState.v * dt;
    this.eulerState.v += aE * dt;

    // 2. Euler-Cromer (Symplectic - Stable orbit)
    const aC = -(this.k / this.m) * this.cromerState.x;
    this.cromerState.v += aC * dt;
    this.cromerState.x += this.cromerState.v * dt;

    // 3. RK4 (Exact high order)
    const deriv = (t, y) => [y[1], -(this.k / this.m) * y[0]];
    this.rk4State = rk4Step(this.rk4State, this.time, dt, deriv);

    this.eulerHistory.push({ t: this.time, x: this.eulerState.x, v: this.eulerState.v });
    this.cromerHistory.push({ t: this.time, x: this.cromerState.x, v: this.cromerState.v });
    this.rk4History.push({ t: this.time, x: this.rk4State[0], v: this.rk4State[1] });

    if (this.eulerHistory.length > this.maxPts) {
      this.eulerHistory.shift();
      this.cromerHistory.shift();
      this.rk4History.shift();
    }

    this.time += dt;
  }

  render() {
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Left View: Waveform x(t) (60% width)
    // Right View: Phase Space v vs x (40% width)
    const splitX = w * 0.58;

    // Splitter line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();

    // 1. Waveform Plot
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(splitX, h / 2);
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('Vaqt o\'qi t ->', splitX - 80, h / 2 - 6);
    ctx.fillText('x(t) Tebranishlar', 14, 20);

    const scaleY = h / 8;
    const drawCurve = (hist, color, width) => {
      if (hist.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i < hist.length; i++) {
        const px = (i / this.maxPts) * splitX;
        const py = h / 2 - hist[i].x * scaleY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };

    drawCurve(this.eulerHistory, '#F43F5E', 2);
    drawCurve(this.cromerHistory, '#34D399', 2);
    drawCurve(this.rk4History, '#38BDF8', 2.5);

    // 2. Phase Space Orbits (Right side)
    const phaseCenterX = splitX + (w - splitX) / 2;
    const phaseCenterY = h / 2;

    ctx.fillText('Faza Fazosi (v vs x)', splitX + 14, 20);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(splitX + 10, phaseCenterY);
    ctx.lineTo(w - 10, phaseCenterY);
    ctx.moveTo(phaseCenterX, 10);
    ctx.lineTo(phaseCenterX, h - 10);
    ctx.stroke();

    const drawPhase = (hist, color) => {
      if (hist.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < hist.length; i++) {
        const px = phaseCenterX + hist[i].x * (scaleY * 0.7);
        const py = phaseCenterY - (hist[i].v / 2.0) * (scaleY * 0.7);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };

    drawPhase(this.eulerHistory, '#F43F5E');   // Spirals outwards (blowup)
    drawPhase(this.cromerHistory, '#34D399');  // Stable closed ellipse
    drawPhase(this.rk4History, '#38BDF8');     // Exact analytical circle

    // Telemetry Update
    const e0 = 0.5 * this.k * (1.5 * 1.5);
    const curE_Euler = 0.5 * this.k * (this.eulerState.x ** 2) + 0.5 * this.m * (this.eulerState.v ** 2);
    const errEl = document.getElementById('spring-euler-err');
    if (errEl) {
      const pct = ((curE_Euler - e0) / e0) * 100;
      errEl.textContent = `+${pct.toFixed(0)}% (Portlash)`;
    }
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(this.loop);
  }
}
