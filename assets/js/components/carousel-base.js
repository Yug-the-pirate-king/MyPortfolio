/**
 * Universal Carousel Drag/Swipe Functionality
 *
 * Provides drag and swipe interactions for all carousel types.
 *
 * Dependencies: None
 * Exports: CarouselDrag class
 */

class CarouselDrag {
    /**
     * Creates a new CarouselDrag instance.
     *
     * @param {HTMLElement} container - The carousel container element.
     * @param {Object} [options={}] - Configuration options.
     * @param {number} [options.threshold=30] - Minimum drag distance (px) to change slides.
     * @param {number} [options.sensitivity=0.3] - Drag sensitivity multiplier (0-1).
     * @param {Function} [options.goToSlide] - Custom slide navigation callback.
     */
    constructor(container, options = {}) {
        // Validate the container argument to avoid unsafe DOM access.
        if (!(container instanceof HTMLElement)) {
            throw new TypeError('CarouselDrag: container must be a valid HTMLElement.');
        }

        // Validate that options is a plain object.
        if (options === null || typeof options !== 'object') {
            throw new TypeError('CarouselDrag: options must be a plain object.');
        }

        this.container = container;
        this.track = container.querySelector('.carousel-track, .featured-image-carousel-track');
        this.slides = this.track ? Array.from(this.track.children) : [];

        // Parse and normalise the starting slide index.
        let startPosition = 0;
        if (this.track) {
            const rawPosition = this.track.getAttribute('data-position');
            const parsedPosition = Number.parseInt(rawPosition, 10);
            if (Number.isFinite(parsedPosition)) {
                startPosition = parsedPosition;
            }
        }

        this.totalSlides = this.slides.length;
        this.currentSlide = this.totalSlides > 0
            ? this._clampSlideIndex(startPosition)
            : 0;

        // Configuration with input sanitisation.
        this.threshold = this._toNonNegativeFiniteNumber(options.threshold, 30);
        this.sensitivity = this._clampFiniteNumber(options.sensitivity, 0, 1, 0.3);

        // Validate the optional navigation callback.
        if (options.goToSlide != null && typeof options.goToSlide !== 'function') {
            throw new TypeError('CarouselDrag: options.goToSlide must be a function.');
        }
        this.goToSlide = options.goToSlide || this.defaultGoToSlide.bind(this);

        // Drag state.
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.dragDistance = 0;
        this.startTime = 0;

        // Transition guard to prevent drag during slide changes.
        this.isTransitioning = false;
        this.lastTransitionTime = 0;

        // Animation constants.
        this.transitionDuration = 500;
        this.transitionTiming = 'cubic-bezier(0.4, 0, 0.2, 1)';

        // Store bound event handlers so they can be cleanly removed later.
        this._handlers = {
            start: this.handleStart.bind(this),
            move: this.handleMove.bind(this),
            end: this.handleEnd.bind(this),
            dragStart: (e) => e.preventDefault(),
        };

        this.init();
    }

    init() {
        if (!this.track) {
            // Nothing to attach to; warn for easier debugging but stay graceful.
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('CarouselDrag: no carousel track found inside container.');
            }
            return;
        }

        // Touch events.
        this.container.addEventListener('touchstart', this._handlers.start, { passive: false });
        this.container.addEventListener('touchmove', this._handlers.move, { passive: false });
        this.container.addEventListener('touchend', this._handlers.end, { passive: false });

        // Mouse events for desktop drag support.
        this.container.addEventListener('mousedown', this._handlers.start, { passive: false });
        this.container.addEventListener('mousemove', this._handlers.move, { passive: false });
        this.container.addEventListener('mouseup', this._handlers.end, { passive: false });
        this.container.addEventListener('mouseleave', this._handlers.end, { passive: false });

        // Prevent native image dragging inside the carousel.
        this.container.addEventListener('dragstart', this._handlers.dragStart);

        // Disable text selection and allow vertical scrolling by default.
        this.container.style.userSelect = 'none';
        this.container.style.touchAction = 'pan-y';
    }

    /**
     * Extracts the horizontal client coordinate from a mouse or touch event.
     *
     * @param {MouseEvent|TouchEvent} e
     * @returns {number}
     */
    getEventX(e) {
        if (e.touches && e.touches.length > 0) {
            return e.touches[0].clientX;
        }

        // touchend uses changedTouches when touches is empty.
        if (e.changedTouches && e.changedTouches.length > 0) {
            return e.changedTouches[0].clientX;
        }

        return e.clientX;
    }

    handleStart(e) {
        // Ignore multi-touch gestures and non-primary mouse buttons.
        if (e.touches && e.touches.length > 1) return;
        if (e.type === 'mousedown' && e.button !== 0) return;

        // Guard against starting a drag while a slide transition is running.
        const timeSinceLastTransition = Date.now() - this.lastTransitionTime;
        if (this.isTransitioning || timeSinceLastTransition < 100) {
            return;
        }

        this.isDragging = true;
        this.startX = this.getEventX(e);
        this.currentX = this.startX;
        this.startTime = Date.now();

        // Disable CSS transitions while the user is dragging.
        if (this.track) {
            this.track.style.transition = 'none';
        }

        // Prevent default mouse behaviour.
        if (e.type === 'mousedown') {
            e.preventDefault();
        }
    }

    handleMove(e) {
        if (!this.isDragging || !this.track) return;

        this.currentX = this.getEventX(e);
        this.dragDistance = this.currentX - this.startX;

        const slideWidth = this.container.offsetWidth;
        const baseTransform = -this.currentSlide * slideWidth;
        const dragOffset = this.dragDistance * this.sensitivity;

        // Apply a transform that follows the finger/cursor.
        this.track.style.transform = `translateX(${baseTransform + dragOffset}px)`;

        // Once a horizontal drag is recognised, prevent the page from scrolling vertically.
        if (Math.abs(this.dragDistance) > 10) {
            e.preventDefault();
        }
    }

    handleEnd() {
        if (!this.isDragging) return;

        this.isDragging = false;

        if (!this.track) return;

        // Calculate drag velocity and direction.
        const dragTime = Math.max(Date.now() - this.startTime, 1);
        const velocity = Math.abs(this.dragDistance) / dragTime;
        const dragDirection = this.dragDistance > 0 ? 'right' : 'left';

        // Determine if we should change slides.
        const shouldChangeSlide = Math.abs(this.dragDistance) > this.threshold || velocity > 0.5;

        if (shouldChangeSlide) {
            if (dragDirection === 'left') {
                // Dragged left, go to next slide.
                this.nextSlide();
            } else {
                // Dragged right, go to previous slide.
                this.prevSlide();
            }
        } else {
            // Snap back to the current slide.
            this._animateToSlide(this.currentSlide);
        }

        // Reset drag distance after the gesture is processed.
        this.dragDistance = 0;
    }

    /**
     * Moves to the next slide, wrapping around to the first slide when at the end.
     */
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this._animateToSlide(nextIndex);
    }

    /**
     * Moves to the previous slide, wrapping around to the last slide when at the start.
     */
    prevSlide() {
        const prevIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this._animateToSlide(prevIndex);
    }

    /**
     * Animates the carousel to a specific slide index and updates state.
     *
     * @param {number} slideIndex - The target slide index.
     */
    _animateToSlide(slideIndex) {
        if (!this.track) return;

        // Mark transition as starting.
        this.isTransitioning = true;
        this.lastTransitionTime = Date.now();

        // Clamp the target index to the available slide range.
        this.currentSlide = this._clampSlideIndex(slideIndex);

        // Clear any inline drag transform and restore CSS-based positioning.
        this.track.style.transform = '';
        this.track.style.transition = `transform ${this.transitionDuration}ms ${this.transitionTiming}`;

        // Let the configured navigator update the visual slide state.
        this.goToSlide(this.currentSlide);

        // Clear the transition guard once the animation finishes.
        this._clearTransitionGuard(this.transitionDuration);
    }

    /**
     * Resets the transition guard after the specified animation duration.
     *
     * @param {number} duration - Milliseconds to wait before re-enabling dragging.
     */
    _clearTransitionGuard(duration) {
        window.setTimeout(() => {
            this.isTransitioning = false;
        }, duration);
    }

    /**
     * Default slide navigation implementation.
     *
     * @param {number} slideIndex - The slide index to record as active.
     */
    defaultGoToSlide(slideIndex) {
        this.currentSlide = this._clampSlideIndex(slideIndex);
        if (this.track) {
            this.track.setAttribute('data-position', String(this.currentSlide));
        }
    }

    /**
     * Updates the tracked current slide index from an external source.
     *
     * @param {number} slideIndex
     */
    updateCurrentSlide(slideIndex) {
        const index = Number(slideIndex);
        if (!Number.isFinite(index)) {
            throw new TypeError('CarouselDrag.updateCurrentSlide: slideIndex must be a finite number.');
        }
        this.currentSlide = this._clampSlideIndex(index);
    }

    /**
     * Removes all event listeners and resets inline styles added by this instance.
     */
    destroy() {
        if (!this.container) return;

        this.container.removeEventListener('touchstart', this._handlers.start, { passive: false });
        this.container.removeEventListener('touchmove', this._handlers.move, { passive: false });
        this.container.removeEventListener('touchend', this._handlers.end, { passive: false });
        this.container.removeEventListener('mousedown', this._handlers.start, { passive: false });
        this.container.removeEventListener('mousemove', this._handlers.move, { passive: false });
        this.container.removeEventListener('mouseup', this._handlers.end, { passive: false });
        this.container.removeEventListener('mouseleave', this._handlers.end, { passive: false });
        this.container.removeEventListener('dragstart', this._handlers.dragStart);

        this.container.style.userSelect = '';
        this.container.style.touchAction = '';

        if (this.track) {
            this.track.style.transition = '';
            this.track.style.transform = '';
        }

        this.isDragging = false;
        this.isTransitioning = false;
    }

    // ---------------------------------------------------------------------------
    // Helper utilities
    // ---------------------------------------------------------------------------

    /**
     * Clamps a slide index to the valid range [0, totalSlides - 1].
     * Always returns 0 when no slides are present.
     *
     * @param {number} index
     * @returns {number}
     */
    _clampSlideIndex(index) {
        if (this.totalSlides === 0) return 0;
        const value = Math.trunc(index);
        return Math.max(0, Math.min(value, this.totalSlides - 1));
    }

    /**
     * Converts a value to a finite, non-negative number, falling back to a default.
     *
     * @param {*} value
     * @param {number} defaultValue
     * @returns {number}
     */
    _toNonNegativeFiniteNumber(value, defaultValue) {
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0) {
            return defaultValue;
        }
        return number;
    }

    /**
     * Converts a value to a finite number and clamps it between min and max.
     *
     * @param {*} value
     * @param {number} min
     * @param {number} max
     * @param {number} defaultValue
     * @returns {number}
     */
    _clampFiniteNumber(value, min, max, defaultValue) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return defaultValue;
        }
        return Math.max(min, Math.min(number, max));
    }
}