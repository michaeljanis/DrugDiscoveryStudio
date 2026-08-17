import React, { useState } from 'react';
import { 
  BookOpen, Compass, Dna, Network, Brain, Shield, FlaskConical, 
  FileText, Lock, Sparkles, CheckCircle2, ChevronRight, X, 
  Activity, ExternalLink, ArrowRight, Zap, Award, Search, Info
} from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
  onLaunchPreset?: (preset: { source: string; target: string }) => void;
  clientContext?: {
    sourceConcept?: string;
    targetConcept?: string;
    selectedBTerm?: any;
    activeBTerms?: any[];
    ledgerSteps?: any[];
    authUser?: any;
    accountTier?: string;
  };
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'quickstart',
  onLaunchPreset,
  clientContext
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Feedback state
  const [feedbackCategory, setFeedbackCategory] = useState<string>('Feature Request');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<any>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || isSubmittingFeedback) return;

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackText,
          category: feedbackCategory,
          userEmail: clientContext?.authUser?.email || 'scientist@institution.org',
          userName: clientContext?.authUser?.displayName || 'Discovery Scientist',
          accountTier: clientContext?.accountTier || 'free',
          appState: {
            sourceConcept: clientContext?.sourceConcept,
            targetConcept: clientContext?.targetConcept,
            selectedBTerm: clientContext?.selectedBTerm?.word || clientContext?.selectedBTerm,
            activeBTerms: clientContext?.activeBTerms?.slice(0, 5),
            ledgerSteps: clientContext?.ledgerSteps
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess(data);
        setFeedbackText('');
      } else {
        alert(data.error || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      alert('Error submitting feedback: ' + err.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (!isOpen) return null;

  const chapters = [
    { id: 'quickstart', label: '1. Quick Start & Workflow', icon: Zap },
    { id: 'methodology', label: '2. Scientific Methodology', icon: Network },
    { id: 'deep_dives', label: '3. Validated Case Studies & How-Tos', icon: FlaskConical },
    { id: 'toxicology', label: '4. AI Safety & Tox Protocols', icon: Shield },
    { id: 'ledger_dossier', label: '5. Hypothesis Ledger & IND Dossiers', icon: FileText },
    { id: 'enterprise_ip', label: '6. Enterprise IP & Zero-Retention', icon: Lock },
    { id: 'faq', label: '7. Scientific & Heuristic FAQ', icon: Info },
    { id: 'feedback', label: '8. Scientist Feedback & Feature Requests', icon: Sparkles },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '1040px', 
          width: '94%',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '16px', 
          color: '#0f172a', 
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Scientific Documentation &amp; User Guide
              </h2>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                DrugDiscovery.Studio &bull; Operational Architecture, Causal Graph Theory &amp; Translational Deep Dives
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body: Left Sidebar + Right Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Navigation Sidebar */}
          <div style={{
            width: '280px',
            background: '#f8fafc',
            borderRight: '1px solid #e2e8f0',
            padding: '1.25rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
              Documentation Chapters
            </div>
            {chapters.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeTab === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveTab(ch.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: isActive ? '1px solid #0284c7' : '1px solid transparent',
                    background: isActive ? '#f0f9ff' : 'transparent',
                    color: isActive ? '#0369a1' : '#475569',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? '#0284c7' : '#64748b', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{ch.label}</span>
                  {isActive && <ChevronRight size={14} style={{ color: '#0284c7' }} />}
                </button>
              );
            })}

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.75rem',
                color: '#64748b'
              }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>Knowledge Graph Sync</strong>
                PubMed: 38.2M abstracts<br />
                Graph: 13.1M causal edges<br />
                ChEMBL: 2.4M bioactivities
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto', lineHeight: 1.65, fontSize: '0.92rem', color: '#334155' }}>
            
            {/* CHAPTER 1: QUICK START */}
            {activeTab === 'quickstart' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Zap size={14} />
                  <span>Platform Overview</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  1. Quick Start &amp; Core Discovery Workflow
                </h3>
                <p>
                  DrugDiscovery.Studio accelerates early-stage target de-risking and drug repurposing by solving the <strong>literature island problem</strong>. Modern biomedical research is published in hyper-specialized silos; when two fields do not cite one another, direct search queries return zero results.
                </p>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', margin: '1.5rem 0' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                    5-Step Rapid Discovery Protocol:
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <li>
                      <strong>Define Concept A (Input Modality / Compound):</strong> Enter a small molecule, peptide, approved drug, or candidate entity (e.g. <em>Semaglutide</em>, <em>Olaparib</em>, <em>Metformin</em>).
                    </li>
                    <li>
                      <strong>Define Concept C (Indication / Target Phenotype):</strong> Enter a disease indication, oncology subtype, or pathological state (e.g. <em>Alzheimer Disease</em>, <em>Triple-Negative Breast Cancer</em>).
                    </li>
                    <li>
                      <strong>Traverse Multi-Hop Topological Bridges ($B$-Terms):</strong> The graph engine queries 13.1M+ empirical co-occurrence edges across 38.2M PubMed papers to identify intermediate biological bridges (kinases, receptors, transcription factors).
                    </li>
                    <li>
                      <strong>Autonomous AI Mechanism Synthesis:</strong> Frontier AI cross-evaluates literature evidence, screens for toxicology liabilities (hERG, liver, BBB), and formats a testable biological hypothesis.
                    </li>
                    <li>
                      <strong>Compile &amp; Export IND Research Dossiers:</strong> Log findings to your <em>Translational Hypothesis Ledger</em> and export formal PDF/Word dossiers with suggested in-vitro validation protocols.
                    </li>
                  </ol>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => {
                      onClose();
                      if (onLaunchPreset) onLaunchPreset({ source: 'Semaglutide', target: 'Alzheimer Disease' });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>Try Semaglutide &rarr; Alzheimer's Benchmark</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* CHAPTER 2: METHODOLOGY */}
            {activeTab === 'methodology' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Network size={14} />
                  <span>Causal Graph Theory</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  2. Scientific Methodology &amp; Topological Bridging
                </h3>
                <p>
                  The platform is built on modern graph-theoretic extensions of the <strong>Swanson Literature-Based Discovery (LBD)</strong> paradigm:
                </p>

                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '1.25rem', margin: '1.25rem 0' }}>
                  <div style={{ fontWeight: 800, color: '#0369a1', marginBottom: '0.35rem' }}>The Transitive Causal Bridging Formula</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#0f172a', background: 'white', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                    A &cap; B &ne; &empty; &nbsp;&and;&nbsp; B &cap; C &ne; &empty; &nbsp;&and;&nbsp; A &cap; C = &empty;
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#0369a1', marginTop: '0.5rem', marginBottom: 0 }}>
                    If literature sets show that Concept $A$ interacts with intermediate entity $B$, and separate literature proves that $B$ modulates disease $C$, but $A$ and $C$ have zero direct joint publications, then $A \rightarrow B \rightarrow C$ forms a novel, unstudied therapeutic pathway.
                  </p>
                </div>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '1.5rem' }}>
                  Literature Gap Density &amp; B-Term Scoring Heuristics
                </h4>
                <p>
                  Intermediate entities are ranked by a multi-parametric score balancing topological connectivity and therapeutic novelty:
                </p>
                <ul>
                  <li><strong>Empirical Association Weight (W_AB, W_BC):</strong> Pointwise mutual information (PMI) and co-occurrence counts extracted from PubMed abstracts.</li>
                  <li><strong>Direct Co-Occurrence Penalty (W_AC):</strong> Penalizes well-known existing combinations to surface uncrowded patent whitespace.</li>
                  <li><strong>Biological Modality Filter:</strong> Prioritizes targetable druggable classes (GPCRs, Kinases, E3 Ligases, Ion Channels, Transcription Factors) via ChEMBL &amp; Open Targets ontologies.</li>
                </ul>
              </div>
            )}

            {/* CHAPTER 3: DEEP DIVES */}
            {activeTab === 'deep_dives' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <FlaskConical size={14} />
                  <span>Translational Deep Dives</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  3. Validated Biopharma Case Studies &amp; How-Tos
                </h3>
                <p>
                  Review four landmark translational discovery examples illustrating how topological bridging uncovers unexpected clinical mechanisms before Phase III commitment:
                </p>

                {/* Case 1 */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>Case Study 1: Neuro-Metabolic Repurposing</div>
                  <h4 style={{ margin: '0.25rem 0 0.5rem 0', color: '#0f172a', fontSize: '1.1rem' }}>
                    Semaglutide &rarr; GLP-1R / NLRP3 &rarr; Alzheimer's Disease
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: '#475569' }}>
                    <strong>Causal Mechanism:</strong> Semaglutide crosses the blood-brain barrier to bind microglial GLP-1 receptors, activating cAMP/PKA signaling. This suppresses NLRP3 inflammasome assembly, shifting microglia from an M1 neuroinflammatory phenotype to an M2 neuroprotective state, halting synaptic loss.
                  </p>
                  <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
                    Validated Status: EVOKE &amp; EVOKE+ Global Phase III Clinical Trials
                  </div>
                </div>

                {/* Case 2 */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>Case Study 2: Immuno-Oncology Synergies</div>
                  <h4 style={{ margin: '0.25rem 0 0.5rem 0', color: '#0f172a', fontSize: '1.1rem' }}>
                    Olaparib &rarr; cGAS-STING Innate Immunity &rarr; Triple-Negative Breast Cancer
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: '#475569' }}>
                    <strong>Causal Mechanism:</strong> Olaparib-induced replication fork collapse spills double-stranded DNA into the cytosol. Cytosolic DNA triggers cGAS-STING-TBK1 signaling, turning 'cold' TNBC tumors into interferon-rich, CD8+ T-cell-infiltrated targets responsive to PD-1/PD-L1 checkpoint blockade.
                  </p>
                  <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
                    Validated Status: Nature &amp; Science Immunology Translational Benchmark
                  </div>
                </div>

                {/* Case 3 */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>Case Study 3: Targeted Protein Degradation (TPD)</div>
                  <h4 style={{ margin: '0.25rem 0 0.5rem 0', color: '#0f172a', fontSize: '1.1rem' }}>
                    Lenalidomide &rarr; CRL4-CRBN E3 Ligase &rarr; Multiple Myeloma
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: '#475569' }}>
                    <strong>Causal Mechanism:</strong> Acts as a molecular glue by binding Cereblon (CRBN), reprogramming its substrate specificity to selectively polyubiquitinate and degrade non-native transcription factors IKZF1 and IKZF3 via the 26S proteasome.
                  </p>
                  <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
                    Validated Status: FDA Approved Standard of Care &amp; TPD Paradigm
                  </div>
                </div>
              </div>
            )}

            {/* CHAPTER 4: TOXICOLOGY */}
            {activeTab === 'toxicology' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Shield size={14} />
                  <span>Safety &amp; Toxicology</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  4. Real-Time AI Safety, Toxicology &amp; In-Vitro Assays
                </h3>
                <p>
                  To prevent costly late-stage attrition, every AI-synthesized hypothesis is automatically passed through an integrated toxicology and liability screen before wet-lab commitment:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', margin: '1.25rem 0' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>hERG Cardiotoxicity</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Flags potential I_Kr potassium channel blockade risks associated with QT prolongation and cardiac arrhythmias.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Hepatotoxicity &amp; DILI</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Screens for CYP450 reactive metabolite formation, mitochondrial toxicity, and drug-induced liver injury risks.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>BBB Permeability</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Computes CNS MPO scores and passive membrane diffusion for neurodegenerative and neuro-oncology targets.
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '1.5rem' }}>
                  Structured In-Vitro Assay Validation Protocols
                </h4>
                <p>
                  The platform outputs actionable laboratory assay protocols to validate target engagement:
                </p>
                <ul>
                  <li><strong>Target Engagement Assays:</strong> CETSA (Cellular Thermal Shift Assay), SPR (Surface Plasmon Resonance), and NanoBRET target occupancy.</li>
                  <li><strong>Downstream Functional Readouts:</strong> Western Blot phosphorylation cascades, qPCR transcriptional markers, and cell viability IC50 dose-response curves.</li>
                </ul>
              </div>
            )}

            {/* CHAPTER 5: LEDGER & IND DOSSIERS */}
            {activeTab === 'ledger_dossier' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <FileText size={14} />
                  <span>Audit-Grade Documentation</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  5. Translational Hypothesis Ledger &amp; IND Dossier Export
                </h3>
                <p>
                  The <strong>Translational Hypothesis Ledger</strong> functions as an audit-grade electronic discovery notebook. Every graph traversal, B-term milestone, and mechanistic critique is tracked with exact PubMed citation provenance.
                </p>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', margin: '1.25rem 0' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#0f172a' }}>1-Click IND Publication Dossier Export</h4>
                  <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0 }}>
                    Export your full investigation into publication-ready documents formatted for NIH/ERC grant proposals, internal scientific review boards, and FDA IND Pre-Meeting Briefing packages in <strong>PDF</strong>, <strong>Microsoft Word (.docx)</strong>, or <strong>Markdown</strong> formats.
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 6: ENTERPRISE IP */}
            {activeTab === 'enterprise_ip' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Lock size={14} />
                  <span>Enterprise Security</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  6. Enterprise Data Sovereignty &amp; Zero-Retention Policy
                </h3>
                <p>
                  Biopharma IP requires uncompromising confidentiality. DrugDiscovery.Studio enforces institutional data governance:
                </p>
                <ul>
                  <li><strong>Zero-Retention Target Queries:</strong> Proprietary input targets and compounds are never logged, cached across shared tenants, or used to train public models.</li>
                  <li><strong>Single-Tenant VPC Deployments:</strong> Available on AWS, GCP, and Microsoft Azure with dedicated KMS customer-managed encryption keys.</li>
                  <li><strong>SOC2 Type II &amp; HIPAA Compliant:</strong> End-to-end TLS 1.3 encryption for all data in flight and at rest.</li>
                </ul>
              </div>
            )}

            {/* CHAPTER 7: FAQ */}
            {activeTab === 'faq' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Info size={14} />
                  <span>Technical Reference</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  7. Frequently Asked Questions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>How often is the PubMed graph updated?</strong>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      The causal knowledge graph indexes 38.2M+ abstracts with ongoing synchronization to capture newly published biomedical papers and bioactivities.
                    </span>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>Can I upload internal ELN or assay data?</strong>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Yes, through Biotech Lab and Enterprise plans, teams can overlay proprietary assay data onto the global biomedical graph within their private VPC.
                    </span>
                  </div>
                </div>
              </div>
            )}



            {/* CHAPTER 8: SCIENTIST FEEDBACK & FEATURE INGESTION */}
            {activeTab === 'feedback' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Sparkles size={14} />
                  <span>Interactive Scientist Feedback &amp; Feature Ingestion</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  8. Direct Feedback, Feature Requests &amp; AI Context Ingestion
                </h3>
                <p style={{ color: '#475569', fontSize: '0.92rem', margin: '0 0 1.5rem 0' }}>
                  Submit direct feedback or feature requests to lead developer Dr. Janis. <strong>Gemini 3.7</strong> automatically inspects your active discovery telemetry (target pair, inspected bridges, hypothesis ledger) to synthesize an audit-grade developer brief and notify your account when the update is live in production.
                </p>

                {/* Live Context Telemetry Badge */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Activity size={14} />
                    <span>Active Telemetry Automatically Captured with Submission:</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.82rem', color: '#334155' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Scientist Account:</span>
                      <strong>{clientContext?.authUser?.email || 'Guest Scientist (Unauthenticated)'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Account Tier:</span>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                        {(clientContext?.accountTier || 'Free').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Active Discovery Pair:</span>
                      <strong>{clientContext?.sourceConcept || 'None'} ➔ {clientContext?.targetConcept || 'None'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Inspected B-Bridge:</span>
                      <strong>{clientContext?.selectedBTerm?.word || clientContext?.selectedBTerm || 'None'}</strong>
                    </div>
                  </div>
                </div>

                {feedbackSuccess ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      <CheckCircle2 size={20} />
                      <span>Feedback Ticket #{feedbackSuccess.ticketId} Dispatched!</span>
                    </div>
                    <p style={{ color: '#166534', fontSize: '0.88rem', margin: '0 0 1rem 0' }}>
                      Your submission was analyzed by <strong>Gemini 3.7</strong> and emailed directly to <strong>michael.janis@gmail.com</strong>. A notification has been registered for your account and you will be notified when the feature/fix is deployed.
                    </p>
                    {feedbackSuccess.aiBrief && (
                      <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', fontSize: '0.84rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>AI 3.7 Executive Brief:</div>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>{feedbackSuccess.aiBrief.executiveSummary}</p>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>Biological &amp; Preclinical Impact:</div>
                        <p style={{ margin: 0, color: '#334155' }}>{feedbackSuccess.aiBrief.biologicalImpact}</p>
                      </div>
                    )}
                    <button
                      onClick={() => setFeedbackSuccess(null)}
                      style={{ marginTop: '1rem', background: '#16a34a', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Submit Another Feedback Note
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                        Feedback Category
                      </label>
                      <select
                        value={feedbackCategory}
                        onChange={(e) => setFeedbackCategory(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff', color: '#0f172a', outline: 'none' }}
                      >
                        <option value="Feature Request">🚀 Feature Request / New Indication Discovery</option>
                        <option value="Scientific Methodology">🔬 Scientific Methodology / Biological Inquiry</option>
                        <option value="Toxicology & Safety Screen">🛡️ Toxicology / Assay Validation Protocol</option>
                        <option value="Data Discrepancy & Bug">🐛 Bug Report / Data Discrepancy</option>
                        <option value="Enterprise Integration">💼 Enterprise / Custom Pipeline Integration</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                        Your Feedback / Feature Description
                      </label>
                      <textarea
                        rows={5}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Describe the feature, target filtering (e.g. blood-brain barrier permeability, kinase selectivity), or workflow enhancement you would like to see..."
                        style={{ width: '100%', padding: '0.75rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', color: '#0f172a', background: '#ffffff', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingFeedback || !feedbackText.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.85rem 1.5rem',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        cursor: isSubmittingFeedback || !feedbackText.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: isSubmittingFeedback || !feedbackText.trim() ? 0.6 : 1,
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <Sparkles size={16} />
                      <span>{isSubmittingFeedback ? 'Gemini 3.7 Synthesizing & Dispatching...' : '🚀 Submit Feedback & Ingest Action Brief'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 2rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Silicon Research Group (SRG) &bull; DrugDiscovery.Studio Documentation Center
          </span>
          <button
            onClick={onClose}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
