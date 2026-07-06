// Robust Zernio DG Carousels - Production-ready with error handling
class RobustCarousel {
    constructor(options = {}) {
        // Validate required DOM elements exist
        this.container = document.querySelector(options.container || '.carousel');
        if (!this.container) {
            throw new Error(`Carousel container not found: ${options.container || '.carousel'}`);
        }

        this.slides = this.container.querySelectorAll('.slide');
        if (this.slides.length === 0) {
            throw new Error('No slides found in carousel container');
        }

        // Validate parent element exists for indicators/progress
        if (!this.container.parentElement) {
            throw new Error('Carousel container must have a parent element for indicators and progress bar');
        }

        this.currentSlide = 0;
        this.totalSlides = this.slides.length;

        // Configuration with validation
        this.config = this._validateConfig({
            autoPlay: options.autoPlay !== false,
            autoPlayDelay: options.autoPlayDelay || 4000,
            showIndicators: options.showIndicators !== false,
            showProgress: options.showProgress !== false,
            swipeEnabled: options.swipeEnabled !== false,
            swipeThreshold: options.swipeThreshold || 50,
            ...options
        });

        // Find control buttons (optional)
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');

        // State tracking
        this.isPlaying = this.config.autoPlay;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.autoPlayInterval = null;
        this.indicators = null;
        this.progressFill = null;

        // Event handler bindings (for proper cleanup)
        this.boundHandlers = {
            keydown: (e) => this._handleKeydown(e),
            mouseenter: () => this.pauseAutoPlay(),
            mouseleave: () => this.resumeAutoPlay(),
            touchstart: (e) => this._handleTouchStart(e),
            touchend: (e) => this._handleTouchEnd(e),
            resize: () => this._handleResize()
        };

        this.init();
    }

    _validateConfig(config) {
        if (typeof config.autoPlayDelay !== 'number' || config.autoPlayDelay < 100) {
            throw new Error('autoPlayDelay must be a number >= 100ms');
        }
        if (typeof config.swipeThreshold !== 'number' || config.swipeThreshold < 10 || config.swipeThreshold > 200) {
            throw new Error('swipeThreshold must be between 10 and 200 pixels');
        }
        return config;
    }

    init() {
        try {
            this._setupEventListeners();

            if (this.config.showIndicators) this._createIndicators();
            if (this.config.showProgress) this._createProgressBar();

            // Initialize first slide
            this.showSlide(0);
            this._updateAccessibility();

            if (this.config.autoPlay) this.startAutoPlay();

            return true; // Success indicator
        } catch (error) {
            console.error('Carousel initialization failed:', error);
            throw error;
        }
    }

    _setupEventListeners() {
        // Button controls (optional)
        this.prevBtn?.addEventListener('click', () => this.previousSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());

        // Global event listeners
        document.addEventListener('keydown', this.boundHandlers.keydown);
        this.container.addEventListener('mouseenter', this.boundHandlers.mouseenter);
        this.container.addEventListener('mouseleave', this.boundHandlers.mouseleave);

        // Touch events (conditional)
        if (this.config.swipeEnabled) {
            this.container.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: true });
            this.container.addEventListener('touchend', this.boundHandlers.touchend, { passive: true });
        }

        // Window resize
        window.addEventListener('resize', this.boundHandlers.resize);
    }

    _createIndicators() {
        const indicatorContainer = document.createElement('div');
        indicatorContainer.className = 'carousel-indicators';

        for (let i = 0; i < this.totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'indicator';
            indicator.type = 'button';
            indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);
            indicator.addEventListener('click', () => this.goToSlide(i));
            indicatorContainer.appendChild(indicator);
        }

        this.container.parentElement.appendChild(indicatorContainer);
        this.indicators = indicatorContainer.querySelectorAll('.indicator');
    }

    _createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'carousel-progress';
        progressBar.innerHTML = '<div class="progress-fill"></div>';

        this.container.parentElement.appendChild(progressBar);
        this.progressFill = progressBar.querySelector('.progress-fill');
    }

    showSlide(index) {
        // Validate index
        if (typeof index !== 'number' || index < 0 || index >= this.totalSlides) {
            console.warn(`Invalid slide index: ${index}. Using current slide.`);
            return false;
        }

        try {
            // Update slide visibility
            this.slides.forEach((slide, i) => {
                const isActive = i === index;
                slide.classList.toggle('active', isActive);
                slide.setAttribute('aria-hidden', !isActive);
            });

            // Update indicators
            if (this.indicators) {
                this.indicators.forEach((indicator, i) => {
                    indicator.classList.toggle('active', i === index);
                });
            }

            this.currentSlide = index;
            this._updateProgress();
            this._announceSlideChange();

            return true; // Success
        } catch (error) {
            console.error('Error showing slide:', error);
            return false;
        }
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        return this.showSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        return this.showSlide(prevIndex);
    }

    goToSlide(index) {
        return this.showSlide(index);
    }

    startAutoPlay() {
        if (!this.config.autoPlay) return false;

        // Clear existing interval
        this.pauseAutoPlay();

        try {
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, this.config.autoPlayDelay);

            this.isPlaying = true;
            return true;
        } catch (error) {
            console.error('Error starting auto-play:', error);
            return false;
        }
    }

    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        return true;
    }

    resumeAutoPlay() {
        if (this.isPlaying && this.config.autoPlay) {
            return this.startAutoPlay();
        }
        return false;
    }

    toggleAutoPlay() {
        if (this.isPlaying) {
            this.pauseAutoPlay();
            this.isPlaying = false;
            return false; // Now paused
        } else {
            this.isPlaying = true;
            return this.startAutoPlay(); // Returns success state
        }
    }

    _updateProgress() {
        if (!this.progressFill) return false;

        try {
            const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
            this.progressFill.style.width = `${progress}%`;
            return true;
        } catch (error) {
            console.error('Error updating progress:', error);
            return false;
        }
    }

    _handleKeydown(e) {
        // Only handle if carousel is focused or no other input is focused
        if (document.activeElement && document.activeElement.tagName.match(/INPUT|TEXTAREA|SELECT/)) {
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
            case ' ':
                e.preventDefault();
                this.toggleAutoPlay();
                break;
        }
    }

    _handleTouchStart(e) {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        this.touchStartX = e.changedTouches[0].screenX;
    }

    _handleTouchEnd(e) {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        this.touchEndX = e.changedTouches[0].screenX;
        this._handleSwipe();
    }

    _handleSwipe() {
        const swipeDistance = this.touchStartX - this.touchEndX;
        const absDistance = Math.abs(swipeDistance);

        if (absDistance > this.config.swipeThreshold) {
            if (swipeDistance > 0) {
                this.nextSlide();
            } else {
                this.previousSlide();
            }
        }
    }

    _handleResize() {
        // Refresh current slide to handle dimension changes
        this.showSlide(this.currentSlide);
    }

    _updateAccessibility() {
        try {
            // Container accessibility
            this.container.setAttribute('role', 'region');
            this.container.setAttribute('aria-label', 'Image carousel');

            // Slide accessibility
            this.slides.forEach((slide, index) => {
                slide.setAttribute('role', 'group');
                slide.setAttribute('aria-roledescription', 'slide');
                slide.setAttribute('aria-label', `${index + 1} of ${this.totalSlides}`);
            });

            return true;
        } catch (error) {
            console.error('Error updating accessibility:', error);
            return false;
        }
    }

    _announceSlideChange() {
        try {
            const announcement = `Slide ${this.currentSlide + 1} of ${this.totalSlides}`;

            // Create or update live region
            let liveRegion = document.getElementById('carousel-live-region');
            if (!liveRegion) {
                liveRegion = document.createElement('div');
                liveRegion.id = 'carousel-live-region';
                liveRegion.setAttribute('aria-live', 'polite');
                liveRegion.setAttribute('aria-atomic', 'true');
                liveRegion.className = 'sr-only';
                liveRegion.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden';
                document.body.appendChild(liveRegion);
            }

            liveRegion.textContent = announcement;
            return true;
        } catch (error) {
            console.error('Error announcing slide change:', error);
            return false;
        }
    }

    destroy() {
        try {
            // Stop auto-play
            this.pauseAutoPlay();

            // Remove all event listeners
            document.removeEventListener('keydown', this.boundHandlers.keydown);
            this.container.removeEventListener('mouseenter', this.boundHandlers.mouseenter);
            this.container.removeEventListener('mouseleave', this.boundHandlers.mouseleave);
            window.removeEventListener('resize', this.boundHandlers.resize);

            if (this.config.swipeEnabled) {
                this.container.removeEventListener('touchstart', this.boundHandlers.touchstart);
                this.container.removeEventListener('touchend', this.boundHandlers.touchend);
            }

            // Remove created DOM elements
            const indicatorsContainer = document.querySelector('.carousel-indicators');
            const progressBar = document.querySelector('.carousel-progress');
            const liveRegion = document.getElementById('carousel-live-region');

            indicatorsContainer?.remove();
            progressBar?.remove();
            liveRegion?.remove();

            // Clear references
            this.autoPlayInterval = null;
            this.indicators = null;
            this.progressFill = null;

            return true;
        } catch (error) {
            console.error('Error during carousel destruction:', error);
            return false;
        }
    }

    // Getter methods for testing
    get state() {
        return {
            currentSlide: this.currentSlide,
            totalSlides: this.totalSlides,
            isPlaying: this.isPlaying,
            config: { ...this.config }
        };
    }
}

// Safe auto-initialize with error handling
document.addEventListener('DOMContentLoaded', () => {
    const carouselElements = document.querySelectorAll('[data-carousel="robust"]');

    carouselElements.forEach((element, index) => {
        try {
            const carousel = new RobustCarousel({
                container: `[data-carousel="robust"]:nth-child(${index + 1}) .carousel`
            });

            console.log(`Robust Zernio DG Carousel ${index + 1} initialized successfully!`);

            // Expose to global scope for debugging
            window[`zernioDGCarousel${index || ''}`] = carousel;
        } catch (error) {
            console.error(`Failed to initialize carousel ${index + 1}:`, error);
        }
    });
});