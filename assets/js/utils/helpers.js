/**
 * Utility Helper Functions
 *
 * JSON-LD schemas, grid lines, donut charts, logo scroller
 *
 * Dependencies: core/data-loader.js
 * Exports: Multiple utility functions
 */

const SCHEMA_CONTEXT = 'https://schema.org';

function buildSchema(type, properties) {
    return {
        '@context': SCHEMA_CONTEXT,
        '@type': type,
        ...properties
    };
}

function generatePersonSchema(personData) {
    if (!personData) return null;

    const { name, jobTitle, description, website, image, email, phone, location, socialLinks, skills } = personData;

    return buildSchema('Person', {
        name,
        jobTitle,
        description,
        url: website,
        image,
        email,
        telephone: phone,
        address: buildSchema('PostalAddress', {
            streetAddress: location?.address,
            addressLocality: location?.city,
            addressRegion: location?.state,
            postalCode: location?.zip,
            addressCountry: location?.country
        }),
        sameAs: [
            socialLinks?.linkedin,
            socialLinks?.github,
            socialLinks?.dribbble,
            socialLinks?.instagram
        ],
        knowsAbout: skills
    });
}

function generateProjectSchema(projectData, personData) {
    if (!projectData || !personData) return null;

    return buildSchema('CreativeWork', {
        name: projectData.title,
        description: projectData.description,
        author: buildSchema('Person', {
            name: personData.name,
            url: personData.website
        }),
        datePublished: projectData.year?.toString(),
        image: `https://jerimybrown.com/assets/images/work/${projectData.id}-light.png`,
        keywords: projectData.tags?.join(', '),
        genre: projectData.category
    });
}

function generateBreadcrumbSchema(items) {
    return buildSchema('BreadcrumbList', {
        itemListElement: items.map((item, index) => buildSchema('ListItem', {
            position: index + 1,
            name: item.name,
            item: item.url
        }))
    });
}

function generateWebSiteSchema(personData) {
    if (!personData) return null;

    return buildSchema('WebSite', {
        name: `${personData.name} - Portfolio`,
        url: personData.website,
        description: personData.description,
        author: buildSchema('Person', {
            name: personData.name
        })
    });
}

function injectJSONLD(schema) {
    if (!schema) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
}

function initJSONLDSchemas() {
    const personData = dataLoader.getPerson();
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    const isProjectPage = currentPath.includes('work/');
    const isHomePage = currentPage === 'index.html' || currentPath === '/' || currentPath === '';

    injectJSONLD(generatePersonSchema(personData));

    if (isProjectPage) {
        const projectData = dataLoader.getProject(currentPage);
        if (projectData) {
            injectJSONLD(generateProjectSchema(projectData, personData));
            injectJSONLD(generateBreadcrumbSchema([
                { name: 'Home', url: 'https://jerimybrown.com' },
                { name: 'Work', url: 'https://jerimybrown.com#projects' },
                { name: projectData.title, url: `https://jerimybrown.com/work/${projectData.url}` }
            ]));
        }
    } else if (isHomePage) {
        injectJSONLD(generateWebSiteSchema(personData));
    }
}

// Grid Lines System
// ==========================================

function getGridControls() {
    return {
        overlay: document.getElementById('gridLinesOverlay'),
        toggles: [
            document.getElementById('gridToggle'),
            document.getElementById('gridToggleLocal')
        ]
    };
}

function syncGridToggles(overlay) {
    const isVisible = overlay.classList.contains('visible');
    const { toggles } = getGridControls();

    toggles.forEach(toggle => {
        if (toggle) toggle.classList.toggle('active', isVisible);
    });
}

function toggleGridLines() {
    const { overlay } = getGridControls();

    if (!overlay) return;

    overlay.classList.toggle('visible');
    syncGridToggles(overlay);
    localStorage.setItem('gridLinesVisible', overlay.classList.contains('visible'));
}

function initGridLines() {
    const savedState = localStorage.getItem('gridLinesVisible');
    const { overlay } = getGridControls();

    if (savedState === 'true' && overlay) {
        overlay.classList.add('visible');
        syncGridToggles(overlay);
    }
}

// Donut Chart Animations
// ==========================================

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

function initDonutCharts() {
    const charts = document.querySelectorAll('.donut-chart');
    if (charts.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const chart = entry.target;
            const progress = parseInt(chart.dataset.progress, 10) || 0;
            const radius = 25;
            const circumference = 2 * Math.PI * radius;
            const progressLength = (progress / 100) * circumference;

            chart.classList.add('animate');
            chart.style.setProperty('--progress', progressLength);

            const valueElement = chart.querySelector('.chart-value');
            if (valueElement) {
                animateChartValue(valueElement, 0, progress, 1500);
            }

            observer.unobserve(chart);
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -20px 0px'
    });

    charts.forEach(chart => observer.observe(chart));
}

function animateChartValue(element, start, end, duration) {
    const startTime = performance.now();

    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(start + (end - start) * easeOutQuart(progress));

        element.textContent = `${current}%`;

        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }

    requestAnimationFrame(updateValue);
}

// Logo Scroller - Seamless Infinite Scroll
// ==========================================

let brandScrollDuration = 80000;
let restartLogoScroller = null;
let updateLogoScrollSpeed = null;

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

    function calculateScrollParameters() {
        const allLogos = Array.from(track.querySelectorAll('.brand-logo'));
        const visibleLogos = allLogos.filter(logo => window.getComputedStyle(logo).display !== 'none');

        if (visibleLogos.length === 0) {
            scrollWidth = 0;
            speed = 0;
            return;
        }

        const oneSetCount = visibleLogos.length / 2;
        const gap = parseInt(window.getComputedStyle(track).gap, 10) || 64;

        let totalWidth = 0;
        for (let i = 0; i < oneSetCount; i++) {
            totalWidth += visibleLogos[i].offsetWidth + gap;
        }

        scrollWidth = totalWidth;
        speed = scrollWidth / brandScrollDuration;
    }

    function animate(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;

        if (!isPaused && scrollWidth > 0) {
            const delta = timestamp - lastTimestamp;
            position += speed * delta;

            if (position >= scrollWidth) {
                position = position % scrollWidth;
            }

            track.style.transform = `translateX(-${position}px)`;
        }

        lastTimestamp = timestamp;
        animationId = requestAnimationFrame(animate);
    }

    function start() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        position = 0;
        lastTimestamp = 0;
        track.style.transform = 'translateX(0)';

        calculateScrollParameters();

        if (scrollWidth > 0) {
            animationId = requestAnimationFrame(animate);
        }
    }

    function updateSpeed() {
        calculateScrollParameters();
    }

    scroller.addEventListener('mouseenter', () => {
        isPaused = true;
    });

    scroller.addEventListener('mouseleave', () => {
        isPaused = false;
    });

    restartLogoScroller = start;
    updateLogoScrollSpeed = updateSpeed;

    start();

    const themeObserver = new MutationObserver(() => {
        start();
    });

    themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-theme']
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(start, 150);
    });
}

// Brands Speed Control
// ==========================================

function getBrandSpeedDuration(speedPercent) {
    return (120 - speedPercent) * 1000;
}

function applyBrandSpeed(speedPercent) {
    brandScrollDuration = getBrandSpeedDuration(speedPercent);
    if (updateLogoScrollSpeed) {
        updateLogoScrollSpeed();
    }
}

function initBrandsSpeedControl() {
    const slider = document.getElementById('brandsSpeedSlider');
    const valueDisplay = document.getElementById('brandsSpeedValue');

    if (!slider || !valueDisplay) return;

    const updateDisplay = (percent) => {
        valueDisplay.textContent = `${percent}%`;
    };

    const savedSpeed = localStorage.getItem('brandsScrollSpeed');
    const initialPercent = savedSpeed ? parseInt(savedSpeed, 10) : parseInt(slider.value, 10);

    slider.value = initialPercent;
    updateDisplay(initialPercent);
    applyBrandSpeed(initialPercent);

    slider.addEventListener('input', function () {
        const speedPercent = parseInt(this.value, 10);
        updateDisplay(speedPercent);
        localStorage.setItem('brandsScrollSpeed', speedPercent);
        applyBrandSpeed(speedPercent);
    });
}