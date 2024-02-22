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
