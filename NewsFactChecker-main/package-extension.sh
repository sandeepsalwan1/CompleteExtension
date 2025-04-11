#!/bin/bash

# Create a clean build directory
rm -rf build
mkdir -p build

# Copy extension files to build directory
cp manifest.json build/
cp popup.html build/
cp popup.css build/
cp popup.js build/
cp content.js build/
cp background.js build/
cp -r icons build/

# Create screenshots directory for store listing
mkdir -p screenshots

echo "Extension files prepared in the 'build' directory"
echo "To create a ZIP file for Chrome Web Store submission:"
echo "cd build && zip -r ../NewsFactChecker.zip *"
echo ""
echo "Don't forget to create proper icon files before submission!"
echo "Take screenshots of the extension in action and save them in the 'screenshots' directory." 