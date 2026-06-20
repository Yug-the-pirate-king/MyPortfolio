/**
 * Text Theater — Split-Text Scroll Reveals
 *
 * Splits section titles and hero text into individual character spans,
 * then triggers staggered slide-up reveals when they enter the viewport.
 * Pure JS/CSS, no external library dependency.
 *
 * Respects prefers-reduced-motion by skipping the split.
 */

(function() {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Elements to theatrize (hero elements excluded to preserve original fade-in-up)
    const selectors = [
        '.section-title',
        '.about-subtitle'
    ];

    function splitText(el) {
        if (el.dataset.theater === 'done') return;
        el.dataset.theater = 'done';

        const text = el.textContent;
        // Hide parent momentarily to prevent flash of raw text during split
        el.style.opacity = '0';
        el.innerHTML = '';

        // Wrap each character in a span, preserving spaces
        const chars = text.split('');
        chars.forEach((char, i) => {
            const wrapper = document.createElement('span');
            wrapper.className = 'char-wrap';
            wrapper.style.display = 'inline-block';
            wrapper.style.overflow = 'hidden';
            wrapper.style.verticalAlign = 'top';

            const inner = document.createElement('span');
            inner.className = 'char-inner';
            inner.textContent = char === ' ' ? ' ' : char;
            inner.style.display = 'inline-block';
            inner.style.transition = `transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)`;
            inner.style.transitionDelay = `${i * 0.025}s`;
            inner.style.transform = 'translateY(110%)';
            inner.style.opacity = '0';

            wrapper.appendChild(inner);
            el.appendChild(wrapper);
        });

        // Restore parent opacity so only inner chars control visibility
        el.style.opacity = '1';
    }

    function reveal(el) {
        if (el.dataset.revealed === 'true') return;
        el.dataset.revealed = 'true';
        const inners = el.querySelectorAll('.char-inner');
        inners.forEach(inner => {
            inner.style.transform = 'translateY(0)';
            inner.style.opacity = '1';
        });
    }

    function init() {
        if (prefersReducedMotion) return;

        const elements = [];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => elements.push(el));
        });

        elements.forEach(splitText);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    reveal(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        elements.forEach(el => observer.observe(el));
    }

    // Wait for DOM and other renderers
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
