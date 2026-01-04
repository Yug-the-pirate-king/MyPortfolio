// Particle Network System
// Interactive particle animation for hero section background

// Version tracking for forcing demo animations on updates
const PARTICLE_SYSTEM_VERSION = '2.0'; // Orbital motion update

class ParticleSystem {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.animationId = null;
        this.isActive = false;
        this.previousBlackHoleStrength = 110; // Track for redistribution

        // Mouse activity tracking
        this.lastMouseMove = Date.now();
        this.isMouseActive = false;
        this.mouseIdleTimeout = 800; // ms of inactivity before releasing
        this.mouseActivityCheckInterval = null;

        // Default configuration with responsive particle count
        const isMobile = window.innerWidth <= 768;
        this.config = {
            particleCount: isMobile ? 200 : 300, // 200 on mobile, 300 on desktop
            connectionDistance: 150,
            mouseRadius: 150,
            colorScheme: 'greys', // 'accent' or 'greys'
            colorStrength: 1.0, // 0.3 to 1.5
            interactionMode: 'attract', // 'attract', 'repel', or 'static'
            speed: 1.0,
            mode: 'blackhole', // 'deepspace' or 'blackhole'
            blackHoleStrength: 110, // radius for black hole mode
            rememberMe: false, // Don't remember settings by default
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
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.canvas.style.display = 'none';
            return;
        }

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Mouse tracking with activity detection
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY - rect.top;

            // Update activity state
            this.lastMouseMove = Date.now();
            this.isMouseActive = true;
        });

        // Deactivate when mouse leaves viewport
        window.addEventListener('mouseleave', () => {
            this.isMouseActive = false;
        });

        // Reactivate when mouse enters viewport
        window.addEventListener('mouseenter', () => {
            this.lastMouseMove = Date.now();
            this.isMouseActive = true;
        });

        // Set up "connects" word boundary circle
        this.updateConnectsCircle();

        // Start checking for mouse inactivity
        this.mouseActivityCheckInterval = setInterval(() => {
            const timeSinceLastMove = Date.now() - this.lastMouseMove;
            if (timeSinceLastMove > this.mouseIdleTimeout && this.isMouseActive) {
                this.isMouseActive = false;
            }
        }, 100); // Check every 100ms

        // Initialize particles
        this.createParticles();

        // Start animation
        this.start();
    }

    updateConnectsCircle() {
        const connectsWord = document.getElementById('rotatingWord');
        if (connectsWord) {
            const rect = connectsWord.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();

            // Use larger radius on mobile for better visual effect
            const isMobile = window.innerWidth <= 768;
            const radiusMultiplier = isMobile ? 1.15 : 0.8;

            this.connectsCircle = {
                x: rect.left + rect.width / 2 - canvasRect.left,
                y: rect.top + rect.height / 2 - canvasRect.top,
                radius: Math.max(rect.width, rect.height) * radiusMultiplier
            };
        }
    }

    resizeCanvas() {
        const heroSection = this.canvas.closest('.hero');
        if (heroSection) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = heroSection.offsetHeight;
            this.updateConnectsCircle();
            this.createParticles(); // Reset particles on resize
        }
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
            // Add particles
            for (let i = 0; i < diff; i++) {
                this.particles.push(new Particle(this.canvas, this.config.speed, this.config.mode, this.connectsCircle));
            }
        } else if (diff < 0) {
            // Remove particles
            this.particles = this.particles.slice(0, count);
        }

        this.savePreferences();
    }

    updateMode(mode) {
        this.config.mode = mode;
        this.createParticles(); // Recreate particles for new mode
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

        // Apply color strength multiplier
        const strength = this.config.colorStrength;

        return {
            particle: this.adjustColorOpacity(baseColors.particle, strength),
            connection: this.adjustColorOpacity(baseColors.connection, strength)
        };
    }

    adjustColorOpacity(colorString, multiplier) {
        // Extract the opacity value from rgba() string and multiply it
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
                    // Get base opacity from the color string and multiply by distance factor
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

            // Only draw connections to particles within connection distance from circle edge
            const distanceFromEdge = Math.abs(distance - circle.radius);

            if (distanceFromEdge < this.config.connectionDistance && distance > circle.radius) {
                // Get base opacity from the color string and multiply by distance factor
                const baseOpacity = this.extractOpacity(colors.connection);
                const distanceFactor = (1 - distanceFromEdge / this.config.connectionDistance);
                const finalOpacity = baseOpacity * distanceFactor;

                // Calculate point on circle edge closest to particle
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

        // Update and draw particles
        this.particles.forEach(particle => {
            if (this.config.mode === 'blackhole' && this.connectsCircle) {
                // Black hole mode: gravity-based particle distribution with mass

                // Mouse interaction still works in black hole mode
                // Stronger mouse effect at higher black hole strength
                // Only apply when mouse is actively moving
                if (this.config.interactionMode !== 'static' && this.isMouseActive) {
                    const dx = this.mouse.x - particle.x;
                    const dy = this.mouse.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.config.mouseRadius) {
                        const force = (this.config.mouseRadius - distance) / this.config.mouseRadius;
                        const angle = Math.atan2(dy, dx);
                        // Scale mouse force based on black hole strength (80-300 range)
                        const strengthFactor = this.config.blackHoleStrength / 50; // 1.6 to 6.0
                        const baseMultiplier = this.config.interactionMode === 'attract' ? 0.2 : -0.2;
                        const multiplier = baseMultiplier * strengthFactor;

                        particle.vx += Math.cos(angle) * force * multiplier;
                        particle.vy += Math.sin(angle) * force * multiplier;
                    }
                }

                // Apply gravity-based constraints
                const dx = this.connectsCircle.x - particle.x;
                const dy = this.connectsCircle.y - particle.y;
                const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                const innerRadius = this.connectsCircle.radius;
                // Massively amplify the range at low strength - extreme dramatic spread
                const maxOuterDistance = (380 - this.config.blackHoleStrength) * 2.5;

                // Strong repulsion from inside the circle - maintain clear boundary
                if (distanceFromCenter < innerRadius) {
                    const force = (innerRadius - distanceFromCenter) / innerRadius;
                    // Much stronger repulsion to keep clean circular boundary
                    particle.vx -= Math.cos(angle) * force * 1.5;
                    particle.vy -= Math.sin(angle) * force * 1.5;

                    // If particle is deep inside, push it out immediately
                    if (distanceFromCenter < innerRadius * 0.9) {
                        const pushOut = (innerRadius - distanceFromCenter) * 0.1;
                        particle.x -= Math.cos(angle) * pushOut;
                        particle.y -= Math.sin(angle) * pushOut;
                    }
                }

                const distanceFromCircumference = distanceFromCenter - innerRadius;

                // Each particle has its own equilibrium distance based on mass
                // Light particles naturally settle further out, heavy ones closer in
                // At HIGH strength: range compressed, everyone pulled tight together
                // At LOW strength: range MASSIVELY expanded, particles spread with extreme variation
                const baseDistance = maxOuterDistance * 0.25;
                const massVariation = (1.0 - particle.mass) * maxOuterDistance * 1.1; // Maximum variation
                const particleTargetDistance = baseDistance + massVariation;

                // Pull/push particle toward its individual target distance
                const distanceFromTarget = distanceFromCircumference - particleTargetDistance;

                if (Math.abs(distanceFromTarget) > 5) {
                    // Strength determines how strongly particles are pulled to their targets
                    // Extremely gentle force for ultra-smooth, non-bouncy movement
                    const forceStrength = this.config.blackHoleStrength / 15000;
                    const force = distanceFromTarget * forceStrength;

                    particle.vx += Math.cos(angle) * force;
                    particle.vy += Math.sin(angle) * force;
                }

                // Mass-based random drift - very gentle for smoothness
                const randomFactor = (360 - this.config.blackHoleStrength) * (1.6 - particle.mass);
                const randomDrift = randomFactor / 3000; // Much reduced for smoothness
                particle.vx += (Math.random() - 0.5) * randomDrift;
                particle.vy += (Math.random() - 0.5) * randomDrift;

                // Add orbital motion that scales with black hole strength
                // Starts very subtle at ~90, slow at 110 (default), increases to max at 300
                if (this.config.blackHoleStrength > 90) {
                    const strengthRange = 300 - 90; // 210
                    const strengthPosition = (this.config.blackHoleStrength - 90) / strengthRange; // 0 to 1

                    // Use power curve to make it slow at low values, faster at high values
                    // At 110: (110-90)/210 = 0.095 -> 0.095^0.75 = 0.146 (14.6% of max speed)
                    const orbitStrength = Math.pow(strengthPosition, 0.75);
                    const orbitalSpeed = 0.3 * orbitStrength; // Max 0.3 at strength 300

                    // Tangential velocity (perpendicular to radial direction)
                    particle.vx += -Math.sin(angle) * orbitalSpeed;
                    particle.vy += Math.cos(angle) * orbitalSpeed;
                }

                // Apply very strong damping in black hole mode for buttery-smooth motion
                particle.vx *= 0.92; // Very strong friction
                particle.vy *= 0.92;

                // Soft outer boundary
                if (distanceFromCircumference > maxOuterDistance) {
                    const excess = distanceFromCircumference - maxOuterDistance;
                    const constrainForce = excess / 50;
                    particle.vx += Math.cos(angle) * constrainForce;
                    particle.vy += Math.sin(angle) * constrainForce;
                }
            } else {
                // Deep space mode: mouse interaction
                // Only apply when mouse is actively moving
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

                // Handle "connects" word circle repulsion in deep space mode
                if (this.connectsCircle) {
                    const dx = this.connectsCircle.x - particle.x;
                    const dy = this.connectsCircle.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.connectsCircle.radius) {
                        // Repel particles from inside the circle
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

        // Draw connections
        this.drawConnections();

        // Draw connections to "connects" word circle (both modes)
        this.drawConnectsCircleConnections(colors);

        // Update previous strength for next frame
        this.previousBlackHoleStrength = this.config.blackHoleStrength;

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isActive = true;
        this.animate();
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.mouseActivityCheckInterval) {
            clearInterval(this.mouseActivityCheckInterval);
        }
    }

    reset() {
        const isMobile = window.innerWidth <= 768;
        this.config = {
            particleCount: isMobile ? 200 : 300, // 200 on mobile, 300 on desktop
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
        // Only save preferences if rememberMe is enabled
        if (!this.config.rememberMe) {
            return;
        }

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
        // Only load preferences if rememberMe is enabled
        const saved = localStorage.getItem('particlePreferences');
        if (!saved) {
            return {};
        }

        const preferences = JSON.parse(saved);

        // Only load if rememberMe was enabled
        if (!preferences.rememberMe) {
            return { rememberMe: false };
        }

        return preferences;
    }

    updateRememberMe(enabled) {
        this.config.rememberMe = enabled;
        if (enabled) {
            // Save current settings when turning on
            this.savePreferences();
        } else {
            // Clear saved settings when turning off
            localStorage.removeItem('particlePreferences');
        }
    }
}

// Particle class
class Particle {
    constructor(canvas, speedMultiplier = 1.0, mode = 'deepspace', connectsCircle = null) {
        this.canvas = canvas;
        this.speedMultiplier = speedMultiplier;
        this.mode = mode;
        this.radius = Math.random() * 2 + 1;

        // Give each particle a random "mass" - affects how it responds to gravity
        // Heavier particles (higher mass) stay closer to circumference
        // Lighter particles (lower mass) float away more easily
        this.mass = 0.6 + Math.random() * 0.8; // Range: 0.6 to 1.4

        if (mode === 'blackhole' && connectsCircle) {
            // Black hole mode: spawn outside the circle at varying distances
            const angle = Math.random() * Math.PI * 2;
            const randomOffset = Math.random() * 250; // Random distance outside circumference
            const spawnRadius = connectsCircle.radius + randomOffset + 10; // Always outside

            this.x = connectsCircle.x + Math.cos(angle) * spawnRadius;
            this.y = connectsCircle.y + Math.sin(angle) * spawnRadius;

            // Small random initial velocity
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
        } else {
            // Deep space mode: spawn randomly
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
        }
    }

    update() {
        // Move particle
        this.x += this.vx * this.speedMultiplier;
        this.y += this.vy * this.speedMultiplier;

        // Friction
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Wrap-around boundaries only in Deep Space mode
        // In Black Hole mode, gravitational constraints handle boundaries
        if (this.mode === 'deepspace') {
            // Allow particles to move beyond visible canvas without bouncing
            const buffer = 200; // Buffer zone beyond canvas edges

            // Wrap horizontally
            if (this.x < -buffer) {
                this.x = this.canvas.width + buffer;
            } else if (this.x > this.canvas.width + buffer) {
                this.x = -buffer;
            }

            // Wrap vertically
            if (this.y < -buffer) {
                this.y = this.canvas.height + buffer;
            } else if (this.y > this.canvas.height + buffer) {
                this.y = -buffer;
            }
        }
    }

    draw(ctx, color) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

// Control Panel class
class ParticleControlPanel {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.demoAnimationRunning = false;

        // Check version and rememberMe status to determine if we should play demo
        const saved = localStorage.getItem('particlePreferences');
        const savedVersion = saved ? JSON.parse(saved).version : null;
        const versionChanged = savedVersion !== PARTICLE_SYSTEM_VERSION;
        const rememberMe = this.particleSystem.config.rememberMe;

        // Check if demo has already played this session
        const demoPlayedThisSession = sessionStorage.getItem('particleDemoPlayed') === 'true';

        // Play demo if:
        // When Remember Me is OFF:
        //   - Play once per visit (session) - check sessionStorage
        // When Remember Me is ON:
        //   - Only play when version changes (new features to showcase)
        if (rememberMe) {
            // Remember Me is ON - only play demo on version change
            this.shouldPlayDemo = versionChanged;
        } else {
            // Remember Me is OFF - play once per session
            this.shouldPlayDemo = !demoPlayedThisSession;
        }

        // Determine panel state
        if (this.shouldPlayDemo) {
            // Force open panel only when actually playing the demo
            this.isExpanded = true;
        } else {
            // Load saved panel state based on Remember Me setting
            if (rememberMe) {
                // Use localStorage for persistent state
                const savedPanelState = localStorage.getItem('particleControlsExpanded');
                this.isExpanded = savedPanelState === 'true';
            } else {
                // Use sessionStorage for session-only state
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

        // Set initial expanded state
        if (this.isExpanded) {
            panel.classList.add('expanded');
        }

        // Toggle button click (opens/closes panel)
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.togglePanel();
            });
        }

        // Mode toggle (Default/Black Hole)
        const modeBtns = document.querySelectorAll('[name="particleMode"]');
        const blackHoleControl = document.getElementById('blackHoleStrengthControl');

        modeBtns.forEach((btn, index) => {
            if (btn.value === this.particleSystem.config.mode) {
                btn.checked = true;
                this.updateModePillPosition(index, true); // Skip transition on initial load
                // Show/hide black hole strength based on initial mode without animation
                if (blackHoleControl) {
                    if (btn.value === 'blackhole') {
                        // Disable transitions during initial load to prevent animation
                        blackHoleControl.classList.add('no-transition');
                        blackHoleControl.classList.add('visible');
                        // Re-enable transitions after render
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                blackHoleControl.classList.remove('no-transition');
                            });
                        });
                    } else {
                        blackHoleControl.classList.remove('visible');
                    }
                }
            }

            btn.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.particleSystem.updateMode(e.target.value);
                    // Find index of checked button
                    const checkedIndex = Array.from(modeBtns).findIndex(b => b.checked);
                    this.updateModePillPosition(checkedIndex);

                    // Show/hide black hole strength slider with smooth animation
                    if (blackHoleControl) {
                        if (e.target.value === 'blackhole') {
                            blackHoleControl.classList.add('visible');
                        } else {
                            blackHoleControl.classList.remove('visible');
                        }
                    }
                }
            });
        });

        // Black hole strength slider
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

        // Set initial visibility of black hole strength control
        if (this.particleSystem.config.mode === 'blackhole' && blackHoleControl) {
            blackHoleControl.classList.add('visible');
        }

        // Particle count slider
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

        // Color scheme toggle
        const colorBtns = document.querySelectorAll('[name="colorScheme"]');
        colorBtns.forEach(btn => {
            if (btn.value === this.particleSystem.config.colorScheme) {
                btn.checked = true;
            }

            btn.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.particleSystem.updateColorScheme(e.target.value);
                }
            });
        });

        // Color strength slider
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

        // Interaction mode
        const interactionBtns = document.querySelectorAll('[name="interactionMode"]');
        interactionBtns.forEach((btn, index) => {
            if (btn.value === this.particleSystem.config.interactionMode) {
                btn.checked = true;
                this.updateSliderPillPosition(index, true); // Skip transition on initial load
            }

            btn.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.particleSystem.updateInteractionMode(e.target.value);
                    // Find index of checked button
                    const checkedIndex = Array.from(interactionBtns).findIndex(b => b.checked);
                    this.updateSliderPillPosition(checkedIndex);
                }
            });
        });

        // Connection distance slider
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

        // Speed slider
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

        // Remember Me toggle
        const rememberMeToggle = document.getElementById('rememberMeToggle');
        if (rememberMeToggle) {
            // Set initial state from config
            rememberMeToggle.checked = this.particleSystem.config.rememberMe;

            rememberMeToggle.addEventListener('change', (e) => {
                this.particleSystem.updateRememberMe(e.target.checked);
            });
        }

        // Reset button
        const resetBtn = document.getElementById('particleReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetControls());
        }

        // Run demo animation when appropriate
        if (this.shouldPlayDemo && this.particleSystem.config.mode === 'blackhole') {
            this.runDemoAnimation(blackHoleSlider, blackHoleValue);
        }
    }

    runDemoAnimation(slider, valueDisplay) {
        if (!slider || !valueDisplay || this.demoAnimationRunning) return;

        this.demoAnimationRunning = true;
        const startValue = 110;
        const maxValue = 330;
        const animationIn = 3200; // 3.2 seconds to animate in
        const animationOut = 2800; // 2.8 seconds to animate out
        const pauseDuration = 2000; // 2 second pause at max

        // Wait 2 seconds before starting
        setTimeout(() => {
            let startTime = null;

            // Animate from 110 to 330
            const animateUp = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / animationIn, 1);

                // Easing function for smooth animation
                const easeInOutCubic = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                const currentValue = Math.round(startValue + (maxValue - startValue) * easeInOutCubic);

                slider.value = currentValue;
                valueDisplay.textContent = currentValue;
                this.particleSystem.updateBlackHoleStrength(currentValue);

                if (progress < 1) {
                    requestAnimationFrame(animateUp);
                } else {
                    // Pause at max, then animate back down
                    setTimeout(() => {
                        startTime = null;
                        requestAnimationFrame(animateDown);
                    }, pauseDuration);
                }
            };

            // Animate from 330 back to 110
            const animateDown = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / animationOut, 1);

                // Easing function for smooth animation
                const easeInOutCubic = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                const currentValue = Math.round(maxValue - (maxValue - startValue) * easeInOutCubic);

                slider.value = currentValue;
                valueDisplay.textContent = currentValue;
                this.particleSystem.updateBlackHoleStrength(currentValue);

                if (progress < 1) {
                    requestAnimationFrame(animateDown);
                } else {
                    this.demoAnimationRunning = false;

                    // Mark that demo has played this session
                    sessionStorage.setItem('particleDemoPlayed', 'true');

                    // Close the panel after a short delay
                    setTimeout(() => {
                        if (this.isExpanded) {
                            this.togglePanel();
                        }
                    }, 1000); // Wait 1 second before closing
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

        // Save panel state to appropriate storage
        if (this.particleSystem.config.rememberMe) {
            // Remember Me is ON - save to localStorage for persistence
            localStorage.setItem('particleControlsExpanded', this.isExpanded.toString());
        } else {
            // Remember Me is OFF - save to sessionStorage for current session only
            sessionStorage.setItem('particleControlsExpanded', this.isExpanded.toString());
        }
    }

    updateSliderPillPosition(index, skipTransition = false) {
        const pill = document.querySelector('#interactionModeToggle .slider-toggle-pill');
        if (!pill) return;

        // Disable transitions during initial load to prevent animation
        if (skipTransition) {
            pill.classList.add('no-transition');
        }

        // Calculate position based on index (0=attract, 1=repel, 2=static)
        // Each option is 33.333% width with 2px padding and 2px gaps
        const totalOptions = 3;
        const optionWidthPercent = 100 / totalOptions;
        const pillLeft = 2 + (index * (optionWidthPercent + 0.2)); // 2px initial padding + option width

        pill.style.left = `calc(${pillLeft}% - ${index * 1}px)`;

        // Re-enable transitions after positioning
        if (skipTransition) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    pill.classList.remove('no-transition');
                });
            });
        }
    }

    updateModePillPosition(index, skipTransition = false) {
        const pill = document.querySelector('#particleModeToggle .slider-toggle-pill');
        if (!pill) return;

        // Disable transitions during initial load to prevent animation
        if (skipTransition) {
            pill.classList.add('no-transition');
        }

        // Calculate position based on index (0=blackhole, 1=deepspace)
        // Each option is 50% width with 2px padding and 2px gaps
        const totalOptions = 2;
        const optionWidthPercent = 100 / totalOptions;
        const pillLeft = 2 + (index * (optionWidthPercent + 0.15)); // 2px initial padding + option width

        pill.style.left = `calc(${pillLeft}% - ${index * 1}px)`;

        // Re-enable transitions after positioning
        if (skipTransition) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    pill.classList.remove('no-transition');
                });
            });
        }
    }

    resetControls() {
        this.particleSystem.reset();

        // Clear the "Save Settings" checkbox
        const rememberMeToggle = document.getElementById('rememberMeToggle');
        if (rememberMeToggle) {
            rememberMeToggle.checked = false;
            // Trigger the change event to update the particle system config
            this.particleSystem.updateRememberMe(false);
        }

        // Update all control values with responsive particle count
        const isMobile = window.innerWidth <= 768;
        const defaultParticleCount = isMobile ? 200 : 300;
        const countSlider = document.getElementById('particleCount');
        const countValue = document.getElementById('particleCountValue');
        if (countSlider && countValue) {
            countSlider.value = defaultParticleCount;
            countValue.textContent = defaultParticleCount.toString();
        }

        const distanceSlider = document.getElementById('connectionDistance');
        const distanceValue = document.getElementById('connectionDistanceValue');
        if (distanceSlider && distanceValue) {
            distanceSlider.value = 150;
            distanceValue.textContent = '150';
        }

        const speedSlider = document.getElementById('particleSpeed');
        const speedValue = document.getElementById('particleSpeedValue');
        if (speedSlider && speedValue) {
            speedSlider.value = 1.0;
            speedValue.textContent = '1.0';
        }

        const strengthSlider = document.getElementById('colorStrength');
        const strengthValue = document.getElementById('colorStrengthValue');
        if (strengthSlider && strengthValue) {
            strengthSlider.value = 1.0;
            strengthValue.textContent = '1.0';
        }

        const blackHoleSlider = document.getElementById('blackHoleStrength');
        const blackHoleValue = document.getElementById('blackHoleStrengthValue');
        if (blackHoleSlider && blackHoleValue) {
            blackHoleSlider.value = 110;
            blackHoleValue.textContent = '110';
        }

        // Reset radio buttons
        document.querySelectorAll('[name="colorScheme"]').forEach(btn => {
            btn.checked = btn.value === 'greys';
        });

        document.querySelectorAll('[name="interactionMode"]').forEach((btn, index) => {
            btn.checked = btn.value === 'attract';
            if (btn.checked) {
                this.updateSliderPillPosition(index);
            }
        });

        document.querySelectorAll('[name="particleMode"]').forEach((btn, index) => {
            btn.checked = btn.value === 'blackhole';
            if (btn.checked) {
                this.updateModePillPosition(index);
            }
        });

        // Show black hole strength control when reset to black hole mode with animation
        const blackHoleControl = document.getElementById('blackHoleStrengthControl');
        if (blackHoleControl) {
            blackHoleControl.classList.add('visible');
        }
    }
}

// Initialize particle system
function initParticleSystem() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return null;

    const system = new ParticleSystem('particleCanvas');
    const controls = new ParticleControlPanel(system);

    // Re-render when theme changes
    const originalToggleTheme = window.toggleTheme;
    window.toggleTheme = function() {
        originalToggleTheme();
        // Particle colors will update on next frame automatically
    };

    return system;
}

// Make available globally
window.initParticleSystem = initParticleSystem;
