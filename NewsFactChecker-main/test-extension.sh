#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}NewsFactChecker Extension Testing Script${NC}"
echo -e "---------------------------------------\n"

echo -e "${YELLOW}Step 1: Opening Chrome Extensions page${NC}"
echo -e "Please make sure Chrome is installed and running."
echo -e "1. Navigate to chrome://extensions/ in your browser"
echo -e "2. Enable 'Developer mode' (toggle in top-right corner)"
echo -e "3. Click 'Load unpacked' and select this directory"
echo -e "4. Make sure the extension appears in your browser\n"

read -p "Press Enter after completing Step 1..."

echo -e "\n${YELLOW}Step 2: Prepare to test the extension${NC}"

# Get absolute path to demo.html
DEMO_PATH="file://$(pwd)/demo.html"

echo -e "Opening the demo.html file in Chrome for testing..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open -a "Google Chrome" "$DEMO_PATH"
else
    # Linux
    google-chrome "$DEMO_PATH" || xdg-open "$DEMO_PATH"
fi

echo -e "\n${YELLOW}Step 3: Test the extension${NC}"
echo -e "1. Click on the NewsFactChecker extension icon in Chrome"
echo -e "2. Click 'Check This Article' in the popup"
echo -e "3. Wait for the analysis to complete"
echo -e "\n${GREEN}Verification checklist:${NC}"
echo -e "✓ All percentage values are correctly highlighted (complete values, not partial)"
echo -e "✓ Each correction has a source link provided"
echo -e "✓ Hovering over corrections shows a tooltip with the correct value and source"
echo -e "✓ The footnote at the bottom of the article includes source links"
echo -e "✓ The popup interface displays the corrections with source links"

echo -e "\n${BLUE}Testing Complete!${NC}"
echo -e "If all checklist items passed, your extension is working correctly."
echo -e "If there are any issues, review the console output for errors (Right-click > Inspect > Console)." 