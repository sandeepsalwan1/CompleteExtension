# Project Configuration (LTM)
[...]

---

## Core Goal

**Create** a local Python Flask API server within the existing `Svm` directory. This server must:
1. Load the pre-trained SVM model (`Svm/claim_verifier_model.joblib`).
2. Expose a POST API endpoint (e.g., `/predict` on localhost).
3. Accept text claims via the API, use the model to predict true/false classification and confidence score, and return the results as JSON.
4. Implement necessary CORS configuration.

**Modify** the Chrome Extension (`NewsFactChecker-main`) JavaScript code to:
1. Send extracted text claims to the local Flask API endpoint using the `Workspace` API.
2. Receive and handle the JSON response (classification and confidence).
3. Display the results in the extension UI.
4. Update `manifest.json` with required permissions for localhost access.

The overall objective is to establish a functional local development environment where the extension communicates with the newly created local backend API for fact-checking predictions.

---

## Tech Stack

* **Frontend (Extension):**
    * Project: `NewsFactChecker-main`
    * Language: JavaScript (ES6+)
    * APIs: Chrome Extension APIs, `Workspace` API
    * Manifest: `manifest.json` (Version 3)
    * Files: `popup.js`, `background.js`, `content.js`, `popup.html`, `popup.css`
* **Backend:**
    * Directory: `Svm`
    * Language: Python 3.x
    * Framework: Flask (Needs to be added/implemented)
    * ML Libraries: Joblib, Scikit-learn, NLTK, Pandas, Numpy (based on `Svm/requirements.txt`)
    * Model File: `Svm/claim_verifier_model.joblib`
    * Dependencies: `Svm/requirements.txt`
* **API Communication:**
    * Protocol: HTTP (POST)
    * Data Format: JSON
    * Server Address: `localhost` (configurable)
* **Environment:** Local Development

---
[...]