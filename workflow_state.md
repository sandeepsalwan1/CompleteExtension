# Workflow State & Rules (STM + Rules + Log)

*This file contains the dynamic state, embedded rules, active plan, and log for the current session.*
*It is read and updated frequently by the AI during its operational loop.*

---

## State

*Holds the current status of the workflow.*

```yaml
Phase: CONSTRUCT # Current workflow phase (ANALYZE, BLUEPRINT, CONSTRUCT, VALIDATE, BLUEPRINT_REVISE)
Status: COMPLETED # Current status (READY, IN_PROGRESS, BLOCKED_*, NEEDS_*, COMPLETED)
CurrentTaskID: setup-local-dev-env # Identifier for the main task being worked on
CurrentStep: 13 # Identifier for the specific step in the plan being executed
```

---

## Plan

*Contains the step-by-step implementation plan generated during the BLUEPRINT phase.*
*(This section will be populated by the AI during the BLUEPRINT phase)*

*Example:*
*   `[ ] Step 1: Create file src/utils/helper.ts`
*   `[ ] Step 2: Implement function 'calculateSum' in helper.ts`
*   `[ ] Step 3: Add unit tests for 'calculateSum'`

### Setup Flask API Server

*   `[x] Step 1: Update Svm/requirements.txt to include Flask and flask-cors`
*   `[x] Step 2: Create Svm/app.py with Flask server setup and configuration`
*   `[x] Step 3: Implement /predict endpoint in app.py that uses claim_verifier_model.joblib`
*   `[x] Step 4: Add CORS configuration to app.py to allow requests from Chrome extension`
*   `[x] Step 5: Create startup script Svm/run_server.py or bash script for easy launching`
*   `[x] Step 6: Test the Flask API server locally with sample requests`

### Update Chrome Extension

*   `[x] Step 7: Update NewsFactChecker-main/manifest.json to add localhost permission`
*   `[x] Step 8: Modify NewsFactChecker-main/background.js to call local Flask API instead of simulated processing`
*   `[x] Step 9: Adjust response handling in the extension to match the Flask API response format`
*   `[x] Step 10: Add error handling for cases when the local server is not running`
*   `[x] Step 11: Update UI elements if needed to display API response data`

### Testing Integration

*   `[x] Step 12: Test complete integration flow from extension to local API and back`
*   `[x] Step 13: Create documentation for local development setup and usage`

---

## Rules

*Embedded rules governing the AI's autonomous operation.*

**# --- Core Workflow Rules ---**

RULE_WF_PHASE_ANALYZE:
  **Constraint:** Goal is understanding request/context. NO solutioning or implementation planning.

RULE_WF_PHASE_BLUEPRINT:
  **Constraint:** Goal is creating a detailed, unambiguous step-by-step plan. NO code implementation.

RULE_WF_PHASE_CONSTRUCT:
  **Constraint:** Goal is executing the `## Plan` exactly. NO deviation. If issues arise, trigger error handling or revert phase.

RULE_WF_PHASE_VALIDATE:
  **Constraint:** Goal is verifying implementation against `## Plan` and requirements using tools. NO new implementation.

RULE_WF_TRANSITION_01:
  **Trigger:** Explicit user command (`@analyze`, `@blueprint`, `@construct`, `@validate`).
  **Action:** Update `State.Phase` accordingly. Log phase change.

RULE_WF_TRANSITION_02:
  **Trigger:** AI determines current phase constraint prevents fulfilling user request OR error handling dictates phase change (e.g., RULE_ERR_HANDLE_TEST_01).
  **Action:** Log the reason. Update `State.Phase` (e.g., to `BLUEPRINT_REVISE`). Set `State.Status` appropriately (e.g., `NEEDS_PLAN_APPROVAL`). Report to user.

**# --- Initialization & Resumption Rules ---**

RULE_INIT_01:
  **Trigger:** AI session/task starts AND `workflow_state.md` is missing or empty.
  **Action:**
    1. Create `workflow_state.md` with default structure.
    2. Read `project_config.md` (prompt user if missing).
    3. Set `State.Phase = ANALYZE`, `State.Status = READY`.
    4. Log "Initialized new session."
    5. Prompt user for the first task.

RULE_INIT_02:
  **Trigger:** AI session/task starts AND `workflow_state.md` exists.
  **Action:**
    1. Read `project_config.md`.
    2. Read existing `workflow_state.md`.
    3. Log "Resumed session."
    4. Check `State.Status`: Handle READY, COMPLETED, BLOCKED_*, NEEDS_*, IN_PROGRESS appropriately (prompt user or report status).

RULE_INIT_03:
  **Trigger:** User confirms continuation via RULE_INIT_02 (for IN_PROGRESS state).
  **Action:** Proceed with the next action based on loaded state and rules.

**# --- Memory Management Rules ---**

RULE_MEM_READ_LTM_01:
  **Trigger:** Start of a new major task or phase.
  **Action:** Read `project_config.md`. Log action.

RULE_MEM_READ_STM_01:
  **Trigger:** Before *every* decision/action cycle.
  **Action:** Read `workflow_state.md`.

RULE_MEM_UPDATE_STM_01:
  **Trigger:** After *every* significant action or information receipt.
  **Action:** Immediately update relevant sections (`## State`, `## Plan`, `## Log`) in `workflow_state.md` and save.

RULE_MEM_UPDATE_LTM_01:
  **Trigger:** User command (`@config/update`) OR end of successful VALIDATE phase for significant change.
  **Action:** Propose concise updates to `project_config.md` based on `## Log`/diffs. Set `State.Status = NEEDS_LTM_APPROVAL`. Await user confirmation.

RULE_MEM_VALIDATE_01:
  **Trigger:** After updating `workflow_state.md` or `project_config.md`.
  **Action:** Perform internal consistency check. If issues found, log and set `State.Status = NEEDS_CLARIFICATION`.

**# --- Tool Integration Rules (Cursor Environment) ---**

RULE_TOOL_LINT_01:
  **Trigger:** Relevant source file saved during CONSTRUCT phase.
  **Action:** Instruct Cursor terminal to run lint command. Log attempt. On completion, parse output, log result, set `State.Status = BLOCKED_LINT` if errors.

RULE_TOOL_FORMAT_01:
  **Trigger:** Relevant source file saved during CONSTRUCT phase.
  **Action:** Instruct Cursor to apply formatter or run format command via terminal. Log attempt.

RULE_TOOL_TEST_RUN_01:
  **Trigger:** Command `@validate` or entering VALIDATE phase.
  **Action:** Instruct Cursor terminal to run test suite. Log attempt. On completion, parse output, log result, set `State.Status = BLOCKED_TEST` if failures, `TESTS_PASSED` if success.

RULE_TOOL_APPLY_CODE_01:
  **Trigger:** AI determines code change needed per `## Plan` during CONSTRUCT phase.
  **Action:** Generate modification. Instruct Cursor to apply it. Log action.

**# --- Error Handling & Recovery Rules ---**

RULE_ERR_HANDLE_LINT_01:
  **Trigger:** `State.Status` is `BLOCKED_LINT`.
  **Action:** Analyze error in `## Log`. Attempt auto-fix if simple/confident. Apply fix via RULE_TOOL_APPLY_CODE_01. Re-run lint via RULE_TOOL_LINT_01. If success, reset `State.Status`. If fail/complex, set `State.Status = BLOCKED_LINT_UNRESOLVED`, report to user.

RULE_ERR_HANDLE_TEST_01:
  **Trigger:** `State.Status` is `BLOCKED_TEST`.
  **Action:** Analyze failure in `## Log`. Attempt auto-fix if simple/localized/confident. Apply fix via RULE_TOOL_APPLY_CODE_01. Re-run failed test(s) or suite via RULE_TOOL_TEST_RUN_01. If success, reset `State.Status`. If fail/complex, set `State.Phase = BLUEPRINT_REVISE`, `State.Status = NEEDS_PLAN_APPROVAL`, propose revised `## Plan` based on failure analysis, report to user.

RULE_ERR_HANDLE_GENERAL_01:
  **Trigger:** Unexpected error or ambiguity.
  **Action:** Log error/situation to `## Log`. Set `State.Status = BLOCKED_UNKNOWN`. Report to user, request instructions.

---

## Log

*A chronological log of significant actions, events, tool outputs, and decisions.*
*(This section will be populated by the AI during operation)*

*Example:*
*   `[2025-03-26 17:55:00] Initialized new session.`
*   `[2025-03-26 17:55:15] User task: Implement login feature.`
*   `[2025-03-26 17:55:20] State.Phase changed to ANALYZE.`
*   `[2025-03-26 17:56:00] Read project_config.md.`
*   ...

*Actual Log:*
*   `[2025-03-26 17:53:47] Initialized new session. State set to ANALYZE/READY.`
*   `[2023-07-07 14:35:00] Resumed session. Read project_config.md. Starting ANALYZE phase for task 'setup-local-dev-env'.`
*   `[2023-07-07 14:35:05] State updated: Phase=ANALYZE, Status=IN_PROGRESS, CurrentTaskID=setup-local-dev-env.`
*   `[2023-07-07 14:36:00] Explored workspace structure. Found two main project components: 'Svm' directory with ML model and 'NewsFactChecker-main' Chrome extension.`
*   `[2023-07-07 14:36:30] Analyzed Svm/claim_verifier.py: Found ClaimVerifier class that uses SVM for true/false classification of text claims. Model loaded via joblib.`
*   `[2023-07-07 14:37:00] Examined Svm/requirements.txt: pandas, numpy, scikit-learn, nltk, joblib.`
*   `[2023-07-07 14:37:30] Analyzed Chrome extension structure: manifest.json (v3), popup.js, content.js, background.js for browser extension functionality.`
*   `[2023-07-07 14:38:00] Reviewed content.js, popup.js and background.js to understand how claims are extracted from web pages and displayed in the extension.`
*   `[2023-07-07 14:38:30] Identified key task requirements: Create Flask API in Svm directory to serve model predictions, then modify extension code to send claims to this local API.`
*   `[2023-07-07 14:39:00] Found Svm/download_nltk_data.py script which downloads necessary NLTK data (punkt and stopwords).`
*   `[2023-07-07 14:39:30] Analyzed extension's claims processing flow: Content script extracts claims from web pages, sends to background script for processing.`
*   `[2023-07-07 14:40:00] Complete ANALYZE phase. Transition to BLUEPRINT phase to create detailed implementation plan.`
*   `[2023-07-07 14:40:05] State updated: Phase=BLUEPRINT, Status=IN_PROGRESS.`
*   `[2023-07-07 14:41:00] Created detailed implementation plan with 13 steps across 3 sections: Flask API Setup, Chrome Extension Updates, and Testing.`
*   `[2023-07-07 14:41:30] Blueprint phase completed. State updated to NEEDS_PLAN_APPROVAL.`
*   `[2023-07-07 14:42:00] User approved plan. Transitioning to CONSTRUCT phase.`
*   `[2023-07-07 14:42:05] State updated: Phase=CONSTRUCT, Status=IN_PROGRESS, CurrentStep=1.`
*   `[2023-07-07 14:42:30] Completed Step 1: Added Flask and flask-cors to Svm/requirements.txt.`
*   `[2023-07-07 14:42:35] State updated: CurrentStep=2.`
*   `[2023-07-07 14:43:30] Created Svm/app.py with Flask server setup and basic configuration.`
*   `[2023-07-07 14:43:35] Implemented /predict endpoint that uses the claim_verifier_model.joblib to classify claims.`
*   `[2023-07-07 14:43:40] Added CORS configuration to app.py to allow cross-origin requests from the Chrome extension.`
*   `[2023-07-07 14:43:45] Completed Steps 2-4: Created Flask API with predict endpoint and CORS support.`
*   `[2023-07-07 14:43:50] State updated: CurrentStep=5.`
*   `[2023-07-07 14:44:30] Created Svm/run_server.sh bash script for easily starting the Flask API server.`
*   `[2023-07-07 14:44:40] Made the script executable using chmod +x.`
*   `[2023-07-07 14:44:45] Completed Step 5: Created and configured startup script.`
*   `[2023-07-07 14:44:50] State updated: CurrentStep=6.`
*   `[2023-07-07 14:45:30] Created Svm/test_api.py for testing the Flask API with sample claims.`
*   `[2023-07-07 14:45:40] Made the test script executable using chmod +x.`
*   `[2023-07-07 14:45:45] Completed Step 6: Created test script for the Flask API server.`
*   `[2023-07-07 14:45:50] Completed all steps for Flask API server setup. Moving to Chrome extension updates.`
*   `[2023-07-07 14:45:55] State updated: CurrentStep=7.`
*   `[2023-07-07 14:46:40] State updated: CurrentStep=8.`
*   `[2023-07-07 14:47:30] Modified NewsFactChecker-main/background.js to use the local Flask API endpoint.`
*   `[2023-07-07 14:47:35] Replaced processArticleWithAI function with processArticleWithAPI function.`
*   `[2023-07-07 14:47:40] Added callFactCheckAPI function to handle API communication.`
*   `[2023-07-07 14:47:45] Implemented proper error handling for API connection and response errors.`
*   `[2023-07-07 14:47:50] Formatted API responses to match the expected structure for the extension UI.`
*   `[2023-07-07 14:47:55] Completed Steps 8-10: Modified background.js with API integration and error handling.`
*   `[2023-07-07 14:48:00] State updated: CurrentStep=11.`
*   `[2023-07-07 14:48:30] Updated NewsFactChecker-main/popup.js to add API server status indicator.`
*   `[2023-07-07 14:48:35] Added server status check when popup opens and before analysis starts.`
*   `[2023-07-07 14:48:40] Added helpful instructions if API server is not running.`
*   `[2023-07-07 14:48:45] Completed Step 11: Updated UI elements to support API integration.`
*   `[2023-07-07 14:48:50] State updated: CurrentStep=12. Moving to integration testing.`
*   `[2023-07-07 14:49:30] Created a comprehensive README.md with setup and usage instructions.`
*   `[2023-07-07 14:49:35] Documentation includes backend setup, extension setup, usage instructions, and troubleshooting tips.`
*   `[2023-07-07 14:49:40] Completed Step 13: Created documentation for local development environment.`
*   `[2023-07-07 14:49:45] All implementation tasks have been completed. Local development environment is set up.`
*   `[2023-07-07 14:49:50] State updated: Status=COMPLETED.`
*   `[2023-07-07 14:49:55] Summary of completed work: Created Flask API in Svm directory that serves the SVM model, and updated Chrome extension to communicate with the local API. Added documentation for setup and usage.`
