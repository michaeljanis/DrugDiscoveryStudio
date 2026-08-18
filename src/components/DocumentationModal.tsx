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
  onOpenFeedback?: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'quickstart',
  onLaunchPreset,
  onOpenFeedback
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const chapters = [
    { id: 'quickstart', label: '1. Quick Start & Workflow', icon: Zap },
    { id: 'methodology', label: '2. Scientific Methodology', icon: Network },
    { id: 'deep_dives', label: '3. Validated Case Studies & How-Tos', icon: FlaskConical },
    { id: 'toxicology', label: '4. AI Safety & Tox Protocols', icon: Shield },
    { id: 'ledger_dossier', label: '5. Hypothesis Ledger & IND Dossiers', icon: FileText },
    { id: 'enterprise_ip', label: '6. Enterprise IP & Zero-Retention', icon: Lock },
    { id: 'faq', label: '7. Scientific & Heuristic FAQ', icon: Info },
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

            {onOpenFeedback && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                style={{
                  marginTop: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px dashed #0284c7',
                  background: 'rgba(2, 132, 199, 0.05)',
                  color: '#0284c7',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Sparkles size={15} />
                <span>Submit Feedback / Request</span>
              </button>
            )}

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
                  <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li>
                      <strong>Define Concepts A &amp; C:</strong> Enter your candidate small molecule, biological modality, or target gene as <em>Concept A</em> and the disease phenotype as <em>Concept C</em>.
                    </li>
                    <li>
                      <strong>Autonomous Topological Traversal:</strong> Click <em>Execute Discovery Search</em>. The system traverses 13.1M+ empirical co-occurrence edges to extract intermediate <em>Concept B</em> hubs (kinases, receptors, transcription factors).
                    </li>
                    <li>
                      <strong>Review High-Dimensional B-Terms:</strong> Inspect ranking by mutual information score, A-B citation volume, and B-C citation volume.
                    </li>
                    <li>
                      <strong>Pair-Program with Translational Bio-AI:</strong> Ask the domain-grounded Bio-AI to synthesize multi-hop pathways, critique binding kinetics, and recommend stage-gated in-vitro assays.
                    </li>
                    <li>
                      <strong>Generate IND-Ready Dossier:</strong> Click <em>Synthesize Discovery Dossier</em> to compile a publication-grade mechanistic brief complete with ChEMBL bioactivities and Open Targets data.
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
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>Launch Semaglutide ➔ Alzheimer's Tutorial</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* CHAPTER 2: METHODOLOGY */}
            {activeTab === 'methodology' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Network size={14} />
                  <span>Graph Theory &amp; Algorithms</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  2. Scientific Methodology &amp; Mathematical Scoring
                </h3>
                <p>
                  DrugDiscovery.Studio implements Don Swanson's foundational <em>Undiscovered Public Knowledge (UPK)</em> literature-based discovery framework, extended with modern graph centrality algorithms and real-time cross-database validation.
                </p>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '1.5rem 0 0.5rem 0' }}>
                  Swanson Open vs. Closed Discovery
                </h4>
                <p>
                  <strong>Closed Discovery (Mechanistic Bridging):</strong> When both A (Drug) and C (Disease) are specified, the engine extracts the intersection of their neighborhoods <em>B = N(A) ∩ N(C)</em> where literature co-occurrence <strong>Direct(A, C) = 0</strong>.
                </p>
                <p>
                  <strong>Open Discovery (Autonomous Target Finding):</strong> When only Concept A is provided, the engine projects all connected intermediate paths outward to identify previously unassociated disease phenotypes with high topological affinity.
                </p>
              </div>
            )}

            {/* CHAPTER 3: DEEP DIVES & BENCHMARKS */}
            {activeTab === 'deep_dives' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <FlaskConical size={14} />
                  <span>Validated Benchmarks</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  3. Validated Case Studies &amp; Preclinical How-Tos
                </h3>
                
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#0284c7', fontWeight: 700 }}>
                    Case Study 1: Semaglutide in Early Alzheimer's Disease
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem' }}>
                    <strong>The Clinical Gap:</strong> Metabolic GLP-1 receptor agonists were traditionally developed for glycemic control in Type 2 Diabetes.
                  </p>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>
                    <strong>The Discovered Mechanism:</strong> GLP-1R microglial receptor activation engages intracellular cAMP/PKA to downregulate the NLRP3 inflammasome, suppressing neuroinflammatory synaptic pruning.
                  </p>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#0284c7', fontWeight: 700 }}>
                    Case Study 2: Olaparib &amp; cGAS-STING in Triple-Negative Breast Cancer
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem' }}>
                    <strong>The Clinical Gap:</strong> PARP inhibitors were categorized strictly as DNA-repair blockers.
                  </p>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>
                    <strong>The Discovered Mechanism:</strong> Unresolved DNA replication stress leaks cytosolic double-stranded DNA, activating cGAS-STING and transforming immunologically "cold" tumors into interferon-rich, checkpoint-responsive targets.
                  </p>
                </div>
              </div>
            )}

            {/* CHAPTER 4: TOXICOLOGY & SAFETY */}
            {activeTab === 'toxicology' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Shield size={14} />
                  <span>Preclinical De-Risking</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  4. AI Safety &amp; Toxicology Screening Protocols
                </h3>
                <p>
                  Translational discovery requires rapid safety screening before wet-lab assay commitment. The platform automatically critiques potential preclinical liabilities:
                </p>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li><strong>hERG Cardiotoxicity:</strong> Identifies potential I_Kr potassium channel blockade liabilities.</li>
                  <li><strong>Hepatotoxicity &amp; CYP450:</strong> Flags cytochrome P450 inhibition and metabolic liabilities.</li>
                  <li><strong>Blood-Brain Barrier (BBB) Permeability:</strong> Evaluates CNS multiparameter optimization (CNS MPO) metrics.</li>
                </ul>
              </div>
            )}

            {/* CHAPTER 5: LEDGER & IND DOSSIERS */}
            {activeTab === 'ledger_dossier' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <FileText size={14} />
                  <span>IND Synthesis</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  5. Living Hypothesis Ledger &amp; IND Dossiers
                </h3>
                <p>
                  As you explore multi-hop causal graphs, every validated bridge and AI reasoning insight can be pinned directly to your private <strong>Hypothesis Ledger</strong>.
                </p>
                <p>
                  Clicking <em>Synthesize Discovery Dossier</em> instantly compiles your ledger milestones, ChEMBL bioactivities, and Open Targets localizations into a publication-ready report formatted for scientific advisory boards and regulatory filings.
                </p>
              </div>
            )}

            {/* CHAPTER 6: ENTERPRISE IP & ZERO-RETENTION */}
            {activeTab === 'enterprise_ip' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Lock size={14} />
                  <span>Enterprise Security</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  6. Enterprise IP Protection &amp; Zero-Retention Policy
                </h3>
                <p>
                  Biopharma discovery queries represent mission-critical intellectual property. DrugDiscovery.Studio is engineered with strict single-tenant session isolation:
                </p>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li><strong>Strict Zero-Retention:</strong> User queries and candidate structures are processed in isolated sessions with zero retention.</li>
                  <li><strong>No Model Training:</strong> Proprietary biopharma hypotheses are never used to train foundation models.</li>
                  <li><strong>Encrypted Transport:</strong> All data is encrypted in transit (TLS 1.3) and at rest.</li>
                </ul>
              </div>
            )}

            {/* CHAPTER 7: FAQ */}
            {activeTab === 'faq' && (
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  <Info size={14} />
                  <span>Frequently Asked Questions</span>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                  7. Scientific &amp; Heuristic FAQ
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>
                      How often is the biomedical knowledge graph updated?
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      The underlying causal graph is refreshed continuously from PubMed abstracts and synchronized weekly with live releases of ChEMBL and Open Targets.
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>
                      Can I export generated dossiers to PDF or Markdown?
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Yes, all IND-ready discovery dossiers can be copied, exported as formatted Markdown, or printed directly to PDF.
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>
                      Can we integrate our internal proprietary compound libraries?
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Yes, through Biotech Lab and Enterprise plans, teams can overlay proprietary assay data onto the global biomedical graph within their private VPC.
                    </span>
                  </div>
                </div>
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
            DrugDiscovery.Studio Documentation Center &bull; Knowledge Graph Architecture
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
