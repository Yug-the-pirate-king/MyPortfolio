/**
 * About Carousel System
 *
 * Auto-rotating about section carousel.
 * Dependencies: components/carousel-base.js (CarouselDrag)
 */

'use strict';

// --- Configuration constants ---
const AUTO_ROTATE_DEFAULT_MS = 8000;
const AUTO_ROTATE_USER_PAUSE_MS = 12000;
const INTERSECTION_THRESHOLD = 0.3;
const SLIDE_COUNT = 4;
const HOVER_CHECK_DELAY_MS = 100;

// --- DOM selectors ---
const SELECTORS = Object.freeze({
  aboutSection: '#about',
  carouselContainer: '.carousel-container',
  track: '#aboutCarouselTrack',
  indicator: '.indicator',
});

// --- Module state ---
let currentSlideIndex = 0;
let rotationTimerId = null;

// Cached DOM references (queried once during init).
let aboutSection = null;
let carouselContainer = null;
let carouselTrack = null;
let indicators = [];

// Reference to the drag controller provided by carousel-base.js.
let dragController = null;

/**
 * Ensures a slide index is a safe, finite integer within the valid range.
 * Invalid values are wrapped into the [0, SLIDE_COUNT) interval.
 */
function normalizeSlideIndex(rawIndex) {
  const index = Number(rawIndex);

  if (!Number.isFinite(index)) {
    return 0;
  }

  // Wrap negative or out-of-range values safely.
  return ((Math.round(index) % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;
}

/**
 * Starts the auto-rotation timer if one is not already running.
 */
function startAutoRotate(interval = AUTO_ROTATE_DEFAULT_MS) {
  if (rotationTimerId) {
    return;
  }

  rotationTimerId = setInterval(rotateToNextSlide, interval);
}

/**
 * Stops the auto-rotation timer and clears its reference.
 */
function stopAutoRotate() {
  if (!rotationTimerId) {
    return;
  }

  clearInterval(rotationTimerId);
  rotationTimerId = null;
}

/**
 * Checks whether the about section is currently inside the viewport.
 */
function isAboutSectionInView() {
  if (!aboutSection) {
    return false;
  }

  const rect = aboutSection.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

/**
 * Updates the active state of all indicator dots.
 */
function updateIndicators(activeIndex) {
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle('active', index === activeIndex);
  });
}

/**
 * Activates a specific slide, updates indicators, and informs the drag controller.
 * When triggered by a user interaction, auto-rotation is paused briefly.
 */
function activateSlide(rawIndex, isUserTriggered = false) {
  const slideIndex = normalizeSlideIndex(rawIndex);

  currentSlideIndex = slideIndex;

  if (carouselTrack) {
    if (isUserTriggered) {
      carouselTrack.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    carouselTrack.setAttribute('data-position', String(slideIndex));
  }

  updateIndicators(slideIndex);

  // Notify the drag controller of the programmatic change, if available.
  dragController?.updateCurrentSlide?.(slideIndex);

  // Reset auto-rotation timing after a manual change to give the user time to read.
  if (isUserTriggered) {
    stopAutoRotate();
    startAutoRotate(AUTO_ROTATE_USER_PAUSE_MS);
  }
}

/**
 * Advances to the next slide in the loop.
 */
function rotateToNextSlide() {
  activateSlide(currentSlideIndex + 1);
}

/**
 * Resumes auto-rotation shortly after a pointer interaction ends,
 * but only if the user is no longer hovering over the carousel.
 */
function resumeAutoRotateIfNotHovering() {
  setTimeout(() => {
    if (carouselContainer && !carouselContainer.matches(':hover')) {
      startAutoRotate();
    }
  }, HOVER_CHECK_DELAY_MS);
}

/**
 * Initializes the about carousel, binds event listeners, and starts auto-rotation
 * when the section becomes visible.
 */
function initCarousel() {
  // Cache DOM references once to avoid repeated querySelector calls.
  aboutSection = document.querySelector(SELECTORS.aboutSection);
  carouselContainer = document.querySelector(SELECTORS.carouselContainer);
  carouselTrack = document.querySelector(SELECTORS.track);
  indicators = Array.from(document.querySelectorAll(SELECTORS.indicator));

  // Activate the first slide immediately.
  activateSlide(0);

  if (carouselContainer) {
    // Wire up drag/swipe support from the shared carousel base component.
    dragController = new CarouselDrag(carouselContainer, {
      goToSlide: (slideIndex) => activateSlide(slideIndex, true),
      threshold: 50,
      sensitivity: 1.0,
    });

    // Expose the controller for external callers (e.g. tests or other modules).
    window.aboutCarouselDrag = dragController;

    // Pause rotation when the user interacts with or hovers over the carousel.
    carouselContainer.addEventListener('mouseenter', stopAutoRotate);
    carouselContainer.addEventListener('mouseleave', startAutoRotate);

    carouselContainer.addEventListener('mousedown', stopAutoRotate);
    carouselContainer.addEventListener('touchstart', stopAutoRotate);

    // Resume rotation after a drag/swipe interaction if the cursor has left.
    carouselContainer.addEventListener('mouseup', resumeAutoRotateIfNotHovering);
    carouselContainer.addEventListener('touchend', resumeAutoRotateIfNotHovering);
  }

  // Pause when the page is backgrounded; resume only when visible, in view, and not hovered.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoRotate();
      return;
    }

    const isHovering = carouselContainer ? carouselContainer.matches(':hover') : false;

    if (isAboutSectionInView() && !isHovering) {
      startAutoRotate();
    }
  });

  // Use IntersectionObserver to start rotation only while the section is meaningfully visible.
  if (aboutSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAutoRotate();
          } else {
            stopAutoRotate();
          }
        });
      },
      { threshold: INTERSECTION_THRESHOLD }
    );

    observer.observe(aboutSection);
  }
}