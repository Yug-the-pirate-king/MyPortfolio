/**
 * Custom Cursor System
 *
 * Hides the default cursor and replaces it with a soft glowing orb
 * that follows the mouse with lerp easing. Expands and changes color
 * when hovering interactive elements. Optional subtle decay trail.
 *
 * Disabled on touch devices and when prefers-reduced-motion.
 */

(function() {
    'use strict';

    // Skip on touch devices or reduced motion
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    // Cursor markup
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    const cursorDot = document.createElement('div');
    cursorDot.className = 'custom-cursor-dot';
    cursor.appendChild(cursorDot);

    // State
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let isHovering = false;
    let isActive = true;
    let inactivityTimer = null;

    // Easing factor (lower = more lag/smoothness)
    const ease = 0.12;

    // Track mouse
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isActive) {
            isActive = true;
            cursor.style.opacity = '1';
            animate();
        }
        resetInactivity();
    });

    document.addEventListener('mousedown', () => {
        cursor.classList.add('clicking');
    });

    document.addEventListener('mouseup', () => {
        cursor.classList.remove('clicking');
    });

    // Detect hover on interactive elements
    const interactives = 'a, button, .button, .box, .project-card, .skill-card, .certification-card, .cta-link, .nav-links a, .mobile-nav a, .scroll-arrow, .back-to-top, .skill-brick, .stat-item';

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactives)) {
            isHovering = true;
            cursor.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactives)) {
            isHovering = false;
            cursor.classList.remove('hovering');
        }
    });

    function resetInactivity() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            isActive = false;
            cursor.style.opacity = '0';
        }, 3000);
    }

    // Animation loop
    function animate() {
        if (!isActive) return;

        cursorX += (mouseX - cursorX) * ease;
        cursorY += (mouseY - cursorY) * ease;

        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;

        requestAnimationFrame(animate);
    }

    // Hide native cursor
    document.documentElement.classList.add('custom-cursor-enabled');

    // Start
    cursor.style.opacity = '1';
    animate();
    resetInactivity();
})();
