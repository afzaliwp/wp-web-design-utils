<?php
// The URL of the latest WordPress zip file.
$url = 'https://wordpress.org/latest.zip';

// Use file_get_contents to download the file.
$file = file_get_contents($url);

// The path where you want to save the file.
$path = './latest.zip';

// Use file_put_contents to save the file to your server.
file_put_contents($path, $file);

echo "WordPress downloaded successfully.";

//----------Allow bypass ssl

// The URL of the latest WordPress zip file.
$url = 'https://wordpress.org/latest.zip';

// Create a context with SSL verification disabled
$context = stream_context_create([
    'http' => [
        'timeout' => 300, // 5 minutes timeout
        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true,
    ]
]);

// Use file_get_contents with the context to download the file.
$file = file_get_contents($url, false, $context);

if ($file === false) {
    echo "Failed to download WordPress.";
    exit;
}

// The path where you want to save the file.
$path = './latest.zip';

// Use file_put_contents to save the file to your server.
$result = file_put_contents($path, $file);

if ($result !== false) {
    echo "WordPress downloaded successfully. File size: " . formatBytes($result);
} else {
    echo "Failed to save WordPress file.";
}

// Helper function to format file size
function formatBytes($size, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB');
    
    for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
        $size /= 1024;
    }
    
    return round($size, $precision) . ' ' . $units[$i];
}
?>
