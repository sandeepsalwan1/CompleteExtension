# News Fact Checker - Local Development Environment

This project consists of two main components:
1. A Chrome Extension for fact-checking claims in news articles
2. A local Flask API that uses an SVM model to predict the truthfulness of claims

## Setup Instructions

### Prerequisites
- Python 3.x
- Chrome or Chromium-based browser
- Git (to clone the repository)

### Backend Setup (Flask API)

1. Navigate to the `Svm` directory:
   ```
   cd Svm
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Download the necessary NLTK data:
   ```
   python download_nltk_data.py
   ```

4. Start the Flask server:
   ```
   ./run_server.sh
   ```
   
   The server will run on http://localhost:5000

5. You can test the API separately:
   ```
   python test_api.py
   ```

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the `NewsFactChecker-main` directory
4. The extension should now be installed and visible in your browser toolbar

## Usage

1. Make sure the Flask API server is running (`./Svm/run_server.sh`)
2. Click on the News Fact Checker extension icon in your browser toolbar
3. The extension will check if the API server is running and display its status
4. Click "Check This Article" to analyze the current webpage
5. The extension will extract claims from the article, send them to your local API for verification, and display the results

## Development Workflow

### Backend (Flask API)
- The Flask API is defined in `Svm/app.py`
- It loads the pre-trained SVM model from `Svm/claim_verifier_model.joblib`
- The `/predict` endpoint accepts POST requests with JSON data containing a `claim` field
- The response includes the prediction (true/false) and confidence score

### Frontend (Chrome Extension)
- The extension consists of the following main components:
  - `manifest.json`: Extension configuration and permissions
  - `popup.html/js/css`: The UI shown when clicking the extension icon
  - `content.js`: Extracts article content from the current webpage
  - `background.js`: Handles communication with the Flask API

## Troubleshooting

- **API Server Not Running**: If the extension shows "API Server is not running", make sure you've started the Flask server with `./Svm/run_server.sh`
- **CORS Issues**: If you're seeing CORS errors, ensure the Flask server has CORS properly configured in `app.py`
- **Model Loading Errors**: Check that the model file exists at `Svm/claim_verifier_model.joblib` and that the required Python packages are installed

## License

This project is licensed under the MIT License - see the LICENSE file for details. 