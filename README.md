# ManSula BOS (POS & Billing System)

ManSula BOS is a modern, premium web-based Point of Sale (POS) and Billing System built with React and Vite. It is designed to be highly responsive, aesthetically pleasing, and easy to use.

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

### v1.6.0-alpha — Persistent Data, Home UI & Business Setup
*   **Feature: Home Hub** — A new premium Home screen with interactive tool cards. The app now boots to the Home screen instead of directly to the POS.
*   **Feature: Business Profile Tool** — New tool to manage business name, logo, contact info, and tax/legal details. Includes a read-only profile view and an edit mode.
*   **Feature: Dynamic Menu Management** — Add, edit, and delete products and categories directly from the Business Profile. Changes instantly sync to the POS.
*   **Feature: Persistent Storage** — Implemented IndexedDB (`db.js`) to persistently store the business profile, products, and categories across sessions.
*   **Feature: Backup & Restore** — Added an export/import feature to download your business data as a `.json` backup file and restore it on any device.
*   **Feature: App Data Reset** — Added a "Reset App Data" option with a 2-step confirmation in the Home settings to wipe all local storage and IndexedDB data.
*   **UI Polish: Seamless Navigation** — Cleaned up POS header; clicking the brand logo now intuitively navigates back to the Home Hub.

---

### v1.5.16-alpha — Cash Calculator & Payment Screen Polish
*   **Feature: Cash Note Calculator** — The cash payment screen now tracks the exact quantity of each currency note received (+₹500, +₹200, etc.) and automatically computes the total cash and required change.
*   **UI: Payment Screen Layout** — Reordered the payment screen so the active UPI QR and amount are fixed to the top, making the screen scannable without scrolling.
*   **UI: Expandable Order Summary** — The order summary bar on the payment screen defaults to a compact view showing only the total and order ID. Tapping it smoothly expands to reveal the full item list.
*   **UX: Mobile Cart Drawer** — Increased the maximum height of the mobile cart drawer to 92dvh to ensure the entire payment interface, including QR codes, fits comfortably on screen without internal scrolling.
*   **Fix: Note Wrapping** — Fixed an issue where currency amounts on chips would break onto a second line.

---

### v1.5.10-alpha — Persistent Alerts & UI Polish
*   **Feature: Persistent Alerts** — Watchdog alerts now stay at the bottom of the screen with a dismiss button instead of auto-hiding.
*   **UI: Centered Modal** — The checkout success modal is now perfectly centered on the screen and gracefully truncates long item lists with an expandable button.
*   **UX: Desktop Enhancements** — Added a "Complete" button that appears when hovering over orders in the desktop console, avoiding the need to swipe.
*   **Fix: Watchdog Config** — The custom watchdog timer input now hides the dropdown cleanly and functions without losing state.
*   **Polish: Alarms** — The overdue alarm synth sound is now softer and triggers a red error notification.

---

### v1.5.3-alpha — Watchdog & UX Guardrails
*   **Feature: Watchdog Timer** — Active orders now monitor their age. If they exceed the configured threshold (default 5 minutes, configurable in Settings), they trigger a toast alert and are highlighted with a red pulse in the Order Console.
*   **UX: Safe Swipe Thresholds** — Swipe-to-action on the cart bar and order rows now requires swiping at least 50% across the screen width, preventing accidental triggers.
*   **Logic: Empty Order Prevention** — The "New Order" button is now safely disabled with an alert if your currently active order is completely empty.

---

### v1.5.2-alpha — Swipe Actions & Order ID Polish
*   **UI: Swipeable Cart Bar** — The floating cart button on mobile expands into a swipeable bar. Swipe left-to-right to checkout, or right-to-left to clear the cart.
*   **UI: Swipeable Active Orders** — In the Order Console, you can now swipe left-to-right on any active order row to quickly mark it as completed.
*   **Polish: Order ID Font** — The starting integer of the Order ID (e.g. the `1` in `#1-17...`) is now styled with a significantly larger font size for easier readability.

---

### v1.5.1-alpha — Refinements
*   **Fix: Card Click Propagation** — Clicking the emoji itself on a product card now correctly triggers the cart addition.
*   **UI: Inline Order Details** — In the Order Console, clicking an order now expands the details inline (accordion style) rather than opening a new page, with a quick 'Switch' button.
*   **Fix: Order ID Format** — Orders now use the format `#N-DD/MM/YY` (e.g., `#1-17/06/26`) and start at 1.
*   **UI: Mobile Brand Name** — The "ManSula BOS" brand name is now visible on mobile, with correctly stylized casing.

---

### v1.5.0-alpha — Fixes & Order Detail View
*   **Fix: Card Click** — Clicking anywhere on a product card (including the emoji/image area) now reliably adds the item. Only clicking the `−` button decreases quantity.
*   **Fix: ORD-002 Missing** — Fixed React StrictMode double-invoke bug by creating the initial order at module scope instead of inside `useState`. ORD-001 → ORD-002 → ORD-003 now work correctly in sequence.
*   **Feature: Order Detail View** — Clicking any order row in the Order Console opens a detail panel showing the full item list, quantities, subtotal, tax, and total. Active orders also show a "Switch" button. Press back to return to the list.
*   **Fix: Settings Drawer on Right** — The settings panel now slides in from the right side (matching the hamburger position).
*   **UI: Removed Duplicate Button** — Removed the redundant orders clipboard icon from the header; the centre `#ORD-XXX` pill already opens the console.
*   **Feature: GST Disclaimer** — Added a ⚠️ Disclaimer button next to the Tax Rate selector in settings. Tapping it shows a legal notice clarifying that the user is responsible for configuring the correct GST slab, and ManSula BOS accepts no liability.
*   **UI: Responsive Overlay Scaling** — Card overlay controls (+/−/qty) and badges (Popular/New) now scale proportionally with the grid column size via `data-cols` CSS selectors.

---

### v1.4.0-alpha — Customization & Polish
*   **Feature: Currency Selector** — Choose between INR, USD, EUR, GBP, and AUD from the settings menu. Prices automatically convert.
*   **Feature: Tax Rate Selector** — Choose between No Tax (0%), and GST tiers (5%, 12%, 18%, 28%).
*   **Feature: Sound Effects** — Added subtle Web Audio API sound effects for adding items (rising pitch), removing items (falling pitch), and checkout (success chime) for a friendlier UX.
*   **Feature: Auto Grid Mode** — Added an "Auto" grid option that uses CSS grid auto-fill for responsive layouts by default. Replaces static columns.
*   **UI Polish: Empty State Cards** — Removed the large `+` button from cards when quantity is 0; the entire card is now cleanly clickable without visual clutter.
*   **UX: Hamburger Placement** — Moved the menu icon from the left side to the right side of the header for easier thumb access.
*   **Fix: Cart Overlay Z-Index** — The dark background overlay behind the mobile cart panel now correctly sits behind the panel rather than fading the panel itself.

---

### v1.3.0-alpha — Orders, Settings & Grid Control
*   **Feature: Settings Drawer** — 3-bar hamburger menu opens a left slide-in drawer with: dark/light theme toggle, product grid column selector (2/3/4 columns), currency info, and tax rate display.
*   **Feature: Order System** — Full multi-order management. Each session starts with `ORD-001`. Completing an order marks it as done and auto-creates a new one. Active and completed orders are stored in session.
*   **Feature: Order Console** — Right slide-in panel showing all active and past orders with timestamp, item count, and total. Click to switch between active orders. "New Order" button with dashed green style.
*   **Feature: Order ID in Header** — Current order ID (`#ORD-001`) displayed as a pill in the header. Clicking it opens the order console.
*   **Feature: Quick New Order Button** — Green `+` icon in the header creates a new order instantly with a toast confirmation.
*   **Feature: Grid Size Selector** — Switch between 2, 3, or 4 columns from the settings drawer. Preference saved to `localStorage`.
*   **Feature: INR Currency + GST** — All prices changed to Indian Rupees (₹). Tax updated to 5% GST.
*   **Fix: Qty Controls Overlap** — Removed the bottom-of-card quantity controls. Instead, a dark gradient overlay appears at the bottom of the card image with `−`, qty count, and `+` buttons — fully separated from the name/price row.

---

### v1.2.0-alpha — UI Polish & UX Improvements
*   **UX: Collapsible Search** — Search bar is now hidden by default on mobile. A search icon in the category toolbar opens a smooth slide-down search overlay, keeping the toolbar compact.
*   **UX: Inline Cart Qty on Cards** — Product cards now display the current cart quantity in a badge on the card image. When qty > 0, inline `−` and `+` controls appear; tapping the card always adds; the `−` button removes (shows trash icon at qty 1).
*   **UX: Toast Notification** — A green toast confirmation pops up on successful checkout instead of a plain header message.
*   **Design: Compact Mobile Cards** — Reduced image aspect ratio and padding on cards for mobile screens; more items visible without scrolling.
*   **Design: "In Cart" Card Highlight** — Cards with items in the cart show a subtle indigo border glow to visually indicate active state.
*   **Design: Dark Theme Refinement** — Deeper dark base (`#0d1117`), improved contrast ratios, border colours, and adjusted brand primary to `#818cf8` for better legibility in dark mode.
*   **Design: Premium Micro-interactions** — Emoji on cards rotate/scale on hover, add button pulses on click, qty badge animates in with a pop effect.

---

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
