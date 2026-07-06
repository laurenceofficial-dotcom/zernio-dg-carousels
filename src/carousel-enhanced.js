// Enhanced Zernio DG Carousels with additional features
class EnhancedCarousel {
    constructor(options = {}) {
        this.container = document.querySelector(options.container || '.carousel');
        this.slides = this.container.querySelectorAll('.slide');
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;

        // Configuration options
        this.config = {
            autoPlay: options.autoPlay !== false,
            autoPlayDelay: options.autoPlayDelay || 4000,
            showIndicators: options.showIndicators !== false,
            showProgress: options.showProgress !== false,
            swipeEnabled: options.swipeEnabled !== false,
            ...options
        };

        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');

        // State tracking
        this.isPlaying = this.config.autoPlay;
        this.touchStartX = 0;
        this.touchEndX = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        if (this.config.showIndicators) this.createIndicators();
        if (this.config.showProgress) this.createProgressBar();
        if (this.config.autoPlay) this.startAutoPlay();

        // Initialize first slide
        this.showSlide(0);
        this.updateAccessibility();
    }

    setupEventListeners() {
        // Button controls
        this.prevBtn?.addEventListener('click', () => this.previousSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
            if (e.key === ' ') {
                e.preventDefault();
                this.toggleAutoPlay();
            }
        });

        // Mouse events
        this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.container.addEventListener('mouseleave', () => this.resumeAutoPlay());

        // Touch events for swipe
        if (this.config.swipeEnabled) {
            this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            this.container.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        }

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    createIndicators() {
        const indicatorContainer = document.createElement('div');
        indicatorContainer.className = 'carousel-indicators';

        for (let i = 0; i < this.totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'indicator';
            indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);
            indicator.addEventListener('click', () => this.goToSlide(i));
            indicatorContainer.appendChild(indicator);
        }

        this.container.parentElement.appendChild(indicatorContainer);
        this.indicators = indicatorContainer.querySelectorAll('.indicator');
    }

    createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'carousel-progress';
        progressBar.innerHTML = '<div class="progress-fill"></div>';

        this.container.parentElement.appendChild(progressBar);
        this.progressFill = progressBar.querySelector('.progress-fill');
    }

    showSlide(index) {
        // Remove active classes
        this.slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            slide.setAttribute('aria-hidden', i !== index);
        });

        if (this.indicators) {
            this.indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });
        }

        this.currentSlide = index;
        this.updateProgress();
        this.announceSlideChange();
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this.showSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.showSlide(prevIndex);
    }

    goToSlide(index) {
        if (index >= 0 && index < this.totalSlides) {
            this.showSlide(index);
        }
    }

    startAutoPlay() {
        if (!this.config.autoPlay) return;

        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.config.autoPlayDelay);

        this.isPlaying = true;
    }

    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
    }

    resumeAutoPlay() {
        if (this.isPlaying && this.config.autoPlay) {
            this.startAutoPlay();
        }
    }

    toggleAutoPlay() {
        if (this.isPlaying) {
            this.pauseAutoPlay();
            this.isPlaying = false;
        } else {
            this.startAutoPlay();
        }
    }

    updateProgress() {
        if (!this.progressFill) return;

        const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
    }

    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = this.touchStartX - this.touchEndX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                this.nextSlide();
            } else {
                this.previousSlide();
            }
        }
    }

    handleResize() {
        // Recalculate dimensions if needed
        this.showSlide(this.currentSlide);
    }

    updateAccessibility() {
        // Add ARIA labels and roles
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Image carousel');

        this.slides.forEach((slide, index) => {
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-roledescription', 'slide');
            slide.setAttribute('aria-label', `${index + 1} of ${this.totalSlides}`);
        });
    }

    announceSlideChange() {
        // Screen reader announcement
        const announcement = `Slide ${this.currentSlide + 1} of ${this.totalSlides}`;

        // Create or update live region
        let liveRegion = document.getElementById('carousel-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'carousel-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = announcement;
    }

    destroy() {
        this.pauseAutoPlay();
        // Remove event listeners and clean up
        window.removeEventListener('resize', this.handleResize);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if enhanced carousel should be used
    const useEnhanced = document.querySelector('[data-carousel="enhanced"]');

    if (useEnhanced) {
        const carousel = new EnhancedCarousel({
            container: '.carousel',
            autoPlay: true,
            autoPlayDelay: 4000,
            showIndicators: true,
            showProgress: true,
            swipeEnabled: true
        });

        console.log('Enhanced Zernio DG Carousels initialized successfully!');

        // Expose to global scope for debugging
        window.zernioDGCarousel = carousel;
    }
});