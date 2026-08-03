# Contributing to VibeGrid ⚡

Thank you for your interest in contributing to VibeGrid! VibeGrid is a free, open-source GPU-accelerated terminal workspace for developers built with Tauri 2, Rust, React, TypeScript, and xterm.js.

## Getting Started

1. **Fork and clone** the repository.
2. Ensure you have Node.js (v18+) and Rust (v1.75+) installed.
3. Install frontend dependencies:
   ```bash
   npm install
   ```
4. Run dev server:
   ```bash
   npm run tauri dev
   ```

## Guidelines

- **TypeScript**: Run `npx tsc --noEmit` before submitting a pull request to verify zero type errors.
- **Rust**: Ensure all Rust unit tests pass via `cargo test` in `src-tauri`.
- **Code Style**: Run `npm run format` and `cargo fmt`.

## Submitting Pull Requests

- Open a PR targeting the `main` branch.
- Describe the feature or bugfix clearly.
- Ensure all CI checks pass.
