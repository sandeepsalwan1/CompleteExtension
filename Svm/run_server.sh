#!/bin/bash

# Display startup message
echo "Starting News Fact Checker Local API Server..."

# Ensure NLTK data is downloaded
echo "Ensuring NLTK data is available..."
python download_nltk_data.py

# Run the Flask application
echo "Starting Flask server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
python app.py
