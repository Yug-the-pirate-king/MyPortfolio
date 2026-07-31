'use strict';

/* global CarouselDrag, goToFeaturedSlide */

/**
 * Project Detail Carousel System
 *
 * Project page carousel functionality.
 *
 * Dependencies: components/carousel-base.js
 * Relies on global CarouselDrag and goToFeaturedSlide.
 */

/** @constant {string} localStorage key tracking gesture hint usage. */
const GESTURE_HINT_COUNT_KEY = 'gestureHintUseCount';

/** @constant {number} Delay before the drag hint is shown (ms). */
const DRAG_HINT_DELAY = 1000;

/** @constant {number} Total time the drag hint remains visible (ms). */
const DRAG_HINT_DURATION = 6500;

/** @constant {number} Fade-out transition duration for the drag hint (ms). */
const DRAG_HINT_FADEOUT = 300;


/**
 * Navigate to a specific slide in the project detail carousel.
 *
 * @param {number} slideIndex - The zero-based target slide index.
 * @param {boolean} [animate=false] - Whether to animate the transition.
 */
function goToProjectSlide(slideIndex, animate = false) {
    const track = document.getElementById('projectCarouselTrack');

    if (track) {
        track.style.transition = animate
            ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            : '';
        track.setAttribute('data-position', slideIndex);
    }

    document.querySelectorAll('.project-carousel .indicator').forEach((indicator, index) => {
        indicator.classList.toggle('active', index === slideIndex);
    });

    if (window.projectCarouselDrag) {
        window.projectCarouselDrag.updateCurrentSlide(slideIndex);
    }
}


/**
 * Initialize all project and featured page carousels present in the document.
 *
 * @see goToProjectSlide
 * @see goToFeaturedSlide
 * @see CarouselDrag
 */
function initProjectCarousels() {
    const projectCarouselContainer = document.getElementById('projectCarouselContainer');
    const projectCarouselTrack = document.getElementById('projectCarouselTrack');

    if (projectCarouselTrack) {
        goToProjectSlide(0);

        if (projectCarouselContainer) {
            window.projectCarouselDrag = new CarouselDrag(projectCarouselContainer, {
                goToSlide: (slideIndex) => goToProjectSlide(slideIndex, true),
                threshold: 50,
                sensitivity: 1.0
            });
        }
    }

    const featuredCarouselContainer = document.getElementById('featuredCarouselContainer');
    const featuredCarouselTrack = document.getElementById('featuredCarouselTrack');

    if (featuredCarouselTrack) {
        goToFeaturedSlide(0);

        if (featuredCarouselContainer) {
            window.featuredCarouselDrag = new CarouselDrag(featuredCarouselContainer, {
                goToSlide: (slideIndex) => goToFeaturedSlide(slideIndex, true),
                threshold: 50,
                sensitivity: 1.0
            });

            initDragHint(featuredCarouselContainer);
        }
    }
}


/**
 * Show a one-time "Drag to explore" hint for users who haven't yet used the
 * carousel gesture. The hint is dismissed automatically after its animation
 * completes, or immediately once the user begins interacting with the carousel.
 *
 * @param {HTMLElement} carouselContainer - The carousel element to attach the hint to.
 */
function initDragHint(carouselContainer) {
    if (!carouselContainer) {
        return;
    }

    const gestureUseCount = parseInt(localStorage.getItem(GESTURE_HINT_COUNT_KEY) || '0', 10);

    if (gestureUseCount >= 3) {
        return;
    }

    const dragHint = document.createElement('div');
    dragHint.className = 'drag-hint';

    const dragCursor = document.createElement('div');
    dragCursor.className = 'drag-hint-cursor';

    const dragText = document.createElement('div');
    dragText.className = 'drag-hint-text';
    dragText.textContent = 'Drag to explore';

    dragHint.append(dragCursor, dragText);
    carouselContainer.appendChild(dragHint);

    const showTimeoutId = setTimeout(() => {
        carouselContainer.classList.add('show-drag-hint');
    }, DRAG_HINT_DELAY);

    const autoHideTimeoutId = setTimeout(() => {
        carouselContainer.classList.remove('show-drag-hint');
        setTimeout(() => dragHint.remove(), DRAG_HINT_FADEOUT);
    }, DRAG_HINT_DURATION);

    let hasInteracted = false;

    const hideOnInteraction = () => {
        if (hasInteracted) {
            return;
        }
        hasInteracted = true;

        clearTimeout(showTimeoutId);
        clearTimeout(autoHideTimeoutId);

        carouselContainer.classList.remove('show-drag-hint');
        setTimeout(() => dragHint.remove(), DRAG_HINT_FADEOUT);

        const currentCount = parseInt(localStorage.getItem(GESTURE_HINT_COUNT_KEY) || '0', 10);
        localStorage.setItem(GESTURE_HINT_COUNT_KEY, String(currentCount + 1));
    };

    carouselContainer.addEventListener('mousedown', hideOnInteraction, { once: true });
    carouselContainer.addEventListener('touchstart', hideOnInteraction, { once: true });

    const indicators = carouselContainer.parentNode.querySelectorAll('.featured-carousel-indicators .indicator');
    indicators.forEach((indicator) => {
        indicator.addEventListener('click', hideOnInteraction, { once: true });
    });
}


/**
 * Reset the gesture hint counter so hints are shown again, then reload the page.
 */
function resetGestureHints() {
    localStorage.setItem(GESTURE_HINT_COUNT_KEY, '0');
    location.reload();
}


/**
 * Force the featured carousel drag hint to appear immediately.
 * Intended for debugging purposes only.
 */
function testDragHint() {
    const featuredCarouselContainer = document.getElementById('featuredCarouselContainer');

    if (featuredCarouselContainer) {
        localStorage.setItem(GESTURE_HINT_COUNT_KEY, '0');
        initDragHint(featuredCarouselContainer);
    }
}