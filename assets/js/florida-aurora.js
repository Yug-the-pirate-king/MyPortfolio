/**
 * Florida Aurora - Organic Gradient Mesh Background
 *
 * A living, breathing canvas of soft radial gradient blobs that drift
 * along Lissajous curves, creating an aurora-like fluid atmosphere.
 * Renders behind the particle system as a z-index -2 layer.
 */

(function() {
    'use strict';

    const canvas = document.getElementById('auroraCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let isVisible = true;
    let time = 0;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        canvas.style.display = 'none';
        return;
    }

    // Configuration
    const config = {
        blobCount: 5,
        baseSpeed: 0.0003,
        mouseInfluence: 0.15,
        blurAmount: 80,
    };

    // Blob colors adapt to theme
    function getPalette() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            return [
                { r: 15, g: 10, b: 35, a: 0.35 },    // deep indigo
                { r: 40, g: 15, b: 10, a: 0.30 },    // warm ember
                { r: 10, g: 20, b: 30, a: 0.25 },    // midnight teal
                { r: 30, g: 10, b: 20, a: 0.20 },    // muted plum
                { r: 20, g: 25, b: 40, a: 0.30 },    // slate blue
            ];
        }
        return [
            { r: 230, g: 245, b: 255, a: 0.40 },   // pale ice blue
            { r: 255, g: 245, b: 235, a: 0.35 },   // warm ivory
            { r: 245, g: 235, b: 255, a: 0.30 },   // soft lavender
            { r: 235, g: 255, b: 245, a: 0.25 },   // mint whisper
            { r: 255, g: 250, b: 240, a: 0.35 },   // cream
        ];
    }

    // Blob class
    class Blob {
        constructor(index, w, h) {
            this.index = index;
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = 0;
            this.vy = 0;
            this.radius = Math.min(w, h) * (0.3 + Math.random() * 0.4);
            this.phase = Math.random() * Math.PI * 2;
            this.freqX = 0.3 + Math.random() * 0.5;
            this.freqY = 0.2 + Math.random() * 0.5;
            this.ampX = w * 0.4;
            this.ampY = h * 0.3;
            this.centerX = w / 2;
            this.centerY = h / 2;
            this.currentRadius = this.radius;
        }

        update(t, mx, my, w, h) {
            // Lissajous drift
            const targetX = this.centerX + Math.sin(t * this.freqX + this.phase) * this.ampX;
            const targetY = this.centerY + Math.cos(t * this.freqY + this.phase * 1.3) * this.ampY;

            // Gentle pull toward center over time to keep blobs on screen
            const centerPull = 0.002;
            this.centerX += (w / 2 - this.centerX) * centerPull;
            this.centerY += (h / 2 - this.centerY) * centerPull;

            // Soft follow toward target
            this.vx += (targetX - this.x) * 0.001;
            this.vy += (targetY - this.y) * 0.001;

            // Mouse gentle repulsion/attraction
            const dx = this.x - mx;
            const dy = this.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 400 && dist > 0) {
                const force = (1 - dist / 400) * config.mouseInfluence;
                this.vx += (dx / dist) * force;
                this.vy += (dy / dist) * force;
            }

            // Friction
            this.vx *= 0.96;
            this.vy *= 0.96;

            this.x += this.vx;
            this.y += this.vy;

            // Breathing radius
            this.currentRadius = this.radius + Math.sin(t * 0.5 + this.phase) * this.radius * 0.15;
        }

        draw(ctx, paletteColor) {
            const grad = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.currentRadius
            );
            grad.addColorStop(0, `rgba(${paletteColor.r},${paletteColor.g},${paletteColor.b},${paletteColor.a})`);
            grad.addColorStop(0.5, `rgba(${paletteColor.r},${paletteColor.g},${paletteColor.b},${paletteColor.a * 0.5})`);
            grad.addColorStop(1, `rgba(${paletteColor.r},${paletteColor.g},${paletteColor.b},0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    let blobs = [];
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let palette = getPalette();

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Re-center blobs
        blobs.forEach(b => {
            b.centerX = canvas.width / 2;
            b.centerY = canvas.height / 2;
            b.ampX = canvas.width * 0.4;
            b.ampY = canvas.height * 0.3;
        });
    }

    function init() {
        resize();
        window.addEventListener('resize', resize);

        blobs = [];
        for (let i = 0; i < config.blobCount; i++) {
            blobs.push(new Blob(i, canvas.width, canvas.height));
        }

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Listen for theme changes to swap palette
        const observer = new MutationObserver(() => {
            palette = getPalette();
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

        // Visibility API to pause when tab hidden
        document.addEventListener('visibilitychange', () => {
            isVisible = !document.hidden;
            if (isVisible && !animationId) animate();
        });

        animate();
    }

    function animate() {
        if (!isVisible) {
            animationId = null;
            return;
        }

        animationId = requestAnimationFrame(animate);
        time += config.baseSpeed;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each blob
        blobs.forEach((blob, i) => {
            blob.update(time, mouseX, mouseY, canvas.width, canvas.height);
            blob.draw(ctx, palette[i % palette.length]);
        });
    }

    init();
})();
