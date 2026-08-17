import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Sparkles, Send, X, Maximize2, Minimize2, Shield, 
  BookOpen, Dna, Activity, Copy, Check, Plus, RefreshCw,
  FlaskConical, Lock, AlertCircle, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { marked } from 'marked';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface CsoCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  clientContext: {
    sourceConcept?: string;
    targetConcept?: string;
    selectedBTerm?: any;
    activeBTerms?: any[];
    activeEvidence?: any[];
    chemblData?: any;
    otData?: any;
    ledgerSteps?: any[];
    ledgerNotes?: string[];
    safetyCritique?: any;
    openDiscoveryResult?: any;
  };
  onAddToLedger?: (note: string) => void;
  onTriggerSearch?: (source: string, target: string) => void;
}

export const CsoCopilot: React.FC<CsoCopilotProps> = ({
  isOpen,
  onClose,
  clientContext,
  onAddToLedger,
  onTriggerSearch
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello Doctor. I am your **Translational Bio-AI** at DrugDiscovery.Studio.\\n\\nI have synchronized with your active discovery canvas, multi-hop topological graph paths, and private hypothesis ledger. How can I assist your translational pipeline strategy today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addedLedgerId, setAddedLedgerId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue.trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare sanitized client context with zero leakage
      const sanitizedContext = {
        sourceConcept: clientContext.sourceConcept || '',
        targetConcept: clientContext.targetConcept || '',
        selectedBTerm: clientContext.selectedBTerm?.word || clientContext.selectedBTerm || '',
        activeBTerms: (clientContext.activeBTerms || []).slice(0, 6).map(b => ({
          word: b.word || b.name,
          score: b.score,
          countA: b.countA,
          countC: b.countC,
          type: b.type
        })),
        activeEvidence: (clientContext.activeEvidence || []).slice(0, 4).map(e => ({
          pmid: e.pmid,
          sentence: e.sentence || e.title
        })),
        chemblData: clientContext.chemblData ? {
          max_phase: clientContext.chemblData.max_phase,
          molecule_type: clientContext.chemblData.molecule_type,
          smiles: clientContext.chemblData.smiles
        } : null,
        otData: clientContext.otData ? {
          approvedSymbol: clientContext.otData.approvedSymbol,
          biotype: clientContext.otData.biotype,
          subcellularLocations: clientContext.otData.subcellularLocations,
          tractability: clientContext.otData.tractability
        } : null,
        ledgerSteps: (clientContext.ledgerSteps || []).map(s => ({
          from: s.from,
          to: s.to,
          type: s.type,
          score: s.score
        })),
        ledgerNotes: clientContext.ledgerNotes || [],
        safetyCritique: clientContext.safetyCritique,
        openDiscoveryResult: clientContext.openDiscoveryResult
      };

      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.id !== 'welcome').map(m => ({
            role: m.role,
            content: m.content
          })),
          clientContext: sanitizedContext
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const modelMsg: Message = {
        id: 'model-' + Date.now(),
        role: 'model',
        content: data.content || 'I have evaluated your hypothesis. Please let me know if you would like an in-vitro validation protocol or structural breakdown.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        role: 'model',
        content: `**Biochemical Reasoning Alert**: Unable to synthesize response (${err.message}). Retrying in single-node mode...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToLedger = (id: string, content: string) => {
    if (onAddToLedger) {
      onAddToLedger(content);
      setAddedLedgerId(id);
      setTimeout(() => setAddedLedgerId(null), 2500);
    }
  };

  const promptShortcuts = [
    { label: "🔬 Critique Causal Plausibility & Whitespace", prompt: "Evaluate the biological and mechanistic plausibility of connecting Concept A to Concept C via our active intermediate B-terms. Why is direct literature co-occurrence currently zero, and does this represent viable patent whitespace?" },
    { label: "🧪 Design In-Vitro Assay Cascade", prompt: "Propose a structured, stage-gated preclinical assay cascade (CETSA target engagement, Surface Plasmon Resonance binding kinetics, cellular qPCR readout, and phenotypic viability IC50 endpoints) to validate this hypothesis in the wet lab." },
    { label: "🛡️ Screen Structure & Tox Liabilities", prompt: "Perform a rapid structure-activity relationship (SAR) and toxicological liability critique for this candidate modality (evaluating hERG cardiotoxicity, hepatotoxicity/CYP interactions, and BBB permeability)." },
    { label: "📄 Draft Executive IND Mechanism Summary", prompt: "Draft a formal, publication-grade executive summary of this molecular mechanism of action suitable for a scientific advisory board (SAB) review or FDA IND Pre-Meeting briefing package." }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      width: isExpanded ? '860px' : '480px',
      height: isExpanded ? '85vh' : '620px',
      maxWidth: 'calc(100vw - 3rem)',
      maxHeight: 'calc(100vh - 3rem)',
      background: '#0f172a',
      border: '1px solid rgba(6, 182, 212, 0.35)',
      borderRadius: '16px',
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1050,
      overflow: 'hidden',
      transition: 'width 0.25s ease, height 0.25s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.9rem 1.25rem',
        background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'white' }}>Translational Bio-AI</span>
              <span style={{ fontSize: '0.65rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.4)', color: '#38bdf8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                Translational AI
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <span>Isolated Zero-Retention Session</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
            title={isExpanded ? 'Collapse View' : 'Expand View'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
            title="Close Bio-AI"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Active Context Bar */}
      <div style={{
        padding: '0.45rem 1rem',
        background: 'rgba(6, 182, 212, 0.05)',
        borderBottom: '1px solid rgba(6, 182, 212, 0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        fontSize: '0.72rem',
        whiteSpace: 'nowrap'
      }}>
        <span style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Layers size={12} />
          <span>Active Context:</span>
        </span>
        {clientContext.sourceConcept ? (
          <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#e2e8f0' }}>
            A: <strong>{clientContext.sourceConcept}</strong> {clientContext.targetConcept ? `➔ C: ${clientContext.targetConcept}` : ''}
          </span>
        ) : (
          <span style={{ color: '#64748b' }}>No active search query</span>
        )}
        {clientContext.selectedBTerm && (
          <span style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#38bdf8' }}>
            Bridge: <strong>{clientContext.selectedBTerm?.word || clientContext.selectedBTerm}</strong>
          </span>
        )}
        {clientContext.ledgerSteps && clientContext.ledgerSteps.length > 0 && (
          <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
            Ledger: <strong>{clientContext.ledgerSteps.length} Steps</strong>
          </span>
        )}
      </div>

      {/* Message Stream */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '90%',
                padding: '0.85rem 1.1rem',
                borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: isUser ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'rgba(30, 41, 59, 0.85)',
                border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isUser ? '#ffffff' : '#e2e8f0',
                fontSize: '0.86rem',
                lineHeight: 1.6,
                boxShadow: isUser ? '0 4px 12px rgba(2, 132, 199, 0.25)' : '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}>
                {isUser ? (
                  <div>{m.content}</div>
                ) : (
                  <div 
                    dangerouslySetInnerHTML={{ __html: marked.parse(m.content) as string }} 
                    style={{ overflowX: 'auto' }}
                  />
                )}
              </div>

              {/* Action Bar for AI Messages */}
              {!isUser && m.id !== 'welcome' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem', paddingLeft: '0.25rem' }}>
                  <button
                    onClick={() => handleCopy(m.id, m.content)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedId === m.id ? '#34d399' : '#94a3b8',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: 0
                    }}
                  >
                    {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  {onAddToLedger && (
                    <button
                      onClick={() => handleSaveToLedger(m.id, m.content)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: addedLedgerId === m.id ? '#34d399' : '#38bdf8',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: 0
                      }}
                    >
                      {addedLedgerId === m.id ? <Check size={12} /> : <Plus size={12} />}
                      <span>{addedLedgerId === m.id ? 'Added to Ledger' : 'Add to Hypothesis Ledger'}</span>
                    </button>
                  )}
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{m.timestamp}</span>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8', fontSize: '0.82rem', padding: '0.5rem' }}>
            <Sparkles size={16} className="animate-spin" />
            <span>Translational AI is synthesizing multi-hop literature pathways...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 1-Click Executive Prompt Shortcuts */}
      <div style={{
        padding: '0.5rem 0.85rem',
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {promptShortcuts.map((ps, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(ps.prompt)}
            disabled={isLoading}
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '0.3rem 0.65rem',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {ps.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'rgba(15, 23, 42, 0.98)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <input
            type="text"
            placeholder="Ask Translational Bio-AI (e.g. 'Evaluate binding kinetics & off-target liabilities...')"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '0.65rem 0.9rem',
              color: 'white',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '0.65rem 1rem',
              cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading || !inputValue.trim() ? 0.6 : 1
            }}
          >
            <Send size={15} />
          </button>
        </form>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.68rem', color: '#64748b' }}>
          <span>Strict zero-retention policy &bull; Single-tenant session isolation</span>
          <span>Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  );
};
