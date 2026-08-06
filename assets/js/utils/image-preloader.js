/**
 * Image Preloading System
 *
 * Preloads project images on hover for better UX. Uses the browser's
 * requestIdleCallback API (where available) to avoid blocking the main
 * thread while injecting <link rel="prefetch"> hints.
 *
 * Dependencies: core/config.js, core/theme-system.js
 * Exports: prefetchProjectImages(), initHoverPreloading()
 */

/** Set of preloaded project/theme combinations to avoid duplicate hints. */
const preloadedProjects = new Set();

/** Delay before treating a hover as intentional (ms). */
const HOVER_INTENT_DELAY_MS = 200;

/** Fallback delay for browsers without requestIdleCallback (ms). */
const PREFETCH_FALLBACK_DELAY_MS = 100;

/** Maximum time to wait for an idle slice before forcing prefetch (ms). */
const PREFETCH_IDLE_TIMEOUT_MS = 2000;

/** Body attribute that stores the active theme. */
const THEME_ATTR = 'data-theme';

/** Selector for project card anchor elements. */
const CARD_LINK_SELECTOR = '.project-card-link';

/** Selector for the project card element that carries the project id. */
const CARD_SELECTOR = '.project-card';

/**
 * Return the active image theme variant.
 * @returns {'dark' | 'light'}
 */
function getActiveTheme() {
    return document.body.getAttribute(THEME_ATTR) === 'dark' ? 'dark' : 'light';
}

/**
 * Build the prefetch URL for an image name and theme.
 * @param {string} imageName
 * @param {string} theme
 * @returns {string}
 */
function buildImageUrl(imageName, theme) {
    return `assets/images/work/${imageName}-${theme}.png`;
}

/**
 * Create a <link rel="prefetch" as="image"> element.
 * @param {string} href
 * @returns {HTMLLinkElement}
 */
function createPrefetchLink(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = href;
    return link;
}

/**
 * Schedule a low-priority callback using requestIdleCallback when available,
 * otherwise fall back to a short setTimeout.
 * @param {IdleRequestCallback | Function} callback
 * @returns {number}
 */
function scheduleIdleTask(callback) {
    if (typeof window.requestIdleCallback === 'function') {
        return window.requestIdleCallback(callback, { timeout: PREFETCH_IDLE_TIMEOUT_MS });
    }
    return window.setTimeout(callback, PREFETCH_FALLBACK_DELAY_MS);
}

/**
 * Prefetch all featured images for a project, scoped to the current theme.
 *
 * @param {string} projectId - The data-card identifier for the project.
 */
function prefetchProjectImages(projectId) {
    if (
        typeof PROJECT_FEATURED_IMAGES === 'undefined' ||
        !Array.isArray(PROJECT_FEATURED_IMAGES[projectId])
    ) {
        return;
    }

    const theme = getActiveTheme();
    const cacheKey = `${projectId}:${theme}`;

    if (preloadedProjects.has(cacheKey)) {
        return;
    }

    const images = PROJECT_FEATURED_IMAGES[projectId];
    const fragment = document.createDocumentFragment();

    images.forEach((imageName) => {
        fragment.appendChild(createPrefetchLink(buildImageUrl(imageName, theme)));
    });

    scheduleIdleTask(() => {
        if (document.head) {
            document.head.appendChild(fragment);
        }
        preloadedProjects.add(cacheKey);
    });
}

/**
 * Initialize hover-intent preloading on project cards within the #projects
 * section. Uses event delegation to keep listener counts low and ignores
 * pointer movements between a card and its child elements.
 */
function initHoverPreloading() {
    const projectsSection = document.getElementById('projects');
    if (!projectsSection || projectsSection.dataset.hoverPreloadInitialized) {
        return;
    }

    projectsSection.dataset.hoverPreloadInitialized = 'true';

    /** @type {WeakMap<HTMLElement, number>} */
    const hoverTimers = new WeakMap();

    /**
     * Start the prefetch timer for a card.
     * @param {HTMLElement} card
     */
    const startPrefetch = (card) => {
        const projectCard = card.querySelector(CARD_SELECTOR);
        const projectId = projectCard?.dataset?.card;

        if (!projectId) {
            return;
        }

        hoverTimers.set(
            card,
            window.setTimeout(() => {
                prefetchProjectImages(projectId);
                hoverTimers.delete(card);
            }, HOVER_INTENT_DELAY_MS)
        );
    };

    /**
     * Cancel the prefetch timer for a card.
     * @param {HTMLElement} card
     */
    const cancelPrefetch = (card) => {
        const timer = hoverTimers.get(card);
        if (timer) {
            window.clearTimeout(timer);
            hoverTimers.delete(card);
        }
    };

    projectsSection.addEventListener(
        'mouseenter',
        (event) => {
            const card = event.target.closest(CARD_LINK_SELECTOR);
            if (!card) {
                return;
            }

            const related = event.relatedTarget;
            if (related && card.contains(related)) {
                return;
            }

            cancelPrefetch(card);
            startPrefetch(card);
        },
        true
    );

    projectsSection.addEventListener(
        'mouseleave',
        (event) => {
            const card = event.target.closest(CARD_LINK_SELECTOR);
            if (!card) {
                return;
            }

            const related = event.relatedTarget;
            if (related && card.contains(related)) {
                return;
            }

            cancelPrefetch(card);
        },
        true
    );
}