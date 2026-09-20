/**
 * sim-error-analysis.js
 * 4-Mavzu: Zamonaviy kompyuter modeliga qo'yiladigan talablar va hisoblash aniqligi
 * Sonli integratsiya usullari (Euler, Euler-Cromer, RK2/Heun, RK4) va xatolik tahlili simulyatori.
 */

class ErrorAnalysisEngine {
  constructor(canvasAnimId, canvasGraphId, canvasPhaseId, canvasEnergyId) {
    this.canvasAnim = document.getElementById(canvasAnimId);
    this.canvasGraph = document.getElementById(canvasGraphId);
    this.canvasPhase = document.getElementById(canvasPhaseId);
    this.canvasEnergy = document.getElementById(canvasEnergyId);

    this.ctxAnim = this.canvasAnim ? this.canvasAnim.getContext('2d') : null;
    this.ctxGraph = this.canvasGraph ? this.canvasGraph.getContext('2d') : null;
    this.ctxPhase = this.canvasPhase ? this.canvasPhase.getContext('2d') : null;
    this.ctxEnergy = this.canvasEnergy ? this.canvasEnergy.getContext('2d') : null;

    // Physics Parameters
    this.g = 9.81;
    this.L = 1.0;          // Pendulum length in meters
    this.omega0 = Math.sqrt(this.g / this.L);
    this.theta0 = 0.5;      // Initial angle in radians (~28.6 degrees)
    this.dt = 0.15;         // Integration time step in seconds
    this.isNonlinear = false; // Simple harmonic (linear) vs full non-linear sin(theta)

    // Simulation State
    this.isRunning = false;
    this.time = 0;
    this.maxHistory = 400;

    // Active Methods
    this.methods = {
      exact: { name: 'Aniq Yechim', color: '#94A3B8', active: true, theta: 0, omega: 0, history: [], energy: [] },
      euler: { name: 'Forward Euler', color: '#F43F5E', active: true, theta: 0, omega: 0, history: [], energy: [] },
      ec:    { name: 'Euler-Cromer', color: '#34D399', active: true, theta: 0, omega: 0, history: [], energy: [] },
      heun:  { name: 'Heun (RK2)', color: '#FBBF24', active: true, theta: 0, omega: 0, history: [], energy: [] },
      rk4:   { name: 'Runge-Kutta 4', color: '#38BDF8', active: true, theta: 0, omega: 0, history: [], energy: [] }
    };

    this.reset();
    this.initEventListeners();
    this.render();
  }

  reset() {
    this.time = 0;
    this.omega0 = Math.sqrt(this.g / this.L);

    // Initial mechanical energy E0 = 0.5 * m * L^2 * (omega^2 + omega0^2 * theta^2)
    // Normalized: E0 = 0.5 * (omega^2 + omega0^2 * theta^2)
    const E0 = 0.5 * (this.omega0 ** 2) * (this.theta0 ** 2);

    for (let key in this.methods) {
      const m = this.methods[key];
      m.theta = this.theta0;
      m.omega = 0.0;
      m.history = [{ t: 0, theta: this.theta0, omega: 0 }];
      m.energy = [{ t: 0, E_rel: 1.0 }];
    }

    this.updateTelemetry();
    this.render();
  }

  acceleration(theta) {
    if (this.isNonlinear) {
      return -(this.g / this.L) * Math.sin(theta);
    } else {
      return -(this.g / this.L) * theta;
    }
  }

  step() {
    this.time += this.dt;
    const dt = this.dt;
    const E0 = 0.5 * (this.omega0 ** 2) * (this.theta0 ** 2);

    // 1. Exact Analytical (Linear case)
    if (this.methods.exact.active) {
      const exactTheta = this.theta0 * Math.cos(this.omega0 * this.time);
      const exactOmega = -this.theta0 * this.omega0 * Math.sin(this.omega0 * this.time);
      this.methods.exact.theta = exactTheta;
      this.methods.exact.omega = exactOmega;
      this.methods.exact.history.push({ t: this.time, theta: exactTheta, omega: exactOmega });
      this.methods.exact.energy.push({ t: this.time, E_rel: 1.0 });
    }

    // 2. Forward Euler (1st order non-symplectic)
    if (this.methods.euler.active) {
      const th = this.methods.euler.theta;
      const om = this.methods.euler.omega;
      const a = this.acceleration(th);
      
      const newTh = th + om * dt;
      const newOm = om + a * dt;

      this.methods.euler.theta = newTh;
      this.methods.euler.omega = newOm;
      this.methods.euler.history.push({ t: this.time, theta: newTh, omega: newOm });

      const E = 0.5 * (newOm ** 2 + (this.omega0 ** 2) * (newTh ** 2));
      this.methods.euler.energy.push({ t: this.time, E_rel: E / E0 });
    }

    // 3. Euler-Cromer (1st order symplectic)
    if (this.methods.ec.active) {
      const th = this.methods.ec.theta;
      const om = this.methods.ec.omega;
      const a = this.acceleration(th);

      const newOm = om + a * dt;
      const newTh = th + newOm * dt;

      this.methods.ec.theta = newTh;
      this.methods.ec.omega = newOm;
      this.methods.ec.history.push({ t: this.time, theta: newTh, omega: newOm });

      const E = 0.5 * (newOm ** 2 + (this.omega0 ** 2) * (newTh ** 2));
      this.methods.ec.energy.push({ t: this.time, E_rel: E / E0 });
    }

    // 4. Heun / Midpoint (RK2)
    if (this.methods.heun.active) {
      const th = this.methods.heun.theta;
      const om = this.methods.heun.omega;

      const k1_th = om;
      const k1_om = this.acceleration(th);

      const th_mid = th + 0.5 * dt * k1_th;
      const om_mid = om + 0.5 * dt * k1_om;

      const k2_th = om_mid;
      const k2_om = this.acceleration(th_mid);

      const newTh = th + dt * k2_th;
      const newOm = om + dt * k2_om;

      this.methods.heun.theta = newTh;
      this.methods.heun.omega = newOm;
      this.methods.heun.history.push({ t: this.time, theta: newTh, omega: newOm });

      const E = 0.5 * (newOm ** 2 + (this.omega0 ** 2) * (newTh ** 2));
      this.methods.heun.energy.push({ t: this.time, E_rel: E / E0 });
    }

    // 5. Classic RK4 (4th order)
    if (this.methods.rk4.active) {
      const th = this.methods.rk4.theta;
      const om = this.methods.rk4.omega;

      const k1_th = om;
      const k1_om = this.acceleration(th);

      const k2_th = om + 0.5 * dt * k1_om;
      const k2_om = this.acceleration(th + 0.5 * dt * k1_th);

      const k3_th = om + 0.5 * dt * k2_om;
      const k3_om = this.acceleration(th + 0.5 * dt * k2_th);

      const k4_th = om + dt * k3_om;
      const k4_om = this.acceleration(th + dt * k3_th);

      const newTh = th + (dt / 6.0) * (k1_th + 2 * k2_th + 2 * k3_th + k4_th);
      const newOm = om + (dt / 6.0) * (k1_om + 2 * k2_om + 2 * k3_om + k4_om);

      this.methods.rk4.theta = newTh;
      this.methods.rk4.omega = newOm;
      this.methods.rk4.history.push({ t: this.time, theta: newTh, omega: newOm });

      const E = 0.5 * (newOm ** 2 + (this.omega0 ** 2) * (newTh ** 2));
      this.methods.rk4.energy.push({ t: this.time, E_rel: E / E0 });
    }

    // Trim history buffers
    for (let key in this.methods) {
      if (this.methods[key].history.length > this.maxHistory) {
        this.methods[key].history.shift();
      }
      if (this.methods[key].energy.length > this.maxHistory) {
        this.methods[key].energy.shift();
      }
    }

    this.updateTelemetry();
  }

  render() {
    this.renderAnimation();
    this.renderTimeSeries();
    this.renderPhasePortrait();
    this.renderEnergyDrift();
  }

  renderAnimation() {
    if (!this.ctxAnim) return;
    const ctx = this.ctxAnim;
    const w = this.canvasAnim.width;
    const h = this.canvasAnim.height;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    // Pivot point
    const originX = w / 2;
    const originY = 40;
    const pixelLength = Math.min(w, h) * 0.65;

    // Draw Pivot
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(originX - 40, originY);
    ctx.lineTo(originX + 40, originY);
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(originX, originY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw equilibrium vertical line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, originY + pixelLength + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Each Active Method's Pendulum Arm and Bob
    for (let key of ['exact', 'euler', 'ec', 'heun', 'rk4']) {
      const m = this.methods[key];
      if (!m.active) continue;

      const bobX = originX + pixelLength * Math.sin(m.theta);
      const bobY = originY + pixelLength * Math.cos(m.theta);

      // Rod
      ctx.strokeStyle = m.color;
      ctx.lineWidth = (key === 'exact') ? 3 : 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Bob
      ctx.fillStyle = m.color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(bobX, bobY, (key === 'exact' ? 12 : 9), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.globalAlpha = 1.0;
    }

    // Legend on canvas
    ctx.font = '11px sans-serif';
    let legendY = h - 20;
    let legendX = 14;
    for (let key in this.methods) {
      const m = this.methods[key];
      if (!m.active) continue;
      ctx.fillStyle = m.color;
      ctx.fillRect(legendX, legendY - 8, 10, 10);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(m.name, legendX + 14, legendY);
      legendX += ctx.measureText(m.name).width + 30;
    }
  }

  renderTimeSeries() {
    if (!this.ctxGraph) return;
    const ctx = this.ctxGraph;
    const w = this.canvasGraph.width;
    const h = this.canvasGraph.height;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    const midY = h / 2;

    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    const scaleY = (h / 2.6) / (Math.max(this.theta0 * 1.8, 1.0));
    const historyLen = this.maxHistory;

    for (let key of ['exact', 'euler', 'ec', 'heun', 'rk4']) {
      const m = this.methods[key];
      if (!m.active || m.history.length === 0) continue;

      ctx.strokeStyle = m.color;
      ctx.lineWidth = (key === 'exact') ? 2.5 : 1.8;
      ctx.beginPath();

      for (let i = 0; i < m.history.length; i++) {
        const x = (i / (historyLen - 1)) * w;
        const y = midY - m.history[i].theta * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Title label
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText('Siljish theta(t) [rad] vaqt bo`yicha', 10, 16);
    ctx.fillText(`+${(this.theta0).toFixed(2)} rad`, 10, midY - this.theta0 * scaleY + 12);
    ctx.fillText(`-${(this.theta0).toFixed(2)} rad`, 10, midY + this.theta0 * scaleY - 4);
  }

  renderPhasePortrait() {
    if (!this.ctxPhase) return;
    const ctx = this.ctxPhase;
    const w = this.canvasPhase.width;
    const h = this.canvasPhase.height;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    // Cross axes
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(w, centerY);
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, h);
    ctx.stroke();

    const scaleX = (w * 0.4) / (Math.max(this.theta0 * 1.8, 1.0));
    const scaleY = (h * 0.4) / (Math.max(this.theta0 * this.omega0 * 1.8, 2.0));

    for (let key of ['exact', 'euler', 'ec', 'heun', 'rk4']) {
      const m = this.methods[key];
      if (!m.active || m.history.length === 0) continue;

      ctx.strokeStyle = m.color;
      ctx.lineWidth = (key === 'exact') ? 2 : 1.5;
      ctx.beginPath();

      for (let i = 0; i < m.history.length; i++) {
        const x = centerX + m.history[i].theta * scaleX;
        const y = centerY - m.history[i].omega * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText('Fazaviy Portret (omega vs theta)', 10, 16);
  }

  renderEnergyDrift() {
    if (!this.ctxEnergy) return;
    const ctx = this.ctxEnergy;
    const w = this.canvasEnergy.width;
    const h = this.canvasEnergy.height;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    const baseLineY = h * 0.7; // E/E0 = 1.0 line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, baseLineY);
    ctx.lineTo(w, baseLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText('E(t)/E0 = 1.00 (Saqlanish qonuni)', 10, baseLineY - 6);

    const scaleE = h * 0.25; // Height for E/E0 = 2.0
    const historyLen = this.maxHistory;

    for (let key of ['exact', 'euler', 'ec', 'heun', 'rk4']) {
      const m = this.methods[key];
      if (!m.active || m.energy.length === 0) continue;

      ctx.strokeStyle = m.color;
      ctx.lineWidth = (key === 'exact') ? 2 : 1.8;
      ctx.beginPath();

      for (let i = 0; i < m.energy.length; i++) {
        const x = (i / (historyLen - 1)) * w;
        // relative energy E_rel: 1.0 maps to baseLineY
        const y = baseLineY - (m.energy[i].E_rel - 1.0) * scaleE;
        const clampedY = Math.max(5, Math.min(h - 5, y));
        if (i === 0) ctx.moveTo(x, clampedY);
        else ctx.lineTo(x, clampedY);
      }
      ctx.stroke();
    }
  }

  updateTelemetry() {
    const tableBody = document.getElementById('error-telemetry-body');
    if (!tableBody) return;

    const exactTheta = this.methods.exact.theta;
    let html = '';

    const methodKeys = [
      { key: 'euler', order: 'O(dt)', name: 'Forward Euler' },
      { key: 'ec',    order: 'O(dt) Simplektik', name: 'Euler-Cromer' },
      { key: 'heun',  order: 'O(dt^2)', name: 'Heun / RK2' },
      { key: 'rk4',   order: 'O(dt^4)', name: 'Runge-Kutta 4' }
    ];

    for (let item of methodKeys) {
      const m = this.methods[item.key];
      const absErr = Math.abs(m.theta - exactTheta);
      const curEnergy = m.energy[m.energy.length - 1]?.E_rel || 1.0;
      const driftPercent = ((curEnergy - 1.0) * 100).toFixed(2);
      const isDiverging = curEnergy > 2.0;

      html += `<tr>
        <td style="color:${m.color}; font-weight:700;">${item.name}</td>
        <td><span class="badge badge-purple" style="font-size:0.75rem;">${item.order}</span></td>
        <td style="font-family:var(--font-mono);">${m.theta.toFixed(4)} rad</td>
        <td style="font-family:var(--font-mono); color:${absErr > 0.5 ? '#F43F5E' : '#38BDF8'};">${absErr.toExponential(3)}</td>
        <td style="font-family:var(--font-mono); color:${isDiverging ? '#F43F5E' : (driftPercent == '0.00' ? '#34D399' : '#FBBF24')};">
          ${driftPercent > 0 ? '+' : ''}${driftPercent}% ${isDiverging ? '⚠️ (Portlash)' : ''}
        </td>
      </tr>`;
    }

    tableBody.innerHTML = html;

    const timeEl = document.getElementById('telemetry-time');
    if (timeEl) timeEl.textContent = `${this.time.toFixed(2)} s`;

    const stepEl = document.getElementById('telemetry-step');
    if (stepEl) stepEl.textContent = `${this.methods.rk4.history.length}`;
  }

  initEventListeners() {
    // dt slider
    const dtSlider = document.getElementById('slider-dt');
    const dtVal = document.getElementById('val-dt');
    if (dtSlider && dtVal) {
      dtSlider.addEventListener('input', (e) => {
        this.dt = parseFloat(e.target.value);
        dtVal.textContent = `${this.dt.toFixed(3)} s`;
        this.reset();
      });
    }

    // Length slider
    const lSlider = document.getElementById('slider-len');
    const lVal = document.getElementById('val-len');
    if (lSlider && lVal) {
      lSlider.addEventListener('input', (e) => {
        this.L = parseFloat(e.target.value);
        this.omega0 = Math.sqrt(this.g / this.L);
        lVal.textContent = `${this.L.toFixed(2)} m`;
        this.reset();
      });
    }

    // Amplitude slider
    const ampSlider = document.getElementById('slider-amp');
    const ampVal = document.getElementById('val-amp');
    if (ampSlider && ampVal) {
      ampSlider.addEventListener('input', (e) => {
        this.theta0 = parseFloat(e.target.value);
        const deg = (this.theta0 * 180 / Math.PI).toFixed(1);
        ampVal.textContent = `${this.theta0.toFixed(2)} rad (${deg}°)`;
        this.reset();
      });
    }

    // Method checkboxes
    for (let key in this.methods) {
      const chk = document.getElementById(`chk-${key}`);
      if (chk) {
        chk.addEventListener('change', (e) => {
          this.methods[key].active = e.target.checked;
          this.render();
        });
      }
    }

    // Start/Pause Button
    const playBtn = document.getElementById('btn-play-pause');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.isRunning = !this.isRunning;
        playBtn.textContent = this.isRunning ? '⏸️ To`xtatish' : '▶️ Boshlash';
        playBtn.classList.toggle('btn-primary', !this.isRunning);
        playBtn.classList.toggle('btn-secondary', this.isRunning);
      });
    }

    // Reset Button
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.isRunning = false;
        if (playBtn) playBtn.textContent = '▶️ Boshlash';
        this.reset();
      });
    }

    // Step Button
    const stepBtn = document.getElementById('btn-step');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => {
        this.step();
        this.render();
      });
    }

    // Scenarios buttons
    window.loadAccuracyScenario = (scen) => {
      this.isRunning = false;
      if (playBtn) playBtn.textContent = '▶️ Boshlash';

      if (scen === 'euler-explosion') {
        this.dt = 0.25;
        this.theta0 = 0.4;
        this.L = 1.0;
        if (dtSlider) dtSlider.value = 0.25;
        if (dtVal) dtVal.textContent = '0.250 s';
      } else if (scen === 'symplectic-stable') {
        this.dt = 0.10;
        this.theta0 = 0.5;
        this.L = 1.0;
        if (dtSlider) dtSlider.value = 0.10;
        if (dtVal) dtVal.textContent = '0.100 s';
      } else if (scen === 'rk4-precision') {
        this.dt = 0.05;
        this.theta0 = 0.6;
        this.L = 1.0;
        if (dtSlider) dtSlider.value = 0.05;
        if (dtVal) dtVal.textContent = '0.050 s';
      } else if (scen === 'stiff-step') {
        this.dt = 0.35;
        this.theta0 = 0.3;
        this.L = 0.4; // Very short pendulum => large omega
        if (dtSlider) dtSlider.value = 0.35;
        if (dtVal) dtVal.textContent = '0.350 s';
        if (lSlider) lSlider.value = 0.4;
        if (lVal) lVal.textContent = '0.40 m';
      }

      this.reset();
    };

    // Animation Loop
    const loop = () => {
      if (this.isRunning) {
        this.step();
        this.render();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sim-anim-canvas')) {
    window.errorSim = new ErrorAnalysisEngine(
      'sim-anim-canvas',
      'sim-graph-canvas',
      'sim-phase-canvas',
      'sim-energy-canvas'
    );
  }
});
