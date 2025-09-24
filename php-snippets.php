<?php
//----- fix cacheKey console error
add_action('wp_enqueue_scripts', function () {
    wp_add_inline_script('jquery', '
        if (typeof window.cacheKey === "undefined") {
            window.cacheKey = {};
        }
    ', 'before');
});
add_action('admin_enqueue_scripts', function () {
    wp_add_inline_script('jquery', '
        if (typeof window.cacheKey === "undefined") {
            window.cacheKey = {};
        }
    ', 'before');
});

//----- 
