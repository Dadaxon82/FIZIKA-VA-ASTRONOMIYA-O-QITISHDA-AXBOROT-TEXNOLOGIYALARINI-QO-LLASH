/**
 * Lecture 5: Dual-Engine Model Taxonomy Simulator
 * Engine 1: Deterministic Dynamic (Kepler Planetary Orbit)
 * Engine 2: Stochastic Dynamic (2D Gas Kinetics & Maxwell-Boltzmann Distribution)
 */

document.addEventListener('DOMContentLoaded', () => {
    initKeplerDeterministic();
    initGasStochastic();
});

// =============================================================================
// ENGINE 1: DETERMINISTIC DYNAMIC KEPLER ORBIT
// =============================================================================
function initKeplerDeterministic() {
    const canvas = document.getElementById('kepler-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Controls
    const speedSlider = document.getElementById('kepler-speed');
    const speedVal = document.getElementById('kepler-speed-val');
    const massSlider = document.getElementById('kepler-mass');
    const massVal = document.getElementById('kepler-mass-val');
    const dtSlider = document.getElementById('kepler-dt');
    const dtVal = document.getElementById('kepler-dt-val');
    const btnPlay = document.getElementById('kepler-play');
    const btnReset = document.getElementById('kepler-reset');
    const btnClear = document.getElementById('kepler-clear');

    // Telemetry
    const elR = document.getElementById('kep-r');
    const elV = document.getElementById('kep-v');
    const elEk = document.getElementById('kep-ek');
    const elEp = document.getElementById('kep-ep');
    const elEtot = document.getElementById('kep-etot');
    const elL = document.getElementById('kep-l');

    // Physics parameters
    let GM = 40000;
    let dt = 0.02;
    let isRunning = true;
    let scale = 1.0;

    const sun = { x: 0, y: 0, r: 16 };
    let planet = { x: 180, y: 0, vx: 0, vy: 14.5, r: 8 };
    let trail = [];
    const maxTrail = 800;

    function resetSimulation() {
        const vMult = parseFloat(speedSlider ? speedSlider.value : 1.0);
        GM = parseFloat(massSlider ? massSlider.value : 40000);
        dt = parseFloat(dtSlider ? dtSlider.value : 0.02);

        // Circular orbit velocity: v = sqrt(GM / r)
        const r0 = 180;
        const v_circ = Math.sqrt(GM / r0);
        
        planet.x = r0;
        planet.y = 0;
        planet.vx = 0;
        planet.vy = v_circ * vMult;
        trail = [];
        updateTelemetry();
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            if (speedVal) speedVal.textContent = parseFloat(e.target.value).toFixed(2) + 'x';
            resetSimulation();
        });
    }

    if (massSlider) {
        massSlider.addEventListener('input', (e) => {
            if (massVal) massVal.textContent = e.target.value;
            resetSimulation();
        });
    }

    if (dtSlider) {
        dtSlider.addEventListener('input', (e) => {
            dt = parseFloat(e.target.value);
            if (dtVal) dtVal.textContent = dt.toFixed(3) + ' s';
        });
    }

    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            isRunning = !isRunning;
            btnPlay.textContent = isRunning ? '⏸ To\'xtatish' : '▶ Davom ettirish';
            btnPlay.className = isRunning ? 'btn btn-amber' : 'btn btn-emerald';
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            resetSimulation();
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            trail = [];
        });
    }

    function updatePhysics() {
        if (!isRunning) return;

        // Symplectic Euler-Cromer integration for accurate orbit preservation
        const subSteps = 5;
        const subDt = dt / subSteps;

        for (let s = 0; s < subSteps; s++) {
            const rx = planet.x;
            const ry = planet.y;
            const r2 = rx * rx + ry * ry;
            const r = Math.sqrt(r2);

            if (r < sun.r) {
                // Collided with Sun
                isRunning = false;
                if (btnPlay) btnPlay.textContent = '▶ Qayta boshlash';
                break;
            }

            const a = -GM / (r2 * r);
            const ax = a * rx;
            const ay = a * ry;

            // Update velocity
            planet.vx += ax * subDt;
            planet.vy += ay * subDt;

            // Update position
            planet.x += planet.vx * subDt;
            planet.y += planet.vy * subDt;
        }

        // Add to trail
        trail.push({ x: planet.x, y: planet.y });
        if (trail.length > maxTrail) trail.shift();

        updateTelemetry();
    }

    function updateTelemetry() {
        const r = Math.sqrt(planet.x * planet.x + planet.y * planet.y);
        const v = Math.sqrt(planet.vx * planet.vx + planet.vy * planet.vy);
        const Ek = 0.5 * v * v;
        const Ep = -GM / (r || 1);
        const Etot = Ek + Ep;
        const L = planet.x * planet.vy - planet.y * planet.vx;

        if (elR) elR.textContent = (r / 100).toFixed(2) + ' a.b.';
        if (elV) elV.textContent = v.toFixed(1) + ' km/s';
        if (elEk) elEk.textContent = Ek.toFixed(1) + ' J/kg';
        if (elEp) elEp.textContent = Ep.toFixed(1) + ' J/kg';
        if (elEtot) elEtot.textContent = Etot.toFixed(1) + ' J/kg';
        if (elL) elL.textContent = L.toFixed(0) + ' birlik';
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Background space grid
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);

        // Coordinate axes
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.beginPath();
        ctx.moveTo(-cx, 0); ctx.lineTo(cx, 0);
        ctx.moveTo(0, -cy); ctx.lineTo(0, cy);
        ctx.stroke();

        // Orbit trail
        if (trail.length > 1) {
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#38BDF8';
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);
            for (let i = 1; i < trail.length; i++) {
                ctx.lineTo(trail[i].x, trail[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Radius vector line
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(planet.x, planet.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sun (Central gravity body)
        const sunGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, sun.r * 1.5);
        sunGrad.addColorStop(0, '#FEF08A');
        sunGrad.addColorStop(0.5, '#FBBF24');
        sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(0, 0, sun.r * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, 0, sun.r, 0, Math.PI * 2);
        ctx.fill();

        // Planet
        ctx.fillStyle = '#34D399';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#34D399';
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Velocity vector arrow
        const vScale = 3.5;
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(planet.x, planet.y);
        ctx.lineTo(planet.x + planet.vx * vScale, planet.y + planet.vy * vScale);
        ctx.stroke();

        ctx.restore();

        // Info Badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(15, 15, 260, 45, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('DETERMINISTIK DINAMIK MODEL', 25, 33);
        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px sans-serif';
        ctx.fillText('100% Oldindan Aniq Yopiq Orbita (Kepler)', 25, 49);
    }

    function loop() {
        updatePhysics();
        draw();
        requestAnimationFrame(loop);
    }

    resetSimulation();
    loop();
}

// =============================================================================
// ENGINE 2: STOCHASTIC DYNAMIC 2D GAS & MAXWELL-BOLTZMANN
// =============================================================================
function initGasStochastic() {
    const canvas = document.getElementById('gas-canvas');
    const histCanvas = document.getElementById('gas-hist-canvas');
    if (!canvas || !histCanvas) return;

    const ctx = canvas.getContext('2d');
    const hctx = histCanvas.getContext('2d');

    // Controls
    const countSlider = document.getElementById('gas-count');
    const countVal = document.getElementById('gas-count-val');
    const tempSlider = document.getElementById('gas-temp');
    const tempVal = document.getElementById('gas-temp-val');
    const btnPlay = document.getElementById('gas-play');
    const btnReset = document.getElementById('gas-reset');
    const btnHeat = document.getElementById('gas-heat');
    const btnCool = document.getElementById('gas-cool');

    // Telemetry
    const elTemp = document.getElementById('gas-t-display');
    const elPressure = document.getElementById('gas-p-display');
    const elVavg = document.getElementById('gas-vavg-display');
    const elVp = document.getElementById('gas-vp-display');
    const elVrms = document.getElementById('gas-vrms-display');

    let particles = [];
    let isRunning = true;
    let targetTemperature = 300; // Kelvin
    let tracerTrail = [];
    const maxTracerTrail = 250;

    let wallMomentumAccum = 0;
    let pressureHistory = [];
    let lastPressureTime = performance.now();
    let currentPressure = 1.0;

    const particleRadius = 4.5;
    const particleMass = 1.0;

    function createParticle(isTracer = false) {
        const speed = Math.sqrt(targetTemperature) * 0.12 * (0.6 + Math.random() * 0.8);
        const angle = Math.random() * Math.PI * 2;
        return {
            x: particleRadius + Math.random() * (canvas.width - 2 * particleRadius),
            y: particleRadius + Math.random() * (canvas.height - 2 * particleRadius),
            vx: speed * Math.cos(angle),
            vy: speed * Math.sin(angle),
            r: isTracer ? 6.5 : particleRadius,
            m: isTracer ? 2.0 : particleMass,
            isTracer: isTracer
        };
    }

    function initGas() {
        const N = parseInt(countSlider ? countSlider.value : 80, 10);
        targetTemperature = parseInt(tempSlider ? tempSlider.value : 300, 10);
        particles = [];
        tracerTrail = [];

        // 1st particle is tracer (Brownian motion indicator)
        particles.push(createParticle(true));

        for (let i = 1; i < N; i++) {
            particles.push(createParticle(false));
        }
        rescaleVelocitiesToTemperature();
    }

    function rescaleVelocitiesToTemperature() {
        if (particles.length === 0) return;
        let sumKinetic = 0;
        for (const p of particles) {
            sumKinetic += 0.5 * p.m * (p.vx * p.vx + p.vy * p.vy);
        }
        const currentT = sumKinetic / particles.length;
        const targetT = targetTemperature * 0.015;
        const factor = Math.sqrt(targetT / (currentT || 1));

        for (const p of particles) {
            p.vx *= factor;
            p.vy *= factor;
        }
    }

    if (countSlider) {
        countSlider.addEventListener('input', (e) => {
            const count = parseInt(e.target.value, 10);
            if (countVal) countVal.textContent = count;
            
            while (particles.length < count) {
                particles.push(createParticle(false));
            }
            while (particles.length > count) {
                particles.pop();
            }
            rescaleVelocitiesToTemperature();
        });
    }

    if (tempSlider) {
        tempSlider.addEventListener('input', (e) => {
            targetTemperature = parseInt(e.target.value, 10);
            if (tempVal) tempVal.textContent = targetTemperature + ' K';
            rescaleVelocitiesToTemperature();
        });
    }

    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            isRunning = !isRunning;
            btnPlay.textContent = isRunning ? '⏸ To\'xtatish' : '▶ Davom ettirish';
            btnPlay.className = isRunning ? 'btn btn-amber' : 'btn btn-emerald';
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            initGas();
        });
    }

    if (btnHeat) {
        btnHeat.addEventListener('click', () => {
            targetTemperature = Math.min(800, targetTemperature + 50);
            if (tempSlider) tempSlider.value = targetTemperature;
            if (tempVal) tempVal.textContent = targetTemperature + ' K';
            rescaleVelocitiesToTemperature();
        });
    }

    if (btnCool) {
        btnCool.addEventListener('click', () => {
            targetTemperature = Math.max(50, targetTemperature - 50);
            if (tempSlider) tempSlider.value = targetTemperature;
            if (tempVal) tempVal.textContent = targetTemperature + ' K';
            rescaleVelocitiesToTemperature();
        });
    }

    function updatePhysics() {
        if (!isRunning) return;

        const dt = 1.0;
        const width = canvas.width;
        const height = canvas.height;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Elastic wall collisions
            if (p.x - p.r < 0) {
                p.x = p.r;
                p.vx = -p.vx;
                wallMomentumAccum += 2 * p.m * Math.abs(p.vx);
            } else if (p.x + p.r > width) {
                p.x = width - p.r;
                p.vx = -p.vx;
                wallMomentumAccum += 2 * p.m * Math.abs(p.vx);
            }

            if (p.y - p.r < 0) {
                p.y = p.r;
                p.vy = -p.vy;
                wallMomentumAccum += 2 * p.m * Math.abs(p.vy);
            } else if (p.y + p.r > height) {
                p.y = height - p.r;
                p.vy = -p.vy;
                wallMomentumAccum += 2 * p.m * Math.abs(p.vy);
            }

            // Particle-particle collisions (2D Elastic Hard-Disks)
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const dx = q.x - p.x;
                const dy = q.y - p.y;
                const dist2 = dx * dx + dy * dy;
                const minDist = p.r + q.r;

                if (dist2 < minDist * minDist) {
                    const dist = Math.sqrt(dist2) || 0.001;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Positional overlap resolution
                    const overlap = minDist - dist;
                    p.x -= nx * overlap * 0.5;
                    p.y -= ny * overlap * 0.5;
                    q.x += nx * overlap * 0.5;
                    q.y += ny * overlap * 0.5;

                    // Relative velocity along normal
                    const kx = p.vx - q.vx;
                    const ky = p.vy - q.vy;
                    const pvn = kx * nx + ky * ny;

                    if (pvn > 0) {
                        // Impulse scalar
                        const impulse = (2 * pvn) / (p.m + q.m);
                        p.vx -= impulse * q.m * nx;
                        p.vy -= impulse * q.m * ny;
                        q.vx += impulse * p.m * nx;
                        q.vy += impulse * p.m * ny;
                    }
                }
            }
        }

        // Record Tracer Path
        if (particles.length > 0 && particles[0].isTracer) {
            tracerTrail.push({ x: particles[0].x, y: particles[0].y });
            if (tracerTrail.length > maxTracerTrail) tracerTrail.shift();
        }

        // Pressure calculation every 100ms
        const now = performance.now();
        if (now - lastPressureTime > 120) {
            const timeDelta = (now - lastPressureTime) / 1000;
            const perimeter = 2 * (width + height);
            currentPressure = wallMomentumAccum / (perimeter * timeDelta * 10);
            wallMomentumAccum = 0;
            lastPressureTime = now;
            updateTelemetry();
        }
    }

    function updateTelemetry() {
        if (particles.length === 0) return;

        let sumV = 0;
        let sumV2 = 0;
        let sumEk = 0;

        for (const p of particles) {
            const v2 = p.vx * p.vx + p.vy * p.vy;
            const v = Math.sqrt(v2);
            sumV += v;
            sumV2 += v2;
            sumEk += 0.5 * p.m * v2;
        }

        const avgV = sumV / particles.length;
        const vrms = Math.sqrt(sumV2 / particles.length);
        const actualT = (sumEk / particles.length) / 0.015;
        const vp = avgV * 0.886; // Theoretical 2D peak

        if (elTemp) elTemp.textContent = Math.round(actualT) + ' K';
        if (elPressure) elPressure.textContent = currentPressure.toFixed(2) + ' kPa';
        if (elVavg) elVavg.textContent = (avgV * 120).toFixed(0) + ' m/s';
        if (elVp) elVp.textContent = (vp * 120).toFixed(0) + ' m/s';
        if (elVrms) elVrms.textContent = (vrms * 120).toFixed(0) + ' m/s';
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Container Border
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Tracer Trail (Brownian random walk)
        if (tracerTrail.length > 1) {
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(tracerTrail[0].x, tracerTrail[0].y);
            for (let i = 1; i < tracerTrail.length; i++) {
                ctx.lineTo(tracerTrail[i].x, tracerTrail[i].y);
            }
            ctx.stroke();
        }

        // Draw Particles
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

            if (p.isTracer) {
                ctx.fillStyle = '#F43F5E';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#F43F5E';
                ctx.fill();
                ctx.shadowBlur = 0;

                // Tracer label
                ctx.fillStyle = '#FB7185';
                ctx.font = 'bold 9px sans-serif';
                ctx.fillText('Broun Zarrasi', p.x + 8, p.y - 4);
            } else {
                // Color by speed (Cold blue to hot orange)
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const ratio = Math.min(1.0, speed / 5.0);
                const r = Math.floor(56 + ratio * 200);
                const g = Math.floor(189 - ratio * 100);
                const b = Math.floor(248 - ratio * 200);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fill();
            }
        }

        // Info Badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(15, 15, 270, 45, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#F43F5E';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('STOXASTIK DINAMIK MODEL', 25, 33);
        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px sans-serif';
        ctx.fillText('N ta Molekula Tasodifiy To\'qnashuvi (MKT)', 25, 49);

        // Draw Live Maxwell-Boltzmann Histogram
        drawMaxwellHistogram();
    }

    function drawMaxwellHistogram() {
        hctx.clearRect(0, 0, histCanvas.width, histCanvas.height);

        const w = histCanvas.width;
        const h = histCanvas.height;
        const numBins = 18;
        const maxSpeed = 7.0;
        const binWidth = maxSpeed / numBins;
        const bins = new Array(numBins).fill(0);

        // Fill bins
        let maxCount = 1;
        for (const p of particles) {
            const v = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const binIdx = Math.min(numBins - 1, Math.floor(v / binWidth));
            bins[binIdx]++;
            if (bins[binIdx] > maxCount) maxCount = bins[binIdx];
        }

        // Draw histogram bars
        const paddingLeft = 35;
        const paddingBottom = 25;
        const plotW = w - paddingLeft - 10;
        const plotH = h - paddingBottom - 15;
        const barPxWidth = plotW / numBins;

        for (let i = 0; i < numBins; i++) {
            const barH = (bins[i] / (maxCount * 1.2 || 1)) * plotH;
            const x = paddingLeft + i * barPxWidth;
            const y = h - paddingBottom - barH;

            hctx.fillStyle = 'rgba(244, 63, 94, 0.55)';
            hctx.strokeStyle = '#FB7185';
            hctx.lineWidth = 1;
            hctx.fillRect(x + 1, y, barPxWidth - 2, barH);
            hctx.strokeRect(x + 1, y, barPxWidth - 2, barH);
        }

        // Draw Theoretical 2D Maxwell-Boltzmann Curve: f(v) = (v / T_eff) * exp(-v^2 / (2 T_eff))
        const Teff = targetTemperature * 0.0075;
        hctx.strokeStyle = '#FBBF24';
        hctx.lineWidth = 2.5;
        hctx.beginPath();

        let maxMB = (1 / Math.sqrt(Teff)) * Math.exp(-0.5);
        for (let px = 0; px <= plotW; px += 2) {
            const v = (px / plotW) * maxSpeed;
            const fv = (v / Teff) * Math.exp(- (v * v) / (2 * Teff));
            const normFv = fv / (maxMB || 1);
            const y = h - paddingBottom - normFv * plotH * 0.85;
            if (px === 0) hctx.moveTo(paddingLeft + px, y);
            else hctx.lineTo(paddingLeft + px, y);
        }
        hctx.stroke();

        // Axes
        hctx.strokeStyle = '#64748B';
        hctx.lineWidth = 1.5;
        hctx.beginPath();
        hctx.moveTo(paddingLeft, 10);
        hctx.lineTo(paddingLeft, h - paddingBottom);
        hctx.lineTo(w - 10, h - paddingBottom);
        hctx.stroke();

        // Axis labels
        hctx.fillStyle = '#94A3B8';
        hctx.font = '10px sans-serif';
        hctx.fillText('Tezlik v [m/s] →', w - 90, h - 8);
        hctx.fillText('f(v)', 8, 20);

        // Legend
        hctx.fillStyle = '#FBBF24';
        hctx.fillText('— Nazariy Maksvell Egri Chizig\'i', paddingLeft + 10, 20);
    }

    function loop() {
        updatePhysics();
        draw();
        requestAnimationFrame(loop);
    }

    initGas();
    loop();
}
