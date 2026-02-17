// Particle Network System
// Interactive particle animation for global website background

// Version tracking for forcing demo animations on updates
const PARTICLE_SYSTEM_VERSION = '2.1'; // Global background update

class ParticleSystem {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.animationId = null;
        this.isActive = false;
        this.previousBlackHoleStrength = 110; 

        // Mouse activity tracking
        this.lastMouseMove = Date.now();
        this.isMouseActive = false;
        this.mouseIdleTimeout = 800; 
        this.mouseActivityCheckInterval = null;

        // Default configuration with your specific density requirements
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

        this.previousBlackHoleStrength = this.config.blackHoleStrength;

        // Color palettes
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

    init() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.canvas.style.display = 'none';
            return;
        }

        // Set canvas size to full viewport
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Global viewport mouse tracking
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY; 

            this.lastMouseMove = Date.now();
            this.isMouseActive = true;
        });

        window.addEventListener('mouseleave', () => {
            this.isMouseActive = false;
        });

        window.addEventListener('mouseenter', () => {
            this.lastMouseMove = Date.now();
            this.isMouseActive = true;
        });

        this.updateConnectsCircle();

        this.mouseActivityCheckInterval = setInterval(() => {
            const timeSinceLastMove = Date.now() - this.lastMouseMove;
            if (timeSinceLastMove > this.mouseIdleTimeout && this.isMouseActive) {
                this.isMouseActive = false;
            }
        }, 100);

        this.createParticles();
        this.start();
    }

    updateConnectsCircle() {
        const connectsWord = document.getElementById('rotatingWord');
        if (connectsWord) {
            const rect = connectsWord.getBoundingClientRect();
            const isMobile = window.innerWidth <= 768;
            const radiusMultiplier = isMobile ? 1.15 : 0.8;

            this.connectsCircle = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                radius: Math.max(rect.width, rect.height) * radiusMultiplier
            };
        }
    }

    resizeCanvas() {
        // Fullscreen viewport dimensions
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update counts on resize if device threshold crossed
        const isMobile = window.innerWidth <= 768;
        const newCount = isMobile ? 150 : 250;
        
        if (this.config.particleCount !== newCount) {
            this.updateParticleCount(newCount);
        }

        this.updateConnectsCircle();
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(new Particle(this.canvas, this.config.speed, this.config.mode, this.connectsCircle));
        }
    }

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

    updateMode(mode) {
        this.config.mode = mode;
        this.createParticles(); 
        this.savePreferences();
    }

    updateBlackHoleStrength(strength) {
        this.previousBlackHoleStrength = this.config.blackHoleStrength;
        this.config.blackHoleStrength = strength;
        this.savePreferences();
    }

    updateColorScheme(scheme) {
        this.config.colorScheme = scheme;
        this.savePreferences();
    }

    updateColorStrength(strength) {
        this.config.colorStrength = strength;
        this.savePreferences();
    }

    updateInteractionMode(mode) {
        this.config.interactionMode = mode;
        this.savePreferences();
    }

    updateConnectionDistance(distance) {
        this.config.connectionDistance = distance;
        this.savePreferences();
    }

    updateSpeed(speed) {
        this.config.speed = speed;
        this.particles.forEach(p => p.speedMultiplier = speed);
        this.savePreferences();
    }

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

    adjustColorOpacity(colorString, multiplier) {
        const match = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (match) {
            const [, r, g, b, a] = match;
            const newOpacity = Math.min(1, parseFloat(a) * multiplier);
            return `rgba(${r}, ${g}, ${b}, ${newOpacity})`;
        }
        return colorString;
    }

    drawConnections() {
        const colors = this.getCurrentColors();

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.connectionDistance) {
                    const baseOpacity = this.extractOpacity(colors.connection);
                    const distanceFactor = (1 - distance / this.config.connectionDistance);
                    const finalOpacity = baseOpacity * distanceFactor;

                    this.ctx.beginPath();
                    this.ctx.strokeStyle = this.replaceOpacity(colors.connection, finalOpacity);
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    extractOpacity(colorString) {
        const match = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        return match ? parseFloat(match[4]) : 1;
    }

    replaceOpacity(colorString, newOpacity) {
        return colorString.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/,
            (match, r, g, b) => `rgba(${r}, ${g}, ${b}, ${newOpacity})`);
    }

    drawConnectsCircleConnections(colors) {
        if (!this.connectsCircle) return;
        const circle = this.connectsCircle;

        this.particles.forEach(particle => {
            const dx = circle.x - particle.x;
            const dy = circle.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const distanceFromEdge = Math.abs(distance - circle.radius);

            if (distanceFromEdge < this.config.connectionDistance && distance > circle.radius) {
                const baseOpacity = this.extractOpacity(colors.connection);
                const distanceFactor = (1 - distanceFromEdge / this.config.connectionDistance);
                const finalOpacity = baseOpacity * distanceFactor;
                const angle = Math.atan2(dy, dx);
                const edgeX = circle.x - Math.cos(angle) * circle.radius;
                const edgeY = circle.y - Math.sin(angle) * circle.radius;

                this.ctx.beginPath();
                this.ctx.strokeStyle = this.replaceOpacity(colors.connection, finalOpacity);
                this.ctx.lineWidth = 1;
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(edgeX, edgeY);
                this.ctx.stroke();
            }
        });
    }

    animate() {
        if (!this.isActive) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const colors = this.getCurrentColors();

        this.particles.forEach(particle => {
            if (this.config.mode === 'blackhole' && this.connectsCircle) {
                if (this.config.interactionMode !== 'static' && this.isMouseActive) {
                    const dx = this.mouse.x - particle.x;
                    const dy = this.mouse.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.config.mouseRadius) {
                        const force = (this.config.mouseRadius - distance) / this.config.mouseRadius;
                        const angle = Math.atan2(dy, dx);
                        const strengthFactor = this.config.blackHoleStrength / 50; 
                        const baseMultiplier = this.config.interactionMode === 'attract' ? 0.2 : -0.2;
                        const multiplier = baseMultiplier * strengthFactor;

                        particle.vx += Math.cos(angle) * force * multiplier;
                        particle.vy += Math.sin(angle) * force * multiplier;
                    }
                }

                const dx = this.connectsCircle.x - particle.x;
                const dy = this.connectsCircle.y - particle.y;
                const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                const innerRadius = this.connectsCircle.radius;
                const maxOuterDistance = (380 - this.config.blackHoleStrength) * 2.5;

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

                const distanceFromCircumference = distanceFromCenter - innerRadius;
                const baseDistance = maxOuterDistance * 0.25;
                const massVariation = (1.0 - particle.mass) * maxOuterDistance * 1.1; 
                const particleTargetDistance = baseDistance + massVariation;
                const distanceFromTarget = distanceFromCircumference - particleTargetDistance;

                if (Math.abs(distanceFromTarget) > 5) {
                    const forceStrength = this.config.blackHoleStrength / 15000;
                    const force = distanceFromTarget * forceStrength;
                    particle.vx += Math.cos(angle) * force;
                    particle.vy += Math.sin(angle) * force;
                }

                const randomFactor = (360 - this.config.blackHoleStrength) * (1.6 - particle.mass);
                const randomDrift = randomFactor / 3000; 
                particle.vx += (Math.random() - 0.5) * randomDrift;
                particle.vy += (Math.random() - 0.5) * randomDrift;

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

                if (distanceFromCircumference > maxOuterDistance) {
                    const excess = distanceFromCircumference - maxOuterDistance;
                    const constrainForce = excess / 50;
                    particle.vx += Math.cos(angle) * constrainForce;
                    particle.vy += Math.sin(angle) * constrainForce;
                }
            } else {
                if (this.config.interactionMode !== 'static' && this.isMouseActive) {
                    const dx = this.mouse.x - particle.x;
                    const dy = this.mouse.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.config.mouseRadius) {
                        const force = (this.config.mouseRadius - distance) / this.config.mouseRadius;
                        const angle = Math.atan2(dy, dx);
                        const multiplier = this.config.interactionMode === 'attract' ? 0.2 : -0.2;

                        particle.vx += Math.cos(angle) * force * multiplier;
                        particle.vy += Math.sin(angle) * force * multiplier;
                    }
                }

                if (this.connectsCircle) {
                    const dx = this.connectsCircle.x - particle.x;
                    const dy = this.connectsCircle.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.connectsCircle.radius) {
                        const force = (this.connectsCircle.radius - distance) / this.connectsCircle.radius;
                        const angle = Math.atan2(dy, dx);
                        particle.vx -= Math.cos(angle) * force * 0.5;
                        particle.vy -= Math.sin(angle) * force * 0.5;
                    }
                }
            }

            particle.update();
            particle.draw(this.ctx, colors.particle);
        });

        this.drawConnections();
        this.drawConnectsCircleConnections(colors);
        this.previousBlackHoleStrength = this.config.blackHoleStrength;
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isActive = true;
        this.animate();
    }

    stop() {
        this.isActive = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.mouseActivityCheckInterval) clearInterval(this.mouseActivityCheckInterval);
    }

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

    loadPreferences() {
        const saved = localStorage.getItem('particlePreferences');
        if (!saved) return {};
        const preferences = JSON.parse(saved);
        if (!preferences.rememberMe) return { rememberMe: false };
        return preferences;
    }

    updateRememberMe(enabled) {
        this.config.rememberMe = enabled;
        if (enabled) this.savePreferences();
        else localStorage.removeItem('particlePreferences');
    }
}

class Particle {
    constructor(canvas, speedMultiplier = 1.0, mode = 'deepspace', connectsCircle = null) {
        this.canvas = canvas;
        this.speedMultiplier = speedMultiplier;
        this.mode = mode;
        this.radius = Math.random() * 2 + 1;
        this.mass = 0.6 + Math.random() * 0.8; 

        if (mode === 'blackhole' && connectsCircle) {
            const angle = Math.random() * Math.PI * 2;
            const randomOffset = Math.random() * 250; 
            const spawnRadius = connectsCircle.radius + randomOffset + 10; 
            this.x = connectsCircle.x + Math.cos(angle) * spawnRadius;
            this.y = connectsCircle.y + Math.sin(angle) * spawnRadius;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
        } else {
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * window.innerHeight;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
        }
    }

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

    draw(ctx, color) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

class ParticleControlPanel {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.demoAnimationRunning = false;
        const saved = localStorage.getItem('particlePreferences');
        const savedVersion = saved ? JSON.parse(saved).version : null;
        const versionChanged = savedVersion !== PARTICLE_SYSTEM_VERSION;
        const rememberMe = this.particleSystem.config.rememberMe;
        const demoPlayedThisSession = sessionStorage.getItem('particleDemoPlayed') === 'true';

        if (rememberMe) this.shouldPlayDemo = versionChanged;
        else this.shouldPlayDemo = !demoPlayedThisSession;

        if (this.shouldPlayDemo) this.isExpanded = true;
        else {
            if (rememberMe) {
                const savedPanelState = localStorage.getItem('particleControlsExpanded');
                this.isExpanded = savedPanelState === 'true';
            } else {
                const sessionPanelState = sessionStorage.getItem('particleControlsExpanded');
                this.isExpanded = sessionPanelState === 'true';
            }
        }
        this.init();
    }

    init() {
        const panel = document.getElementById('particleControls');
        if (!panel) return;
        const toggleBtn = document.getElementById('particleControlsToggle');
        if (this.isExpanded) panel.classList.add('expanded');
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.togglePanel());

        const modeBtns = document.querySelectorAll('[name="particleMode"]');
        const blackHoleControl = document.getElementById('blackHoleStrengthControl');

        modeBtns.forEach((btn, index) => {
            if (btn.value === this.particleSystem.config.mode) {
                btn.checked = true;
                this.updateModePillPosition(index, true);
                if (blackHoleControl) {
                    if (btn.value === 'blackhole') {
                        blackHoleControl.classList.add('no-transition');
                        blackHoleControl.classList.add('visible');
                        requestAnimationFrame(() => requestAnimationFrame(() => blackHoleControl.classList.remove('no-transition')));
                    } else blackHoleControl.classList.remove('visible');
                }
            }
            btn.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.particleSystem.updateMode(e.target.value);
                    this.updateModePillPosition(Array.from(modeBtns).findIndex(b => b.checked));
                    if (blackHoleControl) {
                        if (e.target.value === 'blackhole') blackHoleControl.classList.add('visible');
                        else blackHoleControl.classList.remove('visible');
                    }
                }
            });
        });

        const blackHoleSlider = document.getElementById('blackHoleStrength');
        const blackHoleValue = document.getElementById('blackHoleStrengthValue');
        if (blackHoleSlider && blackHoleValue) {
            blackHoleSlider.value = this.particleSystem.config.blackHoleStrength;
            blackHoleValue.textContent = this.particleSystem.config.blackHoleStrength;
            blackHoleSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                blackHoleValue.textContent = value;
                this.particleSystem.updateBlackHoleStrength(value);
            });
        }

        const countSlider = document.getElementById('particleCount');
        const countValue = document.getElementById('particleCountValue');
        if (countSlider && countValue) {
            countSlider.value = this.particleSystem.config.particleCount;
            countValue.textContent = this.particleSystem.config.particleCount;
            countSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                countValue.textContent = value;
                this.particleSystem.updateParticleCount(value);
            });
        }

        const colorBtns = document.querySelectorAll('[name="colorScheme"]');
        colorBtns.forEach(btn => {
            if (btn.value === this.particleSystem.config.colorScheme) btn.checked = true;
            btn.addEventListener('change', (e) => { if (e.target.checked) this.particleSystem.updateColorScheme(e.target.value); });
        });

        const strengthSlider = document.getElementById('colorStrength');
        const strengthValue = document.getElementById('colorStrengthValue');
        if (strengthSlider && strengthValue) {
            strengthSlider.value = this.particleSystem.config.colorStrength;
            strengthValue.textContent = this.particleSystem.config.colorStrength.toFixed(1);
            strengthSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                strengthValue.textContent = value.toFixed(1);
                this.particleSystem.updateColorStrength(value);
            });
        }

        const interactionBtns = document.querySelectorAll('[name="interactionMode"]');
        interactionBtns.forEach((btn, index) => {
            if (btn.value === this.particleSystem.config.interactionMode) {
                btn.checked = true;
                this.updateSliderPillPosition(index, true);
            }
            btn.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.particleSystem.updateInteractionMode(e.target.value);
                    this.updateSliderPillPosition(Array.from(interactionBtns).findIndex(b => b.checked));
                }
            });
        });

        const distanceSlider = document.getElementById('connectionDistance');
        const distanceValue = document.getElementById('connectionDistanceValue');
        if (distanceSlider && distanceValue) {
            distanceSlider.value = this.particleSystem.config.connectionDistance;
            distanceValue.textContent = this.particleSystem.config.connectionDistance;
            distanceSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                distanceValue.textContent = value;
                this.particleSystem.updateConnectionDistance(value);
            });
        }

        const speedSlider = document.getElementById('particleSpeed');
        const speedValue = document.getElementById('particleSpeedValue');
        if (speedSlider && speedValue) {
            speedSlider.value = this.particleSystem.config.speed;
            speedValue.textContent = this.particleSystem.config.speed.toFixed(1);
            speedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                speedValue.textContent = value.toFixed(1);
                this.particleSystem.updateSpeed(value);
            });
        }

        const rememberMeToggle = document.getElementById('rememberMeToggle');
        if (rememberMeToggle) {
            rememberMeToggle.checked = this.particleSystem.config.rememberMe;
            rememberMeToggle.addEventListener('change', (e) => this.particleSystem.updateRememberMe(e.target.checked));
        }

        const resetBtn = document.getElementById('particleReset');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetControls());

        if (this.shouldPlayDemo && this.particleSystem.config.mode === 'blackhole') this.runDemoAnimation(blackHoleSlider, blackHoleValue);
    }

    runDemoAnimation(slider, valueDisplay) {
        if (!slider || !valueDisplay || this.demoAnimationRunning) return;
        this.demoAnimationRunning = true;
        const startValue = 110;
        const maxValue = 330;
        const animationIn = 3200;
        const animationOut = 2800;
        const pauseDuration = 2000;

        setTimeout(() => {
            let startTime = null;
            const animateUp = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / animationIn, 1);
                const easeInOutCubic = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                const currentValue = Math.round(startValue + (maxValue - startValue) * easeInOutCubic);
                slider.value = currentValue;
                valueDisplay.textContent = currentValue;
                this.particleSystem.updateBlackHoleStrength(currentValue);
                if (progress < 1) requestAnimationFrame(animateUp);
                else setTimeout(() => { startTime = null; requestAnimationFrame(animateDown); }, pauseDuration);
            };

            const animateDown = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / animationOut, 1);
                const easeInOutCubic = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                const currentValue = Math.round(maxValue - (maxValue - startValue) * easeInOutCubic);
                slider.value = currentValue;
                valueDisplay.textContent = currentValue;
                this.particleSystem.updateBlackHoleStrength(currentValue);
                if (progress < 1) requestAnimationFrame(animateDown);
                else {
                    this.demoAnimationRunning = false;
                    sessionStorage.setItem('particleDemoPlayed', 'true');
                    setTimeout(() => { if (this.isExpanded) this.togglePanel(); }, 1000);
                }
            };
            requestAnimationFrame(animateUp);
        }, 2000);
    }

    togglePanel() {
        const panel = document.getElementById('particleControls');
        if (!panel) return;
        this.isExpanded = !this.isExpanded;
        panel.classList.toggle('expanded');
        if (this.particleSystem.config.rememberMe) localStorage.setItem('particleControlsExpanded', this.isExpanded.toString());
        else sessionStorage.setItem('particleControlsExpanded', this.isExpanded.toString());
    }

    updateSliderPillPosition(index, skipTransition = false) {
        const pill = document.querySelector('#interactionModeToggle .slider-toggle-pill');
        if (!pill) return;
        if (skipTransition) pill.classList.add('no-transition');
        const pillLeft = 2 + (index * (33.333 + 0.2));
        pill.style.left = `calc(${pillLeft}% - ${index * 1}px)`;
        if (skipTransition) requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.remove('no-transition')));
    }

    updateModePillPosition(index, skipTransition = false) {
        const pill = document.querySelector('#particleModeToggle .slider-toggle-pill');
        if (!pill) return;
        if (skipTransition) pill.classList.add('no-transition');
        const pillLeft = 2 + (index * (50 + 0.15));
        pill.style.left = `calc(${pillLeft}% - ${index * 1}px)`;
        if (skipTransition) requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.remove('no-transition')));
    }

    resetControls() {
        this.particleSystem.reset();
        const rememberMeToggle = document.getElementById('rememberMeToggle');
        if (rememberMeToggle) {
            rememberMeToggle.checked = false;
            this.particleSystem.updateRememberMe(false);
        }

        const isMobile = window.innerWidth <= 768;
        const defaultCount = isMobile ? 150 : 250;
        const countSlider = document.getElementById('particleCount');
        const countValue = document.getElementById('particleCountValue');
        if (countSlider && countValue) { countSlider.value = defaultCount; countValue.textContent = defaultCount.toString(); }

        const distanceSlider = document.getElementById('connectionDistance');
        const distanceValue = document.getElementById('connectionDistanceValue');
        if (distanceSlider && distanceValue) { distanceSlider.value = 150; distanceValue.textContent = '150'; }

        const speedSlider = document.getElementById('particleSpeed');
        const speedValue = document.getElementById('particleSpeedValue');
        if (speedSlider && speedValue) { speedSlider.value = 1.0; speedValue.textContent = '1.0'; }

        const strengthSlider = document.getElementById('colorStrength');
        const strengthValue = document.getElementById('colorStrengthValue');
        if (strengthSlider && strengthValue) { strengthSlider.value = 1.0; strengthValue.textContent = '1.0'; }

        const blackHoleSlider = document.getElementById('blackHoleStrength');
        const blackHoleValue = document.getElementById('blackHoleStrengthValue');
        if (blackHoleSlider && blackHoleValue) { blackHoleSlider.value = 110; blackHoleValue.textContent = '110'; }

        document.querySelectorAll('[name="colorScheme"]').forEach(btn => btn.checked = btn.value === 'greys');
        document.querySelectorAll('[name="interactionMode"]').forEach((btn, index) => { btn.checked = btn.value === 'attract'; if (btn.checked) this.updateSliderPillPosition(index); });
        document.querySelectorAll('[name="particleMode"]').forEach((btn, index) => { btn.checked = btn.value === 'blackhole'; if (btn.checked) this.updateModePillPosition(index); });

        const blackHoleControl = document.getElementById('blackHoleStrengthControl');
        if (blackHoleControl) blackHoleControl.classList.add('visible');
    }
}

function initParticleSystem() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return null;
    const system = new ParticleSystem('particleCanvas');
    const controls = new ParticleControlPanel(system);
    const originalToggleTheme = window.toggleTheme;
    window.toggleTheme = function() { originalToggleTheme(); };
    return system;
}

window.initParticleSystem = initParticleSystem;