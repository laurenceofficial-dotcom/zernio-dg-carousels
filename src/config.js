// Zernio DG Carousels - Configuration System
const CarouselConfig = {
    // Default configuration for all carousels
    defaults: {
        autoPlay: true,
        autoPlayDelay: 4000,
        showIndicators: true,
        showProgress: true,
        swipeEnabled: true,
        pauseOnHover: true,
        keyboardEnabled: true,
        animationSpeed: 600,
        swipeThreshold: 50
    },

    // Theme configurations
    themes: {
        default: {
            primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            slideGradients: [
                'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)'
            ],
            borderRadius: '20px',
            shadowIntensity: '0 20px 60px rgba(0,0,0,0.3)'
        },

        minimal: {
            primaryGradient: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            slideGradients: [
                'linear-gradient(45deg, #6c757d 0%, #495057 100%)',
                'linear-gradient(45deg, #6f42c1 0%, #5a23c8 100%)',
                'linear-gradient(45deg, #20c997 0%, #0d9488 100%)'
            ],
            borderRadius: '10px',
            shadowIntensity: '0 10px 30px rgba(0,0,0,0.1)'
        },

        dark: {
            primaryGradient: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
            slideGradients: [
                'linear-gradient(45deg, #4a5568 0%, #2d3748 100%)',
                'linear-gradient(45deg, #3182ce 0%, #2c5282 100%)',
                'linear-gradient(45deg, #38a169 0%, #2f855a 100%)'
            ],
            borderRadius: '15px',
            shadowIntensity: '0 15px 45px rgba(0,0,0,0.5)'
        }
    },

    // Responsive breakpoints
    breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024
    },

    // Animation presets
    animations: {
        slide: {
            duration: 600,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        fade: {
            duration: 400,
            easing: 'ease-in-out'
        },
        zoom: {
            duration: 800,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }
    },

    // Accessibility settings
    accessibility: {
        announceSlideChanges: true,
        respectMotionPreferences: true,
        focusManagement: true,
        ariaLiveRegion: true
    },

    // Performance settings
    performance: {
        useRAF: true, // RequestAnimationFrame for smooth animations
        debounceResize: 250, // Debounce window resize events
        throttleScroll: 16 // Throttle scroll events (60fps)
    },

    // Custom event names
    events: {
        slideChange: 'carousel:slidechange',
        play: 'carousel:play',
        pause: 'carousel:pause',
        init: 'carousel:init',
        destroy: 'carousel:destroy'
    }
};

// Configuration utility functions
const ConfigUtils = {
    /**
     * Merge user config with defaults
     */
    mergeConfig(userConfig = {}) {
        return {
            ...CarouselConfig.defaults,
            ...userConfig
        };
    },

    /**
     * Apply theme to carousel
     */
    applyTheme(themeName = 'default') {
        const theme = CarouselConfig.themes[themeName] || CarouselConfig.themes.default;

        // Create CSS custom properties for theme
        const root = document.documentElement;
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--carousel-${key}`, value);
        });

        return theme;
    },

    /**
     * Get responsive config based on screen size
     */
    getResponsiveConfig() {
        const width = window.innerWidth;
        const { mobile, tablet } = CarouselConfig.breakpoints;

        if (width <= mobile) {
            return {
                showIndicators: true,
                showProgress: false,
                autoPlayDelay: 5000 // Slower on mobile
            };
        } else if (width <= tablet) {
            return {
                showIndicators: true,
                showProgress: true,
                autoPlayDelay: 4500
            };
        } else {
            return {}; // Use defaults for desktop
        }
    },

    /**
     * Validate configuration options
     */
    validateConfig(config) {
        const errors = [];

        if (config.autoPlayDelay && config.autoPlayDelay < 1000) {
            errors.push('autoPlayDelay must be at least 1000ms');
        }

        if (config.animationSpeed && config.animationSpeed < 100) {
            errors.push('animationSpeed must be at least 100ms');
        }

        if (config.swipeThreshold && (config.swipeThreshold < 10 || config.swipeThreshold > 200)) {
            errors.push('swipeThreshold must be between 10 and 200 pixels');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CarouselConfig, ConfigUtils };
} else {
    // Browser global
    window.CarouselConfig = CarouselConfig;
    window.ConfigUtils = ConfigUtils;
}