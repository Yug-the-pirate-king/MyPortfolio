/**
 * @fileoverview About section carousel with auto-rotation, drag support,
 *    and visibility-aware playback.
 *
 * Dependencies: components/carousel-base.js (provides CarouselDrag)
 */

(function (global) {
  'use strict';

  const DEFAULT_TOTAL_SLIDES = 4;
  const AUTO_ROTATE_INTERVAL_MS = 8000;
  const USER_INTERACTION_INTERVAL_MS = 12000;
  const INTERSECTION_THRESHOLD = 0.3;
  const SLIDE_TRANSITION = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

  /**
   * Internal state for the about carousel.
   *
   * @typedef {Object} CarouselState
   * @property {number} currentSlide
   * @property {number} totalSlides
   * @property {number|null} autoRotateInterval
   */
  const state = {
    currentSlide: 0,
    totalSlides: DEFAULT_TOTAL_SLIDES,
    autoRotateInterval: null
  };

  /**
   * @returns {HTMLElement|null} The carousel track element.
   */
  const getTrack = () => document.getElementById('aboutCarouselTrack');

  /**
   * @returns {HTMLElement|null} The about section element.
   */
  const getAboutSection = () => document.getElementById('about');

  /**
   * @returns {HTMLElement|null} The carousel container within the about section.
   */
  const getCarouselContainer = () => {
    const section = getAboutSection();
    return section
      ? section.querySelector('.carousel-container')
      : document.querySelector('.carousel-container');
  };

  /**
   * @returns {NodeListOf<HTMLElement>} The carousel indicator dots.
   */
  const getIndicators = () => {
    const container = getCarouselContainer();
    return container
      ? container.querySelectorAll('.indicator')
      : document.querySelectorAll('.indicator');
  };

  /**
   * Derive the total slide count from the DOM, falling back to a default.
   */
  function updateTotalSlides() {
    const track = getTrack();
    state.totalSlides = track && track.children.length
      ? track.children.length
      : DEFAULT_TOTAL_SLIDES;
  }

  /**
   * Stop the auto-rotation timer if it is running.
   */
  function stopAutoRotation() {
    if (state.autoRotateInterval) {
      clearInterval(state.autoRotateInterval);
      state.autoRotateInterval = null;
    }
  }

  /**
   * Start the auto-rotation timer if it is not already running.
   *
   * @param {number} [interval=AUTO_ROTATE_INTERVAL_MS] The rotation interval in ms.
   */
  function startAutoRotation(interval = AUTO_ROTATE_INTERVAL_MS) {
    if (state.autoRotateInterval) return;
    state.autoRotateInterval = setInterval(nextSlide, interval);
  }

  /**
   * Update indicator dots to reflect the active slide.
   *
   * @param {number} slideIndex The active slide index.
   */
  function updateIndicators(slideIndex) {
    getIndicators().forEach((indicator, index) => {
      indicator.classList.toggle('active', index === slideIndex);
    });
  }

  /**
   * Keep the drag controller in sync with programmatic slide changes.
   *
   * @param {number} slideIndex The current slide index.
   */
  function syncDragInstance(slideIndex) {
    if (
      global.aboutCarouselDrag &&
      typeof global.aboutCarouselDrag.updateCurrentSlide === 'function'
    ) {
      global.aboutCarouselDrag.updateCurrentSlide(slideIndex);
    }
  }

  /**
   * Move the carousel to a specific slide.
   *
   * @param {number} slideIndex The target slide index.
   * @param {boolean} [userTriggered=false] Whether the change was user-initiated.
   */
  function goToSlide(slideIndex, userTriggered = false) {
    state.currentSlide = slideIndex;

    const track = getTrack();
    if (track) {
      if (userTriggered) {
        track.style.transition = SLIDE_TRANSITION;
      }
      track.setAttribute('data-position', String(slideIndex));
    }

    updateIndicators(slideIndex);
    syncDragInstance(slideIndex);

    if (userTriggered) {
      stopAutoRotation();
      startAutoRotation(USER_INTERACTION_INTERVAL_MS);
    }
  }

  /**
   * Advance to the next slide, wrapping back to the start.
   */
  function nextSlide() {
    state.currentSlide = (state.currentSlide + 1) % state.totalSlides;
    goToSlide(state.currentSlide);
  }

  /**
   * Determine whether the carousel container is currently hovered.
   *
   * @param {HTMLElement|null} container
   * @returns {boolean}
   */
  function isHovered(container) {
    return container ? container.matches(':hover') : false;
  }

  /**
   * Determine whether the about section is in the viewport.
   *
   * @param {HTMLElement|null} section
   * @returns {boolean}
   */
  function isSectionInView(section) {
    if (!section) return false;
    const rect = section.getBoundingClientRect();
    return rect.top < global.innerHeight && rect.bottom > 0;
  }

  /**
   * Resume auto-rotation after a drag ends, but only when not hovering.
   *
   * @param {HTMLElement} container
   */
  function resumeAfterDrag(container) {
    setTimeout(() => {
      if (!isHovered(container) && !state.autoRotateInterval) {
        startAutoRotation(AUTO_ROTATE_INTERVAL_MS);
      }
    }, 100);
  }

  /**
   * Bind pointer and hover events that pause/resume auto-rotation.
   *
   * @param {HTMLElement} container
   */
  function bindPlaybackControls(container) {
    container.addEventListener('mouseenter', stopAutoRotation);
    container.addEventListener('mouseleave', () => startAutoRotation(AUTO_ROTATE_INTERVAL_MS));

    ['mousedown', 'touchstart'].forEach((eventType) => {
      container.addEventListener(eventType, stopAutoRotation);
    });

    container.addEventListener('mouseup', () => resumeAfterDrag(container));
    container.addEventListener('touchend', () => resumeAfterDrag(container));
  }

  /**
   * Initialize the drag controller for the carousel.
   *
   * @param {HTMLElement} container
   */
  function initDrag(container) {
    global.aboutCarouselDrag = new CarouselDrag(container, {
      goToSlide: (slideIndex) => goToSlide(slideIndex, true),
      threshold: 50,
      sensitivity: 1.0
    });
  }

  /**
   * Start or stop auto-rotation when the page becomes visible/hidden.
   *
   * @param {HTMLElement|null} section
   * @param {HTMLElement|null} container
   */
  function handleVisibilityChange(section, container) {
    if (document.hidden) {
      stopAutoRotation();
      return;
    }

    if (isSectionInView(section) && !isHovered(container)) {
      startAutoRotation(AUTO_ROTATE_INTERVAL_MS);
    }
  }

  /**
   * Observe section visibility and toggle auto-rotation accordingly.
   *
   * @param {HTMLElement} section
   */
  function observeSectionVisibility(section) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startAutoRotation(AUTO_ROTATE_INTERVAL_MS);
        } else {
          stopAutoRotation();
        }
      });
    }, { threshold: INTERSECTION_THRESHOLD });

    observer.observe(section);
  }

  /**
   * Initialize the about carousel, drag controls, and visibility observers.
   */
  function initCarousel() {
    updateTotalSlides();

    const container = getCarouselContainer();
    const section = getAboutSection();

    goToSlide(0);

    if (container) {
      initDrag(container);
      bindPlaybackControls(container);
    }

    document.addEventListener('visibilitychange', () => {
      handleVisibilityChange(section, container);
    });

    if (section) {
      observeSectionVisibility(section);
    }
  }

  // Expose public functions for backwards compatibility with the original API.
  global.goToSlide = goToSlide;
  global.nextSlide = nextSlide;
  global.initCarousel = initCarousel;
})(typeof window !== 'undefined' ? window : this);