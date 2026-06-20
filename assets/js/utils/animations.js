/**
 * Animation & Interaction Systems
 *
 * Scroll animations, observers, page transitions
 *
 * Dependencies: None
 * Exports: Animation and transition functions
 */

// Animation & Interaction Observers
// ==========================================

function initScrollAnimations() {
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

    // Observe cards for entrance animations (index page sections)
    document.querySelectorAll('.project-card, .skill-card, .certification-card, .containers .box, .stat-item').forEach(card => {
        observer.observe(card);
    });

    // Observe section lines and mask reveals
    document.querySelectorAll('.section-line, .about-carousel.reveal-mask').forEach(el => {
        observer.observe(el);
    });
}

function initSmoothScrolling() {
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Skip if href is just '#' or empty
            if (!href || href === '#') {
                return;
            }

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const targetPosition = target.offsetTop - 48;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}


// Page Transitions
// ==========================================

function initPageTransitions() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        return; // Skip transitions if user prefers reduced motion
    }

    // Fade in the page on load
    document.body.classList.add('page-transition-in');

    // Get all links that navigate to other HTML pages
    const pageLinks = document.querySelectorAll('a[href$=".html"], a[href*=".html#"], a[href*="/"][href*=".html"]');

    pageLinks.forEach(link => {
        // Skip external links
        const href = link.getAttribute('href');
        if (href.startsWith('http') || href.startsWith('//')) {
            return;
        }

        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetUrl = this.href;

            // Add fade out class
            document.body.classList.add('page-transition-out');

            // Check if mobile menu is open - use longer delay if it is
            const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
            const isMobileMenuOpen = mobileMenuOverlay && mobileMenuOverlay.classList.contains('active');
            const delay = isMobileMenuOpen ? 600 : 300; // Longer delay for mobile menu sequential fade

            // Navigate after transition completes
            setTimeout(() => {
                window.location.href = targetUrl;
            }, delay);
        });
    });
}

// ==========================================
