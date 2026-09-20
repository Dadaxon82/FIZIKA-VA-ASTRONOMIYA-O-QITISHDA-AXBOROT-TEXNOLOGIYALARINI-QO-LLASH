/**
 * PHYSICS-ENGINE.JS - High Precision Computational Physics Library
 * Includes: Vec2, Vec3, RK4 Integrator, Symplectic Euler-Cromer, Boris Pusher & Substepping
 */

class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set(x, y) { this.x = x; this.y = y; return this; }
  clone() { return new Vec2(this.x, this.y); }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  scale(s) { this.x *= s; this.y *= s; return this; }
  magSq() { return this.x * this.x + this.y * this.y; }
  mag() { return Math.sqrt(this.magSq()); }
  normalize() {
    const m = this.mag();
    if (m > 1e-8) { this.x /= m; this.y /= m; }
    return this;
  }
  dot(v) { return this.x * v.x + this.y * v.y; }
  cross(v) { return this.x * v.y - this.y * v.x; }
  static add(a, b) { return new Vec2(a.x + b.x, a.y + b.y); }
  static sub(a, b) { return new Vec2(a.x - b.x, a.y - b.y); }
  static scale(v, s) { return new Vec2(v.x * s, v.y * s); }
}

class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  clone() { return new Vec3(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  scale(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  magSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
  mag() { return Math.sqrt(this.magSq()); }
  normalize() {
    const m = this.mag();
    if (m > 1e-8) { this.x /= m; this.y /= m; this.z /= m; }
    return this;
  }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
  static add(a, b) { return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z); }
  static sub(a, b) { return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z); }
  static scale(v, s) { return new Vec3(v.x * s, v.y * s, v.z * s); }
  static cross(a, b) {
    return new Vec3(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    );
  }
}

/**
 * 4th Order Runge-Kutta (RK4) Vectorized Integrator
 * @param {Array<number>} y Current state vector
 * @param {number} t Current time
 * @param {number} dt Time step
 * @param {Function} f Derivative function: (t, y) => dydt array
 * @returns {Array<number>} Next state vector
 */
function rk4Step(y, t, dt, f) {
  const n = y.length;
  const k1 = f(t, y);
  
  const y2 = new Array(n);
  for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * dt * k1[i];
  const k2 = f(t + 0.5 * dt, y2);
  
  const y3 = new Array(n);
  for (let i = 0; i < n; i++) y3[i] = y[i] + 0.5 * dt * k2[i];
  const k3 = f(t + 0.5 * dt, y3);
  
  const y4 = new Array(n);
  for (let i = 0; i < n; i++) y4[i] = y[i] + dt * k3[i];
  const k4 = f(t + dt, y4);
  
  const yNext = new Array(n);
  for (let i = 0; i < n; i++) {
    yNext[i] = y[i] + (dt / 6.0) * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
  }
  return yNext;
}

/**
 * Symplectic Euler-Cromer Step for 2nd order ODEs
 * v_{n+1} = v_n + a(x_n, v_n) * dt
 * x_{n+1} = x_n + v_{n+1} * dt
 */
function eulerCromerStep(x, v, dt, accelFunc) {
  const a = accelFunc(x, v);
  const vNext = v + a * dt;
  const xNext = x + vNext * dt;
  return { x: xNext, v: vNext };
}

/**
 * Boris Particle Pusher for Electromagnetic Plasma & Lorentz Force
 * Preserves exact cyclotron energy in arbitrary magnetic fields
 */
function borisPusher(pos, vel, q, m, E, B, dt) {
  const qPrime = 0.5 * dt * (q / m);
  
  // 1. Half electric acceleration: v_minus = v + (q*E/m)*(dt/2)
  const vMinus = Vec3.add(vel, Vec3.scale(E, qPrime));
  
  // 2. Magnetic rotation vector t = (q*B/m)*(dt/2)
  const t = Vec3.scale(B, qPrime);
  const tMagSq = t.magSq();
  // s = 2*t / (1 + |t|^2)
  const s = Vec3.scale(t, 2.0 / (1.0 + tMagSq));
  
  // v_prime = v_minus + v_minus x t
  const vPrime = Vec3.add(vMinus, Vec3.cross(vMinus, t));
  // v_plus = v_minus + v_prime x s
  const vPlus = Vec3.add(vMinus, Vec3.cross(vPrime, s));
  
  // 3. Second half electric acceleration: v_next = v_plus + (q*E/m)*(dt/2)
  const vNext = Vec3.add(vPlus, Vec3.scale(E, qPrime));
  
  // 4. Update position: x_next = x + v_next * dt
  const posNext = Vec3.add(pos, Vec3.scale(vNext, dt));
  
  return { pos: posNext, vel: vNext };
}

/**
 * Substep Execution Helper to eliminate time discretization errors
 */
function runSubsteps(stepCallback, dtTotal, numSubsteps = 8) {
  const dt = dtTotal / numSubsteps;
  for (let i = 0; i < numSubsteps; i++) {
    stepCallback(dt);
  }
}

// Utility: Wavelength to RGB approximation
function wavelengthToRGB(wavelength) {
  let r, g, b, alpha;
  const wl = wavelength;
  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / (440 - 380);
    g = 0.0;
    b = 1.0;
  } else if (wl >= 440 && wl < 490) {
    r = 0.0;
    g = (wl - 440) / (490 - 440);
    b = 1.0;
  } else if (wl >= 490 && wl < 510) {
    r = 0.0;
    g = 1.0;
    b = -(wl - 510) / (510 - 490);
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510);
    g = 1.0;
    b = 0.0;
  } else if (wl >= 580 && wl < 645) {
    r = 1.0;
    g = -(wl - 645) / (645 - 580);
    b = 0.0;
  } else if (wl >= 645 && wl <= 750) {
    r = 1.0;
    g = 0.0;
    b = 0.0;
  } else {
    r = 0.0; g = 0.0; b = 0.0;
  }

  // Intensity falloff near limits
  if (wl >= 380 && wl < 420) {
    alpha = 0.3 + 0.7 * (wl - 380) / (420 - 380);
  } else if (wl >= 420 && wl <= 700) {
    alpha = 1.0;
  } else if (wl > 700 && wl <= 750) {
    alpha = 0.3 + 0.7 * (750 - wl) / (750 - 700);
  } else {
    alpha = 0.0;
  }

  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
}

/**
 * Canvasni ota konteyner (parent) o'lchamiga moslab qayta o'lchaydi va
 * Retina/DPR ekranlarda xira ko'rinmasligi uchun devicePixelRatio'ni
 * hisobga oladi. `ctx.scale()` o'rniga `ctx.setTransform()` ishlatiladi,
 * shunda resize bir necha marta chaqirilganda (ekran aylantirilganda,
 * oyna o'lchami o'zgarganda) masshtab hech qachon kumulyativ (jamlanib)
 * oshib ketmaydi.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} [aspectRatio] - balandlik/kenglik nisbati (masalan 0.6).
 *   Berilmasa, konteynerning haqiqiy balandligi ishlatiladi.
 * @param {(width:number, height:number) => void} [onResize] - har bir
 *   qayta o'lchashdan keyin chaqiriladi (CSS piksellardagi yangi o'lcham bilan).
 * @returns {() => void} resize funksiyasining o'zi (darhol chaqirish uchun)
 */
function setupResponsiveCanvas(canvas, aspectRatio, onResize) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = Math.max(1, Math.floor(parent.clientWidth));
    const cssHeight = Math.max(1, Math.floor(
      aspectRatio ? cssWidth * aspectRatio : (parent.clientHeight || cssWidth * 0.6)
    ));

    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';

    // Kumulyativ emas, mutlaq masshtab — har chaqiriqda avvalgisini
    // qayta yozadi, shuning uchun bir necha marta resize chaqirilishi
    // xavfsiz.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (typeof onResize === 'function') onResize(cssWidth, cssHeight);
  }

  resize();

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);
  } else {
    window.addEventListener('resize', resize);
  }

  return resize;
}
