// Clean Universal Video Pause Handler with Event Delegation
(function() {
    'use strict';

    // Core video management functions
    const VideoManager = {
        
        getAllVideos() {
            return document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="dailymotion"]');
        },

        pauseVideo(videoElement) {
            if (!videoElement) return;
            
            if (videoElement.tagName === 'VIDEO' && !videoElement.paused) {
                videoElement.pause();
            } else if (videoElement.tagName === 'IFRAME') {
                this.pauseIframeVideo(videoElement);
            }
        },

        pauseIframeVideo(iframe) {
            try {
                // YouTube API
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                // Vimeo API
                iframe.contentWindow.postMessage('{"method":"pause"}', '*');
            } catch(e) {
                // Silently handle cross-origin restrictions
            }
        },

        pauseAllExcept(excludeVideo = null) {
            this.getAllVideos().forEach(video => {
                if (video !== excludeVideo) {
                    this.pauseVideo(video);
                }
            });
        },

        pauseAll() {
            this.pauseAllExcept();
        }
    };

    // Event handler functions
    const EventHandlers = {
        
        onVideoPlay(event) {
            if (event.target.tagName === 'VIDEO') {
                VideoManager.pauseAllExcept(event.target);
            }
        },

        onIframeInteraction(event) {
            const iframe = event.target.closest('iframe') || 
                          (event.target.tagName === 'IFRAME' ? event.target : null);
            
            if (iframe && iframe.src.match(/(youtube|vimeo|dailymotion)/)) {
                setTimeout(() => VideoManager.pauseAllExcept(iframe), 100);
            }
        },

        onElementorPopupHide() {
            VideoManager.pauseAll();
        },

        onCloseButtonClick(event) {
            const target = event.target;
            const link = target.closest('a') || (target.tagName === 'A' ? target : null);
            
            // Check for Elementor action links (both encoded and decoded)
            if (link && link.href) {
                const href = link.href;
                const decodedHref = decodeURIComponent(href);
                
                const isElementorClose = href.includes('#elementor-action%3Aaction%3Doff_canvas%3Aclose') ||
                                       href.includes('#elementor-action%3Aaction%3Dpopup%3Aclose') ||
                                       decodedHref.includes('#elementor-action:action=off_canvas:close') ||
                                       decodedHref.includes('#elementor-action:action=popup:close');
                
                if (isElementorClose) {
                    setTimeout(() => VideoManager.pauseAll(), 50);
                    return;
                }
            }

            // Check for other close button classes
            const isCloseButton = target.matches(`
                .elementor-menu-toggle[aria-expanded="true"],
                .eicon-close,
                .elementor-button-link,
                [data-elementor-close],
                .dialog-close-button,
                .elementor-lightbox-close-btn
            `);

            if (isCloseButton) {
                setTimeout(() => VideoManager.pauseAll(), 50);
            }
        },

        onVisibilityChange() {
            if (document.hidden) {
                VideoManager.pauseAll();
            }
        }
    };

    // Event delegation setup
    const EventDelegation = {
        
        setupVideoEvents() {
            // Use event delegation for dynamically added videos
            document.addEventListener('play', EventHandlers.onVideoPlay, true);
            document.addEventListener('click', EventHandlers.onIframeInteraction);
        },

        setupElementorEvents() {
            if (typeof jQuery !== 'undefined') {
                // Elementor popup events
                jQuery(document).on('elementor/popup/hide elementor/popup/show', 
                    EventHandlers.onElementorPopupHide
                );
                
                // Additional Elementor frontend events
                if (typeof elementorFrontend !== 'undefined') {
                    elementorFrontend.hooks.addAction('frontend/element_ready/global', () => {
                        // Re-setup after Elementor elements are ready
                        setTimeout(() => VideoManager.pauseAll(), 100);
                    });
                }
            }
        },

        setupCloseButtonEvents() {
            // Delegate close button clicks
            document.addEventListener('click', EventHandlers.onCloseButtonClick);
        },

        setupVisibilityEvents() {
            document.addEventListener('visibilitychange', EventHandlers.onVisibilityChange);
        }
    };

    // Initialization
    const VideoController = {
        
        init() {
            this.setupAllEventListeners();
            this.handleElementorReady();
        },

        setupAllEventListeners() {
            EventDelegation.setupVideoEvents();
            EventDelegation.setupCloseButtonEvents();
            EventDelegation.setupVisibilityEvents();
        },

        handleElementorReady() {
            if (typeof jQuery !== 'undefined' && typeof elementorFrontend !== 'undefined') {
                jQuery(document).ready(() => EventDelegation.setupElementorEvents());
            } else {
                // Fallback for delayed Elementor loading
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        if (typeof jQuery !== 'undefined') {
                            EventDelegation.setupElementorEvents();
                        }
                    }, 500);
                });
            }
        }
    };

    // Start the video controller
    VideoController.init();

})();
