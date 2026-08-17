import React, { useState } from 'react';
import { 
  Sparkles, Zap, Shield, BookOpen, Layers, ArrowRight, CheckCircle2, 
  XCircle, Minus, ChevronDown, ChevronUp, FileText, Activity, Brain, ExternalLink, 
  FlaskConical, Network, Dna, Database, Award, ArrowUpRight, User, Terminal,
  Clock, Check, Search, Lock, Cpu, Server, Compass, CheckCircle, Flame, Timer,
  BarChart3, Microscope, Scale
} from 'lucide-react';
import { Logo } from './Logo';

interface LandingPageProps {
  onLaunchApp: (preset?: { source: string; target: string }) => void;
  onOpenPricing: () => void;
  onLogin: () => void;
  onOpenDocs?: () => void;
  authUser: any;
  onLogout: () => void;
  accountTier?: string;
  freeQueryCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  onOpenPricing,
  onLogin,
  onOpenDocs,
  authUser,
  onLogout,
  accountTier = 'free',
  freeQueryCount = 0
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCaseTab, setActiveCaseTab] = useState<number>(0);
  const [heroSource, setHeroSource] = useState<string>('');
  const [heroTarget, setHeroTarget] = useState<string>('');

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSource.trim() || heroTarget.trim()) {
      onLaunchApp({
        source: heroSource.trim() || 'Semaglutide',
        target: heroTarget.trim() || 'Alzheimer Disease'
      });
    } else {
      onLaunchApp();
    }
  };

  // Modern, high-value clinical & translational biopharma benchmarks
  const caseStudies = [
    {
      id: 0,
      title: "GLP-1R Agonism in Neurodegenerative Inflammation",
      category: "Neuro-Immunology & Metabolic Repurposing",
      source: "Semaglutide (GLP-1RA)",
      target: "Early-Stage Alzheimer's Disease",
      bTerms: [
        "GLP-1R Microglial Receptor Expression",
        "cAMP / PKA / CREB Signaling Cascade",
        "NLRP3 Inflammasome Inactivation",
        "Microglial M1-to-M2 Neuroprotective Switch"
      ],
      narrative: "Originally indicated for metabolic glycemic control and obesity, GLP-1 receptor agonists were isolated from neurodegenerative tau pathology. DrugDiscovery.Studio maps the multi-hop causal bridge: Semaglutide crosses the blood-brain barrier to engage microglial GLP-1 receptors, activating intracellular cAMP/PKA to shut down NLRP3 inflammasome assembly and attenuate neuroinflammatory synaptic pruning.",
      significance: "Accelerates discovery of systemic metabolic therapeutics for neurodegenerative indications prior to Phase III clinical commitment.",
      validationYear: "Translational Validation: EVOKE & EVOKE+ Phase III Global Trials"
    },
    {
      id: 1,
      title: "PARP Inhibition & cGAS-STING Innate Immunity in TNBC",
      category: "Immuno-Oncology & DNA Damage Response",
      source: "Olaparib (PARP1/2 Inhibitor)",
      target: "Triple-Negative Breast Cancer (TNBC)",
      bTerms: [
        "DNA Double-Strand Breaks (DSBs)",
        "Micronuclei Membrane Rupture",
        "cGAS Cytosolic DNA Sensing",
        "STING / TBK1 / Type-I Interferon Induction",
        "CD8+ Cytotoxic T-Lymphocyte Recruitment"
      ],
      narrative: "Synthetically lethal PARP inhibitors were long categorized strictly as homologous recombination DNA-repair blockers. Causal topological bridging demonstrates that Olaparib-induced unresolved replication fork collapse forces double-stranded DNA into the cytosol, triggering the cGAS-STING pathway to turn immunologically 'cold' triple-negative tumors into interferon-rich, checkpoint-responsive targets.",
      significance: "Demonstrates platform ability to uncover hidden immuno-sensitization synergies for existing oncology franchises.",
      validationYear: "Translational Benchmark: Nature & Science Immunology Synergies"
    },
    {
      id: 2,
      title: "Molecular Glues: CRBN Neo-Substrate Degradation",
      category: "Targeted Protein Degradation (TPD)",
      source: "Lenalidomide / Thalidomide Analogs",
      target: "Multiple Myeloma & del(5q) MDS",
      bTerms: [
        "Cereblon (CRBN) E3 Ligase Complex",
        "IKZF1 / IKZF3 Transcription Factors",
        "Polyubiquitination & 26S Proteasomal Lysis",
        "IRF4 / MYC Transcriptional Downregulation"
      ],
      narrative: "The modern paradigm of Targeted Protein Degradation (TPD) was unlocked when the missing molecular intermediate was resolved: Thalidomide analogs act as molecular glues, reprogramming the substrate specificity of the CRL4-CRBN E3 ubiquitin ligase to selectively recruit and degrade previously 'undruggable' lymphoid transcription factors Ikaros and Aiolos.",
      significance: "Validates computational discovery of ternary complex interfaces and neo-substrate degradation pathways.",
      validationYear: "FDA Approved Standard of Care & TPD Foundation"
    },
    {
      id: 3,
      title: "Metformin in Chemo-Resistant Glioblastoma Stem Cells",
      category: "Metabolic Oncology & Stemness Depletion",
      source: "Metformin (Biguanide)",
      target: "Glioblastoma Multiforme (GBM)",
      bTerms: [
        "Mitochondrial Complex I Inhibition",
        "AMPK Phosphorylation & Activation",
        "mTORC1 / STAT3 Signaling Downregulation",
        "CD133+ Glioma Stem Cell Exhaustion",
        "Temozolomide (TMZ) Radiosensitization"
      ],
      narrative: "Isolated diabetes literature met high-grade glioma neuro-oncology through multi-hop pathway discovery: Metformin crosses the blood-brain barrier to inhibit mitochondrial respiratory Complex I, activating AMPK to suppress downstream mTOR/STAT3 axis. This selectively depletes tumorigenic CD133+ stem-like populations resistant to frontline alkylating chemotherapies.",
      significance: "Uncovers metabolic vulnerability targets in aggressive, treatment-refractory solid tumors.",
      validationYear: "Clinical Pipeline: Multi-Center Phase II Trials (NCT02149459)"
    }
  ];

  const faqs = [
    {
      q: "What is the core discovery acceleration of DrugDiscovery.Studio?",
      a: "In early-stage target discovery and drug repositioning, synthesizing literature across disparate therapeutic domains takes months of manual review. DrugDiscovery.Studio accelerates target identification by connecting over 13.1 million verified biological relationships across 38.2 million biomedical papers. AI then synthesizes structured, citation-backed biological mechanisms, proposed lab assay validation schemes, and early safety screens in seconds—enabling discovery teams to prioritize only the highest-conviction hypotheses before committing wet-lab capital."
    },
    {
      q: "How does this differ from naive Vector RAG or standard AI chat tools?",
      a: "Standard AI chat and vector search tools rely on keywords and text similarity. When a compound and a disease reside in separate, non-citing literatures, keyword searches return zero results or hallucinate connections. DrugDiscovery.Studio uses graph pathfinding across 13.1M+ biomedical connections to mathematically discover intermediate biological bridges (such as kinases, receptors, and transcription factors) and rank them by literature gap density."
    },
    {
      q: "How are enterprise IP and data sovereignty protected?",
      a: "We maintain a strict zero-retention policy for proprietary target queries. Single-tenant VPC deployments (AWS, GCP, Azure) are completely isolated, ensuring your private targets, internal Electronic Lab Notebooks (ELN), and proprietary assay datasets are never logged, stored in shared caches, or used to train public models."
    },
    {
      q: "Why is AI essential for discovering new drug targets?",
      a: "Human researchers cannot read millions of papers across oncology, immunology, and chemistry simultaneously. AI bridges these silos by analyzing hidden relationships across the entire biomedical literature, identifying unstudied mechanisms of action, and screening for potential drug safety risks before you begin expensive laboratory experiments."
    },
    {
      q: "How does DrugDiscovery.Studio uncover defensible patent whitespace?",
      a: "By calculating literature gap density, the platform isolates high-probability biological interactions that possess zero direct co-occurrence citations in published literature. This enables search & evaluation teams and patent attorneys to identify unstudied method-of-use and formulation IP before competitors."
    },
    {
      q: "What does the Translational Hypothesis Ledger provide for translational teams?",
      a: "The Translational Hypothesis Ledger functions as an audit-grade digital research notebook. Every graph traversal, intermediate bridge inspection, and hypothesis score is tracked with exact PubMed citation provenance. Teams can export the entire investigation into formal PDF, Word, or Markdown dossiers ready for grant proposals and IND filings with a single click."
    }
  ];

  return (
    <div className="landing-page-root" style={{ 
      background: '#ffffff', 
      color: '#0f172a', 
      fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      
      {/* ----------------- TOP INSTITUTIONAL NAVIGATION ----------------- */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.85rem 2rem'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Brand Logo with light theme styling */}
          <Logo 
            size="md" 
            theme="light"
            showSubtitle={true} 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          />

          {/* Center Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }} className="desktop-nav">
            <a href="#acceleration" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.2s' }}>Overview</a>
            <a href="#architecture" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.2s' }}>How It Works</a>
            <a href="#matrix" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.2s' }}>Comparison</a>
            <a href="#benchmarks" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.2s' }}>Case Studies</a>
            <a href="#pricing" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.2s' }}>Pricing</a>
            {onOpenDocs && (
              <button onClick={onOpenDocs} style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0, whiteSpace: 'nowrap' }}>
                <BookOpen size={13} />
                <span>User Guide</span>
              </button>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            {authUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  background: accountTier === 'pro' ? '#ecfdf5' : '#fffbeb',
                  border: accountTier === 'pro' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                  color: accountTier === 'pro' ? '#047857' : '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Sparkles size={12} />
                  <span>{(accountTier === 'pro' || accountTier === 'scientist' || (authUser?.email && (authUser.email.toLowerCase() === 'clee@oncotelic.com' || authUser.email.toLowerCase() === 'michael.janis@gmail.com' || authUser.email.toLowerCase().endsWith('@oncotelic.com') || authUser.email.toLowerCase().endsWith('@siliconresearchgroup.com')))) ? 'Pro Scientist (Unlimited)' : accountTier === 'researcher' ? 'Researcher Plan' : `Free Account (${Math.max(0, 5 - (freeQueryCount || 0))} of 5 left)`}</span>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#475569', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {authUser.displayName || authUser.email?.split('@')[0]}
                </span>
                <button
                  onClick={() => onLaunchApp()}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  <span>Open Studio</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={onLogout}
                  style={{
                    background: 'transparent',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: '0.3rem 0.6rem',
                    fontWeight: 600
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onLogin}
                  style={{
                    background: 'transparent',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => onLaunchApp()}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>Open Studio</span>
                  <ArrowRight size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ----------------- HERO SECTION ----------------- */}
      <section style={{
        position: 'relative',
        padding: '5.5rem 2rem 4rem 2rem',
        maxWidth: '1240px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Subtle Radial Blue Glow Backdrop */}
        <div style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '750px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.08) 0%, rgba(99, 102, 241, 0.04) 55%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5.2vw, 3.9rem)',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.035em',
            margin: '0 auto 1.5rem auto',
            maxWidth: '1040px',
            color: '#0f172a'
          }}>
            Accelerate Target Discovery &amp; MoA with{' '}
            <span style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              10x Speed
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
            color: '#475569',
            lineHeight: 1.65,
            maxWidth: '880px',
            margin: '0 auto 2.5rem auto'
          }}>
            Every year, thousands of potential medical breakthroughs stay hidden because research is siloed across separate scientific fields. DrugDiscovery.Studio connects the dots across 38+ million published biomedical papers to uncover the missing biological links between diseases and treatments. AI reads across disjointed research to piece together complete biological mechanisms, testable hypotheses, and lab-ready assay designs in minutes—giving your team the clarity to prioritize the highest-probability targets.
          </p>

          {/* ----------------- 10X ACCELERATION & VALUE BANNER ----------------- */}
          <div id="acceleration" style={{
            maxWidth: '960px',
            margin: '0 auto 2.5rem auto',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.5rem 1.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)'
          }}>
            {/* Metric 1: 10x Hypothesis Triaging */}
            <div style={{ textAlign: 'left', borderRight: '1px solid #e2e8f0', paddingRight: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Zap size={14} style={{ color: '#0284c7' }} />
                <span>10x Target Triaging Velocity</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.2rem 0' }}>
                Minutes vs. Months
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
                Replaces months of manual literature searching with instant multi-hop pathway discovery and biological B-term ranking.
              </div>
            </div>

            {/* Metric 2: 13.1M+ Graph Edges */}
            <div style={{ textAlign: 'left', borderRight: '1px solid #e2e8f0', paddingRight: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Network size={14} style={{ color: '#4f46e5' }} />
                <span>13.1M+ Verified Edges</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.2rem 0' }}>
                Zero Keyword Blindness
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
                Uncovers high-probability intermediate targets across disjoint literatures where traditional PubMed returns 0 results.
              </div>
            </div>

            {/* Metric 3: Target De-Risking */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <Shield size={14} style={{ color: '#059669' }} />
                <span>Assay &amp; Screen De-Risking</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.2rem 0' }}>
                Prioritize Top Leads
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
                Automated target engagement protocols (CETSA, SPR) and early tox/liability screens before committing wet-lab capital.
              </div>
            </div>
          </div>

          {/* Interactive Fast-Start Query Canvas */}
          <div style={{
            maxWidth: '860px',
            margin: '0 auto 2.5rem auto',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)'
          }}>
            <form onSubmit={handleHeroSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'block' }}>
                    Concept A (Compound / Modality / Target)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Semaglutide, Olaparib, Lenalidomide, Metformin, Magnesium..."
                    value={heroSource}
                    onChange={(e) => setHeroSource(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: '#0f172a',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'block' }}>
                    Concept C (Indication / Phenotype / Disease)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alzheimer Disease, Triple-Negative Breast Cancer, Migraine..."
                    value={heroTarget}
                    onChange={(e) => setHeroTarget(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: '#0f172a',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                  ⚡ Traverses 13.1M+ empirical co-occurrence edges across PubMed
                </span>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.75rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <span>Synthesize Causal Bridge</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            {/* 1-Click Institutional Presets */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1.1rem', borderTop: '1px solid #e2e8f0', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem' }}>
                Modern Biopharma Discovery Benchmarks:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button
                  onClick={() => onLaunchApp({ source: 'Semaglutide', target: 'Alzheimer Disease' })}
                  style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    color: '#0369a1',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🧠 Semaglutide &rarr; Alzheimer's (GLP-1R / NLRP3)
                </button>
                <button
                  onClick={() => onLaunchApp({ source: 'Olaparib', target: 'Triple-Negative Breast Cancer' })}
                  style={{
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    color: '#4338ca',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🧬 Olaparib &rarr; TNBC (cGAS-STING Synergy)
                </button>
                <button
                  onClick={() => onLaunchApp({ source: 'Lenalidomide', target: 'Multiple Myeloma' })}
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🧪 Lenalidomide &rarr; Myeloma (CRBN Molecular Glue)
                </button>
                <button
                  onClick={() => onLaunchApp({ source: 'Metformin', target: 'Glioblastoma' })}
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    color: '#b45309',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Metformin &rarr; GBM Stem Cells (AMPK / mTOR)
                </button>
                <button
                  onClick={() => onLaunchApp()}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔍 Explore Live Research Platform &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Institutional Trust & Scale Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1040px',
            margin: '0 auto',
            padding: '1.75rem 0',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>38.2M+</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.2rem' }}>PubMed Abstracts Indexed</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7' }}>1.5M+</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.2rem' }}>Biological Entities</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4f46e5' }}>13.1M+</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.2rem' }}>Empirical Causal Edges</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7' }}>&lt; 250ms</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.2rem' }}>Graph Traversal Latency</div>
            </div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4f46e5' }}>Frontier AI</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.2rem' }}>CSO Copilot AI</div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 1: 3-LAYER ARCHITECTURE ----------------- */}
      <section id="architecture" style={{
        padding: '5rem 2rem',
        maxWidth: '1240px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Proprietary 3-Tier Technology Stack
          </span>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 1rem 0' }}>
            Topological Knowledge Graphs &amp; Frontier AI Reasoning
          </h2>
          <p style={{ color: '#475569', maxWidth: '740px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.65 }}>
            Modern scientific discoveries remain trapped in hyperspecialized silos. DrugDiscovery.Studio solves the literature island problem by combining global knowledge graph topology with frontier biochemical reasoning.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Pillar 1 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2.25rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              marginBottom: '1.25rem'
            }}>
              <Network size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
              1. Co-Occurrence Graph Topology
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
              Maps 13.1M+ co-occurrence associations across 38.2M+ PubMed abstracts into a high-speed in-memory graph. Eliminates PubMed keyword blindness by analyzing the global connectivity structure rather than isolated search terms.
            </p>
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
              &bull; 1.5M Entities &bull; Sub-250ms Graph Queries
            </div>
          </div>

          {/* Pillar 2 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2.25rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4f46e5',
              marginBottom: '1.25rem'
            }}>
              <Dna size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
              2. Multi-Hop Causal Bridging (B-Terms)
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
              Identifies high-confidence intermediate biological entities ($B$-terms: receptors, kinases, ion channels, transcription factors) connecting Compound $A$ to Disease $C$. Computes literature gap density to uncover unstudied therapeutic whitespace.
            </p>
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#4f46e5', fontWeight: 700 }}>
              &bull; Transitive Inference &bull; Gap Density Scoring
            </div>
          </div>

          {/* Pillar 3 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2.25rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              marginBottom: '1.25rem'
            }}>
              <Brain size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
              3. Translational Hypothesis Ledger &amp; Synthesis
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
              Frontier biological reasoning models evaluate empirical evidence, screen for preclinical toxicology liabilities (hERG, liver, BBB), and compile audit-grade milestone histories into formal 1-click IND research dossiers.
            </p>
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
              &bull; Frontier AI Reasoning &bull; In-Vitro Assay Cascade &bull; 1-Click IND Export
            </div>
          </div>
        </div>

        {/* Foundational Note */}
        <div style={{
          marginTop: '2.5rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.88rem',
          color: '#475569'
        }}>
          <Compass size={20} style={{ color: '#0284c7', flexShrink: 0 }} />
          <span>
            <strong style={{ color: '#0f172a' }}>Scientific Lineage:</strong> Rooted in the foundational literature-based discovery paradigms established by Don Swanson, modernized with high-dimensional causal graph topology, sub-second SQLite indexing, and frontier AI reasoning.
          </span>
        </div>
      </section>

      {/* ----------------- SECTION 2: SOLUTION COMPARISON MATRIX ----------------- */}
      <section id="matrix" style={{
        padding: '5rem 2rem',
        maxWidth: '1240px',
        margin: '0 auto',
        background: '#f8fafc',
        borderRadius: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Solution Comparison Matrix
          </span>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 1rem 0' }}>
            Why Keyword Search &amp; Naive RAG Fail Biopharma
          </h2>
          <p style={{ color: '#475569', maxWidth: '740px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.65 }}>
            Discovering unstudied therapeutic mechanisms requires topological pathfinding across disjoint literatures, not simple keyword matching or cosine similarity.
          </p>
        </div>

        {/* Clean, High-Contrast Comparison Table */}
        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px -3px rgba(15, 23, 42, 0.05)' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.9rem'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '1.2rem 1.5rem', color: '#475569', fontWeight: 700, width: '25%' }}>Capability</th>
                <th style={{ padding: '1.2rem 1.5rem', color: '#64748b', fontWeight: 600, width: '25%' }}>Traditional PubMed Search</th>
                <th style={{ padding: '1.2rem 1.5rem', color: '#64748b', fontWeight: 600, width: '25%' }}>Vector Embedding / Naive RAG</th>
                <th style={{ 
                  padding: '1.2rem 1.5rem', 
                  color: '#0284c7', 
                  fontWeight: 800, 
                  width: '25%',
                  background: '#f0f9ff'
                }}>
                  DrugDiscovery.Studio
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1.1rem 1.5rem', fontWeight: 700, color: '#0f172a' }}>Disconnected Literature Discovery</td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} />
                    <span>Returns 0 results (Disjoint)</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} />
                    <span>Hallucinates or misses paths</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#0284c7', fontWeight: 700, background: '#f0f9ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#0284c7' }} />
                    <span>13.1M+ Causal Graph Traversal</span>
                  </div>
                </td>
              </tr>

              {/* Row 2 */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1.1rem 1.5rem', fontWeight: 700, color: '#0f172a' }}>Multi-Hop Causal Reasoning (A &rarr; B &rarr; C)</td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} />
                    <span>None (Exact matches only)</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Minus size={16} />
                    <span>Limited to vector distance</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#0284c7', fontWeight: 700, background: '#f0f9ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#0284c7' }} />
                    <span>Deterministic Biological Bridging</span>
                  </div>
                </td>
              </tr>

              {/* Row 3 */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1.1rem 1.5rem', fontWeight: 700, color: '#0f172a' }}>Mechanism of Action Synthesis</td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} />
                    <span>Manual literature reading</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Minus size={16} />
                    <span>Generic summarization</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#0284c7', fontWeight: 700, background: '#f0f9ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#0284c7' }} />
                    <span>Autonomous Bio-AI Synthesis</span>
                  </div>
                </td>
              </tr>

              {/* Row 4 */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1.1rem 1.5rem', fontWeight: 700, color: '#0f172a' }}>Real-Time Safety &amp; Toxicology Screen</td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} />
                    <span>None</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} />
                    <span>None</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#0284c7', fontWeight: 700, background: '#f0f9ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#0284c7' }} />
                    <span>AI Safety &amp; Toxicity Profiling</span>
                  </div>
                </td>
              </tr>

              {/* Row 5 */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1.1rem 1.5rem', fontWeight: 700, color: '#0f172a' }}>Translational Hypothesis Ledger</td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} />
                    <span>None</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} />
                    <span>Ephemeral chat logs</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#0284c7', fontWeight: 700, background: '#f0f9ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#0284c7' }} />
                    <span>Translational Hypothesis Ledger + Provenance</span>
                  </div>
                </td>
              </tr>

              {/* Row 6 */}
              <tr>
                <td style={{ padding: '1.1rem 1.5rem', fontWeight: 700, color: '#0f172a' }}>IND / Grant-Ready Dossier Export</td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} />
                    <span>None</span>
                  </div>
                </td>
                <td style={{ padding: '1.1rem 1.5rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Minus size={16} />
                    <span>Raw unverified text block</span>
                  </div>
                </td>
                <td style={{ 
                  padding: '1.1rem 1.5rem', 
                  color: '#0284c7', 
                  fontWeight: 700, 
                  background: '#f0f9ff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} style={{ color: '#0284c7' }} />
                    <span>1-Click PDF / Word / Markdown Dossier</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ----------------- SECTION 3: BIOPHARMA ENTERPRISE VALUE ----------------- */}
      <section style={{
        padding: '5.5rem 2rem',
        maxWidth: '1240px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Accelerate Translational Discovery
          </span>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 1rem 0' }}>
            Engineered for Scientists &amp; Discovery Leads
          </h2>
          <p style={{ color: '#475569', maxWidth: '740px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.65 }}>
            Accelerating early-stage target de-risking, pipeline diversification, and novel mechanism validation across oncology, neurology, immunology, and rare diseases.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {/* Card 1 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px -3px rgba(15, 23, 42, 0.05)' }}>
            <div style={{ color: '#0284c7', marginBottom: '1rem' }}>
              <Shield size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Target De-Risking &amp; Prioritization
            </h3>
            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
              Screen hypothesis feasibility and co-occurrence density before committing multimillion-dollar wet-lab assay budgets to uncertain targets.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px -3px rgba(15, 23, 42, 0.05)' }}>
            <div style={{ color: '#4f46e5', marginBottom: '1rem' }}>
              <Activity size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Mechanism of Action (MoA) Synthesis
            </h3>
            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
              Unpack complex, multi-layered biochemical cascades with direct PubMed citation evidence, bridging upstream ligands with downstream phenotypic outcomes.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px -3px rgba(15, 23, 42, 0.05)' }}>
            <div style={{ color: '#0284c7', marginBottom: '1rem' }}>
              <Award size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Patent Whitespace Discovery
            </h3>
            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
              Identify unstudied disease indications with zero direct prior art citations, providing defensible whitespace for method-of-use and formulation IP.
            </p>
          </div>

          {/* Card 4 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px -3px rgba(15, 23, 42, 0.05)' }}>
            <div style={{ color: '#059669', marginBottom: '1rem' }}>
              <FlaskConical size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              IND-Enabling Validation Protocols
            </h3>
            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
              Auto-generate structured in-vitro validation protocols (binding assays, IC50 screens, cell viability endpoints) ready for inclusion in grant proposals and IND filings.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 4: VALIDATED CASE STUDIES ----------------- */}
      <section id="benchmarks" style={{
        padding: '5rem 2rem',
        maxWidth: '1240px',
        margin: '0 auto',
        background: '#f8fafc',
        borderRadius: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Biopharma Validation Benchmarks
          </span>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 1rem 0' }}>
            Modern Blockbuster Discovery Benchmarks
          </h2>
          <p style={{ color: '#475569', maxWidth: '740px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.65 }}>
            Explore historically validated and ongoing clinical breakthroughs discovered by bridging disjoint biomedical literatures through intermediate biological B-terms.
          </p>
        </div>

        {/* Case Study Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          {caseStudies.map((cs, idx) => (
            <button
              key={cs.id}
              onClick={() => setActiveCaseTab(idx)}
              style={{
                background: activeCaseTab === idx ? '#0284c7' : '#ffffff',
                border: activeCaseTab === idx ? '1px solid #0284c7' : '1px solid #cbd5e1',
                color: activeCaseTab === idx ? '#ffffff' : '#475569',
                borderRadius: '8px',
                padding: '0.6rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: activeCaseTab === idx ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
              }}
            >
              {cs.title.split(':')[0]}
            </button>
          ))}
        </div>

        {/* Active Case Study Details */}
        {(() => {
          const cs = caseStudies[activeCaseTab];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {cs.category}
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', lineHeight: 1.25 }}>
                  {cs.title}
                </h3>
                <p style={{ color: '#334155', fontSize: '0.92rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                  {cs.narrative}
                </p>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7', padding: '0.85rem 1.25rem', borderRadius: '0 8px 8px 0', marginBottom: '1.5rem', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>
                    <strong>Clinical Significance:</strong> {cs.significance}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginTop: '0.35rem' }}>
                    {cs.validationYear}
                  </div>
                </div>

                <button
                  onClick={() => onLaunchApp({ source: cs.source.split('(')[0].trim(), target: cs.target.split('&')[0].trim() })}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.7rem 1.5rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  <span>Launch Live Exploration in Studio</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Visual Multi-Hop Bridge Box */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.75rem',
                boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.08)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                  Biomedical Graph Bridge Architecture
                </div>

                {/* Node A */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase' }}>Concept A (Input Modality)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{cs.source}</div>
                </div>

                {/* Intermediate B Bridges */}
                <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Transitive Intermediate B-Term Bridges:
                  </div>
                  {cs.bTerms.map((term, i) => (
                    <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.45rem 0.8rem', fontSize: '0.82rem', color: '#1e293b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#0284c7', fontWeight: 800 }}>&bull;</span>
                      <span>{term}</span>
                    </div>
                  ))}
                </div>

                {/* Node C */}
                <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '0.85rem 1rem', marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#4338ca', fontWeight: 700, textTransform: 'uppercase' }}>Concept C (Discovered Indication)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{cs.target}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ----------------- SECTION 5: PRICING & SUBSCRIPTION ----------------- */}
      <section id="pricing" style={{
        padding: '5.5rem 2rem',
        maxWidth: '1240px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Institutional Access
          </span>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 1rem 0' }}>
            Accelerate Your Pipeline Velocity
          </h2>
          <p style={{ color: '#475569', maxWidth: '740px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.65 }}>
            Transparent tiered access for individual researchers, translational leads, and biotech labs.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {/* Free Tier */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px -3px rgba(15, 23, 42, 0.05)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Free Scientist Account</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0' }}>
                $0 <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ on sign-up</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.84rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Includes 5 complimentary AI literature discovery queries to test candidate pathways.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span><strong>5 AI Literature Queries</strong> total</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span>Top 5 B-Term Mechanistic Bridges</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span>Interactive 2D Graph Visualizer</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span>Session Hypothesis Ledger</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onLaunchApp()}
              style={{
                marginTop: '1.5rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                borderRadius: '8px',
                padding: '0.65rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Create Free Account (5 Queries) &rarr;
            </button>
          </div>

          {/* Researcher Plan ($24.99/mo) */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #0284c7',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 25px -5px rgba(2, 132, 199, 0.12)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>Researcher</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0' }}>
                $24.99 <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ month</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.84rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Moderate volume for academic labs and continuous discovery projects.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span><strong>50 AI Traversals / mo</strong></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span><strong>10 Formal IND Dossiers / mo</strong></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span>Persistent Cloud-Synced Ledger</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span>Literature Gap Density Scoring</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenPricing}
              style={{
                marginTop: '1.5rem',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                borderRadius: '8px',
                padding: '0.65rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Subscribe Researcher ($24.99/mo)
            </button>
          </div>

          {/* Scientist Plan ($49.99/mo) - FEATURED */}
          <div style={{
            background: '#ffffff',
            border: '2px solid #6366f1',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: '0 12px 35px -5px rgba(99, 102, 241, 0.2)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              textTransform: 'uppercase'
            }}>
              Most Popular
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>Scientist</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0' }}>
                $49.99 <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ month</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.84rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Full compute power for principal investigators and translational leads.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#4f46e5' }} />
                  <span><strong>Unlimited</strong> Multi-Hop Traversals</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#4f46e5' }} />
                  <span><strong>CSO Bio-AI Reasoning Engine</strong></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#4f46e5' }} />
                  <span><strong>25 Formal IND Dossiers / mo</strong></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#4f46e5' }} />
                  <span>Real-Time AI Toxicology Screen</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenPricing}
              style={{
                marginTop: '1.5rem',
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '0.65rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
              }}
            >
              Subscribe Scientist ($49.99/mo)
            </button>
          </div>

          {/* Biotech Lab Tier ($199/mo) */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px -3px rgba(15, 23, 42, 0.05)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>Biotech Lab</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0' }}>
                $199 <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ month</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.84rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                For biotech startups and multi-investigator research groups (5 seats).
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span><strong>5 Scientist Seats</strong> included</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span>Shared Team Collaborative Ledgers</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span><strong>100 IND Dossiers / mo</strong></span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} style={{ color: '#0284c7' }} />
                  <span>Custom In-Vitro Assay Protocols</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenPricing}
              style={{
                marginTop: '1.5rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                borderRadius: '8px',
                padding: '0.65rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Subscribe Lab ($199/mo)
            </button>
          </div>
        </div>
      </section>

      {/* ----------------- SECTION 6: SCIENTIFIC FAQS ----------------- */}
      <section id="faq" style={{
        padding: '5rem 2rem',
        maxWidth: '940px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Frequently Asked Questions
          </span>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 1rem 0' }}>
            Scientific, Technical &amp; IP Governance
          </h2>
          <p style={{ color: '#475569', fontSize: '0.95rem' }}>
            Details on causal graph heuristics, data sovereignty, and algorithmic methodology.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
                transition: 'border-color 0.2s'
              }}
            >
              <button
                onClick={() => toggleFaq(idx)}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#0f172a',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
                ) : (
                  <ChevronDown size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                )}
              </button>

              {openFaq === idx && (
                <div style={{
                  padding: '0 1.5rem 1.5rem 1.5rem',
                  color: '#475569',
                  fontSize: '0.9rem',
                  lineHeight: 1.65,
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '1rem'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ----------------- SECTION 7: BOTTOM INSTITUTIONAL FOOTER ----------------- */}
      <footer style={{
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '3.5rem 2rem 2.5rem 2rem',
        fontSize: '0.85rem',
        color: '#64748b'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          marginBottom: '2.5rem'
        }}>
          {/* Brand & Mission */}
          <div style={{ maxWidth: '480px' }}>
            <Logo size="md" theme="light" showSubtitle={true} />
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '0.75rem' }}>
              Autonomous biomedical AI discovery platform connecting 38M+ published papers to synthesize therapeutic targets, mechanisms of action, and wet-lab validation protocols.
            </p>
          </div>

          {/* Quick Nav & Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            <a href="#acceleration" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600, transition: 'color 0.2s' }}>Overview</a>
            <a href="#architecture" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600, transition: 'color 0.2s' }}>How It Works</a>
            <a href="#benchmarks" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600, transition: 'color 0.2s' }}>Case Studies</a>
            <a href="#pricing" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600, transition: 'color 0.2s' }}>Pricing</a>
            {onOpenDocs && (
              <button onClick={onOpenDocs} style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                Documentation
              </button>
            )}
            <button
              onClick={() => onLaunchApp()}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.2)'
              }}
            >
              <span>Open Studio</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Bottom Legal Copyright */}
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          paddingTop: '1.75rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            &copy; {new Date().getFullYear()} Silicon Research Group (SRG) &bull; DrugDiscovery.Studio &bull; All Rights Reserved.
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            For scientific research and experimental validation use only. Not for direct diagnostic or medical treatment decisions.
          </div>
        </div>
      </footer>

    </div>
  );
};
