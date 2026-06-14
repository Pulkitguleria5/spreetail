# AI_USAGE.md - AI Collaboration Log

## AI Tools Used
* **Primary AI Collaborator**: Google DeepMind's Antigravity coding assistant.
* **Model**: Gemini 3.5 Flash (Medium).

## Key Prompts & Directives
* **Prompt 1**: "read this pdf carefully line by line each and everything and then see this whole project expense app and make required changes to fulfill all the things present in pdf"
* **Directive**: Move database structure to relational models (SQLite) and design an interactive multi-step wizard for parsing 12+ CSV anomalies, validating timelines, handling multiple currencies, itemizing balances, and simplifying transactions.

---

## Concrete Cases of AI Correction

Here are three concrete cases during development where the AI model made an error, how it was caught, and how we resolved it:

### 1. PowerShell Script Execution Policy Blocking `npm install`
* **Error**: The AI initially ran the dependency installation using standard `npm install sequelize sqlite3` in a PowerShell terminal. This failed with a `SecurityError: UnauthorizedAccess` because running scripts is disabled in PowerShell on the host OS.
* **How caught**: The shell output from `run_command` threw a clear error indicating `npm.ps1 cannot be loaded because running scripts is disabled`.
* **Resolution**: The AI pivoted to run the command via `cmd.exe /c npm install sequelize sqlite3`. This ran the native `npm.cmd` directly in the CMD environment, bypassing the PowerShell execution policy restriction.

### 2. Artifact Metadata Validation Failure on Project Code Files
* **Error**: The AI tried to write the new Sequelize connection file `db.js` into the `expense-server` directory while specifying `ArtifactMetadata`. The tool parser threw an error stating that `ArtifactMetadata` is reserved only for artifacts inside the designated brain/conversation directory, and project code files are not allowed to contain it.
* **How caught**: The tool returned an `invalid_args` error from the system.
* **Resolution**: The AI realized it was writing a project file rather than a documentation artifact, removed the `ArtifactMetadata` block from the arguments list, and re-executed the file creation successfully.

### 3. Stray Duplicate Closing List Item Tag (`</li></li>`) in `UserHeader.jsx`
* **Error**: When applying the replacement block to register the new `/import` route link inside `UserHeader.jsx`, the AI introduced a duplicate list item closing tag (`</li></li>`) on line 128 of the navigation list.
* **How caught**: The AI reviewed the applied file diff output and noticed the stray syntax. If left unchanged, this would have caused a JSX compile-time error.
* **Resolution**: The AI immediately did a targeted search and replace operation to clean up line 128, changing `</li></li>` back to a single `</li>` tag, restoring valid JSX syntax.

### 4. CommonJS vs ES Modules Syntax Error in React Client
* **Error**: When rewriting `AddExpenseModal.jsx` for split type select UI, the AI used CommonJS (`require` and `module.exports`) instead of ES Modules (`import` and `export default`).
* **How caught**: Vite dev server failed to compile and threw a runtime error: `The requested module '/src/components/AddExpenseModal.jsx' does not provide an export named 'default'`.
* **Resolution**: The AI replaced the CommonJS syntax in `AddExpenseModal.jsx` with standard ES Modules syntax (`import` and `export default`), allowing Vite to compile successfully.
