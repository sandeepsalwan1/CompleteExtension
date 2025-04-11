# Project Configuration (LTM)

*This file contains the stable, long-term context for the project.*
*It should be updated infrequently, primarily when core goals, tech, or patterns change.*
*The AI reads this at the start of major tasks or phases.*

---

## Core Goal

Establish a functional local development environment connecting the Chrome Extension project (`sandeepsalwan1-newsfactchecker`) with a local Python/Flask backend (`svm_backend`). The backend will load a pre-trained SVM model (`claim_verifier_model.joblib`), and serve predictions (true/false classification + confidence score) based on text claims sent from the extension. The extension needs to be configured to communicate with this local API.

---

## Tech Stack

Your choice of tech stack is up to you. Any is acceptable. 

---

## Critical Patterns & Conventions

* **Backend API Endpoint:**
    * Method: `POST`
    * Request Body (JSON): `{ "claim": "Text of the claim to verify" }`
    * Response Body (Success - JSON): `{ "classification": "true" | "false", "confidence": <float> }`
    * Response Body (Error - JSON): `{ "error": "<error message>" }`
* **Backend Server:**
    * Must run within the `svm_backend` directory context.
    * Must load `claim_verifier_model.joblib` successfully on startup.
    * Must implement CORS (Cross-Origin Resource Sharing) correctly to allow requests from `chrome-extension://<your_extension_id>`. The extension ID will be needed.
* **Chrome Extension:**
    * Modify relevant JavaScript file(s) (e.g., `content_script.js`, `popup.js`, or `background.js` depending on architecture) to:
        * Extract the claim text.
        * Use the `Workspace` API to send a POST request to localhost with the claim in the JSON body.
        * Handle the JSON response (both success and error cases).
        * Display the `classification` and `confidence` score appropriately in the extension's UI.
    * Update `manifest.json` to include permissions for accessing localhost.
* **Error Handling:** Implement basic error handling on both sides (e.g., Flask returns 500 on model load failure, extension handles network errors or non-JSON responses).

---

## Key Constraints

* **Local Development Only:** This setup is strictly for local development and testing. Not intended for production deployment.
* **Existing Codebase:** Assume the basic structure of the Chrome Extension (`sandeepsalwan1-newsfactchecker`) and the `svm_backend` directory might exist. Focus is on configuring the interaction, API implementation, and environment setup.
* **Model File:** The `claim_verifier_model.joblib` file must be present and compatible with the Python environment's libraries (joblib, scikit-learn version).
* **Dependencies:**
    * Python dependencies (Flask, joblib, scikit-learn, etc.) must be managed, likely via a `requirements.txt` file in `svm_backend`.
    * Chrome Extension dependencies (if any) are managed via its structure.
* **Separate Processes:** The Flask server and the Chrome browser (running the extension) are separate processes that need to run concurrently during development.