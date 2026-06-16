# Mansula Nexus (POS & Billing System)

Mansula Nexus is a modern, premium web-based Point of Sale (POS) and Billing System built with React and Vite. It is designed to be highly responsive, aesthetically pleasing, and easy to use.

## Architecture

This project uses a dual-repository deployment strategy:
1. **Private Repository (`mansula-nexus`)**: Houses the source code and development history.
2. **Public Repository (`mansula-nexus-public`)**: Hosts the compiled build output (`dist/` folder) for public viewing via GitHub Actions.

## Tech Stack

*   **Frontend Framework**: React (Vite)
*   **Styling**: Premium Vanilla CSS (Custom properties, Glassmorphism, Dark Theme)
*   **Typography**: Google Fonts (Outfit)

## Development Setup

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the local development server.
4. Run `npm run build` to compile the project.

---

## Changelog

### v1.0.0-alpha (Current)
*   **Project Initialization**: Set up Vite + React template.
*   **Base Styling**: Added `index.css` with a premium dark theme, glassmorphism utilities, and brand color tokens.
*   **CI/CD Pipeline**: Configured `.github/workflows/deploy.yml` to automatically build and push the `dist/` output to the `mansula-nexus-public` repository upon changes to the `main` branch.
*   **UI Foundation**: Cleared base template to prepare for step-by-step feature implementation.
