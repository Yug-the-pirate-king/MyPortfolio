/**
 * Animation & Interaction Systems
 *
 * Scroll animations, observers, page transitions
 *
 * Dependencies: None
 * Exports: Animation and transition functions
 */

function prefersReducedMotion() {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function observeAll(observer, ...selectors) {
    if (!observer || !selectors.length) {
        return;
    }
    try {
        document.querySelectorAll(selectors.join(', ')).forEach(element => observer.observe(element));
    } catch (error) {
        console.error('Failed to observe animated elements:', error);
    }
}

function getValidHashTarget(href) {
    if (!href || href === '#') {
        return null;
    }
    try {
        return document.querySelector(href);
    } catch (error) {
        console.warn('Invalid hash selector:', href, error);
        return null;
    }
}

function isExternalLink(href) {
    return typeof href === 'string' && (/^https?:/.test(href) || href.startsWith('//'));
}

function getPageTransitionDelay() {
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const isMobileMenuOpen = mobileMenuOverlay && mobileMenuOverlay.classList.contains('active');
    return isMobileMenuOpen ? 600 : 300;
}

// Animation & Interaction Observers
// ==========================================

function initScrollAnimations() {
    if (typeof document === 'undefined') {
        return;
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    observeAll(observer,
        '.project-card, .skill-card, .certification-card, .containers .box, .stat-item',
        '.section-line, .about-carousel.reveal-mask'
    );
}

function initSmoothScrolling() {
    if (typeof document === 'undefined') {
        return;
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (!href || href === '#') {
                return;
            }

            e.preventDefault();

            const target = getValidHashTarget(href);
            if (!target) {
                return;
            }

            const targetPosition = target.offsetTop - 48;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

// Page Transitions
// ==========================================

function initPageTransitions() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    if (prefersReducedMotion()) {
        return;
    }

    document.body.classList.add('page-transition-in');

    const pageLinks = document.querySelectorAll('a[href$=".html"], a[href*=".html#"], a[href*="/"][href*=".html"]');

    pageLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || isExternalLink(href)) {
            return;
        }

        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetUrl = this.href;
            document.body.classList.add('page-transition-out');

            setTimeout(() => {
                window.location.href = targetUrl;
            }, getPageTransitionDelay());
        });
    });
}

// ==========================================