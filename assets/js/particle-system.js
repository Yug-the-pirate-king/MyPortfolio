/**
 * Particle Network System
 * Interactive particle animation for global website background.
 * @version 2.1
 */

const PARTICLE_SYSTEM_VERSION = '2.1';

/**
 * Manages the particle canvas, physics loop and user preferences.
 */
class ParticleSystem {
    /**
     * @param {string} canvasId - The id of the target <canvas> element.
     * @param {Object} [options={}] - Reserved for future configuration overrides.
     */
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.animationId = null;
        this.isActive = false;
        this.connectsCircle = null;

        this.lastMouseMove = Date.now();
        this.isMouseActive = false;
        this.mouseIdleTimeout = 800;
        this.mouseActivityCheckInterval = null;

        const isMobile = window.innerWidth <= 768;
        this.config = {
            particleCount: isMobile ? 150 : 450,
            connectionDistance: 150,
            mouseRadius: 150,
            colorScheme: 'greys',
            colorStrength: 1.0,
            interactionMode: 'attract',
            speed: 1.0,
            mode: 'blackhole',
            blackHoleStrength: 110,
            rememberMe: false,
            ...this.loadPreferences()
        };

        this.colors = {
            light: {
                accent: { particle: 'rgba(21, 181, 255, 0.8)', connection: 'rgba(21, 181, 255, 0.5)' },
                greys: { particle: 'rgba(21, 181, 255, 0.8)', connection: 'rgba(21, 181, 255, 0.5)' }
            },
            dark: {
                accent: { particle: 'rgba(234, 88, 12, 0.8)', connection: 'rgba(234, 88, 12, 0.5)' },
                greys: { particle: 'rgba(234, 88, 12, 0.8)', connection: 'rgba(234, 88, 12, 0.5)' }
            }
        };

        this.init();
    }

    /**
     * Initializes canvas size, input listeners and the animation loop.
     */
    init() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.canvas.style.display = 'none';
            return;
        }

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.lastMouseMove = Date.now();
            this.isMouseActive = true;
        });

        window.addEventListener('mouseleave', () => { this.isMouseActive = false; });
        window.addEventListener('mouseenter', () => {
            this.lastMouseMove = Date.now();
            this.isMouseActive = true;
        });

        this.updateConnectsCircle();

        this.mouseActivityCheckInterval = setInterval(() => {
            if (Date.now() - this.lastMouseMove > this.mouseIdleTimeout) {
                this.isMouseActive = false;
            }
        }, 100);

        this.createParticles();
        this.start();
    }

    /**
     * Caches the bounding circle of the central "connects" element.
     */
    updateConnectsCircle() {
        const connectsWord = document.getElementById('rotatingWord');
        if (!connectsWord) return;

        const rect = connectsWord.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        const radiusMultiplier = isMobile ? 1.15 : 0.8;

        this.connectsCircle = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            radius: Math.max(rect.width, rect.height) * radiusMultiplier
        };
    }

    /**
     * Resizes the canvas to the viewport and adjusts particle density if needed.
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const isMobile = window.innerWidth <= 768;
        const newCount = isMobile ? 150 : 250;

        if (this.config.particleCount !== newCount) {
            this.updateParticleCount(newCount);
        }

        this.updateConnectsCircle();
    }

    /**
     * Builds the particle array based on the current configuration.
     */
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(new Particle(this.canvas, this.config.speed, this.config.mode, this.connectsCircle));
        }
    }

    /**
     * Adds or removes particles to match the requested count.
     * @param {number} count
     */
    updateParticleCount(count) {
        this.config.particleCount = count;
        const diff = count - this.particles.length;

        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                this.particles.push(new Particle(this.canvas, this.config.speed, this.config.mode, this.connectsCircle));
            }
        } else if (diff < 0) {
            this.particles = this.particles.slice(0, count);
        }

        this.savePreferences();
    }

    /** @param {string} mode */
    updateMode(mode) {
        this.config.mode = mode;
        this.createParticles();
        this.savePreferences();
    }

    /** @param {number} strength */
    updateBlackHoleStrength(strength) {
        this.config.blackHoleStrength = strength;
        this.savePreferences();
    }

    /** @param {string} scheme */
    updateColorScheme(scheme) {
        this.config.colorScheme = scheme;
        this.savePreferences();
    }

    /** @param {number} strength */
    updateColorStrength(strength) {
        this.config.colorStrength = strength;
        this.savePreferences();
    }

    /** @param {string} mode */
    updateInteractionMode(mode) {
        this.config.interactionMode = mode;
        this.savePreferences();
    }

    /** @param {number} distance */
    updateConnectionDistance(distance) {
        this.config.connectionDistance = distance;
        this.savePreferences();
    }

    /** @param {number} speed */
    updateSpeed(speed) {
        this.config.speed = speed;
        this.particles.forEach(p => { p.speedMultiplier = speed; });
        this.savePreferences();
    }

    /**
     * Returns theme-aware particle and connection colors with applied color strength.
     * @returns {{particle: string, connection: string}}
     */
    getCurrentColors() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const theme = isDark ? 'dark' : 'light';
        const baseColors = this.colors[theme][this.config.colorScheme];
        const strength = this.config.colorStrength;

        return {
            particle: this.adjustColorOpacity(baseColors.particle, strength),
            connection: this.adjustColorOpacity(baseColors.connection, strength)
        };
    }

    /**
     * Scales the alpha channel of an rgba string by the provided multiplier.
     * @param {string} colorString
     * @param {number} multiplier
     * @returns {string}
     */
    adjustColorOpacity(colorString, multiplier) {
        const match = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (match) {
            const [, r, g, b, a] = match;
            const newOpacity = Math.min(1, parseFloat(a) * multiplier);
            return `rgba(${r}, ${g}, ${b}, ${newOpacity})`;
        }
        return colorString;
    }

    /**
     * Renders distance-based connections between particles.
     */
    drawConnections() {
        const colors = this.getCurrentColors();
        const baseOpacity = this.extractOpacity(colors.connection);
        const maxDistance = this.config.connectionDistance;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    const opacity = baseOpacity * (1 - distance / maxDistance);
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = this.replaceOpacity(colors.connection, opacity);
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    /**
     * Extracts the alpha value from an rgba color string.
     * @param {string} colorString
     * @returns {number}
     */
    extractOpacity(colorString) {
        const match = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        return match ? parseFloat(match[4]) : 1;
    }

    /**
     * Returns a new rgba string with the alpha channel replaced.
     * @param {string} colorString
     * @param {number} newOpacity
     * @returns {string}
     */
    replaceOpacity(colorString, newOpacity) {
        return colorString.replace(
            /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/,
            (match, r, g, b) => `rgba(${r}, ${g}, ${b}, ${newOpacity})`
        );
    }

    /**
     * Renders connections from particles to the edge of the central circle.
     * @param {{particle: string, connection: string}} colors
     */
    drawConnectsCircleConnections(colors) {
        if (!this.connectsCircle) return;
        const circle = this.connectsCircle;
        const baseOpacity = this.extractOpacity(colors.connection);
        const maxDistance = this.config.connectionDistance;

        this.particles.forEach(particle => {
            const dx = circle.x - particle.x;
            const dy = circle.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const distanceFromEdge = Math.abs(distance - circle.radius);

            if (distanceFromEdge < maxDistance && distance > circle.radius) {
                const opacity = baseOpacity * (1 - distanceFromEdge / maxDistance);
                const angle = Math.atan2(dy, dx);
                const edgeX = circle.x - Math.cos(angle) * circle.radius;
                const edgeY = circle.y - Math.sin(angle) * circle.radius;

                this.ctx.beginPath();
                this.ctx.strokeStyle = this.replaceOpacity(colors.connection, opacity);
                this.ctx.lineWidth = 1;
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(edgeX, edgeY);
                this.ctx.stroke();
            }
        });
    }

    /**
     * Runs a single animation frame, updating physics and rendering.
     */
    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const colors = this.getCurrentColors();

        this.particles.forEach(particle => {
            if (this.config.mode === 'blackhole' && this.connectsCircle) {
                this.applyMouseForce(particle, true);
                this.applyBlackHoleForce(particle);
            } else {
                this.applyMouseForce(particle, false);
                if (this.connectsCircle) this.applyCircleRepel(particle);
            }

            particle.update();
            particle.draw(this.ctx, colors.particle);
        });

        this.drawConnections();
        this.drawConnectsCircleConnections(colors);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Applies mouse attraction or repulsion to a particle.
     * @param {Particle} particle
     * @param {boolean} useBlackHoleScale - Whether to scale force by the black hole strength.
     */
    applyMouseForce(particle, useBlackHoleScale) {
        if (this.config.interactionMode === 'static' || !this.isMouseActive) return;

        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= this.config.mouseRadius) return;

        const force = (this.config.mouseRadius - distance) / this.config.mouseRadius;
        const angle = Math.atan2(dy, dx);
        let multiplier = this.config.interactionMode === 'attract' ? 0.2 : -0.2;

        if (useBlackHoleScale) {
            multiplier *= this.config.blackHoleStrength / 50;
        }

        particle.vx += Math.cos(angle) * force * multiplier;
        particle.vy += Math.sin(angle) * force * multiplier;
    }

    /**
     * Pulls particles into an orbital ring around the central black hole.
     * @param {Particle} particle
     */
    applyBlackHoleForce(particle) {
        const circle = this.connectsCircle;
        const dx = circle.x - particle.x;
        const dy = circle.y - particle.y;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const innerRadius = circle.radius;
        const maxOuterDistance = (380 - this.config.blackHoleStrength) * 2.5;

        // Push particles away from the inner core.
        if (distanceFromCenter < innerRadius) {
            const force = (innerRadius - distanceFromCenter) / innerRadius;
            particle.vx -= Math.cos(angle) * force * 1.5;
            particle.vy -= Math.sin(angle) * force * 1.5;

            if (distanceFromCenter < innerRadius * 0.9) {
                const pushOut = (innerRadius - distanceFromCenter) * 0.1;
                particle.x -= Math.cos(angle) * pushOut;
                particle.y -= Math.sin(angle) * pushOut;
            }
        }

        // Guide particles toward their mass-based orbital distance.
        const distanceFromCircumference = distanceFromCenter - innerRadius;
        const baseDistance = maxOuterDistance * 0.25;
        const massVariation = (1.0 - particle.mass) * maxOuterDistance * 1.1;
        const targetDistance = baseDistance + massVariation;
        const distanceFromTarget = distanceFromCircumference - targetDistance;

        if (Math.abs(distanceFromTarget) > 5) {
            const forceStrength = this.config.blackHoleStrength / 15000;
            const force = distanceFromTarget * forceStrength;
            particle.vx += Math.cos(angle) * force;
            particle.vy += Math.sin(angle) * force;
        }

        // Add low-frequency drift for organic motion.
        const randomFactor = (360 - this.config.blackHoleStrength) * (1.6 - particle.mass);
        const randomDrift = randomFactor / 3000;
        particle.vx += (Math.random() - 0.5) * randomDrift;
        particle.vy += (Math.random() - 0.5) * randomDrift;

        // Apply orbital rotation at higher strengths.
        if (this.config.blackHoleStrength > 90) {
            const strengthRange = 300 - 90;
            const strengthPosition = (this.config.blackHoleStrength - 90) / strengthRange;
            const orbitStrength = Math.pow(strengthPosition, 0.75);
            const orbitalSpeed = 0.3 * orbitStrength;

            particle.vx += -Math.sin(angle) * orbitalSpeed;
            particle.vy += Math.cos(angle) * orbitalSpeed;
        }

        particle.vx *= 0.92;
        particle.vy *= 0.92;

        // Keep particles within the outer boundary.
        if (distanceFromCircumference > maxOuterDistance) {
            const excess = distanceFromCircumference - maxOuterDistance;
            const constrainForce = excess / 50;
            particle.vx += Math.cos(angle) * constrainForce;
            particle.vy += Math.sin(angle) * constrainForce;
        }
    }

    /**
     * Gently repels particles from the central circle in non-black-hole modes.
     * @param {Particle} particle
     */
    applyCircleRepel(particle) {
        const circle = this.connectsCircle;
        const dx = circle.x - particle.x;
        const dy = circle.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < circle.radius) {
            const force = (circle.radius - distance) / circle.radius;
            const angle = Math.atan2(dy, dx);
            particle.vx -= Math.cos(angle) * force * 0.5;
            particle.vy -= Math.sin(angle) * force * 0.5;
        }
    }

    /** Starts the animation loop. */
    start() {
        this.isActive = true;
        this.animate();
    }

    /** Stops the animation loop and cleans up timers. */
    stop() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.mouseActivityCheckInterval) clearInterval(this.mouseActivityCheckInterval);
    }

    /** Resets all settings and particles to their defaults. */
    reset() {
        const isMobile = window.innerWidth <= 768;
        this.config = {
            particleCount: isMobile ? 150 : 250,
            connectionDistance: 150,
            mouseRadius: 150,
            colorScheme: 'greys',
            colorStrength: 1.0,
            interactionMode: 'attract',
            speed: 1.0,
            mode: 'blackhole',
            blackHoleStrength: 110
        };
        this.createParticles();
        this.savePreferences();
    }

    /** Writes current preferences to localStorage if rememberMe is enabled. */
    savePreferences() {
        if (!this.config.rememberMe) return;
        localStorage.setItem('particlePreferences', JSON.stringify({
            particleCount: this.config.particleCount,
            connectionDistance: this.config.connectionDistance,
            colorScheme: this.config.colorScheme,
            colorStrength: this.config.colorStrength,
            interactionMode: this.config.interactionMode,
            speed: this.config.speed,
            mode: this.config.mode,
            blackHoleStrength: this.config.blackHoleStrength,
            rememberMe: this.config.rememberMe,
            version: PARTICLE_SYSTEM_VERSION
        }));
    }

    /**
     * Loads saved particle preferences from localStorage.
     * @returns {Object} Saved preferences, or an empty object if none exist.
     */
    loadPreferences() {
        const saved = localStorage.getItem('particlePreferences');
        if (!saved) return {};
        const preferences = JSON.parse(saved);
        if (!preferences.rememberMe) return { rememberMe: false };
        return preferences;
    }

    /**
     * Enables or disables persistent preferences.
     * @param {boolean} enabled
     */
    updateRememberMe(enabled) {
        this.config.rememberMe = enabled;
        if (enabled) this.savePreferences();
        else localStorage.removeItem('particlePreferences');
    }
}

/**
 * Represents a single particle with position, velocity and rendering.
 */
class Particle {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number} [speedMultiplier=1.0]
     * @param {string} [mode='deepspace']
     * @param {Object|null} [connectsCircle=null]
     */
    constructor(canvas, speedMultiplier = 1.0, mode = 'deepspace', connectsCircle = null) {
        this.canvas = canvas;
        this.speedMultiplier = speedMultiplier;
        this.mode = mode;
        this.radius = Math.random() * 2 + 1;
        this.mass = 0.6 + Math.random() * 0.8;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;

        if (mode === 'blackhole' && connectsCircle) {
            const angle = Math.random() * Math.PI * 2;
            const spawnRadius = connectsCircle.radius + Math.random() * 250 + 10;
            this.x = connectsCircle.x + Math.cos(angle) * spawnRadius;
            this.y = connectsCircle.y + Math.sin(angle) * spawnRadius;
        } else {
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * window.innerHeight;
        }
    }

    /** Advances the particle one step and wraps deepspace particles. */
    update() {
        this.x += this.vx * this.speedMultiplier;
        this.y += this.vy * this.speedMultiplier;
        this.vx *= 0.99;
        this.vy *= 0.99;

        if (this.mode === 'deepspace') {
            const buffer = 200;
            if (this.x < -buffer) this.x = window.innerWidth + buffer;
            else if (this.x > window.innerWidth + buffer) this.x = -buffer;
            if (this.y < -buffer) this.y = window.innerHeight + buffer;
            else if (this.y > window.innerHeight + buffer) this.y = -buffer;
        }
    }

    /**
     * Draws the particle on the provided context.
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} color
     */
    draw(ctx, color) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

/**
 * Binds DOM control inputs to a ParticleSystem instance.
 */
class ParticleControlPanel {
    /**
     * @param {ParticleSystem} particleSystem
     */
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.demoAnimationRunning = false;

        const saved = localStorage.getItem('particlePreferences');
        const savedVersion = saved ? JSON.parse(saved).version : null;
        const versionChanged = savedVersion !== PARTICLE_SYSTEM_VERSION;
        const rememberMe = this.particleSystem.config.rememberMe;
        const demoPlayedThisSession = sessionStorage.getItem('particleDemoPlayed') === 'true';

        this.shouldPlayDemo = rememberMe ? versionChanged : !demoPlayedThisSession;
        this.isExpanded = this.shouldPlayDemo || this.loadPanelState(rememberMe);

        this.init();
    }

    /**
     * Restores the last expanded/collapsed panel state.
     * @param {boolean} rememberMe
     * @returns {boolean}
     */
    loadPanelState(rememberMe) {
        const stored = rememberMe
            ? localStorage.getItem('particleControlsExpanded')
            : sessionStorage.getItem('particleControlsExpanded');
        return stored === 'true';
    }

    /**
     * Wires all control inputs to the particle system.
     */
    init() {
        const panel = document.getElementById('particleControls');
        if (!panel) return;

        const toggleBtn = document.getElementById('particleControlsToggle');
        if (this.isExpanded) panel.classList.add('expanded');
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.togglePanel());

        this.bindModeControls();
        this.bindBlackHoleSlider();
        this.bindCountSlider();
        this.bindColorControls();
        this.bindColorStrengthSlider();
        this.bindInteractionControls();
        this.bindDistanceSlider();
        this.bindSpeedSlider();
        this.bindRememberMe();
        this.bindResetButton();

        if (this.shouldPlayDemo && this.particleSystem.config.mode === 'blackhole') {
            this.runDemoAnimation(
                document.getElementById('blackHoleStrength'),
                document.getElementById('blackHoleStrengthValue')
            );
        }
    }

    /** Binds the particle mode radio buttons and their visual pill. */
    bindModeControls() {
        const modeBtns = document.querySelectorAll('[name="particleMode"]');
        const blackHoleControl = document.getElementById('blackHoleStrengthControl');

        const setBlackHoleVisibility = (visible, skipTransition = false) => {
            if (!blackHoleControl) return;
            if (skipTransition) blackHoleControl.classList.add('no-transition');
            blackHoleControl.classList.toggle('visible', visible);
            if (skipTransition) {
                requestAnimationFrame(() => requestAnimationFrame(() => blackHoleControl.classList.remove('no-transition')));
            }
        };

        modeBtns.forEach((btn, index) => {
            const isBlackHole = btn.value === 'blackhole';
            if (btn.value === this.particleSystem.config.mode) {
                btn.checked = true;
                this.updateModePillPosition(index, true);
                setBlackHoleVisibility(isBlackHole, true);
            }
            btn.addEventListener('change', (e) => {
                if (!e.target.checked) return;
                this.particleSystem.updateMode(e.target.value);
                this.updateModePillPosition(Array.from(modeBtns).findIndex(b => b.checked));
                setBlackHoleVisibility(e.target.value === 'blackhole');
            });
        });
    }

    /** Binds the black hole strength slider and value display. */
    bindBlackHoleSlider() {
        const slider = document.getElementById('blackHoleStrength');
        const value = document.getElementById('blackHoleStrengthValue');
        if (!slider || !value) return;
        slider.value = this.particleSystem.config.blackHoleStrength;
        value.textContent = this.particleSystem.config.blackHoleStrength;
        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            value.textContent = val;
            this.particleSystem.updateBlackHoleStrength(val);
        });
    }

    /** Binds the particle count slider and value display. */
    bindCountSlider() {
        const slider = document.getElementById('particleCount');
        const value = document.getElementById('particleCountValue');
        if (!slider || !value) return;
        slider.value = this.particleSystem.config.particleCount;
        value.textContent = this.particleSystem.config.particleCount;
        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            value.textContent = val;
            this.particleSystem.updateParticleCount(val);
        });
    }

    /** Binds the color scheme radio buttons. */
    bindColorControls() {
        document.querySelectorAll('[name="colorScheme"]').forEach(btn => {
            if (btn.value === this.particleSystem.config.colorScheme) btn.checked = true;
            btn.addEventListener('change', (e) => {
                if (e.target.checked) this.particleSystem.updateColorScheme(e.target.value);
            });
        });
    }

    /** Binds the color strength slider and value display. */
    bindColorStrengthSlider() {
        const slider = document.getElementById('colorStrength');
        const value = document.getElementById('colorStrengthValue');
        if (!slider || !value) return;
        slider.value = this.particleSystem.config.colorStrength;
        value.textContent = this.particleSystem.config.colorStrength.toFixed(1);
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            value.textContent = val.toFixed(1);
            this.particleSystem.updateColorStrength(val);
        });
    }

    /** Binds the interaction mode radio buttons and their visual pill. */
    bindInteractionControls() {
        const interactionBtns = document.querySelectorAll('[name="interactionMode"]');
        interactionBtns.forEach((btn, index) => {
            if (btn.value === this.particleSystem.config.interactionMode) {
                btn.checked = true;
                this.updateSliderPillPosition(index, true);
            }
            btn.addEventListener('change', (e) => {
                if (!e.target.checked) return;
                this.particleSystem.updateInteractionMode(e.target.value);
                this.updateSliderPillPosition(Array.from(interactionBtns).findIndex(b => b.checked));
            });
        });
    }

    /** Binds the connection distance slider and value display. */
    bindDistanceSlider() {
        const slider = document.getElementById('connectionDistance');
        const value = document.getElementById('connectionDistanceValue');
        if (!slider || !value) return;
        slider.value = this.particleSystem.config.connectionDistance;
        value.textContent = this.particleSystem.config.connectionDistance;
        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            value.textContent = val;
            this.particleSystem.updateConnectionDistance(val);
        });
    }

    /** Binds the particle speed slider and value display. */
    bindSpeedSlider() {
        const slider = document.getElementById('particleSpeed');
        const value = document.getElementById('particleSpeedValue');
        if (!slider || !value) return;
        slider.value = this.particleSystem.config.speed;
        value.textContent = this.particleSystem.config.speed.toFixed(1);
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            value.textContent = val.toFixed(1);
            this.particleSystem.updateSpeed(val);
        });
    }

    /** Binds the remember-me toggle. */
    bindRememberMe() {
        const toggle = document.getElementById('rememberMeToggle');
        if (!toggle) return;
        toggle.checked = this.particleSystem.config.rememberMe;
        toggle.addEventListener('change', (e) => this.particleSystem.updateRememberMe(e.target.checked));
    }

    /** Binds the reset button. */
    bindResetButton() {
        const resetBtn = document.getElementById('particleReset');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetControls());
    }

    /**
     * Plays the initial black hole strength demo animation.
     * @param {HTMLInputElement|null} slider
     * @param {HTMLElement|null} valueDisplay
     */
    runDemoAnimation(slider, valueDisplay) {
        if (!slider || !valueDisplay || this.demoAnimationRunning) return;
        this.demoAnimationRunning = true;

        const startValue = 110;
        const maxValue = 330;
        const animationIn = 3200;
        const animationOut = 2800;
        const pauseDuration = 2000;

        const easeInOutCubic = (t) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const update = (value) => {
            slider.value = value;
            valueDisplay.textContent = value;
            this.particleSystem.updateBlackHoleStrength(value);
        };

        const animateValue = (startTime, start, end, duration, next) => {
            const step = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = easeInOutCubic(progress);
                update(Math.round(start + (end - start) * eased));
                if (progress < 1) requestAnimationFrame(step);
                else if (next) next();
            };
            requestAnimationFrame(step);
        };

        setTimeout(() => {
            animateValue(performance.now(), startValue, maxValue, animationIn, () => {
                setTimeout(() => {
                    animateValue(performance.now(), maxValue, startValue, animationOut, () => {
                        this.demoAnimationRunning = false;
                        sessionStorage.setItem('particleDemoPlayed', 'true');
                        setTimeout(() => { if (this.isExpanded) this.togglePanel(); }, 1000);
                    });
                }, pauseDuration);
            });
        }, 2000);
    }

    /** Toggles the control panel open/closed and persists the state. */
    togglePanel() {
        const panel = document.getElementById('particleControls');
        if (!panel) return;
        this.isExpanded = !this.isExpanded;
        panel.classList.toggle('expanded');
        const key = 'particleControlsExpanded';
        if (this.particleSystem.config.rememberMe) localStorage.setItem(key, this.isExpanded.toString());
        else sessionStorage.setItem(key, this.isExpanded.toString());
    }

    /**
     * Moves the interaction-mode pill indicator.
     * @param {number} index
     * @param {boolean} [skipTransition=false]
     */
    updateSliderPillPosition(index, skipTransition = false) {
        const pill = document.querySelector('#interactionModeToggle .slider-toggle-pill');
        if (!pill) return;
        this.setPillPosition(pill, index, 33.333, skipTransition);
    }

    /**
     * Moves the particle-mode pill indicator.
     * @param {number} index
     * @param {boolean} [skipTransition=false]
     */
    updateModePillPosition(index, skipTransition = false) {
        const pill = document.querySelector('#particleModeToggle .slider-toggle-pill');
        if (!pill) return;
        this.setPillPosition(pill, index, 50, skipTransition);
    }

    /**
     * Helper for positioning a slider toggle pill without duplicating logic.
     * @param {HTMLElement} pill
     * @param {number} index
     * @param {number} stepPercent
     * @param {boolean} [skipTransition=false]
     */
    setPillPosition(pill, index, stepPercent, skipTransition = false) {
        if (skipTransition) pill.classList.add('no-transition');
        const left = 2 + (index * (stepPercent + 0.2));
        pill.style.left = `calc(${left}% - ${index}px)`;
        if (skipTransition) {
            requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.remove('no-transition')));
        }
    }

    /** Resets the particle system and all control inputs to their defaults. */
    resetControls() {
        this.particleSystem.reset();

        const rememberMeToggle = document.getElementById('rememberMeToggle');
        if (rememberMeToggle) {
            rememberMeToggle.checked = false;
            this.particleSystem.updateRememberMe(false);
        }

        const isMobile = window.innerWidth <= 768;
        const defaultCount = isMobile ? 150 : 250;

        this.setSliderValue('particleCount', 'particleCountValue', defaultCount);
        this.setSliderValue('connectionDistance', 'connectionDistanceValue', 150);
        this.setSliderValue('particleSpeed', 'particleSpeedValue', 1.0, (v) => v.toFixed(1));
        this.setSliderValue('colorStrength', 'colorStrengthValue', 1.0, (v) => v.toFixed(1));
        this.setSliderValue('blackHoleStrength', 'blackHoleStrengthValue', 110);

        document.querySelectorAll('[name="colorScheme"]').forEach(btn => { btn.checked = btn.value === 'greys'; });

        document.querySelectorAll('[name="interactionMode"]').forEach((btn, index) => {
            btn.checked = btn.value === 'attract';
            if (btn.checked) this.updateSliderPillPosition(index);
        });

        document.querySelectorAll('[name="particleMode"]').forEach((btn, index) => {
            btn.checked = btn.value === 'blackhole';
            if (btn.checked) this.updateModePillPosition(index);
        });

        const blackHoleControl = document.getElementById('blackHoleStrengthControl');
        if (blackHoleControl) blackHoleControl.classList.add('visible');
    }

    /**
     * Helper to update a slider input and its displayed value.
     * @param {string} sliderId
     * @param {string} valueId
     * @param {number} value
     * @param {Function} [formatter]
     */
    setSliderValue(sliderId, valueId, value, formatter = (v) => v.toString()) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(valueId);
        if (slider) slider.value = value;
        if (display) display.textContent = formatter(value);
    }
}

/**
 * Creates and exposes the particle system and its control panel.
 * @returns {ParticleSystem|null}
 */
function initParticleSystem() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return null;

    const system = new ParticleSystem('particleCanvas');
    new ParticleControlPanel(system);
    return system;
}

window.initParticleSystem = initParticleSystem;