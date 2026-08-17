# Project Episteme: State of the Union

**Date:** July 1, 2026
**Target:** Silicon Research Group (SRG) Core Engineering / Master Control AI
**Context:** CLI Handover Document

---

## 1. Project Overview & Architecture

**Project Episteme (Insight Discovery)** is a next-generation Literature-Based Discovery (LBD) platform that implements the Swanson ABC paradigm. It is designed as a "cognitive prosthetic" to uncover latent, non-obvious connections across disjoint scientific and biomedical disciplines.

### The Architecture
- **Frontend (Client):** A React-based Single Page Application (Vite) featuring a glassmorphic, minimalist UI. Its core element is a highly optimized, recursive tripartite knowledge graph rendering engine built over custom SVG logic.
- **Backend (API/Engine):** A Node.js/Express backend (`server.js`) that interfaces with the PubMed database and the Google Gemini API.
- **The Intelligence Layer:** We employ the paradigm of **"Intelligence as Architecture."** Rather than treating the LLM as a conversational chatbot, Gemini operates as an invisible orchestration layer. It mathematically evaluates sparse graph paths, assigns Cumulative Clinical Validity Scores (CVS), and synthesizes multi-hop peer-review-grade hypotheses.
- **Deployment:** The application is containerized (Docker) and continuously deployed to Google Cloud Run via `cloudbuild.yaml` and local `deploy.sh` pipelines.

---

## 2. Current State of the Codebase

The platform is fully operational, stable, and live at `https://episteme-629507856227.us-central1.run.app`.

### Key Achievements & Status
- **Zero-Latency Graphing Engine:** The `tripartiteGraphData` hook dynamically constructs nodes and topological links. We recently refactored the engine to safely handle recursive depth expansions ($> 1$ hop). The UI now instantly displays graceful placeholder nodes ("Evaluating Depth...", "Analyzing Literature...") while the backend calculates complex recursive paths, ensuring the application never stalls or crashes (TypeError hotfixes applied).
- **Clinical User Experience:** The Interactive Guide and environment configuration modals have been entirely rewritten. We stripped away marketing jargon in favor of a clinical, rigorously technical tone that reflects SRG's ethos.
- **Karpathy-Level Prompt Engineering:** The `/api/feedback` endpoint utilizes an aggressively constrained prompt architecture that forces the LLM to analyze the platform through the lens of zero-latency UX, scientific validity, and minimalist UI constraints.
- **Fierce Pharma AI Alignment:** The platform has been strategically aligned and submitted as a multi-tiered biological network model capable of de novo target discovery, combinatorial synergy, and semantic extraction, overcoming massive industry bottlenecks like "Cognitive Search Bias."

---

## 3. Critical Structural Decisions

1. **Software as an Autonomous Collaborator:** We abandoned the "passive tool" paradigm. Episteme anticipates intent, pre-fetches data, and synthesizes arguments automatically, shifting the user's role from data-gatherer to director of insights.
2. **Biological Polarity Modeling:** We explicitly enforce the tracking of relationship directionality (e.g., *upregulates* vs. *downregulates*). If the mathematical signs in an A $\rightarrow$ B $\rightarrow$ C pathway do not reconcile correctly, the pathway is pruned to avoid generating pharmacologically adverse hypotheses.
3. **The Circular Vector/Graph Validation Cycle:** We designed the mathematical blueprint for scaling to the full 36M+ PubMed corpus:
   - *Phase 1:* Structural sparse traversal via Graph DB (identifying that a path exists).
   - *Phase 2:* Semantic validation via Vector DB (verifying context with dense embeddings).
   - *Phase 3:* LLM Scoring and graph edge re-weighting based on hypothesis validity.

---

## 4. Next Immediate Tasks

As we transition into the next development cycle, the following tasks require immediate attention:

- **[ ] Data Ingestion Pipeline (Scale to 36M+ Articles):** Build the serverless pipeline (GCP Dataflow) to ingest the historical PubMed XML baseline dumps into our target hybrid Neo4j + Qdrant databases.
- **[ ] NER & Entity Normalization:** Integrate transformer models (BioBERT/Bern2) to accurately extract and map biological entities to standard ontologies (MeSH, UMLS, ChEMBL) during abstract ingestion.
- **[ ] Enhance Path Pruning Logic:** Fine-tune the Cumulative Clinical Validity Score (CVS) to prioritize pathways validated in *human clinical trials* over mouse/rat models, bridging the "Translation Gap."
- **[ ] React Canvas/WebGL Migration Assessment:** Profile the SVG rendering engine. If the UI chokes on graphs with $> 500$ nodes during extreme multi-hop expansions, prepare an architectural shift to Canvas/WebGL for the graph rendering plane.
