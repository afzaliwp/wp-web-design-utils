<?php
//Custom ajax comment box to show on every page including the shop and taxonomies
function create_virtual_post_for_comments($page_type, $page_id) {
    $post_title = '';
    $post_name = '';
    
    switch ($page_type) {
        case 'shop':
            $post_title = 'نظرات فروشگاه';
            $post_name = 'shop-comments';
            break;
        case 'category':
            $term = get_term($page_id);
            if ($term) {
                $post_title = 'نظرات دسته‌بندی: ' . $term->name;
                $post_name = 'category-comments-' . $page_id;
            }
            break;
        case 'tag':
            $term = get_term($page_id);
            if ($term) {
                $post_title = 'نظرات برچسب: ' . $term->name;
                $post_name = 'tag-comments-' . $page_id;
            }
            break;
        case 'homepage':
            $post_title = 'نظرات صفحه اصلی';
            $post_name = 'homepage-comments';
            break;
        case 'post_category':
            $term = get_term($page_id);
            if ($term) {
                $post_title = 'نظرات دسته‌بندی مطالب: ' . $term->name;
                $post_name = 'post-category-comments-' . $page_id;
            }
            break;
        case 'post_tag':
            $term = get_term($page_id);
            if ($term) {
                $post_title = 'نظرات برچسب مطالب: ' . $term->name;
                $post_name = 'post-tag-comments-' . $page_id;
            }
            break;
        case 'author':
            $author = get_userdata($page_id);
            if ($author) {
                $post_title = 'نظرات نویسنده: ' . $author->display_name;
                $post_name = 'author-comments-' . $page_id;
            }
            break;
        case 'search':
            $post_title = 'نظرات جستجو: ' . str_replace('search-', '', $page_id);
            $post_name = 'search-comments-' . md5($page_id);
            break;
        case '404':
            $post_title = 'نظرات صفحه 404';
            $post_name = '404-comments';
            break;
    }
    
    if (empty($post_title)) {
        return false;
    }
    
    // Check if virtual post already exists
    $existing_post = get_page_by_path($post_name, OBJECT, 'woo_comment_post');
    
    if ($existing_post) {
        return $existing_post->ID;
    }
    
    // Create virtual post
    $virtual_post = array(
        'post_title' => $post_title,
        'post_name' => $post_name,
        'post_type' => 'woo_comment_post',
        'post_status' => 'publish',
        'comment_status' => 'open',
        'ping_status' => 'closed',
        'post_content' => 'این پست مجازی برای نگهداری نظرات ایجاد شده است.',
    );
    
    $post_id = wp_insert_post($virtual_post);
    
    // Store metadata to identify the original page
    update_post_meta($post_id, '_woo_comment_page_type', $page_type);
    update_post_meta($post_id, '_woo_comment_page_id', $page_id);
    
    return $post_id;
}

// Register custom post type for virtual comment posts
function register_woo_comment_post_type() {
    register_post_type('woo_comment_post', array(
        'public' => false,
        'show_ui' => false,
        'supports' => array('title', 'comments'),
        'capability_type' => 'post',
    ));
}
add_action('init', 'register_woo_comment_post_type');

// Get or create virtual post ID for current page
function get_virtual_post_id_for_current_page() {
    global $post;
    
    if (is_shop()) {
        return create_virtual_post_for_comments('shop', 'shop');
    } elseif (is_product_category()) {
        return create_virtual_post_for_comments('category', get_queried_object_id());
    } elseif (is_product_tag()) {
        return create_virtual_post_for_comments('tag', get_queried_object_id());
    } elseif (is_singular('product')) {
        // For single products, use the existing product's comment system
        return get_the_ID();
    } elseif (is_singular('post')) {
        // For single posts, use the existing post's comment system
        return get_the_ID();
    } elseif (is_singular()) {
        // For other single pages, use the existing page's comment system
        return get_the_ID();
    } elseif (is_home() || is_front_page()) {
        return create_virtual_post_for_comments('homepage', 'homepage');
    } elseif (is_category()) {
        return create_virtual_post_for_comments('post_category', get_queried_object_id());
    } elseif (is_tag()) {
        return create_virtual_post_for_comments('post_tag', get_queried_object_id());
    } elseif (is_author()) {
        return create_virtual_post_for_comments('author', get_queried_object_id());
    } elseif (is_search()) {
        return create_virtual_post_for_comments('search', 'search-' . get_search_query());
    } elseif (is_404()) {
        return create_virtual_post_for_comments('404', '404');
    }
    
    return false;
}

// Handle comment submission via AJAX
function handle_woo_page_comment_submission() {
    if (!wp_verify_nonce($_POST['nonce'], 'woo_page_comment_nonce')) {
        wp_die('بررسی امنیتی ناموفق بود');
    }
    
    $virtual_post_id = intval($_POST['virtual_post_id']);
    $author_name = sanitize_text_field($_POST['author']);
    $author_email = sanitize_email($_POST['email']);
    $comment_content = sanitize_textarea_field($_POST['comment']);
    $author_url = sanitize_url($_POST['url']);
    
    if (empty($author_name) || empty($author_email) || empty($comment_content)) {
        wp_send_json_error('همه فیلدهای اجباری باید پر شوند.');
        return;
    }
    
    // Prepare comment data
    $comment_data = array(
        'comment_post_ID' => $virtual_post_id,
        'comment_author' => $author_name,
        'comment_author_email' => $author_email,
        'comment_author_url' => $author_url,
        'comment_content' => $comment_content,
        'comment_type' => 'comment',
        'comment_parent' => 0,
        'user_id' => get_current_user_id(),
        'comment_author_IP' => $_SERVER['REMOTE_ADDR'],
        'comment_agent' => $_SERVER['HTTP_USER_AGENT'],
        'comment_date' => current_time('mysql'),
        'comment_approved' => 1, // Auto-approve, or use 0 for moderation
    );
    
    // Insert comment using WordPress function
    $comment_id = wp_insert_comment($comment_data);
    
    if ($comment_id) {
        wp_send_json_success('نظر شما با موفقیت ثبت شد!');
    } else {
        wp_send_json_error('خطا در ثبت نظر.');
    }
}
add_action('wp_ajax_submit_woo_page_comment', 'handle_woo_page_comment_submission');
add_action('wp_ajax_nopriv_submit_woo_page_comment', 'handle_woo_page_comment_submission');

// Shortcode for the comment form and display
function woo_page_comments_shortcode($atts) {
    $atts = shortcode_atts(array(
        'show_form' => 'yes',
        'show_comments' => 'yes',
        'force_virtual' => 'no' // Force virtual comments even on single posts/products
    ), $atts);
    
    $virtual_post_id = get_virtual_post_id_for_current_page();
    
    if (!$virtual_post_id) {
        return '<p>نظرات برای این صفحه در دسترس نیست.</p>';
    }
    
    // Check if this is a single post/product and we should use native comments
    $use_native_comments = false;
    if ($atts['force_virtual'] === 'no' && (is_singular('product') || is_singular('post') || is_singular('page'))) {
        $use_native_comments = true;
        // Check if the post/product has comments enabled
        if (!comments_open($virtual_post_id)) {
            return '<p>نظرات برای این صفحه بسته شده است.</p>';
        }
    }
    
    // Get comments for this post
    $comments = get_comments(array(
        'post_id' => $virtual_post_id,
        'status' => 'approve',
        'order' => 'DESC'
    ));
    
    $current_user = wp_get_current_user();
    
    ob_start();
    ?>
    <div id="woo-page-comments-section" class="<?php echo $use_native_comments ? 'native-comments' : 'virtual-comments'; ?>">
        
        <?php if ($atts['show_form'] === 'yes'): ?>
        <!-- Comment Form -->
        <div class="woo-comment-form-container">
            <div class="comments-form-title">نظر خود را بنویسید</div>
            
            <?php if ($use_native_comments): ?>
                <!-- Use WordPress native comment form for single posts/products -->
                <div class="native-comment-form">
                    <?php
                    comment_form(array(
                        'title_reply' => '',
                        'comment_notes_before' => '',
                        'comment_notes_after' => '',
                        'label_submit' => 'ارسال نظر',
                        'comment_field' => '<p class="comment-form-comment"><label for="comment">نظر *</label><textarea id="comment" name="comment" rows="6" required></textarea></p>',
                        'fields' => array(
                            'author' => '<p class="comment-form-author"><label for="author">نام *</label><input id="author" name="author" type="text" required /></p>',
                            'email' => '<p class="comment-form-email"><label for="email">ایمیل *</label><input id="email" name="email" type="email" required /></p>',
                            'url' => '<p class="comment-form-url"><label for="url">وب‌سایت</label><input id="url" name="url" type="url" /></p>',
                        ),
                    ), $virtual_post_id);
                    ?>
                </div>
            <?php else: ?>
                <!-- Use AJAX form for virtual comments -->
                <form id="woo-page-comment-form" class="woo-comment-form">
                    <?php wp_nonce_field('woo_page_comment_nonce', 'nonce'); ?>
                    <input type="hidden" name="virtual_post_id" value="<?php echo esc_attr($virtual_post_id); ?>">
                    
                    <?php if (!is_user_logged_in()): ?>
                    <p class="comment-form-author">
                        <label for="author">نام *</label>
                        <input type="text" name="author" id="author" required maxlength="245">
                    </p>
                    
                    <p class="comment-form-email">
                        <label for="email">ایمیل *</label>
                        <input type="email" name="email" id="email" required maxlength="100">
                    </p>
                    
                    <p class="comment-form-url">
                        <label for="url">وب‌سایت</label>
                        <input type="url" name="url" id="url" maxlength="200">
                    </p>
                    <?php else: ?>
                    <input type="hidden" name="author" value="<?php echo esc_attr($current_user->display_name); ?>">
                    <input type="hidden" name="email" value="<?php echo esc_attr($current_user->user_email); ?>">
                    <input type="hidden" name="url" value="<?php echo esc_attr($current_user->user_url); ?>">
                    <p>در حال ارسال نظر به عنوان <strong><?php echo esc_html($current_user->display_name); ?></strong>. <a href="<?php echo wp_logout_url(get_permalink()); ?>">خروج از حساب کاربری؟</a></p>
                    <?php endif; ?>
                    
                    <p class="comment-form-comment">
                        <label for="comment">نظر *</label>
                        <textarea name="comment" id="comment" rows="6" required maxlength="65525"></textarea>
                    </p>
                    
                    <p class="form-submit">
                        <button type="submit" name="submit">ارسال نظر</button>
                    </p>
                </form>
                
                <div id="comment-response-message"></div>
            <?php endif; ?>
        </div>
        <?php endif; ?>
        
        <?php if ($atts['show_comments'] === 'yes'): ?>
        <!-- Display Comments -->
        <div id="comments-display" class="comments-area">
            <?php if ($comments): ?>
                <div class="comments-title">
                    نظرات (<?php echo count($comments); ?>)
                </div>
                
                <?php if ($use_native_comments): ?>
                    <!-- Use WordPress native comment display -->
                    <ol class="comment-list">
                        <?php wp_list_comments(array(
                            'style' => 'ol',
                            'short_ping' => true,
                            'avatar_size' => 50,
                        ), $comments); ?>
                    </ol>
                <?php else: ?>
                    <!-- Use custom comment display -->
                    <ol class="comment-list">
                        <?php
                        wp_list_comments(array(
                            'walker' => new WooCommerce_Comment_Walker(),
                            'style' => 'ol',
                            'short_ping' => true,
                            'avatar_size' => 50,
                        ), $comments);
                        ?>
                    </ol>
                <?php endif; ?>
                
            <?php else: ?>
                <p class="no-comments">هنوز نظری ثبت نشده است. اولین نفری باشید که نظر می‌دهد!</p>
            <?php endif; ?>
        </div>
        <?php endif; ?>
    </div>
    
    <script>
    jQuery(document).ready(function($) {
        $('#woo-page-comment-form').on('submit', function(e) {
            e.preventDefault();
            
            var $form = $(this);
            var $submitBtn = $form.find('button[type="submit"]');
            var originalText = $submitBtn.text();
            
            $submitBtn.text('در حال ارسال...').prop('disabled', true);
            
            var formData = $form.serialize();
            formData += '&action=submit_woo_page_comment';
            
            $.ajax({
                url: '<?php echo admin_url('admin-ajax.php'); ?>',
                type: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success) {
                        $('#comment-response-message').html('<div class="comment-success"><p>' + response.data + '</p></div>');
                        $form[0].reset();
                        // Reload comments section
                        setTimeout(function() {
                            location.reload();
                        }, 1500);
                    } else {
                        $('#comment-response-message').html('<div class="comment-error"><p>' + response.data + '</p></div>');
                    }
                },
                error: function() {
                    $('#comment-response-message').html('<div class="comment-error"><p>خطایی رخ داده است. لطفاً دوباره تلاش کنید.</p></div>');
                },
                complete: function() {
                    $submitBtn.text(originalText).prop('disabled', false);
                }
            });
        });
    });
    </script>
    
    <style>
    .comments-form-title,
    .comments-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #333;
    }
    
    .woo-comment-form-container {
        margin-bottom: 40px;
        padding: 25px;
        border: 1px solid #ddd;
        background: #f9f9f9;
        border-radius: 5px;
    }
    
    .woo-comment-form {
        direction: rtl;
    }
    
    .woo-comment-form p {
        margin-bottom: 15px;
    }
    
    .woo-comment-form label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #555;
    }
    
    .woo-comment-form input[type="text"],
    .woo-comment-form input[type="email"],
    .woo-comment-form input[type="url"],
    .woo-comment-form textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: inherit;
        font-size: 14px;
        direction: rtl;
    }
    
    .woo-comment-form textarea {
        resize: vertical;
        min-height: 120px;
    }
    
    .woo-comment-form button {
        background: #0073aa;
        color: white;
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: background-color 0.3s;
    }
    
    .woo-comment-form button:hover {
        background: #005a87;
    }
    
    .woo-comment-form button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
    
    .comment-success {
        padding: 10px;
        background: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 4px;
        color: #155724;
        margin-top: 15px;
    }
    
    .comment-error {
        padding: 10px;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        color: #721c24;
        margin-top: 15px;
    }
    
    .comments-area {
        direction: rtl;
    }
    
    .comment-list {
        list-style: none;
        padding: 0;
    }
    
    .comment-list li {
        margin-bottom: 20px;
        padding: 15px;
        background: #fff;
        border: 1px solid #eee;
        border-radius: 5px;
    }
    
    .comment-meta {
        margin-bottom: 10px;
        font-size: 14px;
        color: #666;
    }
    
    .comment-author {
        font-weight: bold;
        color: #333;
    }
    
    .comment-content {
        line-height: 1.6;
        color: #333;
    }
    
    .no-comments {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
    }
    </style>
    <?php
    
    return ob_get_clean();
}
add_shortcode('woo_page_comments', 'woo_page_comments_shortcode');

// Custom comment walker for better display
class WooCommerce_Comment_Walker extends Walker_Comment {
    
    function start_el( &$output, $comment, $depth = 0, $args = array(), $id = 0 ) {
        $depth++;
        $GLOBALS['comment_depth'] = $depth;
        $GLOBALS['comment'] = $comment;
        
        if ( !empty( $args['callback'] ) ) {
            call_user_func( $args['callback'], $comment, $args, $depth );
            return;
        }
        
        $output .= '<li ' . comment_class('', $comment, null, false) . ' id="comment-' . get_comment_ID() . '">';
        $output .= '<div class="comment-body">';
        $output .= '<div class="comment-meta">';
        $output .= '<span class="comment-author">' . get_comment_author() . '</span>';
        $output .= '<span class="comment-date"> - ' . get_comment_date('j F Y در ساعت H:i') . '</span>';
        $output .= '</div>';
        $output .= '<div class="comment-content">' . wpautop(get_comment_text()) . '</div>';
        $output .= '</div>';
    }
    
    function end_el( &$output, $comment, $depth = 0, $args = array() ) {
        $output .= "</li>\n";
    }
}
