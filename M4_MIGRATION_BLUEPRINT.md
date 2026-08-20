# M4 MIGRATION BLUEPRINT: DRUG DISCOVERY STUDIO
**Target Hardware:** Apple Silicon M4 Mac Mini (ARM64 / Unified Memory)  
**Source Platform:** Dell Linux (x86_64 / Ubuntu)  
**Repository:** `michaeljanis/DrugDiscoveryStudio` (`git@github.com:michaeljanis/DrugDiscoveryStudio.git`)  
**Production URL:** https://drugdiscovery.studio  
**Cloud Run Target:** `catalyst-ai` in `us-central1` (Serving 100% traffic, Revision `catalyst-ai-00059-hjk`)  
**Status:** Live XPRIZE Submission — Critical Production Asset  

---

## 1. REPOSITORY PURPOSE & CORE SCIENTIFIC VALUE
DrugDiscovery.Studio is an autonomous biomedical intelligence platform designed to eliminate the 40-year "Undiscovered Public Knowledge" paradox formulated by Don Swanson. It solves the literature island problem by connecting **13.1 million empirical co-occurrence edges across 38.2 million PubMed abstracts**, cross-referencing live biomedical databases (**ChEMBL 34**, **Open Targets**, **Europe PMC**), and pairing researchers with an elite, domain-grounded **Translational Bio-AI Copilot**.

### Mathematical & Topological Foundation
* **Closed Discovery:** Given Drug A and Disease C, extracts the intersection neighborhood $B = N(A) \cap N(C)$ where direct co-occurrence $	ext{Direct}(A, C) = 0$.
* **Open Discovery:** Projects all multi-hop paths outward from Concept A to discover previously unassociated disease phenotypes ranked by topological mutual information density.
* **Epistemic Falsification:** Front-loads blood-brain barrier (BBB) permeability and Lipinski Rule-of-5 constraints to de-risk preclinical candidates before wet-lab assay commitment.

---

## 2. CODEBASE TOPOGRAPHY & CRITICAL FILE PATHS

```
DrugDiscoveryStudio/
├── server.js                          # Full-stack Express backend & API router (ES Modules)
├── Dockerfile                         # Cloud Run container definition (Node 22 Slim)
├── deploy.sh                          # One-click zero-downtime Google Cloud Run deployment script
├── vite.config.ts                     # Vite build configuration with React plugin
├── tsconfig.json / tsconfig.app.json  # TypeScript strict compiler configurations
├── package.json                       # npm dependencies and script definitions
│
├── src/
│   ├── main.tsx                       # React application entry point
│   ├── App.tsx                        # Master application state, canvas, header & modal orchestrator
│   ├── App.css                        # Core styling, biopharma design tokens, LaTeX typography
│   │
│   ├── components/
│   │   ├── LandingPage.tsx            # Commercial landing page with Mission, Architecture, Case Studies, FAQs
│   │   ├── CsoCopilot.tsx             # Domain-aware Bio-AI companion with LaTeX-to-Unicode renderers
│   │   ├── DocumentationModal.tsx     # Full-screen 7-chapter Scientific Documentation & User Guide
│   │   ├── FeedbackModal.tsx          # Standalone scientist feedback modal with silent context packaging
│   │   ├── DiscoveryProgressHud.tsx   # Animated multi-stage topological traversal HUD
│   │   └── Logo.tsx                   # Vectorized SRG & Studio branding
│   │
│   └── services/
│       └── firebase.ts                # Firebase Authentication with Google Sign-In & email session fallback
```

---

## 3. BACKEND API ENDPOINTS (`server.js`)

| Endpoint | Method | Purpose & Internal Logic |
| :--- | :--- | :--- |
| `/api/swanson-discovery` | `GET` | SSE stream querying SQLite causal graph for A-B-C transitive bridges. |
| `/api/expand` | `GET` | Grounding and expanding concepts via MeSH/UMLS ontology hierarchy. |
| `/api/copilot` | `POST` | Gemini 3.7 / 3.1 Pro multi-turn domain-aware reasoning and hypothesis synthesis. |
| `/api/journal/review` | `POST` | Reviews user's hypothesis ledger, calculating plausibility score (1-100), tox screen & assays. |
| `/api/feedback` | `POST` | Ingests scientist feedback, synthesizes Gemini 3.7 action brief, logs to `feedback_log.json`, sends background SMTP email to developer, and creates user notification. |
| `/api/notifications` | `GET` | Delivers real-time in-app notifications to authenticated scientists. |
| `/api/notifications/mark-read` | `POST` | Marks specific user notification as read. |
| `/api/billing/check-subscription` | `GET` | Checks Stripe customer subscription status and tier entitlements. |
| `/api/billing/create-checkout-session` | `POST` | Generates Stripe Checkout redirect for Pro/Lab subscriptions. |
| `/api/billing/customer-portal` | `POST` | Generates Stripe self-serve Customer Billing Portal session. |

---

## 4. ACTIVE DEPENDENCIES & RUNTIMES

### Node.js Ecosystem (Target: Node.js 22+ on Apple Silicon)
* **Frontend Core:** `react` (19.0.0), `react-dom` (19.0.0), `vite` (6.x / 8.x), `typescript` (5.x).
* **UI & Visualization:** `lucide-react` (icon suite), `marked` (markdown parsing), `canvas-confetti`.
* **Backend Core:** `express` (4.x), `cors`, `dotenv`.
* **AI & Integration:** `@google/genai` (Google Gen AI SDK for Gemini 3.7 / 3.1 Pro), `better-sqlite3`, `nodemailer` (SMTP transport), `stripe` (billing).

---

## 5. ENVIRONMENT SECRETS BLUEPRINT (`.env.local` / `.env`)

The following keys must be populated on the M4 Mac Mini:

```bash
# Gemini AI Infrastructure
GEMINI_API_KEY="AIzaSy..."

# Google Cloud & Cloud Run Deployment
GCP_PROJECT_ID="catalyst-ai-629507856227"
GCP_REGION="us-central1"

# Automated Developer Briefs (SMTP)
GMAIL_USER="michael.janis@gmail.com"
GMAIL_APP_PASSWORD="lpeuycgtdtrusxku"

# Stripe Commercial Engine
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_LAB_PRICE_ID="price_..."

# Firebase Client Authentication
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."

# Server Runtime
PORT=8080
NODE_ENV=production
```

---

## 6. APPLE SILICON (M4) ONBOARDING & RUN PROTOCOL

When opening this repository on the M4 Mac Mini:

1. **Clean Dependency Compilation:**
   ```bash
   npm install
   ```
   *(Compiles clean ARM64 native bindings for `better-sqlite3` and other C-extensions)*

2. **Verify TypeScript Strict Compilation:**
   ```bash
   npm run build
   ```

3. **Verify Node.js Server Syntax:**
   ```bash
   node -c server.js
   ```

4. **Launch Local Development Server:**
   ```bash
   node server.js
   # Access live workbench at http://localhost:8080
   ```

5. **Cloud Deployment (When Ready):**
   ```bash
   ./deploy.sh
   ```

---

## 7. CRITICAL ARCHITECTURAL CONSTRAINTS & CODEX (DO NOT VIOLATE)

1. **Zero Privacy Exposure Rule:** Under NO circumstances should personal email addresses (`michael.janis@gmail.com`), real developer names, or internal model identifiers (`Gemini 3.7`) be rendered in the frontend UI. All developer notifications must be dispatched invisibly on the server.
2. **Unified Documentation & Feedback Entry Points:**
   - Top banner **`User Guide`** button opens the clean 7-chapter `DocumentationModal.tsx`.
   - Top banner **`Feedback & Requests`** button opens the dedicated `FeedbackModal.tsx`.
   - The lower right area is reserved exclusively for the floating **Translational Bio-AI** companion button.
3. **Typography & LaTeX Standards:** All raw LaTeX tags (`	ext{...}`, `\longrightarrow`) generated by the Bio-AI must be parsed into clean Unicode symbols (`➔`, `↑`, `↓`, `α`, `β`, `κ`) before rendering. Monospace ASCII pathway trees must be wrapped in neon-bordered code blocks.
4. **Pre-Flight Verification:** Always run `npm run build` and `node -c server.js` before git commits or Cloud Run deployments.
