/**
 * TextWaveEffect - A reusable text animation component that creates a wave effect
 * across text characters based on a slider/progress value.
 *
 * @class TextWaveEffect
 * @version 1.0.0
 * @author Jerimy Brown
 *
 * @example
 * const effect = new TextWaveEffect('#myTitle', {
 *   weightRange: [300, 700],
 *   scaleRange: [1.0, 1.5],
 *   onChange: (value) => console.log('Wave position:', value)
 * });
 *
 * // Update wave position (0-100)
 * effect.setValue(50);
 */

class TextWaveEffect {
    /**
     * Default configuration options
     * @static
     */
    static defaultConfig = {
        weightRange: [300, 700],
        scaleRange: [1.0, 1.5],
        spacingRange: [0.02, 0.15],
        waveWidth: 11,
        deadZonePercent: 20,
        transitionDuration: 0.1,
        transitionEasing: 'linear',
        transformOrigin: '50% 87%',
        baseLetterSpacing: '0.02em',
        spaceWidth: '0.3em',
        onInit: null,
        onChange: null,
        onReset: null,
        onDestroy: null
    };

    /**
     * Clamp a numeric value between a min and max
     * @private
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Linearly interpolate between two values by a factor t
     * @private
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Create a new TextWaveEffect instance
     * @param {string|HTMLElement} target - CSS selector or DOM element
     * @param {Object} config - Configuration options
     */
    constructor(target, config = {}) {
        this.element = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (!this.element) {
            throw new Error(`TextWaveEffect: Target element not found: ${target}`);
        }

        this.config = { ...TextWaveEffect.defaultConfig, ...config };
        this.letterSpans = [];
        this.currentValue = 0;
        this.previousValue = 0;
        this.originalText = this.element.textContent;
        this.originalHTML = this.element.innerHTML;
        this.isDestroyed = false;

        this.init();
    }

    /**
     * Initialize the effect
     * @private
     */
    init() {
        this.splitTextIntoSpans();
        this.applyBaseStyles();
        this._invokeCallback('onInit', this);
    }

    /**
     * Ensure the instance has not been destroyed
     * @private
     */
    _ensureActive(action) {
        if (this.isDestroyed) {
            console.warn(`TextWaveEffect: Cannot ${action} on destroyed instance`);
            return false;
        }
        return true;
    }

    /**
     * Safely invoke a config callback by name
     * @private
     */
    _invokeCallback(name, ...args) {
        const callback = this.config[name];
        if (typeof callback === 'function') {
            callback(...args);
        }
    }

    /**
     * Build a CSS transition string for the given properties
     * @private
     */
    _buildTransition(properties) {
        return properties
            .map((property) => `${property} ${this.config.transitionDuration}s ${this.config.transitionEasing}`)
            .join(', ');
    }

    /**
     * Apply visual styles based on a 0-1 wave influence
     * @private
     */
    _applyInfluence(span, influence) {
        const [minWeight, maxWeight] = this.config.weightRange;
        const [minScale, maxScale] = this.config.scaleRange;
        const [minSpacing, maxSpacing] = this.config.spacingRange;

        const weight = TextWaveEffect.lerp(minWeight, maxWeight, influence);
        const scale = TextWaveEffect.lerp(minScale, maxScale, influence);
        const spacing = TextWaveEffect.lerp(minSpacing, maxSpacing, influence);

        span.style.fontWeight = weight.toFixed(0);
        span.style.transform = `scale(${scale.toFixed(3)})`;
        span.style.letterSpacing = `${spacing.toFixed(3)}em`;
    }

    /**
     * Create a span for a single text character
     * @private
     */
    _createLetterSpan(char) {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.verticalAlign = 'baseline';
        span.style.lineHeight = '1';
        span.style.transition = this._buildTransition([
            'font-weight',
            'transform',
            'letter-spacing'
        ]);
        span.style.transformOrigin = this.config.transformOrigin;
        span.style.fontWeight = this.config.weightRange[0];
        span.style.letterSpacing = this.config.baseLetterSpacing;

        if (char === ' ') {
            span.style.width = this.config.spaceWidth;
        }

        return span;
    }

    /**
     * Split text into individual letter spans
     * @private
     */
    splitTextIntoSpans() {
        const text = this.originalText;
        this.element.innerHTML = '';
        this.letterSpans = [];

        for (let i = 0; i < text.length; i++) {
            const span = this._createLetterSpan(text[i]);
            this.element.appendChild(span);
            this.letterSpans.push(span);
        }
    }

    /**
     * Apply base styles to letter spans
     * @private
     */
    applyBaseStyles() {
        this.letterSpans.forEach((span) => this._applyInfluence(span, 0));
    }

    /**
     * Set the wave position (0-100)
     * @param {number} value - Position value between 0 and 100
     * @public
     */
    setValue(value) {
        if (!this._ensureActive('set value')) return;

        value = TextWaveEffect.clamp(parseFloat(value), 0, 100);

        this.previousValue = this.currentValue;
        this.currentValue = value;

        this.updateWave(value);
        this._invokeCallback('onChange', value, this);
    }

    /**
     * Update the wave effect based on current value
     * @param {number} sliderValue - Current slider value (0-100)
     * @private
     */
    updateWave(sliderValue) {
        const totalLetters = this.letterSpans.length;
        const deadZone = this.config.deadZonePercent;
        const activeRange = 100 - (deadZone * 2);
        const minPath = Math.min(this.previousValue, sliderValue);
        const maxPath = Math.max(this.previousValue, sliderValue);

        this.letterSpans.forEach((span, index) => {
            const letterPosition = deadZone + (index / (totalLetters - 1)) * activeRange;
            const distance = Math.abs(letterPosition - sliderValue);
            const isInPath = letterPosition >= minPath && letterPosition <= maxPath;

            let influence = 0;
            if (distance < this.config.waveWidth || isInPath) {
                const radians = (distance / this.config.waveWidth) * Math.PI;
                influence = (Math.cos(radians) + 1) / 2;
            }

            this._applyInfluence(span, influence);
        });
    }

    /**
     * Reset the effect to initial state
     * @public
     */
    reset() {
        if (!this._ensureActive('reset')) return;

        this.currentValue = 0;
        this.previousValue = 0;
        this.applyBaseStyles();
        this._invokeCallback('onReset', this);
    }

    /**
     * Update configuration options
     * @param {Object} newConfig - New configuration options to merge
     * @public
     */
    updateConfig(newConfig) {
        if (!this._ensureActive('update config')) return;

        this.config = { ...this.config, ...newConfig };
        this.applyBaseStyles();

        if (this.currentValue > 0) {
            this.updateWave(this.currentValue);
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     * @public
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Get current value
     * @returns {number} Current wave position (0-100)
     * @public
     */
    getValue() {
        return this.currentValue;
    }

    /**
     * Get original text
     * @returns {string} Original text content
     * @public
     */
    getOriginalText() {
        return this.originalText;
    }

    /**
     * Restore original HTML and destroy the effect
     * @public
     */
    destroy() {
        if (this.isDestroyed) {
            console.warn('TextWaveEffect: Instance already destroyed');
            return;
        }

        this._invokeCallback('onDestroy', this);
        this.element.innerHTML = this.originalHTML;
        this.letterSpans = [];
        this.isDestroyed = true;
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextWaveEffect;
}