/**
 * CAROUSEL POPUP HANDLER
 * =====================================
 * 
 * REQUIRED CLASS NAMES:
 * ---------------------
 * 
 * .popup-carousel-module
 *   └─> Main wrapper around your entire carousel module
 * 
 * .swiper-slide
 *   └─> Each individual slide in your carousel (Swiper default class)
 * 
 * .carousel-popup-btn
 *   └─> The button inside each slide that users click to open popup
 * 
 * .carousel-popup-content
 *   └─> Container inside each slide with content to show in popup (should be hidden)
 * 
 * .carousel-popup-trigger-open
 *   └─> Hidden wrapper containing the Elementor popup trigger link
 *       └─> Must contain an <a> tag with Elementor popup action
 * 
 * .carousel-popup-container
 *   └─> Empty container inside your Elementor popup where content will be inserted
 * 
 * 
 * BASIC STRUCTURE:
 * ----------------
 * 
 * <div class="popup-carousel-module">
 *   <div class="carousel-popup-trigger-open" style="display:none;">
 *     <a href="#" [elementor-popup-settings]></a>
 *   </div>
 *   <div class="swiper-slide">
 *     <button class="carousel-popup-btn">Open</button>
 *     <div class="carousel-popup-content" style="display:none;">
 *       [Your content here]
 *     </div>
 *   </div>
 * </div>
 * 
 * Inside Elementor Popup:
 * <div class="carousel-popup-container"></div>
 */

jQuery(document).ready(function($) {
    var $currentContent = null;
    var currentModuleId = null;
    
    $(document).on('click', '.popup-carousel-module .carousel-popup-btn', function(e) {
        e.preventDefault();
        
        var $module = $(this).closest('.popup-carousel-module');
        var $slide = $(this).closest('.swiper-slide');
        var $content = $slide.find('.carousel-popup-content');
        
        if ($content.length) {
            $currentContent = $content.clone();
            
            var $popupTrigger = $module.find('.carousel-popup-trigger-open a');
            
            if (!$popupTrigger.length) {
                $popupTrigger = $('.carousel-popup-trigger-open a').first();
            }
            
            if ($popupTrigger.length) {
                currentModuleId = $module.attr('id') || 'module-' + Math.random();
                $popupTrigger[0].click();
            }
        }
    });
    
    $(document).on('elementor/popup/show', function(event, id, instance) {
        if ($currentContent) {
            setTimeout(function() {
                var $popupContainer = $('.carousel-popup-container');
                
                if ($popupContainer.length) {
                    $popupContainer.empty();
                    $popupContainer.append($currentContent);
                    
                    if ($currentContent.is('video')) {
                        $currentContent[0].currentTime = 0;
                    }
                    
                    $currentContent = null;
                    currentModuleId = null;
                }
            }, 50);
        }
    });
    
    $(document).on('click', '[data-elementor-action*="popup:close"]', function() {
        var $popupContainer = $('.carousel-popup-container');
        var $video = $popupContainer.find('video');
        
        if ($video.length) {
            $video[0].pause();
        }
    });
});
