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

### v1.1.0-alpha — POS Product Grid UI
*   **Feature: Product Catalog** — 16 sample items across 5 categories (Coffee, Tea, Food, Bakery, Drinks) displayed in a responsive card grid with emoji icons, prices, and "Popular/New" badges.
*   **Feature: Category Filter** — Horizontally scrollable chip-style category filter bar to quickly browse item types.
*   **Feature: Search** — Real-time search input that filters items by name instantly.
*   **Feature: Shopping Cart** — Full cart management with add, increase/decrease quantity, remove, and clear-all functionality.
*   **Feature: Order Totals** — Live-calculated subtotal, 8% tax, and grand total displayed in the cart panel.
*   **Feature: Checkout** — "Charge $X.XX" button that clears the cart and shows a confirmation message.
*   **Feature: Light & Dark Theme** — Full light/dark theme toggle saved to `localStorage`, applied via CSS custom properties on `data-theme` attribute.
*   **Design: Mobile-First Responsive** — On mobile, cart slides up as a bottom sheet drawer with an FAB (floating action button) to open it. Desktop shows a fixed side-by-side layout.
*   **Design: Premium UI** — Glassmorphism accents, smooth animations, hover/active micro-interactions on every element.

---

### v1.0.0-alpha — Project Initialization
*   **Project Initialization**: Set up Vite + React template.
*   **Base Styling**: Added `index.css` with a premium dark theme, glassmorphism utilities, and brand color tokens.
*   **CI/CD Pipeline**: Configured `.github/workflows/deploy.yml` to automatically build and push the `dist/` output to the `mansula-nexus-public` repository upon changes to the `main` branch.
*   **UI Foundation**: Cleared base template to prepare for step-by-step feature implementation.
