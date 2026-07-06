// Comprehensive test suite for RobustCarousel following Fable methodology

// Simple test framework for browser environment
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, errors: [] };
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('🧪 Running Carousel Tests...\n');

        for (const { name, fn } of this.tests) {
            try {
                await fn();
                console.log(`✅ ${name}`);
                this.results.passed++;
            } catch (error) {
                console.error(`❌ ${name}: ${error.message}`);
                this.results.errors.push({ test: name, error });
                this.results.failed++;
            }
        }

        console.log(`\n📊 Results: ${this.results.passed} passed, ${this.results.failed} failed`);
        return this.results;
    }
}

// Test utilities
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertThrows(fn, expectedError, message) {
    let threw = false;
    try {
        fn();
    } catch (error) {
        threw = true;
        if (expectedError && !error.message.includes(expectedError)) {
            throw new Error(`${message}: expected error containing "${expectedError}", got "${error.message}"`);
        }
    }
    if (!threw) {
        throw new Error(`${message}: expected function to throw`);
    }
}

// Mock DOM setup for testing
function setupMockDOM(slideCount = 3) {
    // Clean up any existing elements
    document.querySelectorAll('.carousel-container').forEach(el => el.remove());

    const container = document.createElement('div');
    container.className = 'carousel-container';

    const carousel = document.createElement('div');
    carousel.className = 'carousel';

    // Add slides
    for (let i = 0; i < slideCount; i++) {
        const slide = document.createElement('div');
        slide.className = 'slide';
        if (i === 0) slide.classList.add('active');
        slide.innerHTML = `<h2>Slide ${i + 1}</h2>`;
        carousel.appendChild(slide);
    }

    // Add navigation buttons
    const controls = document.createElement('div');
    controls.innerHTML = `
        <button id="prevBtn">Previous</button>
        <button id="nextBtn">Next</button>
    `;

    container.appendChild(carousel);
    container.appendChild(controls);
    document.body.appendChild(container);

    return { container, carousel };
}

function cleanup() {
    // Clean up DOM
    document.querySelectorAll('.carousel-container, .carousel-indicators, .carousel-progress, #carousel-live-region').forEach(el => el.remove());
}

// Initialize test runner
const runner = new TestRunner();

// TIER 1 TESTS - Constructor Error Cases (Following Fable throw-hunt)

runner.test('T1.1 - Constructor throws if container not found', () => {
    cleanup();
    assertThrows(
        () => new RobustCarousel({ container: '.nonexistent' }),
        'Carousel container not found',
        'Should throw when container selector fails'
    );
});

runner.test('T1.2 - Constructor throws if no slides found', () => {
    cleanup();
    const container = document.createElement('div');
    container.className = 'empty-carousel';
    document.body.appendChild(container);

    assertThrows(
        () => new RobustCarousel({ container: '.empty-carousel' }),
        'No slides found',
        'Should throw when no slides exist'
    );
});

runner.test('T1.3 - Constructor throws if no parent element', () => {
    cleanup();
    const carousel = document.createElement('div');
    carousel.className = 'orphan-carousel';
    carousel.innerHTML = '<div class="slide">Slide 1</div>';
    // Don't append to body - orphaned element

    assertThrows(
        () => new RobustCarousel({ container: '.orphan-carousel' }),
        'must have a parent element',
        'Should throw when container has no parent'
    );
});

runner.test('T1.4 - Constructor validates autoPlayDelay bounds', () => {
    setupMockDOM();

    assertThrows(
        () => new RobustCarousel({ autoPlayDelay: 50 }),
        'autoPlayDelay must be a number >= 100ms',
        'Should reject autoPlayDelay < 100ms'
    );
});

runner.test('T1.5 - Constructor validates swipeThreshold bounds', () => {
    setupMockDOM();

    // Test lower bound
    assertThrows(
        () => new RobustCarousel({ swipeThreshold: 5 }),
        'swipeThreshold must be between 10 and 200 pixels',
        'Should reject swipeThreshold < 10px'
    );

    // Test upper bound
    assertThrows(
        () => new RobustCarousel({ swipeThreshold: 300 }),
        'swipeThreshold must be between 10 and 200 pixels',
        'Should reject swipeThreshold > 200px'
    );
});

// TIER 2 TESTS - Boundary Cases (Fable boundary execution)

runner.test('T2.1 - Single slide carousel (boundary case)', () => {
    cleanup();
    setupMockDOM(1);

    const carousel = new RobustCarousel();
    assertEqual(carousel.state.totalSlides, 1, 'Should handle single slide');
    assertEqual(carousel.state.currentSlide, 0, 'Should start at slide 0');

    // Navigation should stay on same slide
    carousel.nextSlide();
    assertEqual(carousel.state.currentSlide, 0, 'Next from single slide should stay at 0');

    carousel.previousSlide();
    assertEqual(carousel.state.currentSlide, 0, 'Previous from single slide should stay at 0');
});

runner.test('T2.2 - showSlide boundary validation', () => {
    cleanup();
    setupMockDOM(3);

    const carousel = new RobustCarousel({ autoPlay: false });

    // Valid boundaries
    assert(carousel.showSlide(0), 'Should accept slide 0');
    assert(carousel.showSlide(2), 'Should accept last slide index');

    // Invalid boundaries
    assert(!carousel.showSlide(-1), 'Should reject negative index');
    assert(!carousel.showSlide(3), 'Should reject index >= totalSlides');
    assert(!carousel.showSlide('invalid'), 'Should reject non-number index');
    assert(!carousel.showSlide(null), 'Should reject null index');
});

runner.test('T2.3 - Swipe threshold exact boundaries', () => {
    cleanup();
    setupMockDOM();

    const carousel = new RobustCarousel({
        swipeThreshold: 50,
        autoPlay: false
    });

    // Mock touch events
    carousel.touchStartX = 100;

    // Test exact threshold (should NOT trigger)
    carousel.touchEndX = 50;  // Distance = 50px exactly
    carousel._handleSwipe();
    assertEqual(carousel.state.currentSlide, 0, 'Exact threshold should not trigger swipe');

    // Test threshold + 1 (should trigger)
    carousel.touchEndX = 49;  // Distance = 51px
    carousel._handleSwipe();
    assertEqual(carousel.state.currentSlide, 1, 'Threshold + 1 should trigger swipe');
});

// TIER 3 TESTS - Happy Path and Integration

runner.test('T3.1 - Happy path initialization and navigation', () => {
    cleanup();
    setupMockDOM(5);

    const carousel = new RobustCarousel({
        autoPlay: false,
        showIndicators: true,
        showProgress: true
    });

    // Verify initialization
    assertEqual(carousel.state.totalSlides, 5, 'Should count slides correctly');
    assertEqual(carousel.state.currentSlide, 0, 'Should start at slide 0');
    assert(!carousel.state.isPlaying, 'Auto-play should be disabled');

    // Verify DOM elements created
    assert(document.querySelector('.carousel-indicators'), 'Should create indicators');
    assert(document.querySelector('.carousel-progress'), 'Should create progress bar');

    // Test navigation sequence
    carousel.nextSlide();
    assertEqual(carousel.state.currentSlide, 1, 'Next should advance to slide 1');

    carousel.goToSlide(3);
    assertEqual(carousel.state.currentSlide, 3, 'goToSlide should jump to slide 3');

    carousel.previousSlide();
    assertEqual(carousel.state.currentSlide, 2, 'Previous should go to slide 2');

    // Test wraparound
    carousel.goToSlide(4); // Last slide
    carousel.nextSlide();
    assertEqual(carousel.state.currentSlide, 0, 'Next from last slide should wrap to 0');

    carousel.previousSlide();
    assertEqual(carousel.state.currentSlide, 4, 'Previous from first slide should wrap to last');
});

runner.test('T3.2 - Auto-play functionality', async () => {
    cleanup();
    setupMockDOM(3);

    const carousel = new RobustCarousel({
        autoPlay: true,
        autoPlayDelay: 200
    });

    assert(carousel.state.isPlaying, 'Auto-play should be active');

    // Wait for auto-advance
    await new Promise(resolve => setTimeout(resolve, 250));
    assertEqual(carousel.state.currentSlide, 1, 'Should auto-advance after delay');

    // Test pause/resume
    carousel.pauseAutoPlay();
    assert(!carousel.state.isPlaying, 'Should pause auto-play');

    const slideBeforePause = carousel.state.currentSlide;
    await new Promise(resolve => setTimeout(resolve, 250));
    assertEqual(carousel.state.currentSlide, slideBeforePause, 'Should not advance when paused');

    // Test resume
    carousel.resumeAutoPlay();
    await new Promise(resolve => setTimeout(resolve, 250));
    assert(carousel.state.currentSlide > slideBeforePause || carousel.state.currentSlide === 0, 'Should resume auto-advance');
});

runner.test('T3.3 - Keyboard navigation', () => {
    cleanup();
    setupMockDOM(3);

    const carousel = new RobustCarousel({ autoPlay: false });

    // Test arrow keys
    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });

    // Test right arrow
    document.dispatchEvent(rightEvent);
    assertEqual(carousel.state.currentSlide, 1, 'Right arrow should advance slide');

    // Test left arrow
    document.dispatchEvent(leftEvent);
    assertEqual(carousel.state.currentSlide, 0, 'Left arrow should go to previous slide');

    // Test spacebar toggle
    document.dispatchEvent(spaceEvent);
    assert(carousel.state.isPlaying, 'Spacebar should toggle auto-play');
});

runner.test('T3.4 - Touch/swipe navigation', () => {
    cleanup();
    setupMockDOM(3);

    const carousel = new RobustCarousel({
        autoPlay: false,
        swipeEnabled: true,
        swipeThreshold: 50
    });

    // Mock touch start
    const touchStart = new TouchEvent('touchstart', {
        changedTouches: [{ screenX: 200 }]
    });
    carousel._handleTouchStart({ changedTouches: [{ screenX: 200 }] });

    // Mock swipe right (next slide)
    carousel._handleTouchEnd({ changedTouches: [{ screenX: 100 }] });
    assertEqual(carousel.state.currentSlide, 1, 'Right swipe should advance slide');

    // Mock swipe left (previous slide)
    carousel._handleTouchStart({ changedTouches: [{ screenX: 100 }] });
    carousel._handleTouchEnd({ changedTouches: [{ screenX: 200 }] });
    assertEqual(carousel.state.currentSlide, 0, 'Left swipe should go to previous slide');
});

runner.test('T3.5 - Accessibility features', () => {
    cleanup();
    setupMockDOM(3);

    const carousel = new RobustCarousel();

    // Check ARIA attributes
    const container = document.querySelector('.carousel');
    assertEqual(container.getAttribute('role'), 'region', 'Container should have region role');
    assertEqual(container.getAttribute('aria-label'), 'Image carousel', 'Container should have aria-label');

    // Check slide accessibility
    const slides = container.querySelectorAll('.slide');
    slides.forEach((slide, index) => {
        assertEqual(slide.getAttribute('role'), 'group', 'Slide should have group role');
        assertEqual(slide.getAttribute('aria-roledescription'), 'slide', 'Slide should have role description');
        assert(slide.getAttribute('aria-label').includes(`${index + 1} of 3`), 'Slide should have position label');
    });

    // Check live region creation
    carousel._announceSlideChange();
    const liveRegion = document.getElementById('carousel-live-region');
    assert(liveRegion, 'Should create live region for announcements');
    assertEqual(liveRegion.getAttribute('aria-live'), 'polite', 'Live region should be polite');
});

runner.test('T3.6 - Proper cleanup and destruction', () => {
    cleanup();
    setupMockDOM();

    const carousel = new RobustCarousel({
        autoPlay: true,
        showIndicators: true,
        showProgress: true
    });

    // Verify elements exist before destruction
    assert(document.querySelector('.carousel-indicators'), 'Indicators should exist before destroy');
    assert(document.querySelector('.carousel-progress'), 'Progress bar should exist before destroy');

    // Destroy carousel
    assert(carousel.destroy(), 'Destroy should return true for success');

    // Verify cleanup
    assert(!document.querySelector('.carousel-indicators'), 'Indicators should be removed after destroy');
    assert(!document.querySelector('.carousel-progress'), 'Progress bar should be removed after destroy');
    assert(!document.getElementById('carousel-live-region'), 'Live region should be removed after destroy');
});

// Error recovery and edge cases

runner.test('T3.7 - Graceful handling of malformed touch events', () => {
    cleanup();
    setupMockDOM();

    const carousel = new RobustCarousel({ swipeEnabled: true });
    const initialSlide = carousel.state.currentSlide;

    // Test malformed touch events (should not crash)
    carousel._handleTouchStart({});
    carousel._handleTouchEnd({});
    carousel._handleTouchStart({ changedTouches: [] });
    carousel._handleTouchEnd({ changedTouches: [] });

    assertEqual(carousel.state.currentSlide, initialSlide, 'Should handle malformed touch events gracefully');
});

runner.test('T3.8 - Configuration edge cases', () => {
    cleanup();
    setupMockDOM();

    // Test with minimal config
    const carousel1 = new RobustCarousel({});
    assert(carousel1.state.config.autoPlay, 'Should default autoPlay to true');

    // Test with explicit false values
    const carousel2 = new RobustCarousel({
        autoPlay: false,
        showIndicators: false,
        showProgress: false,
        swipeEnabled: false
    });

    assert(!carousel2.state.config.autoPlay, 'Should respect explicit false values');
    assert(!carousel2.state.config.showIndicators, 'Should respect explicit false for indicators');
});

// Export for browser use
if (typeof window !== 'undefined') {
    window.CarouselTestRunner = runner;
    window.runCarouselTests = () => runner.run();
}

// Auto-run if in testing environment
if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Add a small delay to ensure carousel code is loaded
        setTimeout(() => {
            if (typeof RobustCarousel !== 'undefined') {
                window.runCarouselTests();
            } else {
                console.warn('RobustCarousel not found. Load carousel-robust.js first.');
            }
        }, 100);
    });
}