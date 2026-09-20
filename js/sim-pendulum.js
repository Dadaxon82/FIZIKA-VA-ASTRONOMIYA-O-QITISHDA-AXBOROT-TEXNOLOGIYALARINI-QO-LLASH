/**
 * SIM-PENDULUM.JS - Nonlinear Damped Mathematical Pendulum with Phase Space & Energy Tracker
 * Solves: d2theta/dt2 + gamma*dtheta/dt + (g/L)*sin(theta) = 0 using RK4 + Substepping
 */

class PendulumSimulation {
  constructor(canvasId, phaseCanvasId) {
    this.canvas = document.getElementById(canvasId);
    this.phaseCanvas = document.getElementById(phaseCanvasId);
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.phaseCtx = this.phaseCanvas ? this.phaseCanvas.getContext('2d') : null;
    
    // Physics Parameters
    this.L = 2.0;       // Length (meters)
    this.g = 9.81;      // Gravity (m/s^2)
    this.gamma = 0.15;  // Damping coefficient (s^-1)
    this.mass = 1.0;    // Mass (kg)
    
    // State: [theta (rad), omega (rad/s)]
    this.theta = 45 * Math.PI / 180;
    this.omega = 0.0;
    this.time = 0;
    
    this.isRunning = true;
    this.isDragging = false;
    this.phaseHistory = [];
    this.maxHistory = 400;
    
    this.initEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = (rect.width * dpr) || 600;
    this.canvas.height = (rect.width * 0.6 * dpr) || 400;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.phaseCanvas) {
      const phaseRect = this.phaseCanvas.parentElement.getBoundingClientRect();
      const phaseWidth = phaseRect.width || 300;
      this.phaseCanvas.width = phaseWidth * dpr;
      this.phaseCanvas.height = 120 * dpr;
      this.phaseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  initEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleStart = (e) => {
      const pos = getPos(e);
      const w = this.canvas.width / window.devicePixelRatio;
      const originX = w / 2;
      const originY = 50;
      const scale = (w * 0.35) / this.L;
      const bobX = originX + this.L * scale * Math.sin(this.theta);
      const bobY = originY + this.L * scale * Math.cos(this.theta);
      
      const dist = Math.hypot(pos.x - bobX, pos.y - bobY);
      if (dist < 35) {
        this.isDragging = true;
        this.omega = 0;
      }
    };

    const handleMove = (e) => {
      if (!this.isDragging) return;
      const pos = getPos(e);
      const w = this.canvas.width / window.devicePixelRatio;
      const originX = w / 2;
      const originY = 50;
      this.theta = Math.atan2(pos.x - originX, pos.y - originY);
      this.omega = 0;
    };

    const handleEnd = () => { this.isDragging = false; };

    this.canvas.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    this.canvas.addEventListener('touchstart', handleStart, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
  }

  update(dt) {
    if (this.isDragging || !this.isRunning) return;

    // Substepping with RK4 for zero drift
    runSubsteps((subDt) => {
      const deriv = (t, state) => {
        const th = state[0];
        const om = state[1];
        const dTheta = om;
        const dOmega = -(this.g / this.L) * Math.sin(th) - this.gamma * om;
        return [dTheta, dOmega];
      };

      const nextState = rk4Step([this.theta, this.omega], this.time, subDt, deriv);
      this.theta = nextState[0];
      this.omega = nextState[1];
      this.time += subDt;
    }, dt, 10);

    // Track phase space trajectory
    this.phaseHistory.push({ theta: this.theta, omega: this.omega });
    if (this.phaseHistory.length > this.maxHistory) {
      this.phaseHistory.shift();
    }
  }

  render() {
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    const originX = w / 2;
    const originY = 60;
    const scale = (h * 0.65) / this.L;
    const bobX = originX + this.L * scale * Math.sin(this.theta);
    const bobY = originY + this.L * scale * Math.cos(this.theta);

    // Ceiling / Pivot
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(originX - 60, originY);
    ctx.lineTo(originX + 60, originY);
    ctx.stroke();

    // Pivot pin
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(originX, originY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Dashed center reference line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, originY + this.L * scale + 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Angle Arc
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(originX, originY, 45, Math.PI / 2, Math.PI / 2 + this.theta, this.theta < 0);
    ctx.stroke();

    // Rod
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Force Vectors: Gravity (mg), Tension (T), Velocity (v)
    const mgLen = 45;
    const tLen = mgLen * Math.cos(this.theta) + (this.mass * this.L * this.omega * this.omega) * 5;
    const vLen = this.L * this.omega * 8;

    // Gravity vector (Down, Red)
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bobX, bobY);
    ctx.lineTo(bobX, bobY + mgLen);
    ctx.stroke();

    // Velocity vector (Tangent, Green)
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bobX, bobY);
    ctx.lineTo(bobX + vLen * Math.cos(this.theta), bobY - vLen * Math.sin(this.theta));
    ctx.stroke();

    // Bob
    const bobGradient = ctx.createRadialGradient(bobX - 5, bobY - 5, 2, bobX, bobY, 20);
    bobGradient.addColorStop(0, '#38BDF8');
    bobGradient.addColorStop(1, '#0284C7');
    ctx.fillStyle = bobGradient;
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Energies: E_k = 0.5*m*(L*omega)^2, E_p = m*g*L*(1-cos(theta))
    const vLinear = this.L * this.omega;
    const Ek = 0.5 * this.mass * vLinear * vLinear;
    const Ep = this.mass * this.g * this.L * (1 - Math.cos(this.theta));
    const Etot = Ek + Ep;

    this.updateHUD(Ek, Ep, Etot);
    this.renderPhaseSpace();
  }

  renderPhaseSpace() {
    if (!this.phaseCtx) return;
    const ctx = this.phaseCtx;
    const w = this.phaseCanvas.width / window.devicePixelRatio;
    const h = this.phaseCanvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, w, h);

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('θ (rad)', w - 40, h / 2 - 4);
    ctx.fillText('ω (rad/s)', w / 2 + 4, 12);

    // Phase Curve
    if (this.phaseHistory.length > 1) {
      const scaleTheta = w / (2.5 * Math.PI);
      const scaleOmega = h / 12;

      ctx.strokeStyle = '#818CF8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < this.phaseHistory.length; i++) {
        const pt = this.phaseHistory[i];
        const px = w / 2 + pt.theta * scaleTheta;
        const py = h / 2 - pt.omega * scaleOmega;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Current Point
      const last = this.phaseHistory[this.phaseHistory.length - 1];
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(w / 2 + last.theta * scaleTheta, h / 2 - last.omega * scaleOmega, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  updateHUD(Ek, Ep, Etot) {
    const degEl = document.getElementById('pendulum-deg');
    const omegaEl = document.getElementById('pendulum-omega');
    const ekBar = document.getElementById('pendulum-bar-ek');
    const epBar = document.getElementById('pendulum-bar-ep');
    const etotEl = document.getElementById('pendulum-etot');

    if (degEl) degEl.textContent = (this.theta * 180 / Math.PI).toFixed(1) + '°';
    if (omegaEl) omegaEl.textContent = this.omega.toFixed(2) + ' rad/s';
    if (etotEl) etotEl.textContent = Etot.toFixed(2) + ' J';

    const maxE = Math.max(0.1, this.mass * this.g * this.L * 2);
    if (ekBar) ekBar.style.width = Math.min(100, (Ek / maxE) * 100) + '%';
    if (epBar) epBar.style.width = Math.min(100, (Ep / maxE) * 100) + '%';
  }

  loop(timestamp) {
    this.update(0.016);
    this.render();
    requestAnimationFrame(this.loop);
  }
}
