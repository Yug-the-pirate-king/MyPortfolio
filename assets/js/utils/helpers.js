/**
 * Utility Helper Functions
 *
 * JSON-LD schemas, grid lines, donut charts, logo scroller
 *
 * Dependencies: core/data-loader.js
 * Exports: Multiple utility functions (global)
 */

// ---------------------------------------------------------------------------
// JSON-LD Schema Generators
// ---------------------------------------------------------------------------

/**
 * Build a Schema.org Person object from the site person data.
 * @param {Object} personData
 * @returns {Object|null}
 */
function generatePersonSchema(personData) {
    if (!personData) return null;

    const location = personData.location || {};
    const social = personData.socialLinks || {};

    // Only include valid social URLs so the schema never contains undefined entries.
    const sameAs = [
        social.linkedin,
        social.github,
        social.dribbble,
        social.instagram
    ].filter(link => typeof link === 'string' && link.trim() !== '');

    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": personData.name,
        "jobTitle": personData.jobTitle,
        "description": personData.description,
        "url": personData.website,
        "image": personData.image,
        "email": personData.email,
        "telephone": personData.phone,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": location.address,
            "addressLocality": location.city,
            "addressRegion": location.state,
            "postalCode": location.zip,
            "addressCountry": location.country
        },
        "sameAs": sameAs,
        "knowsAbout": Array.isArray(personData.skills) ? personData.skills : []
    };
}

/**
 * Build a Schema.org CreativeWork object for a project.
 * @param {Object} projectData
 * @param {Object} personData
 * @returns {Object|null}
 */
function generateProjectSchema(projectData, personData) {
    if (!projectData || !personData) return null;

    return {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": projectData.title,
        "description": projectData.description,
        "author": {
            "@type": "Person",
            "name": personData.name,
            "url": personData.website
        },
        "datePublished": projectData.year?.toString(),
        "image": `https://jerimybrown.com/assets/images/work/${projectData.id}-light.png`,
        "keywords": Array.isArray(projectData.tags) ? projectData.tags.join(', ') : undefined,
        "genre": projectData.category
    };
}

/**
 * Build a Schema.org BreadcrumbList from an array of { name, url } items.
 * @param {Array} items
 * @returns {Object|null}
 */
function generateBreadcrumbSchema(items) {
    if (!Array.isArray(items)) return null;

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };
}

/**
 * Build a Schema.org WebSite object for the portfolio homepage.
 * @param {Object} personData
 * @returns {Object|null}
 */
function generateWebSiteSchema(personData) {
    if (!personData) return null;

    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": `${personData.name} - Portfolio`,
        "url": personData.website,
        "description": personData.description,
        "author": {
            "@type": "Person",
            "name": personData.name
        }
    };
}

/**
 * Inject a JSON-LD script tag into <head>.
 * @param {Object} schema
 */
function injectJSONLD(schema) {
    if (!schema || typeof document === 'undefined') return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
}

/**
 * Initialize the correct JSON-LD schemas for the current page.
 */
function initJSONLDSchemas() {
    if (typeof dataLoader === 'undefined' || !dataLoader) return;

    const personData = dataLoader.getPerson();
    if (!personData) return;

    // Person schema is injected on every page.
    injectJSONLD(generatePersonSchema(personData));

    // Normalize the path so trailing slashes do not produce empty slugs.
    const normalizedPath = window.location.pathname.replace(/\/$/, '') || '/';
    const segments = normalizedPath.split('/').filter(Boolean);
    const pageSlug = segments.at(-1) || '';

    if (normalizedPath.startsWith('/work/') && segments.length > 1) {
        // Project detail page.
        const projectData = dataLoader.getProject(pageSlug);
        if (projectData) {
            injectJSONLD(generateProjectSchema(projectData, personData));
            injectJSONLD(generateBreadcrumbSchema([
                { name: 'Home', url: 'https://jerimybrown.com' },
                { name: 'Work', url: 'https://jerimybrown.com#projects' },
                { name: projectData.title, url: `https://jerimybrown.com/work/${projectData.url}` }
            ]));
        }
    } else if (normalizedPath === '/' || normalizedPath === '/index.html') {
        // Homepage.
        injectJSONLD(generateWebSiteSchema(personData));
    }
}

// ---------------------------------------------------------------------------
// Grid Lines System
// ---------------------------------------------------------------------------

/** Toggle the grid-lines overlay and persist the state. */
function toggleGridLines() {
    const overlay = document.getElementById('gridLinesOverlay');
    const toggle = document.getElementById('gridToggle');
    const toggleLocal = document.getElementById('gridToggleLocal');

    if (!overlay) return;

    overlay.classList.toggle('visible');

    // Keep all toggles in sync with the overlay state.
    if (toggle) toggle.classList.toggle('active');
    if (toggleLocal) toggleLocal.classList.toggle('active');

    const isVisible = overlay.classList.contains('visible');
    try {
        localStorage.setItem('gridLinesVisible', isVisible);
    } catch {
        // Ignore localStorage errors (e.g. private browsing mode).
    }
}

/** Restore the grid-lines state from localStorage on load. */
function initGridLines() {
    let savedState = null;
    try {
        savedState = localStorage.getItem('gridLinesVisible');
    } catch {
        // Ignore localStorage errors.
    }

    const overlay = document.getElementById('gridLinesOverlay');
    const toggle = document.getElementById('gridToggle');
    const toggleLocal = document.getElementById('gridToggleLocal');

    if (savedState === 'true' && overlay) {
        overlay.classList.add('visible');
        if (toggle) toggle.classList.add('active');
        if (toggleLocal) toggleLocal.classList.add('active');
    }
}

// ---------------------------------------------------------------------------
// Donut Chart Animations
// ---------------------------------------------------------------------------

/** Initialize animated donut charts when they enter the viewport. */
function initDonutCharts() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const chart = entry.target;
            const rawProgress = parseInt(chart.dataset.progress, 10);
            const progress = Number.isFinite(rawProgress)
                ? Math.min(Math.max(rawProgress, 0), 100)
                : 0;

            const radius = 25;
            const circumference = 2 * Math.PI * radius;
            const progressLength = (progress / 100) * circumference;

            // Trigger the CSS animation and set the progress CSS variable.
            chart.classList.add('animate');
            chart.style.setProperty('--progress', progressLength);

            // Animate the numeric value.
            const valueElement = chart.querySelector('.chart-value');
            if (valueElement) {
                animateChartValue(valueElement, 0, progress, 1500);
            }

            // Only animate once per chart.
            observer.unobserve(chart);
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -20px 0px'
    });

    document.querySelectorAll('.donut-chart').forEach(chart => {
        observer.observe(chart);
    });
}

/**
 * Animate a number from start to end over a given duration.
 * @param {HTMLElement} element
 * @param {number} start
 * @param {number} end
 * @param {number} duration
 */
function animateChartValue(element, start, end, duration) {
    if (duration <= 0) {
        element.textContent = `${end}%`;
        return;
    }

    const startTime = performance.now();
    const range = end - start;

    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const t = Math.min(elapsed / duration, 1);

        // easeOutQuart
        const eased = 1 - Math.pow(1 - t, 4);
        const current = Math.round(start + range * eased);

        element.textContent = `${current}%`;

        if (t < 1) {
            requestAnimationFrame(updateValue);
        }
    }

    requestAnimationFrame(updateValue);
}

// ---------------------------------------------------------------------------
// Logo Scroller - Seamless Infinite Scroll
// ---------------------------------------------------------------------------

// Global scroll duration in milliseconds (40% speed = 80s).
let brandScrollDuration = 80000;

// Exposed callbacks so external controls can restart or update the scroller.
let restartLogoScroller = null;
let updateLogoScrollSpeed = null;

/** Initialize the infinite logo scroller. */
function initLogoScroller() {
    const track = document.querySelector('.logo-scroller-track');
    const scroller = document.querySelector('.logo-scroller');

    if (!track || !scroller) return;

    let animationId = null;
    let position = 0;
    let isPaused = false;
    let scrollWidth = 0;
    let speed = 0;
    let lastTimestamp = 0;

    /** Calculate the width of one logo set and the corresponding scroll speed. */
    function calculateScrollParameters() {
        const allLogos = Array.from(track.querySelectorAll('.brand-logo'));
        const visibleLogos = allLogos.filter(logo => {
            return window.getComputedStyle(logo).display !== 'none';
        });

        if (visibleLogos.length === 0) {
            scrollWidth = 0;
            speed = 0;
            return;
        }

        // The markup contains the original set plus a duplicate for seamless looping.
        const oneSetCount = Math.floor(visibleLogos.length / 2);
        if (oneSetCount === 0) {
            scrollWidth = 0;
            speed = 0;
            return;
        }

        const trackStyles = window.getComputedStyle(track);
        const gap = parseInt(trackStyles.gap, 10) || 64;

        let totalWidth = 0;
        for (let i = 0; i < oneSetCount; i++) {
            totalWidth += visibleLogos[i].offsetWidth + gap;
        }

        scrollWidth = totalWidth;
        speed = scrollWidth / brandScrollDuration;
    }

    /** Animation loop driven by real frame deltas for frame-rate-independent motion. */
    function animate(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        if (!isPaused && scrollWidth > 0 && speed > 0) {
            position += speed * delta;

            // Seamlessly wrap back to the start of the next set.
            if (position >= scrollWidth) {
                position = position % scrollWidth;
            }

            track.style.transform = `translateX(-${position}px)`;
        }

        animationId = requestAnimationFrame(animate);
    }

    // Pause scrolling while the user hovers over the scroller.
    scroller.addEventListener('mouseenter', () => {
        isPaused = true;
    });

    scroller.addEventListener('mouseleave', () => {
        isPaused = false;
    });

    /** Restart the scroller from the beginning (e.g. on theme change or resize). */
    function start() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        position = 0;
        lastTimestamp = 0;
        track.style.transform = 'translateX(0)';

        calculateScrollParameters();

        if (scrollWidth > 0) {
            animationId = requestAnimationFrame(animate);
        }
    }

    /** Update scroll speed without resetting the current position. */
    function updateSpeed() {
        const previousScrollWidth = scrollWidth;
        calculateScrollParameters();

        if (previousScrollWidth > 0 && scrollWidth > 0) {
            // Preserve the proportional offset so the loop stays seamless.
            position = (position / previousScrollWidth) * scrollWidth;
            if (position >= scrollWidth) {
                position = position % scrollWidth;
            }
            track.style.transform = `translateX(-${position}px)`;
        }
    }

    restartLogoScroller = start;
    updateLogoScrollSpeed = updateSpeed;

    start();

    // Restart when the theme changes because logos may swap dimensions.
    if (document.body) {
        const themeObserver = new MutationObserver(() => start());
        themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    // Debounced restart on window resize.
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(start, 150);
    });
}

// ---------------------------------------------------------------------------
// Brands Speed Control
// ---------------------------------------------------------------------------

/** Clamp the speed percentage to the allowed 20–100 range. */
function clampSpeedPercent(percent) {
    return Math.max(20, Math.min(100, percent));
}

/** Apply the chosen speed percentage to the global duration and UI. */
function applyBrandSpeed(percent, slider, valueDisplay) {
    const clamped = clampSpeedPercent(percent);
    slider.value = clamped;
    valueDisplay.textContent = `${clamped}%`;
    brandScrollDuration = (120 - clamped) * 1000;

    try {
        localStorage.setItem('brandsScrollSpeed', clamped);
    } catch {
        // Ignore localStorage errors.
    }

    if (typeof updateLogoScrollSpeed === 'function') {
        updateLogoScrollSpeed();
    }
}

/** Initialize the brands speed slider. */
function initBrandsSpeedControl() {
    const slider = document.getElementById('brandsSpeedSlider');
    const valueDisplay = document.getElementById('brandsSpeedValue');

    if (!slider || !valueDisplay) return;

    let savedSpeed = null;
    try {
        savedSpeed = localStorage.getItem('brandsScrollSpeed');
    } catch {
        // Ignore localStorage errors.
    }

    if (savedSpeed !== null) {
        const parsed = parseInt(savedSpeed, 10);
        if (Number.isFinite(parsed)) {
            applyBrandSpeed(parsed, slider, valueDisplay);
        } else {
            applyBrandSpeed(40, slider, valueDisplay);
        }
    } else {
        // Default speed matches the initial 80s duration.
        applyBrandSpeed(40, slider, valueDisplay);
    }

    slider.addEventListener('input', () => {
        const parsed = parseInt(slider.value, 10);
        if (Number.isFinite(parsed)) {
            applyBrandSpeed(parsed, slider, valueDisplay);
        }
    });
}