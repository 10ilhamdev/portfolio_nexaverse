/**
 * Dragon Animation — Majestic & Interactive Canvas Dragon
 * ───────────────────────────────────────────────────────────
 * LOOKS LIKE: The legendary, high-detail Eastern Dragon.
 * INTERACTIVE: Press & hold anywhere to make the dragon breathe fire.
 * MOVEMENT:    Slow, majestic, and user-friendly with uniform segment spacing.
 * GEOMETRY:    Beautifully proportioned body with LUT path-offset tracing to prevent stretching.
 */
(function () {
    'use strict';

    /* ═══════════════ CONFIG ═══════════════ */
    const NUM_SEGS = 48; // Shorter, balanced body length
    const LUT_SPEED = 1.3; // Constant speed along the LUT path

    const WP = [
        [0.10, 0.10], [0.45, 0.05], [0.88, 0.08],
        [0.93, 0.35], [0.90, 0.70], [0.68, 0.92],
        [0.45, 0.88], [0.22, 0.92], [0.06, 0.68],
        [0.06, 0.35], [0.22, 0.12],
        [0.38, 0.28], [0.62, 0.28], [0.75, 0.55],
        [0.50, 0.60], [0.28, 0.55],
    ];

    const SEQ = ['fly', 'fly', 'charge', 'breathe', 'fly', 'fly', 'charge', 'breathe', 'fly', 'roar'];
    const DUR = { fly: 8, charge: 1.4, breathe: 3.5, roar: 2.2 };

    /* ═══════════════ STATE ════════════════ */
    let canvas, ctx, W, H;
    let time = 0, lastTs = 0, lutIndex = 0;
    let particles = [];
    let seqIdx = 0, state = 'fly', stateTimer = 0;
    let jawOpen = 0;
    let frameId;
    let mouseX = 0, mouseY = 0, isMouseDown = false;
    let pathLUT = [];
    let headRotOffset = 0; // Smooth head tilt offset
    let userInterrupted = false; // Track manual fire-breathing override

    let isMobile = false;
    let scaleCache = null;
    let lastTheme = null;

    /* ═══════════════ PALETTE ══════════════ */
    const isL = () => document.body.classList.contains('light-mode');

    function C() {
        const L = isL();
        return {
            body: L ? '#22c99e' : '#cc2000', // Teal in light mode, Crimson Red in dark mode
            bodyD: L ? '#0f766e' : '#7a1000',
            bodyH: L ? '#5eead4' : '#ff5533',
            belly: L ? '#f0fdfa' : '#ff9966', // Warm underbelly in dark mode
            bellyH: L ? '#ffffff' : '#ffcc99',
            spine1: L ? '#ea580c' : '#ff9900', // Bright orange spines
            spine2: L ? '#eab308' : '#ffcc00', // Yellow/orange spines
            outline: L ? '#042f2e' : '#220000', // Deep outlines for contrast
            eye: L ? '#dc2626' : '#ffea00', // Glowing gold eyes in dark mode
            pupil: L ? '#000000' : '#000000',
            glowRGB: L ? '34,201,158' : '204,32,0',
            fire: L ? ['#ff4500', '#ffa500', '#ffcc00', '#ffeedd']
                : ['#ff1100', '#ff5500', '#ffaa00', '#ffee55'],
            fireG: L ? 'rgba(255,69,0,0.6)' : 'rgba(255,50,0,0.7)',
        };
    }

    /* ═══════════════ CACHE GENERATOR ═══════ */
    function buildScaleCache() {
        if (!scaleCache) {
            scaleCache = document.createElement('canvas');
        }
        scaleCache.width = 128;
        scaleCache.height = 128;
        const sCtx = scaleCache.getContext('2d');
        const c = C();

        const w = 128, h = 128;
        const cx = w / 2, cy = h / 2;
        const scW = 50, scH = 50;

        sCtx.clearRect(0, 0, w, h);
        sCtx.save();
        sCtx.translate(cx, cy);

        sCtx.beginPath();
        sCtx.moveTo(-scW * 0.675, -scH);
        sCtx.quadraticCurveTo(scW * 0.425, -scH, scW * 0.675, 0);
        sCtx.quadraticCurveTo(scW * 0.425, scH, -scW * 0.675, scH);
        sCtx.quadraticCurveTo(-scW * 0.325, 0, -scW * 0.675, -scH);
        sCtx.closePath();

        const scGrad = sCtx.createRadialGradient(-scW * 0.375, -scH * 0.2, 0, -scW * 0.175, 0, scW);
        scGrad.addColorStop(0, c.bodyH);
        scGrad.addColorStop(0.65, c.body);
        scGrad.addColorStop(1, c.bodyD);

        sCtx.fillStyle = scGrad;
        sCtx.fill();

        sCtx.strokeStyle = c.bodyD;
        sCtx.lineWidth = 1.0;
        sCtx.stroke();
        sCtx.restore();

        lastTheme = isL();
    }

    /* ═══════════════ RESIZE (HiDPI) ═══════ */
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        W = window.innerWidth || 800;
        H = window.innerHeight || 600;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
        isMobile = W < 768;
        buildScaleCache();
        buildLUT(); // Rebuild LUT so coordinates scale to new window size
    }

    /* ═══════════════ PATH ═════════════════ */
    function cr(p0, p1, p2, p3, t) {
        const t2 = t * t, t3 = t2 * t;
        return [
            .5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
            .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ];
    }
    function pPos(t) {
        const n = WP.length, i = Math.floor(t) % n, f = t - Math.floor(t);
        const v = cr(WP[(i - 1 + n) % n], WP[i % n], WP[(i + 1) % n], WP[(i + 2) % n], f);
        return { x: v[0] * W, y: v[1] * H };
    }
    function pAng(t) {
        const a = pPos(t), b = pPos(t + .004);
        return Math.atan2(b.y - a.y, b.x - a.x);
    }

    /* ═══════════════ PATH LUT GENERATOR ════ */
    function buildLUT() {
        if (W <= 0 || H <= 0) return;
        pathLUT = [];

        // 1. High-resolution raw sampling along spline parameter t
        const rawSamples = [];
        const numSamples = 4000;
        for (let i = 0; i <= numSamples; i++) {
            const t = (i / numSamples) * WP.length;
            rawSamples.push(pPos(t));
        }

        // 2. Compute cumulative distances along the spline
        const dists = [0];
        let totalLength = 0;
        for (let i = 1; i <= numSamples; i++) {
            const p1 = rawSamples[i - 1];
            const p2 = rawSamples[i];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
            dists.push(totalLength);
        }

        // 3. Resample the curve at exactly equal physical distances (every 3 pixels)
        const stepDist = 3;
        const numSteps = Math.floor(totalLength / stepDist);

        for (let i = 0; i < numSteps; i++) {
            const targetD = i * stepDist;

            // Binary search to find the matching segment in the high-res samples
            let low = 0, high = numSamples;
            while (low < high) {
                const mid = Math.floor((low + high) / 2);
                if (dists[mid] < targetD) low = mid + 1;
                else high = mid;
            }

            const idx = Math.max(1, low);
            const d0 = dists[idx - 1];
            const d1 = dists[idx];
            const ratio = (d1 - d0) > 0.0001 ? (targetD - d0) / (d1 - d0) : 0;

            const p1 = rawSamples[idx - 1];
            const p2 = rawSamples[idx];
            const x = p1.x + (p2.x - p1.x) * ratio;
            const y = p1.y + (p2.y - p1.y) * ratio;

            pathLUT.push({ x, y, angle: 0 });
        }

        // 4. Compute perfect smooth angles along the equidistant points
        const len = pathLUT.length;
        if (len > 1) {
            for (let i = 0; i < len; i++) {
                const nextPt = pathLUT[(i + 1) % len];
                const prevPt = pathLUT[(i - 1 + len) % len];
                pathLUT[i].angle = Math.atan2(nextPt.y - prevPt.y, nextPt.x - prevPt.x);
            }
        }
    }

    /* ═══════════════ SEGMENT RADIUS ═══════ */
    function segR(i) {
        const t = i / (NUM_SEGS - 1);
        const neck = i < 10 ? (0.65 + i * 0.035) : 1;
        return 18 * Math.pow(1 - t, 0.48) * neck;
    }

    /* ═══════════════ PATH NAVIGATION ══════ */
    function tickPath(dt) {
        if (!pathLUT.length) return;
        // Frame-rate independent speed: 145 pixels per second along the path
        const speedInPixelsPerSecond = 170;
        const speedInIndicesPerSecond = speedInPixelsPerSecond / 3.0; // 3px per index
        lutIndex += speedInIndicesPerSecond * dt;
        if (lutIndex >= pathLUT.length) lutIndex -= pathLUT.length;
    }

    /* ═══════════════ SPINE POSITION ═══════ */
    function spine(i) {
        if (!pathLUT.length) return { x: W * 0.5, y: H * 0.5, angle: 0 };
        const segSpacing = 5; // Exactly 5 * 3 = 15 pixels physical distance between segments!
        const rawIdx = Math.floor(lutIndex - i * segSpacing);
        const idx = ((rawIdx % pathLUT.length) + pathLUT.length) % pathLUT.length;
        const basePt = pathLUT[idx] || pathLUT[0];

        // Serpentine slithering wave perpendicular to the path
        const waveFreq = 4.2;
        const waveAmp = 14 * Math.sin((i / NUM_SEGS) * Math.PI); // Strongest in the middle, 0 at head and tail
        const wave = Math.sin(time * waveFreq - i * 0.28) * waveAmp;

        const perpAng = basePt.angle + Math.PI / 2;
        return {
            x: basePt.x + Math.cos(perpAng) * wave,
            y: basePt.y + Math.sin(perpAng) * wave,
            angle: basePt.angle + Math.cos(time * waveFreq - i * 0.28) * (waveAmp * 0.022)
        };
    }

    /* ═══════════════ PARTICLES ════════════ */
    function emitFire() {
        const h = spine(0);
        const headAng = h.angle + headRotOffset;

        // Dynamic emission point matching the snout scaled by 1.85 and jawOpen displacement
        const localX = 14 * 1.85;
        const localY = (jawOpen * 9) * 1.85;

        const cos = Math.cos(headAng);
        const sin = Math.sin(headAng);
        const mx = h.x + (localX * cos - localY * sin);
        const my = h.y + (localX * sin + localY * cos);
        const c = C();

        for (let i = 0; i < 10; i++) {
            const pa = headAng + (Math.random() - 0.5) * 0.42;
            const spd = 9 + Math.random() * 12;
            particles.push({
                x: mx, y: my, vx: Math.cos(pa) * spd, vy: Math.sin(pa) * spd - .6,
                life: 1, sz: 15 + Math.random() * 20, col: c.fire[Math.floor(Math.random() ** 1.6 * c.fire.length)],
                rot: Math.random() * Math.PI * 2, ember: Math.random() < .18
            });
        }
    }
    function emitSparks() {
        const h = spine(0);
        const headAng = h.angle + headRotOffset;
        if (Math.random() > 0.45) return;
        const pa = headAng + (Math.random() - 0.5) * 0.95;
        particles.push({
            x: h.x + Math.cos(headAng) * 40, y: h.y + Math.sin(headAng) * 40,
            vx: Math.cos(pa) * 3, vy: Math.sin(pa) * 3 - 1, life: 1, sz: 8, col: C().fire[1], rot: 0, ember: true
        });
    }
    function tickParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy -= .13; p.vx *= .97;
            p.life -= dt * (p.ember ? 1.1 : .7); p.sz *= .975; p.rot += .06;
            if (p.life <= 0 || p.sz < .4) particles.splice(i, 1);
        }
    }

    /* ═══════════════ SMOOTH PATH ══════════ */
    function smPath(pts, cont) {
        if (pts.length < 2) return;
        cont ? ctx.lineTo(pts[0].x, pts[0].y) : ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++)
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    }

    /* ═══════════════ DRAW: PARTICLES ══════ */
    function h2r(h) {
        if (h === '#fff' || h === '#ffffff') return [255, 255, 255];
        const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
        return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 165, 0];
    }
    function drawParticles() {
        particles.forEach(p => {
            if (!p.ember) {
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                const [r, g, b] = h2r(p.col);
                const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, p.sz);
                gr.addColorStop(0, `rgba(255,255,200,${p.life})`);
                gr.addColorStop(.35, `rgba(${r},${g},${b},${p.life * .85})`);
                gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
                ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, p.sz, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            } else {
                ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = p.col;
                ctx.fillStyle = '#ffee66'; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.sz * .15), 0, Math.PI * 2);
                ctx.fill(); ctx.restore();
            }
        });
    }

    /* ═══════════════ DRAW: GLOW TRAIL ═════ */
    function drawTrail() {
        if (isMobile) return;
        const rgb = C().glowRGB;
        ctx.save(); ctx.globalAlpha = .07;
        const lim = Math.min(55, NUM_SEGS);
        for (let i = 0; i < lim; i++) {
            const h = spine(i), fade = 1 - i / lim;
            const r = segR(Math.min(i, NUM_SEGS - 1)) * 1.5 * fade;
            if (r < 2) continue;
            const gr = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, r);
            gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(1, `rgba(${rgb},0)`);
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    /* ═══════════════ DRAW: LEGS ═══════════ */
    function drawLegs(isForeground) {
        // Distribute legs nicely along the body (frontIdx and backIdx must have body radius >= 8px)
        const frontIdx = 12;
        const backIdx = 30;

        if (isForeground) {
            drawLeg(frontIdx, 1, true);
            drawLeg(backIdx, 1, true);
        } else {
            drawLeg(frontIdx, -1, false);
            drawLeg(backIdx, -1, false);
        }
    }

    function drawLeg(idx, side, isForeground) {
        const c = C();
        const s = spine(idx);
        const r = segR(idx);
        if (r < 8) return;

        const angle = s.angle + side * Math.PI / 2;
        const bx = s.x + Math.cos(angle) * r * 0.3;
        const by = s.y + Math.sin(angle) * r * 0.3;

        const tTime = time * 3.0 + idx * 0.5;
        const sweep = Math.sin(tTime) * 0.35;

        const thighAngle = s.angle + side * Math.PI * 0.52 + sweep;
        const thighLen = r * 1.35;
        const kx = bx + Math.cos(thighAngle) * thighLen;
        const ky = by + Math.sin(thighAngle) * thighLen;

        const footAngle = thighAngle - side * Math.PI * 0.3 + Math.cos(tTime) * 0.15;
        const fx = kx + Math.cos(footAngle) * r * 1.0;
        const fy = ky + Math.sin(footAngle) * r * 1.0;

        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(
            bx + Math.cos(thighAngle + side * 0.35) * r * 0.8,
            by + Math.sin(thighAngle + side * 0.35) * r * 0.8,
            kx, ky
        );
        ctx.quadraticCurveTo(
            kx + Math.cos(footAngle - side * 0.35) * r * 0.6,
            ky + Math.sin(footAngle - side * 0.35) * r * 0.6,
            fx, fy
        );
        ctx.lineTo(fx + Math.cos(footAngle + Math.PI / 2) * r * 0.25, fy + Math.sin(footAngle + Math.PI / 2) * r * 0.25);
        ctx.quadraticCurveTo(
            kx + Math.cos(footAngle + Math.PI / 2) * r * 0.3,
            ky + Math.sin(footAngle + Math.PI / 2) * r * 0.3,
            kx, ky
        );
        ctx.quadraticCurveTo(
            bx + Math.cos(thighAngle - side * 0.35) * r * 0.6,
            by + Math.sin(thighAngle - side * 0.35) * r * 0.6,
            bx, by
        );
        ctx.closePath();

        ctx.fillStyle = c.body;
        ctx.fill();
        ctx.strokeStyle = c.bodyD;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(kx, ky);
        ctx.lineTo(fx, fy);
        ctx.strokeStyle = c.bodyH;
        ctx.lineWidth = r * 0.14;
        ctx.stroke();

        ctx.restore();

        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(footAngle);

        ctx.fillStyle = c.body;
        ctx.strokeStyle = c.bodyD;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const clawNum = 4;
        for (let j = 0; j < clawNum; j++) {
            const clawAngle = (j - (clawNum - 1) / 2) * 0.4 + Math.sin(tTime + j) * 0.05;
            ctx.save();
            ctx.rotate(clawAngle);
            ctx.fillStyle = isL() ? '#f59e0b' : '#ffaa00';
            ctx.strokeStyle = c.bodyD;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(r * 0.4, -r * 0.08, r * 0.65, 0);
            ctx.quadraticCurveTo(r * 0.4, r * 0.15, 0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    /* ═══════════════ DRAW: BODY ═══════════ */
    function drawBody() {
        const c = C();
        const n = NUM_SEGS;

        const up = [], lo = [];
        for (let i = 0; i < n; i++) {
            const s = spine(i), r = segR(i);
            const px = Math.cos(s.angle - Math.PI / 2), py = Math.sin(s.angle - Math.PI / 2);
            up.push({ x: s.x + px * r, y: s.y + py * r });
            lo.push({ x: s.x - px * r, y: s.y - py * r });
        }

        // ── 1. MAIN BODY FILL ──
        ctx.save();
        ctx.beginPath(); smPath(up, false); smPath([...lo].reverse(), true); ctx.closePath();

        // Multi-stop HD gradient for body depth shading
        const grad = ctx.createLinearGradient(up[0].x, up[0].y, lo[0].x, lo[0].y);
        grad.addColorStop(0, c.bodyH);
        grad.addColorStop(0.4, c.body);
        grad.addColorStop(1, c.bodyD);

        ctx.fillStyle = grad;
        ctx.shadowBlur = 16; ctx.shadowColor = `rgba(${c.glowRGB},0.35)`;
        ctx.fill(); ctx.shadowBlur = 0;
        ctx.restore();

        // ── 2. BACK STRIPE ──
        ctx.save();
        const backEdge = [];
        for (let i = 0; i < n; i++) {
            const s = spine(i), r = segR(i) * 0.36;
            const px = Math.cos(s.angle - Math.PI / 2), py = Math.sin(s.angle - Math.PI / 2);
            backEdge.push({ x: s.x + px * r, y: s.y + py * r });
        }
        ctx.beginPath(); smPath(up, false); smPath([...backEdge].reverse(), true); ctx.closePath();
        ctx.fillStyle = c.bodyD; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
        ctx.restore();

        // ── 3. HIGHLIGHT LINE ──
        ctx.save();
        ctx.beginPath(); smPath(up, false);
        const maxR = segR(Math.floor(n / 3));
        ctx.strokeStyle = c.bodyH;
        ctx.lineWidth = Math.max(2.0, maxR * 0.22);
        ctx.globalAlpha = 0.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.stroke(); ctx.globalAlpha = 1;
        ctx.restore();

        // ── 4. BELLY STRIPE ──
        ctx.save();
        const bellyEdge = [];
        for (let i = 0; i < n; i++) {
            const s = spine(i), r = segR(i) * 0.40;
            const px = Math.cos(s.angle - Math.PI / 2), py = Math.sin(s.angle - Math.PI / 2);
            bellyEdge.push({ x: s.x - px * r, y: s.y - py * r });
        }
        ctx.beginPath(); smPath(bellyEdge, false); smPath([...lo].reverse(), true); ctx.closePath();

        const bGrad = ctx.createLinearGradient(bellyEdge[0].x, bellyEdge[0].y, lo[0].x, lo[0].y);
        bGrad.addColorStop(0, c.bellyH);
        bGrad.addColorStop(1, c.belly);
        ctx.fillStyle = bGrad; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
        ctx.restore();

        // ── 4b. BELLY PLATES (Distinct HD divisions) ──
        ctx.save();
        ctx.beginPath(); smPath(bellyEdge, false); smPath([...lo].reverse(), true); ctx.closePath(); ctx.clip();
        ctx.strokeStyle = c.outline;
        ctx.lineWidth = 1.0;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        for (let i = 0; i < n; i += 2.5) {
            const idx = Math.floor(i);
            if (idx >= n) break;
            ctx.moveTo(lo[idx].x, lo[idx].y);
            ctx.lineTo(bellyEdge[idx].x, bellyEdge[idx].y);
        }
        ctx.stroke();
        ctx.restore();

        // ── 5. BELLY HIGHLIGHT LINE ──
        ctx.save();
        ctx.beginPath(); smPath(lo, false);
        ctx.strokeStyle = c.bellyH;
        ctx.lineWidth = Math.max(1.5, maxR * 0.14);
        ctx.globalAlpha = 0.55; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.stroke(); ctx.globalAlpha = 1;
        ctx.restore();

        // ── 6. 3D OVERLAPPING SHINGLE SCALES ──
        ctx.save();
        ctx.beginPath(); smPath(up, false); smPath([...lo].reverse(), true); ctx.closePath(); ctx.clip();

        // Loop backwards from tail to head to layer scales naturally
        const step = isMobile ? 0.9 : 0.35; // Fewer scale segments along body on mobile to save performance
        
        for (let i = n - 2; i >= 1; i -= step) {
            const idx = Math.floor(i);
            const s = spine(idx);
            const r = segR(idx) * 0.95;
            if (r < 3) continue;

            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle + Math.PI);
            
            // Staggered pattern: fewer rows on mobile
            const isStaggered = (idx % 2 === 0);
            const scalesNum = isMobile 
                ? (isStaggered ? 3 : 4) 
                : (isStaggered ? 5 : 6);
            
            for (let j = 0; j < scalesNum; j++) {
                const sy = isMobile
                    ? (isStaggered ? (j - 1) * r * 0.52 : (j - 1.5) * r * 0.45)
                    : (isStaggered ? (j - 2) * r * 0.38 : (j - 2.5) * r * 0.32);
                
                const scW = isMobile ? r * 0.44 : r * 0.32; // Slightly wider scales on mobile to cover body gaps
                const scH = isMobile ? r * 0.30 : r * 0.22; // Slightly taller scales on mobile
                
                // Draw scale using offscreen canvas cache!
                // Dest Rect: x = -scW * 0.5, y = sy - scH, w = scW * 1.35, h = scH * 2
                ctx.drawImage(scaleCache, -scW * 0.5, sy - scH, scW * 1.35, scH * 2);
            }
            ctx.restore();
        }
        ctx.restore();

        // ── 7. BODY OUTLINE (Thin & colored for realistic shading, no cartoon strokes) ──
        ctx.save();
        ctx.beginPath(); smPath(up, false); smPath([...lo].reverse(), true); ctx.closePath();
        ctx.strokeStyle = c.bodyD; ctx.lineWidth = 0.7; ctx.stroke();
        ctx.restore();

        // ── 8. DORSAL SPINES (Volumetric Flame Spikes) ──
        ctx.save();
        for (let i = 3; i < n - 4; i += 2.5) {
            const idx = Math.floor(i);
            const s = spine(idx), r = segR(idx);
            if (r < 4) continue;
            const spH = r * 1.85;
            const px = Math.cos(s.angle - Math.PI / 2), py = Math.sin(s.angle - Math.PI / 2);

            const wave = Math.sin(time * 3.5 + idx) * 3.5;
            const tip = {
                x: up[idx].x + px * spH + Math.cos(s.angle) * wave,
                y: up[idx].y + py * spH + Math.sin(s.angle) * wave
            };
            const b1 = up[Math.max(0, idx - 2)], b2 = up[Math.min(n - 1, idx + 2)];
            const col = (idx % 2 === 0) ? c.spine1 : c.spine2;

            const fGr = ctx.createLinearGradient(up[idx].x, up[idx].y, tip.x, tip.y);
            fGr.addColorStop(0, col);
            fGr.addColorStop(0.5, c.spine1);
            fGr.addColorStop(1, 'rgba(239,68,68,0)');

            ctx.fillStyle = fGr;
            ctx.strokeStyle = c.bodyD;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(b1.x, b1.y);
            // Curved flame contour
            ctx.quadraticCurveTo(
                up[idx].x + px * spH * 0.45 - Math.cos(s.angle) * spH * 0.22,
                up[idx].y + py * spH * 0.45 - Math.sin(s.angle) * spH * 0.22,
                tip.x, tip.y
            );
            ctx.quadraticCurveTo(
                up[idx].x + px * spH * 0.55 + Math.cos(s.angle) * spH * 0.18,
                up[idx].y + py * spH * 0.55 + Math.sin(s.angle) * spH * 0.18,
                b2.x, b2.y
            );
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();

        // ── 9. HD TAIL PLUME (Extremely sharp and detailed feathered plume) ──
        ctx.save();
        const sTail = spine(n - 1);
        ctx.translate(sTail.x, sTail.y);
        ctx.rotate(sTail.angle + Math.PI);
        const tTuft = time * 2.5;
        // Tail fan plume lines
        for (let j = 0; j < 7; j++) {
            const angOff = (j - 3) * 0.16 + Math.sin(tTuft + j) * 0.1;
            const hairLen = 45 + Math.sin(tTuft) * 5 - Math.abs(j - 3) * 4;
            ctx.save();
            ctx.rotate(angOff);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(hairLen * 0.4, -5, hairLen * 0.8, -3, hairLen, 0);
            ctx.bezierCurveTo(hairLen * 0.8, 3, hairLen * 0.4, 5, 0, 0);
            ctx.closePath();

            const tfGr = ctx.createLinearGradient(0, 0, hairLen, 0);
            tfGr.addColorStop(0, c.spine1);
            tfGr.addColorStop(0.5, c.spine2);
            tfGr.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = tfGr;
            ctx.fill();

            ctx.strokeStyle = c.outline;
            ctx.lineWidth = 1.0;
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    /* ═══════════════ DRAW: HEAD ═══════════ */
    function drawHead() {
        const c = C(), h = spine(0), ang = h.angle, T = time;

        let targetJaw = 0;
        if (state === 'breathe') targetJaw = 0.9; // Much wider organic jaw opening
        else if (state === 'charge') targetJaw = 0.25;
        else if (state === 'roar') targetJaw = 0.9;
        jawOpen += (targetJaw - jawOpen) * 0.12;
        const jaw = jawOpen;

        const rs = state === 'roar' ? 1 + Math.abs(Math.sin(stateTimer * 4.5)) * .12 : 1;

        ctx.save();
        ctx.translate(h.x, h.y);

        // Tilt head smoothly towards mouse (lerped headRotOffset)
        const headAng = ang + headRotOffset;
        ctx.rotate(headAng);
        ctx.scale(1.85 * rs, 1.85 * rs); // Elegant, proportioned head size

        // Ambient glows removed to prevent unwanted shadows
        if (state === 'roar') {
            const rw = (stateTimer % 0.7) / 0.7;
            ctx.beginPath(); ctx.arc(20, 0, rw * 72, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${c.glowRGB},${(1 - rw) * .42})`;
            ctx.lineWidth = 2.5 * (1 - rw); ctx.stroke();
        }

        // ── FLOWING MANE ──
        ctx.save();
        ctx.fillStyle = isL() ? '#f59e0b' : '#ff5500';
        ctx.strokeStyle = c.bodyD;
        ctx.lineWidth = 0.5;
        for (let k = 0; k < 7; k++) {
            const mTime = T * 2.2 - k * 0.45;
            const mAngle = -Math.PI * 0.76 + Math.sin(mTime) * 0.16;
            ctx.save();
            ctx.translate(-12 - k * 3.0, -10 - k * 1.2);
            ctx.rotate(mAngle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(20, -6, 32, -3, 40, 0);
            ctx.bezierCurveTo(28, 6, 15, 6, 0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        // ── CHIN BEARD ──
        ctx.save();
        ctx.strokeStyle = isL() ? '#f59e0b' : '#ff9900';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        const chinX = 0, chinY = 10 + jaw * 18;
        for (let k = 0; k < 3; k++) {
            const bTime = T * 2.5 + k * 0.5;
            ctx.beginPath();
            ctx.moveTo(chinX, chinY);
            ctx.bezierCurveTo(
                chinX - 5, chinY + 10,
                chinX - 12 + Math.sin(bTime) * 6, chinY + 18 + Math.cos(bTime) * 4,
                chinX - 25 + Math.sin(bTime) * 10, chinY + 20
            );
            ctx.stroke();
        }
        ctx.restore();

        // ── BRANCHING ANTLERS ──
        ctx.save();
        ctx.fillStyle = isL() ? '#f59e0b' : '#ffaa00';
        ctx.strokeStyle = c.bodyD;
        ctx.lineWidth = 0.55;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Left Antler
        ctx.beginPath();
        ctx.moveTo(-5, -12);
        ctx.quadraticCurveTo(-12, -28, -16, -40);
        ctx.quadraticCurveTo(-22, -46, -28, -44);
        ctx.quadraticCurveTo(-21, -38, -18, -36);
        ctx.quadraticCurveTo(-20, -52, -24, -60);
        ctx.quadraticCurveTo(-30, -64, -34, -60);
        ctx.quadraticCurveTo(-27, -56, -25, -54);
        ctx.quadraticCurveTo(-16, -40, -11, -24);
        ctx.quadraticCurveTo(-8, -16, -2, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right Antler
        ctx.fillStyle = isL() ? '#fbbf24' : '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(2, -10);
        ctx.quadraticCurveTo(8, -24, 6, -38);
        ctx.quadraticCurveTo(12, -44, 18, -42);
        ctx.quadraticCurveTo(11, -36, 9, -34);
        ctx.quadraticCurveTo(10, -48, 8, -56);
        ctx.quadraticCurveTo(13, -59, 14, -56);
        ctx.quadraticCurveTo(8, -40, 3, -24);
        ctx.quadraticCurveTo(0, -14, 4, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // ── SNOUT HORN ──
        ctx.save();
        ctx.fillStyle = isL() ? '#f59e0b' : '#ff9900';
        ctx.strokeStyle = c.bodyD;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(18, -5);
        ctx.quadraticCurveTo(22, -13, 26, -14);
        ctx.quadraticCurveTo(21, -8, 20, -3);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();

        // ── UPPER HEAD & SNOUT ──
        const jy = jaw * 18;
        const hGr = ctx.createLinearGradient(-4, -20, -4, 8);
        hGr.addColorStop(0, c.bodyD); hGr.addColorStop(.45, c.body); hGr.addColorStop(1, c.bodyH);
        ctx.fillStyle = hGr; ctx.strokeStyle = c.bodyD; ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(26, -jy * 0.22);
        ctx.quadraticCurveTo(18, -10 - jy * 0.12, 10, -12);
        ctx.quadraticCurveTo(3, -20, -10, -18);
        ctx.bezierCurveTo(-19, -18, -21, -8, -18, 0);
        ctx.bezierCurveTo(-16, 6 - jy * 0.15, -8, 10, 0, 6 - jy * 0.3);
        ctx.quadraticCurveTo(12, 2 - jy * 0.2, 26, -jy * 0.22);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // ── LOWER JAW ──
        if (jaw > .01) {
            const ly = jaw * 22;
            ctx.fillStyle = c.bodyD; ctx.strokeStyle = c.bodyD; ctx.lineWidth = 0.6;
            ctx.beginPath();
            // The front tip of the jaw drops down the most (ly * 0.85), while the back joint (x=-15) remains stable (ly * 0.15)
            ctx.moveTo(22, ly * 0.85);
            ctx.bezierCurveTo(15, ly * 0.8, 4, ly * 0.6, -4, ly * 0.45);
            ctx.bezierCurveTo(-14, ly * 0.35, -18, ly * 0.2, -15, ly * 0.15);
            ctx.bezierCurveTo(-10, ly * 0.18, 9, ly * 0.45, 21, ly * 0.8);
            ctx.closePath(); ctx.fill(); ctx.stroke();

            // Mouth interior
            const iGr = ctx.createLinearGradient(22, ly * 0.8, -14, ly * 0.25);
            iGr.addColorStop(0, '#991b1b');
            iGr.addColorStop(1, '#450a0a');
            ctx.fillStyle = iGr; ctx.beginPath();
            ctx.moveTo(21, ly * 0.8);
            ctx.bezierCurveTo(12, ly * 0.6, 2, ly * 0.4, -6, ly * 0.3);
            ctx.bezierCurveTo(-12, ly * 0.28, -14, ly * 0.2, -12, ly * 0.12);
            ctx.bezierCurveTo(-6, ly * 0.22, 10, ly * 0.42, 21, ly * 0.8);
            ctx.closePath(); ctx.fill();

            // Small, natural, sharp fangs
            ctx.fillStyle = '#ffffff';
            for (let k = 0; k < 4; k++) {
                const tx = 16 - k * 5, ty = 2 - jy * .2;
                const fangH = (k === 0 || k === 3) ? jaw * 5 : jaw * 3;
                ctx.beginPath();
                ctx.moveTo(tx - 1.0, ty);
                ctx.lineTo(tx, ty + fangH);
                ctx.lineTo(tx + 1.0, ty);
                ctx.closePath();
                ctx.fill();
            }
            for (let k = 0; k < 3; k++) {
                const tx = 13 - k * 5;
                const toothY = ly * 0.5;
                ctx.beginPath();
                ctx.moveTo(tx - 0.8, toothY);
                ctx.lineTo(tx, toothY - jaw * 4);
                ctx.lineTo(tx + 0.8, toothY);
                ctx.closePath();
                ctx.fill();
            }
        }

        // ── FIERCE REPTILIAN EYES ──
        const ey = -12;
        ctx.save();

        // Slanted, angry glowing eye shape
        ctx.beginPath();
        ctx.moveTo(-2, ey + 3);
        ctx.lineTo(13, ey - 4);
        ctx.lineTo(9, ey + 4);
        ctx.lineTo(-2, ey + 3);
        ctx.closePath();
        ctx.fillStyle = c.eye;
        ctx.fill();
        ctx.strokeStyle = c.outline;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Vertical reptilian slit pupil
        ctx.fillStyle = c.pupil;
        ctx.beginPath();
        ctx.ellipse(5, ey + 0.8, 0.9, 3.8, 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Menacing, jagged heavy brow ridge
        ctx.fillStyle = c.bodyD;
        ctx.strokeStyle = c.outline;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-5, ey - 4);
        ctx.lineTo(15, ey - 9);
        ctx.lineTo(11, ey - 3);
        ctx.lineTo(-4, ey + 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // ── MENACING JAW & CHEEK SPIKES ──
        ctx.save();
        ctx.fillStyle = c.bodyD;
        ctx.strokeStyle = c.outline;
        ctx.lineWidth = 1.1;

        // Top jaw spike
        ctx.beginPath();
        ctx.moveTo(-11, 2);
        ctx.lineTo(-25, 6);
        ctx.lineTo(-15, -2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Bottom jaw spike
        ctx.beginPath();
        ctx.moveTo(-13, -3);
        ctx.lineTo(-28, -4);
        ctx.lineTo(-16, -8);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();

        // ── FLOWING WHISKERS ──
        ctx.save();
        ctx.strokeStyle = c.spine2;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(20, -2);
        ctx.bezierCurveTo(
            36, -10 + Math.sin(T * 4.5) * 5,
            -12, -26 + Math.cos(T * 3.5) * 7,
            -52, -18 + Math.sin(T * 2.2) * 10
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(20, 2);
        ctx.bezierCurveTo(
            36, 10 - Math.sin(T * 4.5) * 5,
            -12, 26 - Math.cos(T * 3.5) * 7,
            -52, 18 - Math.sin(T * 2.2) * 10
        );
        ctx.stroke();
        ctx.restore();

        // ── NOSTRILS ──
        ctx.fillStyle = c.bodyD;
        ctx.beginPath(); ctx.ellipse(19, -3.5, 2.2, 1.5, .3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(19, 3.5, 2.2, 1.5, -.3, 0, Math.PI * 2); ctx.fill();

        // ── CHARGE SMOKE ──
        if (state === 'charge') {
            const prog = Math.min(1, stateTimer / DUR.charge);
            for (let k = 0; k < 5; k++) {
                ctx.fillStyle = `rgba(200,200,200,${prog * (0.3 - k * .05)})`;
                ctx.beginPath(); ctx.arc(22 + k * 3, -5 - k * 3 + Math.sin(T * 5 + k) * 1.5, 3 - k * .3, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();
    }

    /* ═══════════════ STATE MACHINE ════════ */
    function tickState(dt) {
        if (isMouseDown) {
            state = 'breathe';
            stateTimer = 0;
            userInterrupted = true;
            return;
        }

        if (userInterrupted) {
            state = 'fly';
            stateTimer = 0;
            userInterrupted = false;
        }

        stateTimer += dt;
        if (stateTimer >= DUR[state]) {
            stateTimer = 0;
            seqIdx = (seqIdx + 1) % SEQ.length;
            state = SEQ[seqIdx];
        }
    }

    /* ═══════════════ MAIN LOOP ════════════ */
    function frame(ts) {
        try {
            frameId = requestAnimationFrame(frame);
            if (!lastTs) lastTs = ts;
            const dt = Math.min((ts - lastTs) / 1000, .08);
            lastTs = ts; time += dt * 1.1;
            tickPath(dt); tickState(dt);

            if (isL() !== lastTheme) {
                buildScaleCache();
            }

            // Update smooth headRotOffset tracking safely
            if (pathLUT.length) {
                const h = spine(0);
                let targetOffset = 0;
                if (state === 'breathe') {
                    const targetAng = Math.atan2(mouseY - h.y, mouseX - h.x);
                    let diff = targetAng - h.angle;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    targetOffset = Math.max(-0.85, Math.min(0.85, diff)); // Clamp head turn offset
                }
                headRotOffset += (targetOffset - headRotOffset) * 0.12; // Smooth turn interpolation
                if (isNaN(headRotOffset)) headRotOffset = 0;
            }

            if (state === 'breathe') emitFire();
            if (state === 'charge') emitSparks();
            tickParticles(dt);
            ctx.clearRect(0, 0, W, H);

            drawTrail();
            drawParticles();
            drawLegs(false);
            drawBody();
            drawLegs(true);
            drawHead();
        } catch (e) {
            console.error("DRAGON RUNTIME ERROR:", e);
            cancelAnimationFrame(frameId);
        }
    }

    /* ═══════════════ INIT ═════════════════ */
    function init() {
        canvas = document.getElementById('dragon-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);

        // Keep track of pointer movements
        window.addEventListener('pointermove', function (e) {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        // Click-and-hold interaction to breathe fire
        window.addEventListener('pointerdown', function (e) {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
            isMouseDown = true;
        });

        window.addEventListener('pointerup', function () {
            isMouseDown = false;
        });

        window.addEventListener('pointercancel', function () {
            isMouseDown = false;
        });

        requestAnimationFrame(ts => { lastTs = ts; requestAnimationFrame(frame); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
