# GitHub Copilot – ReceiptKeeper Repository Instructions

## APK Build & Deployment
- When downloading APK artifacts from GitHub Actions, ALWAYS replace `/storage/emulated/0/Download/ReceiptKeeper.apk` - do NOT create versioned copies like `ReceiptKeeper-<hash>.apk`
- Keep only ONE APK file: `ReceiptKeeper.apk` in the Downloads folder
- Also maintain a backup copy at `/home/sabata/ReceiptKeeper.apk`

## Project Context
- This is a React Native Android app for receipt management
- Development happens on-device in Termux environment
- Builds run via GitHub Actions CI, artifacts are downloaded via `gh` CLI
- No Android SDK available locally - all builds must go through CI

## Code Style
- Use functional React components with hooks
- Follow existing patterns in the codebase
- Keep components modular and reusable

## Security
- NEVER store full payment card numbers - only first digit and last 4 digits
- Use SQLite for local storage with proper encryption where needed
- No hardcoded credentials or API keys

## Testing & Builds
- Run lint checks before committing
- Commit messages should be descriptive with emoji prefixes when appropriate
- Push to master triggers GitHub Actions build

## File Organization
- React Native source in `src/`
- Android native code in `android/`
- Keep related functionality grouped in subdirectories
