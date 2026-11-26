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


## 2026-11-26 — Add official X social profile

- Added the user-provided Zeeroz Academy X profile link (`https://x.com/Zeerozacademy`) to the public homepage footer social icon row.
- Used an inline SVG X mark, accessible label, and safe new-tab link attributes; no external icon library or script added.
- File changed: `zeeroz-academy/index.html`.
- Deployment: published through the existing GitHub Pages workflow after commit; verify the run and public mirror before marking live.

 
## 2026-11-26 — Zeeroz Career & Test Preparation portal foundation

- Expanded the existing Job Preparation route (catalog.html?level=jobs) into a dedicated Career & Test Preparation hub with nine pathways: IBA, SIBA Testing Services (STS), CBA (identity pending confirmation), SPSC, FPSC, NTS, MDCAT, ECAT and MBBS/BDS admission guidance.
- Added mobile-responsive search and category filters, verified official-source links where available, shared-skill overview, and an interactive three-question timed demonstration quiz with scoring and explanations. The quiz is explicitly labelled as a generic demonstration and does not claim to represent an official paper or save student marks.
- Kept the existing Sindh Teaching Licence preparation portal visible as the currently available dedicated preparation programme.
- Added syllabus/source safeguards: post-specific notices and current prospectuses determine the syllabus, paper structure, negative marking and time limits; ECAT patterns are institution-specific; CBA's intended organisation must be confirmed before publishing an exam-specific course.
- Updated homepage Career & Test Prep links to the expanded portal.
- No Firebase rules, authentication, billing, paid API, credentials or student records changed. This is the portal/UI foundation; the course-to-exam mapping, verified content extraction, exam-specific question banks, authenticated test attempts and persistent analytics remain the next implementation stages.
- Official references checked: https://sts.net.pk/ ; https://nts.org.pk/ ; https://spsc.gov.pk/Syllabus.php ; https://fpsc.gov.pk/ ; https://pmdc.pk/ ; https://www.iba.edu.pk/.
- Deployment and automated checks must pass before describing the new portal as live.
