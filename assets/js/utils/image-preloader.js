/**
 * Image Preloading System
 *
 * Preloads project images on hover for better UX
 *
 * Dependencies: core/config.js, core/theme-system.js
 * Exports: prefetchProjectImages(), initHoverPreloading()
 */

// Registry of project IDs whose images have already been preloaded.
const preloadedProjectIds = new Set();

/**
 * Retrieves and validates the list of image names for a project.
 * Returns an array of image names, or null if unavailable/invalid.
 */
function getProjectImageNames(projectId) {
    if (typeof PROJECT_FEATURED_IMAGES === 'undefined' || PROJECT_FEATURED_IMAGES === null) {
        console.warn('PROJECT_FEATURED_IMAGES is not defined. Cannot preload images.');
        return null;
    }

    const imageNames = PROJECT_FEATURED_IMAGES[projectId];

    if (!Array.isArray(imageNames) || imageNames.length === 0) {
        return null;
    }

    return imageNames;
}

/**
 * Creates and injects a <link rel="prefetch"> tag for a single image.
 */
function createImagePrefetchLink(imageName, theme) {
    if (typeof imageName !== 'string' || imageName.length === 0) {
        console.warn('Skipping invalid image name during prefetch.');
        return;
    }

    const linkElement = document.createElement('link');
    linkElement.rel = 'prefetch';
    linkElement.as = 'image';
    linkElement.href = `assets/images/work/${imageName}-${theme}.png`;

    document.head.appendChild(linkElement);
}

/**
 * Prefetches all images for a specific project using the active theme.
 * Each project is only preloaded once.
 */
function prefetchProjectImages(projectId) {
    // Validate input before doing any work.
    if (typeof projectId !== 'string' || projectId.length === 0) {
        console.warn('Invalid projectId provided to prefetchProjectImages.');
        return;
    }

    // Skip if this project has already been preloaded.
    if (preloadedProjectIds.has(projectId)) {
        return;
    }

    const imageNames = getProjectImageNames(projectId);
    if (!imageNames) {
        return;
    }

    // Resolve the active theme so we preload the correct image variant.
    const isDarkTheme = document.body.getAttribute('data-theme') === 'dark';
    const theme = isDarkTheme ? 'dark' : 'light';

    /**
     * Schedules work during browser idle time when available,
     * otherwise falls back to a short timeout to avoid blocking rendering.
     */
    function schedulePrefetch(callback) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(callback);
        } else {
            setTimeout(callback, 100);
        }
    }

    // Schedule prefetch injection for all project images.
    schedulePrefetch(() => {
        imageNames.forEach((imageName) => {
            createImagePrefetchLink(imageName, theme);
        });
    });

    // Mark project as preloaded immediately to prevent duplicate scheduling.
    preloadedProjectIds.add(projectId);
}

/**
 * Initializes hover-intent preloading for project card links.
 * Only runs on pages containing a projects section.
 */
function initHoverPreloading() {
    const projectsSection = document.getElementById('projects');

    // Bail out if this is not the index/projects page.
    if (!projectsSection) {
        return;
    }

    const projectCardLinks = document.querySelectorAll('.project-card-link');
    const HOVER_INTENT_DELAY_MS = 200;

    projectCardLinks.forEach((cardLink) => {
        let hoverTimeoutId = null;

        // Resolve the project ID from the nested project card element.
        const projectCard = cardLink.querySelector('.project-card');
        const projectId = projectCard?.getAttribute('data-card');

        // Skip cards without a valid project ID.
        if (!projectId) {
            return;
        }

        // Start preloading after the user hovers long enough to show intent.
        cardLink.addEventListener('mouseenter', () => {
            hoverTimeoutId = setTimeout(() => {
                prefetchProjectImages(projectId);
            }, HOVER_INTENT_DELAY_MS);
        });

        // Cancel the pending preload if the user leaves the card quickly.
        cardLink.addEventListener('mouseleave', () => {
            if (hoverTimeoutId !== null) {
                clearTimeout(hoverTimeoutId);
                hoverTimeoutId = null;
            }
        });
    });
}