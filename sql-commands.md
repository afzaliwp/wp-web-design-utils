## replace a string with another on posts table
```
UPDATE wp_posts SET post_content = REPLACE (post_content, 'localhost/test/', 'www.yourlivesite.com/');
```

# full url replacement commands
## Update site URLs
```
UPDATE wp_options
SET option_value = REPLACE(option_value, 'old', 'new')
WHERE option_name IN ('home', 'siteurl');
```

## Update post content links
```
UPDATE wp_posts
SET post_content = REPLACE(post_content, 'old', 'new');
```

## Update post GUIDs
```
UPDATE wp_posts
SET guid = REPLACE(guid, 'old', 'new');
```

## Update user URLs (if used)
```
UPDATE wp_users
SET user_url = REPLACE(user_url, 'old', 'new');
```

## Update serialized and plain-text meta values
```
UPDATE wp_postmeta
SET meta_value = REPLACE(meta_value, 'old', 'new');
```

## Downloadable product links
```
UPDATE wp_woocommerce_downloadable_product_permissions
SET download_url = REPLACE(download_url, 'old', 'new');
```


