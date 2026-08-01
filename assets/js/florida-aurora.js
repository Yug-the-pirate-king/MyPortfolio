/**
 * Florida Aurora - Organic Gradient Mesh Background
 *
 * A living, breathing canvas of soft radial gradient blobs that drift
 * along Lissajous curves, creating an aurora-like fluid atmosphere.
 * Renders behind the particle system as a z-index -2 layer.
 */

(function () {
    'use strict';

    /**
     * Simulation configuration.
     * @type {Object}
     */
    const config = {
        blobCount: 5,
        timeStep: 0.0003,
        mouseInfluence: 0.15,
        blurAmount: 80,
    };

    const canvas = document.getElementById('auroraCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let isPageVisible = true;
    let time = 0;

    let blobs = [];
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let paletteColors = getPalette();
    let pendingMouseUpdate = false;
    let isInitialised = false;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    /**
     * Applies the user's reduced-motion preference.
     * @param {MediaQueryList|MediaQueryListEvent} query
     */
    function updateReducedMotionState(query) {
        if (query.matches) {
            canvas.style.display = 'none';
            isPageVisible = false;

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            return;
        }

        canvas.style.display = '';
        isPageVisible = !document.hidden;

        if (!isInitialised) {
            initAurora();
        } else if (isPageVisible) {
            startRenderLoop();
        }
    }

    /**
     * Returns the colour palette that matches the active theme.
     * @returns {Array<{r: number, g: number, b: number, a: number}>}
     */
    function getPalette() {
        const isDark = document.body && document.body.getAttribute('data-theme') === 'dark';

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

    /**
     * A softly pulsing radial blob that follows a Lissajous curve.
     */
    class Blob {
        /**
         * @param {number} index
         * @param {number} width
         * @param {number} height
         */
        constructor(index, width, height) {
            this.index = index;
            this.x = Math.random() * width;
            this.y = Math.random() * height;

            this.velocityX = 0;
            this.velocityY = 0;

            const minDimension = Math.min(width, height) || 1;
            this.radius = minDimension * (0.3 + Math.random() * 0.4);
            this.currentRadius = this.radius;

            this.phase = Math.random() * Math.PI * 2;
            this.frequencyX = 0.3 + Math.random() * 0.5;
            this.frequencyY = 0.2 + Math.random() * 0.5;

            this.amplitudeX = width * 0.4;
            this.amplitudeY = height * 0.3;

            this.centerX = width / 2;
            this.centerY = height / 2;
        }

        /**
         * Advance the blob one simulation step.
         * @param {number} time
         * @param {number} mouseX
         * @param {number} mouseY
         * @param {number} width
         * @param {number} height
         */
        update(time, mouseX, mouseY, width, height) {
            // Lissajous drift target
            const targetX = this.centerX + Math.sin(time * this.frequencyX + this.phase) * this.amplitudeX;
            const targetY = this.centerY + Math.cos(time * this.frequencyY + this.phase * 1.3) * this.amplitudeY;

            // Gentle pull toward the viewport centre to keep blobs on screen
            const centerPull = 0.002;
            this.centerX += (width / 2 - this.centerX) * centerPull;
            this.centerY += (height / 2 - this.centerY) * centerPull;

            // Soft spring toward the Lissajous target
            this.velocityX += (targetX - this.x) * 0.001;
            this.velocityY += (targetY - this.y) * 0.001;

            // Gentle mouse repulsion
            const deltaX = this.x - mouseX;
            const deltaY = this.y - mouseY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const interactionRadius = 400;

            if (distance < interactionRadius && distance > 0) {
                const force = (1 - distance / interactionRadius) * config.mouseInfluence;
                this.velocityX += (deltaX / distance) * force;
                this.velocityY += (deltaY / distance) * force;
            }

            // Friction
            this.velocityX *= 0.96;
            this.velocityY *= 0.96;

            this.x += this.velocityX;
            this.y += this.velocityY;

            // Breathing radius
            this.currentRadius = this.radius + Math.sin(time * 0.5 + this.phase) * this.radius * 0.15;
        }

        /**
         * Render the blob as a radial gradient.
         * @param {CanvasRenderingContext2D} ctx
         * @param {{r: number, g: number, b: number, a: number}} color
         */
        draw(ctx, color) {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.currentRadius
            );

            gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${color.a})`);
            gradient.addColorStop(0.5, `rgba(${color.r},${color.g},${color.b},${color.a * 0.5})`);
            gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Resizes the canvas and re-centres blobs to the new viewport.
     */
    function resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        const halfWidth = width / 2;
        const halfHeight = height / 2;

        blobs.forEach((blob) => {
            blob.centerX = halfWidth;
            blob.centerY = halfHeight;
            blob.amplitudeX = width * 0.4;
            blob.amplitudeY = height * 0.3;
        });
    }

    /**
     * Starts the render loop if it is not already running.
     */
    function startRenderLoop() {
        if (animationFrameId || !isPageVisible) return;
        animationFrameId = requestAnimationFrame(renderFrame);
    }

    /**
     * Sets up event listeners, initialises blobs, and starts the render loop.
     */
    function initAurora() {
        if (isInitialised) return;
        isInitialised = true;

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        blobs = [];
        for (let i = 0; i < config.blobCount; i++) {
            blobs.push(new Blob(i, canvas.width, canvas.height));
        }

        // Track mouse position efficiently via requestAnimationFrame.
        window.addEventListener('mousemove', (event) => {
            if (pendingMouseUpdate) return;

            pendingMouseUpdate = true;
            requestAnimationFrame(() => {
                mouseX = event.clientX;
                mouseY = event.clientY;
                pendingMouseUpdate = false;
            });
        });

        // React to theme changes.
        if (document.body) {
            const themeObserver = new MutationObserver(() => {
                paletteColors = getPalette();
            });
            themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
        }

        // Pause rendering when the tab is hidden to save resources.
        document.addEventListener('visibilitychange', () => {
            isPageVisible = !document.hidden;

            if (!isPageVisible && animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            } else if (isPageVisible && !reducedMotionQuery.matches) {
                startRenderLoop();
            }
        });

        startRenderLoop();
    }

    /**
     * Renders one frame and schedules the next.
     */
    function renderFrame() {
        if (!isPageVisible) {
            animationFrameId = null;
            return;
        }

        animationFrameId = requestAnimationFrame(renderFrame);
        time += config.timeStep;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        blobs.forEach((blob, index) => {
            blob.update(time, mouseX, mouseY, canvas.width, canvas.height);
            blob.draw(ctx, paletteColors[index % paletteColors.length]);
        });
    }

    /**
     * Boots the aurora once the DOM is ready.
     */
    function startAurora() {
        if (reducedMotionQuery.addEventListener) {
            reducedMotionQuery.addEventListener('change', updateReducedMotionState);
        } else if (reducedMotionQuery.addListener) {
            reducedMotionQuery.addListener(updateReducedMotionState);
        }

        updateReducedMotionState(reducedMotionQuery);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startAurora();
    } else {
        document.addEventListener('DOMContentLoaded', startAurora);
    }
})();