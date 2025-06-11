## fix svg file for icon font
for file in *.svg; do   inkscape --actions="select-all; object-stroke-to-path; export-filename=$file; export-do" "$file"; done

---------------------------------------------------------------------------------------------------------------------------------

## create a WordPress block creator plugin
npx @wordpress/create-block@latest todo-list

---------------------------------------------------------------------------------------------------------------------------------

## Convert Images to webp in terminal
sudo apt install webp
cwebp -q 90 a.png -o output_file.webp  //for single file conversion

//For multiple file conversion (all images in a directory)
for file in *.png; do
    cwebp -q 90 "$file" -o "${file%.png}.webp"
done

## Resize by percentage
cwebp -q 90 -resize 50% 0 a.png -o output_file.webp

---------------------------------------------------------------------------------------------------------------------------------

## Upgrade Chrome browser on Ubuntu
sudo apt --only-upgrade install google-chrome-stable

---------------------------------------------------------------------------------------------------------------------------------

## convert to webp custom terminal command
1. Add this to your ~/.bashrc or ~/.zshrc file
2. source ~/.bashrc  # or source ~/.zshrc

```
ma90-to-webp() {
    local extension="png"
    local quality="90"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--extension)
                extension="$2"
                shift 2
                ;;
            -q|--quality)
                quality="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: ma90-to-webp [-e extension] [-q quality]"
                echo "  -e, --extension    File extension to convert (default: png)"
                echo "  -q, --quality      WebP quality 0-100 (default: 90)"
                echo "Example: ma90-to-webp -e jpg -q 85"
                return 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Use -h or --help for usage information"
                return 1
                ;;
        esac
    done
    
    # Check if cwebp is installed
    if ! command -v cwebp &> /dev/null; then
        echo "Error: cwebp is not installed. Install it with: sudo apt install webp"
        return 1
    fi
    
    # Check if any files with the specified extension exist
    if ! ls *."$extension" 1> /dev/null 2>&1; then
        echo "No .$extension files found in current directory"
        return 1
    fi
    
    echo "Converting *.$extension files to WebP with quality $quality..."
    
    # Convert files
    for file in *."$extension"; do
        if [[ -f "$file" ]]; then
            output_file="${file%.*}.webp"
            echo "Converting: $file -> $output_file"
            cwebp -q "$quality" "$file" -o "$output_file"
        fi
    done
    
    echo "Conversion complete!"
}
```

### Examples:
```
# Convert all PNG files with quality 90 (defaults)
ma90-to-webp

# Convert all JPG files with quality 85
ma90-to-webp -e jpg -q 85

# Convert all JPEG files with quality 75
ma90-to-webp -e jpeg -q 75

# Show help
ma90-to-webp -h
```

