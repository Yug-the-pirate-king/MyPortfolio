/**
 * Magnetic Interaction Physics
 *
 * Elements with .magnetic class subtly translate toward the cursor
 * when within a proximity radius. Combined with 3D tilt on cards.
 * Pure JS, requestAnimationFrame-driven. Disabled on touch.
 */

(function() {
    'use strict';

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch || prefersReducedMotion) return;

    const magneticEls = document.querySelectorAll('.magnetic, .button, .box, .project-card, .skill-card, .certification-card, .cta-link, .scroll-arrow, .back-to-top');
    if (!magneticEls.length) return;

    const state = new Map(); // el -> { x, y, tx, ty, rotX, rotY, trX, trY }

    magneticEls.forEach(el => {
        state.set(el, { x: 0, y: 0, tx: 0, ty: 0, rotX: 0, rotY: 0 });
        el.style.willChange = 'transform';
    });

    let mouseX = 0;
    let mouseY = 0;
    let isMoving = false;
    let moveTimeout = null;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        isMoving = true;
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => { isMoving = false; }, 100);
    });

    const ease = 0.1;
    const proximity = 80; // px
    const strength = 0.3;
    const tiltStrength = 8; // max deg

    function animate() {
        if (!isMoving) {
            // Still animate spring-back
            let hasMovement = false;
            state.forEach((s) => {
                if (Math.abs(s.x) > 0.1 || Math.abs(s.y) > 0.1) hasMovement = true;
            });
            if (!hasMovement) {
                requestAnimationFrame(animate);
                return;
            }
        }

        magneticEls.forEach(el => {
            const s = state.get(el);
            if (!s) return;

            const rect = el.getBoundingClientRect();
            const elCX = rect.left + rect.width / 2;
            const elCY = rect.top + rect.height / 2;
            const dx = mouseX - elCX;
            const dy = mouseY - elCY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const isCard = el.classList.contains('project-card') ||
                           el.classList.contains('skill-card') ||
                           el.classList.contains('certification-card') ||
                           el.classList.contains('box');

            if (dist < proximity + Math.max(rect.width, rect.height) / 2) {
                const factor = Math.max(0, 1 - dist / (proximity + Math.max(rect.width, rect.height) / 2));
                s.tx = dx * factor * strength;
                s.ty = dy * factor * strength;

                if (isCard) {
                    s.trX = (dy / (rect.height / 2)) * tiltStrength;
                    s.trY = -(dx / (rect.width / 2)) * tiltStrength;
                }
            } else {
                s.tx = 0;
                s.ty = 0;
                s.trX = 0;
                s.trY = 0;
            }

            s.x += (s.tx - s.x) * ease;
            s.y += (s.ty - s.y) * ease;

            if (isCard) {
                s.rotX += (s.trX - s.rotX) * ease;
                s.rotY += (s.trY - s.rotY) * ease;
                el.style.transform = `translate(${s.x}px, ${s.y}px) perspective(1000px) rotateX(${s.rotX}deg) rotateY(${s.rotY}deg)`;
            } else {
                el.style.transform = `translate(${s.x}px, ${s.y}px)`;
            }
        });

        requestAnimationFrame(animate);
    }

    animate();
})();
