## 1. Search Page (Reflected XSS)
Test: Visit your search page using this URL:

`https://your-site.com/?s="><script>alert(document.cookie)</script>`
If you see a JavaScript alert, your page is vulnerable.

Vulnerable Example:

```php
<h1>Search Results: <?php echo $wp_query->query_vars['s']; ?></h1>
```
Fix: Replace with proper escaping:

```php
<h1>Search Results: <?php echo esc_html( $wp_query->query_vars['s'] ); ?></h1>
```
Or even better, use WordPress’s built-in function:


```php
<h1>Search Results: <?php echo get_search_query(); ?></h1>
```

## 2. Comment Forms and Comment Display (Stored XSS)
Test: Submit a comment with this payload:

```"><script>alert('XSS in comment')</script>```
Then view the post page—if the alert appears, the comment display is vulnerable.

Vulnerable Example:

```php
echo $comment->comment_content;
```
Fix: Use a WordPress escaping function or filtering function:

```php
echo wp_kses_post( $comment->comment_content );
```
This function strips disallowed HTML, preventing script injection.

## 3. Custom Database Queries (SQL Injection)
Test: If you are using custom queries, try sending an injection payload like:

```1' OR '1'='1```
into a search or query parameter and see if the query output is compromised.

Vulnerable Example:

```php
$query = "SELECT * FROM wp_posts WHERE post_title LIKE '%" . $_GET['q'] . "%'";
$results = $wpdb->get_results($query);
```
Fix: Always use prepared statements:

```php
$q = '%' . $wpdb->esc_like( $_GET['q'] ) . '%';
$query = $wpdb->prepare( "SELECT * FROM wp_posts WHERE post_title LIKE %s", $q );
$results = $wpdb->get_results($query);
```

## 4. Forms Without CSRF Protection
Test: For any form that creates, updates, or deletes data, manually remove the nonce field from the form and attempt the action. If the change still occurs, the form is vulnerable to CSRF.

Vulnerable Example:

```php
<form method="POST">
    <input type="hidden" name="post_id" value="<?```php echo $post->ID; ?>">
    <button type="submit">Delete Post</button>
</form>
```
Fix: Add a nonce to the form and then validate it on submission:


```php
<form method="POST">
    <?```php wp_nonce_field( 'delete_post', 'delete_nonce' ); ?>
    <input type="hidden" name="post_id" value="<?```php echo $post->ID; ?>">
    <button type="submit">Delete Post</button>
</form>
```
On submission:

```php
if ( isset( $_POST['delete_nonce'] ) && wp_verify_nonce( $_POST['delete_nonce'], 'delete_post' ) ) {
    // Process deletion
} else {
    // Reject the request
}
```

## 5. File Upload Vulnerabilities
Test: If your theme allows user file uploads, try uploading a file with a .```php extension containing malicious code.

Vulnerable Example:

```php
if ( isset( $_FILES['upload'] ) ) {
    move_uploaded_file( $_FILES['upload']['tmp_name'], "uploads/" . $_FILES['upload']['name'] );
}
```

Fix: Use WordPress's upload handling function to ensure proper MIME type support and error checking:

```php
if ( isset( $_FILES['upload'] ) ) {
    $uploaded = wp_handle_upload( $_FILES['upload'], array( 'test_form' => false ) );
    if ( isset( $uploaded['error'] ) ) {
        // Handle the error appropriately.
        echo esc_html( $uploaded['error'] );
    } else {
        // File upload is successful: use $uploaded['url'] as safe file reference.
    }
}
```

Additionally, consider checking allowed file types with wp_check_filetype() before proceeding.

## 6. Local File Inclusion (Arbitrary File Inclusion)
Test: If your theme dynamically loads templates based on URL parameters, try navigating to:

https://your-site.com/?template=../../wp-config
If sensitive files are exposed, you have a file inclusion issue.

Vulnerable Example:

```php
include( locate_template( $_GET['template'] . '.```php' ) );
```
Fix: Limit the templates to a whitelist, for example:

```php
$allowed_templates = array( 'home', 'about', 'contact' );
$template = in_array( $_GET['template'], $allowed_templates ) ? $_GET['template'] : 'default';
include( locate_template( $template . '.```php' ) );
```

## 7. Missing Security Headers (General for All Pages)
Test: Use your browser’s developer tools (Network tab) to inspect response headers. Verify that headers like X-Frame-Options, X-Content-Type-Options, and Content-Security-Policy are present.

Fix: Add these headers via your theme’s functions.```php:

```php
add_action( 'send_headers', function() {
    header( "X-Frame-Options: SAMEORIGIN" );
    header( "X-Content-Type-Options: nosniff" );
    header( "X-XSS-Protection: 1; mode=block" );
    header( "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" );
} );
```

## 8. AJAX Endpoint Vulnerabilities
Test: Try calling your AJAX endpoint (via a tool like Postman or even your JavaScript console) without the proper nonce value. If the action is processed, your endpoint is not secured.

Vulnerable Example:

```php
add_action( 'wp_ajax_my_action', 'my_action_callback' );
function my_action_callback() {
    // No nonce or capability check here.
    // Process action...
    wp_die();
}
```

Fix: Secure your AJAX handler by verifying a nonce:

```php
add_action( 'wp_ajax_my_action', 'my_action_callback' );
function my_action_callback() {
    check_ajax_referer( 'my_nonce', 'security' );
    // Additionally, verify user capabilities if needed.
    // Process action...
    wp_die();
}
```

And ensure your JavaScript sends the nonce when making the AJAX call.

## 9. Error Handling and Debug Mode (Information Disclosure)
Test: Force an error (for instance, by referencing an undefined variable) on a live page. If you see detailed error messages or stack traces, production debug settings are improperly configured.

Fix: In your wp-config.```php, make sure you have:

```php
define('WP_DEBUG', false);
define('WP_DEBUG_DISPLAY', false);
```

Instead, log errors to a secure location (using WP_DEBUG_LOG if necessary).

## 10. User Permissions and Capability Checks
Test: Try performing administrative actions (like deleting posts) when logged in as a lower-privilege user. If the action goes through, permission checks are lacking.

Vulnerable Example:

```php
if ( isset( $_GET['delete'] ) && $_GET['delete'] == 'true' ) {
    // Delete post without checking the user's capabilities.
    delete_post( $post_id );
}
```

Fix: Always check permissions using current_user_can():

```php
if ( isset( $_GET['delete'] ) && $_GET['delete'] == 'true' && current_user_can( 'delete_post', $post_id ) ) {
    delete_post( $post_id );
}
```

## 11. Directory and File Permissions (Server-Side Considerations)
Test: Check your server file and folder permissions. Files should generally be set to 644 and directories to 755. Overly permissive settings (like 777) can expose your site to abuse.

Fix: Correct your file permissions at the server level. This isn’t done via code in your theme but through your hosting file manager or command line. Review your server configuration to ensure secure permissions.


## 12. Theme Security Checker Class
```php
<?php
/**
 * Theme Security Checker
 *
 * A custom class that provides helper functions for sanitizing input,
 * escaping output, verifying nonces, adding security headers, and running basic checks.
 */

if ( ! class_exists( 'Theme_Security_Checker' ) ) {
    class Theme_Security_Checker {

        /**
         * Sanitize input based on the type.
         *
         * @param mixed  $input The user input.
         * @param string $type  The type of input: 'text', 'url', 'email', 'int'.
         * @return mixed Sanitized input.
         */
        public static function sanitize_input( $input, $type = 'text' ) {
            switch ( $type ) {
                case 'url':
                    return esc_url_raw( $input );
                case 'email':
                    return sanitize_email( $input );
                case 'int':
                    return absint( $input );
                case 'text':
                default:
                    return sanitize_text_field( $input );
            }
        }

        /**
         * Escape output based on context.
         *
         * @param string $data    The data to be escaped.
         * @param string $context The context: 'html', 'attr', or 'url'.
         * @return string Escaped output.
         */
        public static function escape_output( $data, $context = 'html' ) {
            switch ( $context ) {
                case 'attr':
                    return esc_attr( $data );
                case 'url':
                    return esc_url( $data );
                case 'html':
                default:
                    return esc_html( $data );
            }
        }

        /**
         * Verify a nonce field.
         *
         * @param string $nonce  The nonce value to verify.
         * @param string $action The corresponding action.
         * @return bool True if the nonce is valid, false otherwise.
         */
        public static function verify_nonce( $nonce, $action ) {
            return wp_verify_nonce( $nonce, $action );
        }

        /**
         * Add security headers to the HTTP response.
         *
         * Hook this method to the 'send_headers' action.
         */
        public static function add_security_headers() {
            header( "X-Frame-Options: SAMEORIGIN" );
            header( "X-Content-Type-Options: nosniff" );
            header( "X-XSS-Protection: 1; mode=block" );
            // Adjust the Content-Security-Policy based on your needs
            header( "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" );
        }

        /**
         * Run basic theme security checks.
         *
         * Currently checks if WP_DEBUG is enabled (should be disabled in production).
         *
         * @return array Array of security warnings.
         */
        public static function check_theme_security() {
            $warnings = array();

            // Ensure debugging is off
            if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
                $warnings[] = __( 'WP_DEBUG is enabled. It should be disabled in production environments.', 'your-theme-textdomain' );
            }

            // Additional custom checks can be added here.
            // For example, verifying if allowed upload mime types are configured properly.

            return $warnings;
        }
    }
}
```
### Usage Example
Integrate the helper class into your theme as follows:

Hook Security Headers: Add the security headers to every HTTP response by hooking into WordPress’s send_headers action:

```php
// In your theme's functions.php file
add_action( 'send_headers', array( 'Theme_Security_Checker', 'add_security_headers' ) );
Sanitize and Escape Dynamic Outputs: When using user input (for example, a search query), sanitize before processing and escape when outputting:
```

```php
// Retrieving a search query from the URL
$raw_search_query = isset( $_GET['s'] ) ? $_GET['s'] : '';
$sanitized_search = Theme_Security_Checker::sanitize_input( $raw_search_query, 'text' );

// Output the escaped search query in a heading
echo '<h1>Search results for: ' . Theme_Security_Checker::escape_output( $sanitized_search, 'html' ) . '</h1>';
Display Security Warnings in the Admin Area: Optionally, you can output any security warnings from your custom checks as admin notices:
```


```php
if ( is_admin() ) {
    add_action( 'admin_notices', function() {
        $warnings = Theme_Security_Checker::check_theme_security();
        if ( ! empty( $warnings ) ) {
            echo '<div class="notice notice-error"><ul>';
            foreach ( $warnings as $warning ) {
                echo '<li>' . esc_html( $warning ) . '</li>';
            }
            echo '</ul></div>';
        }
    } );
}
```

By combining the above checklist with custom helper functions in a centralized class, you can ensure that most common vulnerabilities (like XSS, SQL injection, and CSRF) are addressed in your theme. Moreover, this approach creates a reusable pattern for anytime you need to sanitize, escape, or even perform custom security checks as your theme evolves.
