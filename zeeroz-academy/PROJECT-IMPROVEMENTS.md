# Zeeroz Academy — Project Improvement Log

## 2026-11-26 — Material 3-inspired web component layer

- **Product:** Zeeroz Academy public homepage, course catalogue, student dashboard and sign-in page.
- **Opportunity:** Existing pages used several independent visual patterns. Apply a consistent component language based on Material Design 3 without changing the learning flows or replacing the existing brand.
- **Design references:** Google's Material Design 3 component guidance for cards (elevated/filled/outlined), buttons (filled/tonal/outlined), chips, text fields and adaptive navigation. See https://m3.material.io/components and https://developer.android.com/design/ui/mobile/guides/components/material-overview.
- **Implementation:** Extended the existing shared `assets/zeeroz-design-system.css` with M3-inspired semantic colour roles, shape/elevation tokens, button states, card surfaces, filter chips, filled text fields and segmented sign-in tabs. Loaded the shared stylesheet on the catalogue and sign-in pages; the homepage and student dashboard already referenced it.
- **Files changed:**
  - `zeeroz-academy/assets/zeeroz-design-system.css`
  - `zeeroz-academy/catalog.html`
  - `zeeroz-academy/student-login.html`
- **Preserved:** Existing Zeeroz colours/branding, navigation structure, page routes, Firebase/auth scripts, catalogue filters, visual demos and student data flows.
- **Free-resource and licence check:** No third-party package, font, icon CDN, API, storage or external runtime added. Implementation is original CSS using browser-native features; no new licence or account/quota/card/billing requirement.
- **Checks performed:** Confirmed the shared stylesheet is loaded by the homepage and student dashboard already; added it to catalogue and sign-in pages. CSS selector scopes target known page structures; reduced-motion and visible keyboard focus styles included. Source edits committed to `main`.
- **Deployment status:** Awaiting existing GitHub Pages deployment workflow and public-page verification. Do not mark live until the workflow and deployed pages are checked.
- **Next priorities:** Check mobile catalogue filter wrapping and student login form at narrow widths; inspect lesson and admin pages for shared stylesheet coverage; then refine M3 list rows, progress indicators and course navigation only where they improve task completion.
