/**
 * Lecture 5, Tab 4: Live previews that run the EXACT functions shown in the
 * code listings (stepKepler, resolveParticleCollision) directly below them.
 */

// =============================================================================
// Same function as in the "Deterministik Kepler Harakati Kodi" listing
// =============================================================================
function stepKepler(planet, GM, dt) {
    const r2 = planet.x * planet.x + planet.y * planet.y;
    const r = Math.sqrt(r2);

    // Gravitatsiya tezlanishi a = -GM / r^3 * r
    const a = -GM / (r2 * r);
    const ax = a * planet.x;
    const ay = a * planet.y;

    // Simplektik Eyler-Kromer (v yangilanib, keyin x topiladi)
    planet.vx += ax * dt;
    planet.vy += ay * dt;

    planet.x += planet.vx * dt;
    planet.y += planet.vy * dt;

    // Invariantlar: E va L
    const Ek = 0.5 * (planet.vx ** 2 + planet.vy ** 2);
    const Ep = -GM / r;
    const Etot = Ek + Ep;
    const L = planet.x * planet.vy - planet.y * planet.vx;
    return { Etot, L };
}

function initKeplerCodePreview() {
    const canvas = document.getElementById('kepler-code-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const btnPlay = document.getElementById('kepler-code-play');

    const GM = 40000;
    const dt = 0.02;
    const subSteps = 5;
    const r0 = 140;
    let planet = { x: r0, y: 0, vx: 0, vy: Math.sqrt(GM / r0) };
    let trail = [];
    let running = true;

    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            running = !running;
            btnPlay.textContent = running ? '⏸' : '▶';
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.save();
        ctx.translate(cx, cy);

        if (trail.length > 1) {
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);
            for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
            ctx.stroke();
        }

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#34D399';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#34D399';
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    function loop() {
        if (running) {
            for (let s = 0; s < subSteps; s++) stepKepler(planet, GM, dt / subSteps);
            trail.push({ x: planet.x, y: planet.y });
            if (trail.length > 400) trail.shift();
        }
        draw();
        requestAnimationFrame(loop);
    }

    loop();
}

// =============================================================================
// Same function as in the "Stoxastik 2D Gaz To'qnashuvi Kodi" listing
// =============================================================================
function resolveParticleCollision(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist2 = dx * dx + dy * dy;
    const minDist = p1.r + p2.r;

    if (dist2 < minDist * minDist) {
        const dist = Math.sqrt(dist2) || 0.001;
        const nx = dx / dist;
        const ny = dy / dist;

        // Nisbiy tezlik
        const kx = p1.vx - p2.vx;
        const ky = p1.vy - p2.vy;
        const pvn = kx * nx + ky * ny;

        if (pvn > 0) {
            const impulse = (2 * pvn) / (p1.m + p2.m);
            p1.vx -= impulse * p2.m * nx;
            p1.vy -= impulse * p2.m * ny;
            p2.vx += impulse * p1.m * nx;
            p2.vy += impulse * p1.m * ny;
        }
    }
}

function initGasCodePreview() {
    const canvas = document.getElementById('gas-code-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const btnPlay = document.getElementById('gas-code-play');

    const N = 22;
    const particles = [];
    for (let i = 0; i < N; i++) {
        particles.push({
            x: 8 + Math.random() * (canvas.width - 16),
            y: 8 + Math.random() * (canvas.height - 16),
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            r: 5,
            m: 1
        });
    }
    let running = true;

    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            running = !running;
            btnPlay.textContent = running ? '⏸' : '▶';
        });
    }

    function updatePhysics() {
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x - p.r < 0) { p.x = p.r; p.vx *= -1; }
            else if (p.x + p.r > canvas.width) { p.x = canvas.width - p.r; p.vx *= -1; }

            if (p.y - p.r < 0) { p.y = p.r; p.vy *= -1; }
            else if (p.y + p.r > canvas.height) { p.y = canvas.height - p.r; p.vy *= -1; }
        }

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                resolveParticleCollision(particles[i], particles[j]);
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#F43F5E';
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function loop() {
        if (running) updatePhysics();
        draw();
        requestAnimationFrame(loop);
    }

    loop();
}

document.addEventListener('DOMContentLoaded', () => {
    initKeplerCodePreview();
    initGasCodePreview();
});
