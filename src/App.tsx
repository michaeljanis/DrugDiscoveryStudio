import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Loader2, Zap, Compass, Activity,  
  ArrowRight, BrainCircuit, RefreshCw, Maximize2, Minimize2,
  ZoomIn, ZoomOut, Info, Layers2, FileText, ChevronRight, ChevronLeft,
  Sparkles, Check, Building, User, Mail, Menu, X, Bot, Award, Lock, CreditCard, Bell
} from 'lucide-react';
import './App.css';
import { fetchChEMBLMolecule, fetchOpenTargetsTarget, searchChEMBLMolecule } from './services/liveServices';
import { loginWithGoogle, loginWithEmail, loginAsDemoScientist, logout, subscribeToAuthChanges } from './services/firebase';
import { LandingPage } from './components/LandingPage';
import { CsoCopilot } from './components/CsoCopilot';
import { DiscoveryProgressHud } from './components/DiscoveryProgressHud';
import { DocumentationModal } from './components/DocumentationModal';
import { FeedbackModal } from './components/FeedbackModal';
import { Logo } from './components/Logo';
import { marked } from 'marked';

interface BTerm {
  word: string;
  id: string;
  type: string;
  druggability?: {
    tier: string;
    badge: string;
    modality: string;
    tractability: string;
  };
  countA: number;
  countC: number;
  totalOccurrences: number;
  score: number;
}

interface EvidenceItem {
  pmid: string;
  title?: string;
  sentence: string;
  level: 'sentence' | 'abstract';
}

interface PathResult {
  path: string[];
  nodes: { id: string; name: string; type: string }[];
  edges: { source: string; target: string; pmid: string; sentence: string; level: string }[];
  hypothesis?: string;
  cvs?: number;
}

const isStudioMode = typeof window !== 'undefined' && (
  window.location.hostname.includes('drugdiscovery.studio') ||
  new URLSearchParams(window.location.search).get('studio') === 'true' ||
  new URLSearchParams(window.location.search).get('domain') === 'drugdiscovery.studio'
);

const BRAND_NAME = isStudioMode ? 'Drug Discovery Studio' : 'Insight Discovery';

export default function App() {
  const handleStartCheckout = async (plan: string) => {
    setIsCheckingOutPlan(plan);
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: authUser?.uid || 'guest_scientist',
          userEmail: authUser?.email || '',
          returnUrl: window.location.href
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initiate checkout.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Checkout error: ' + err.message);
    } finally {
      setIsCheckingOutPlan(null);
    }
  };

  // Check for successful Stripe / Google Pay return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const sessionId = params.get('session_id');
      const plan = params.get('plan') || 'pro';
      if (sessionId) {
        fetch(`/api/billing/verify-session?session_id=${sessionId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setAccountTier(plan);
              setPaymentBanner(`🎉 Welcome to ${plan === 'pro' ? 'Pro Scientist Tier' : 'your upgraded plan'}! All discovery limits unlocked.`);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(console.error);
      }
    }
  }, []);

  // Navigation
  const [activeTab] = useState<'discover' | 'status'>('discover');

  // Firebase Auth State
  const [authUser, setAuthUser] = useState<any>(null);
  // Open Discovery & Hypothesis Journal State
  const [researchContext, setResearchContext] = useState<string>('');
  const [openDiscoveryResult, setOpenDiscoveryResult] = useState<any>(null);
  const [isOpenDiscoveryLoading, setIsOpenDiscoveryLoading] = useState<boolean>(false);
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<'open_discovery' | 'mechanistic_bridging' | 'graph'>('open_discovery');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<string>('all');
  const [aiReviewResult, setAiReviewResult] = useState<any>(null);
  const [isReviewingJournal, setIsReviewingJournal] = useState<boolean>(false);
  
  interface JournalStep {
    from: string;
    to: string;
    type: string;
    citationsA: number;
    citationsC: number;
    score: number;
    rationale?: string;
    timestamp: string;
  }
  const [journalSteps, setJournalSteps] = useState<JournalStep[]>([]);
  const [journalNotes, setJournalNotes] = useState<string[]>([]);
  const [currentNoteInput, setCurrentNoteInput] = useState<string>('');
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [accountTier, setAccountTier] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('drugdiscovery_tier') || 'free';
    }
    return 'free';
  });
  const [freeQueryCount, setFreeQueryCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('drugdiscovery_free_queries') || '0', 10);
    }
    return 0;
  });
  const [vipCode, setVipCode] = useState<string>('');
  const [vipError, setVipError] = useState<string>('');
  const [isCheckingOutPlan, setIsCheckingOutPlan] = useState<string | null>(null);
  const [paymentBanner, setPaymentBanner] = useState<string | null>(null);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false);
  const [formalDossier, setFormalDossier] = useState<any>(null);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState<boolean>(false);
  const [hypothesisBreadcrumbs, setHypothesisBreadcrumbs] = useState<string[]>([]);

  // View Mode: 'landing' (Commercial Showroom) vs 'app' (Discovery Studio Canvas)
  const [viewMode, setViewMode] = useState<'landing' | 'app'>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('drugdiscovery_user');
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment')) {
        return 'app';
      }
      if (savedUser && (params.get('app') === 'true' || params.get('source') || params.get('target'))) {
        return 'app';
      }
    }
    return 'landing';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [customEmailInput, setCustomEmailInput] = useState<string>('');
  const [pendingLaunchPreset, setPendingLaunchPreset] = useState<{ source: string; target: string } | null>(null);
  const [authIntentMessage, setAuthIntentMessage] = useState<string>('');

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setAuthUser(u);
      if (u) {
        // Load user's query count
        const uKey = u.email || u.uid;
        const count = parseInt(localStorage.getItem(`drugdiscovery_queries_${uKey}`) || '0', 10);
        setFreeQueryCount(count);

        // Load permanent journal if pro
        const tier = localStorage.getItem('drugdiscovery_tier') || 'free';
        if (tier === 'pro' || tier === 'trial' || tier === 'team') {
          const savedJournal = localStorage.getItem(`drugdiscovery_journal_${uKey}`);
          if (savedJournal) {
            try {
              const parsed = JSON.parse(savedJournal);
              if (parsed.steps) setJournalSteps(parsed.steps);
              if (parsed.notes) setJournalNotes(parsed.notes);
            } catch (e) {
              console.warn("Failed to parse saved journal", e);
            }
          }
        }
      } else {
        // Ensure unauthenticated users are on the landing page
        setViewMode('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  // Save journal changes for Pro accounts
  useEffect(() => {
    if (authUser && (accountTier === 'pro' || accountTier === 'trial' || accountTier === 'team')) {
      const uKey = authUser.email || authUser.uid;
      localStorage.setItem(`drugdiscovery_journal_${uKey}`, JSON.stringify({ steps: journalSteps, notes: journalNotes }));
    }
  }, [journalSteps, journalNotes, authUser, accountTier]);

  // Unified UX / Feedback State
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // Pro Tiers Modal & Contact Form State
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [selectedProTier, setSelectedProTier] = useState<'free' | 'pro' | 'pro_plus' | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactOrg, setContactOrg] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Disclaimer Modal State
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  // Sidebar responsive drawer open states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Onboarding Guide States
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState<string | null>(null);
  const [isDocumentationOpen, setIsDocumentationOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [documentationInitialTab, setDocumentationInitialTab] = useState<string>('quickstart');

  interface NotificationItem {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: string;
    read: boolean;
  }
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      const uEmail = authUser?.email || '';
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(uEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) setNotifications(data.notifications);
      }
    } catch (e) {
      console.warn("Failed to fetch notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const notifInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(notifInterval);
  }, [authUser]);

  const handleMarkNotifRead = async (id: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.warn("Failed to mark notif read", e);
    }
  };
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('episteme_onboarding_completed');
      return saved !== 'true';
    } catch {
      return true;
    }
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

  // Input states
  const [sourceConcept, setSourceConcept] = useState<string>('');
  const [targetConcept, setTargetConcept] = useState<string>('');
  const [maxHops, setMaxHops] = useState<number>(3);
  const [pathDepth, setPathDepth] = useState<number>(1);
  const [selectedSourceType, setSelectedSourceType] = useState<string>('');
  const [selectedTargetType, setSelectedTargetType] = useState<string>('');
  
  // AI Entity Grounding & Augmentation State
  const [isAiAugmented, setIsAiAugmented] = useState<boolean>(false);
  const [sourceGrounding, setSourceGrounding] = useState<any>(null);
  const [targetGrounding, setTargetGrounding] = useState<any>(null);
  
  // Autonomous AI Hypothesis State
  const [isHypothesizing, setIsHypothesizing] = useState<boolean>(false);
  const [swarmLogs, setSwarmLogs] = useState<{agent: string, action: string, data: any}[]>([]);
  const [swarmResult, setSwarmResult] = useState<any>(null);
  const [dossierReport, setDossierReport] = useState<any>(null);
  const [isSummarizingDossier, setIsSummarizingDossier] = useState<boolean>(false);
  const [pmidSummaries, setPmidSummaries] = useState<Record<string, string>>({});
  const [summarizingPmids, setSummarizingPmids] = useState<Record<string, boolean>>({});

  const handleSummarizePmid = async (pmid: string) => {
    setSummarizingPmids(prev => ({ ...prev, [pmid]: true }));
    try {
      const res = await fetch('/api/summarize-pmid', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pmid })
      });
      const data = await res.json();
      if (data.summary) {
        setPmidSummaries(prev => ({ ...prev, [pmid]: data.summary }));
      }
    } catch(e) {}
    setSummarizingPmids(prev => ({ ...prev, [pmid]: false }));
  };

  const handleGenerateHypothesis = (customSource?: string | any) => {
    const targetSource = typeof customSource === 'string' ? customSource : sourceConcept;
    if (!targetSource) return;
    
    if (typeof customSource === 'string' && customSource !== sourceConcept) {
      setSourceConcept(customSource);
    }
    setIsHypothesizing(true);
    setSwarmLogs([]);
    setSwarmResult(null);
    
    const eventSource = new EventSource(`/api/swarm-discovery?source=${encodeURIComponent(sourceConcept)}`);
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setSwarmLogs(prev => [...prev, payload]);
        
        if (payload.agent === 'System' && payload.action === 'Complete') {
          setSwarmResult({
            source: payload.data.source,
            hypotheses: payload.data.hypotheses,
            isFailure: false
          });
          eventSource.close();
          setIsHypothesizing(false);
          
          setIsSummarizingDossier(true);
          setDossierReport(null);
          fetch('/api/summarize-hypothesis', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: payload.data.source, hypotheses: payload.data.hypotheses })
          }).then(res => res.json()).then(data => {
            setDossierReport(data);
            setIsSummarizingDossier(false);
          }).catch(() => setIsSummarizingDossier(false));
        } else if (payload.agent === 'System' && payload.action === 'Failed') {
          setSwarmResult({
            isFailure: true,
            errorMsg: 'The swarm exhausted all iterations without finding a literature "Sweet Spot". Consider a different source concept or broader scope.'
          });
          eventSource.close();
          setIsHypothesizing(false);
        } else if (payload.agent === 'System' && payload.action === 'Error') {
          setSwarmResult({
            isFailure: true,
            errorMsg: payload.data
          });
          eventSource.close();
          setIsHypothesizing(false);
        }
      } catch (e) {
        console.error("SSE Parse Error", e);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
      setSwarmResult({
        isFailure: true,
        errorMsg: 'The connection to the Swarm backend timed out or was interrupted. The swarm may still be generating in the background.'
      });
      setIsHypothesizing(false);
    };
  };

  // Autocomplete suggestions
  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [targetSuggestions, setTargetSuggestions] = useState<any[]>([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState<boolean>(false);
  const [showTargetSuggestions, setShowTargetSuggestions] = useState<boolean>(false);

  // AI Semantic Expansion (Multiple selections)
  const [expandedSources, setExpandedSources] = useState<string[]>([]);
  const [expandedTargets, setExpandedTargets] = useState<string[]>([]);
  const [sourceSynonyms, setSourceSynonyms] = useState<string[]>([]);
  const [sourceBroader, setSourceBroader] = useState<string[]>([]);
  const [sourceNarrower, setSourceNarrower] = useState<string[]>([]);
  const [targetSynonyms, setTargetSynonyms] = useState<string[]>([]);
  const [targetBroader, setTargetBroader] = useState<string[]>([]);
  const [targetNarrower, setTargetNarrower] = useState<string[]>([]);
  const [isExpandingSource, setIsExpandingSource] = useState(false);
  const [isExpandingTarget, setIsExpandingTarget] = useState(false);
  const [lastExpandedSource, setLastExpandedSource] = useState("");
  const [lastExpandedTarget, setLastExpandedTarget] = useState("");
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());

  // Search Results
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [directCount, setDirectCount] = useState<number>(0);
  const [swansonBList, setSwansonBList] = useState<BTerm[]>([]);
  const [dbPaths, setDbPaths] = useState<PathResult[]>([]);
  const [activePathIndex, setActivePathIndex] = useState<number>(0);
  const [mergedPathsLimit, setMergedPathsLimit] = useState<number>(1);
  const [depth3State, setDepth3State] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [depth7State, setDepth7State] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Idle — Pathfinder ready');
  const [statusPulse, setStatusPulse] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [loadedPaths, setLoadedPaths] = useState<Record<number, PathResult[]>>({});
  const [allRecursivePaths, setAllRecursivePaths] = useState<Record<string, Record<number, PathResult>>>({});

  const getStatusPulseColorClass = () => {
    if (isLoadingEvidence || isLoadingAiProposal || depth3State === 'loading' || depth7State === 'loading' || isSearching) {
      return 'status-amber';
    }
    if (depth3State === 'error' || depth7State === 'error') {
      return 'status-rose';
    }
    return 'status-green';
  };

  const getStatusPulseClass = () => {
    if (isLoadingEvidence || isLoadingAiProposal || depth3State === 'loading' || depth7State === 'loading' || isSearching) {
      return 'pulse-running';
    }
    return '';
  };

  const getStatusText = () => {
    const parts = [];
    if (isSearching) {
      parts.push("Searching literature...");
    }
    if (isLoadingEvidence) {
      parts.push("Fetching citations & evidence...");
    }
    if (isLoadingAiProposal) {
      parts.push(`Analyzing mechanism for ${selectedSourceType || 'source'} ➔ ${selectedTargetType || 'target'}...`);
    }
    if (depth3State === 'loading') {
      parts.push("Expanding pathway network (3 steps)...");
    } else if (depth7State === 'loading') {
      parts.push("Expanding pathway network (7 steps)...");
    }
    
    if (parts.length === 0) {
      if (depth3State === 'error' || depth7State === 'error') {
        return "Unable to expand pathway network";
      }
      return "Ready";
    }
    return parts.join(" | ");
  };

  // Graph Overlay selections (Swanson B-terms checked on the graph)
  const [checkedBTerms, setCheckedBTerms] = useState<Set<string>>(new Set());

  // Loop-Prevention Trail
  const [historyTrail, setHistoryTrail] = useState<string[]>([]);

  // Selected Bridge & Unified Concept Details (A, B, or C)
  interface SelectedConceptInfo {
    name: string;
    type: string;
    id?: string;
    countA?: number;
    countC?: number;
    totalOccurrences?: number;
    isBridge: boolean;
  }
  const [selectedB, setSelectedB] = useState<BTerm | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<SelectedConceptInfo | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'novelty' | 'ab' | 'bc' | 'name'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [evidenceSource, setEvidenceSource] = useState<string>('');
  const [evidenceTarget, setEvidenceTarget] = useState<string>('');
  const [evidenceSourceType, setEvidenceSourceType] = useState<string>('');
  const [evidenceTargetType, setEvidenceTargetType] = useState<string>('');

  const [evidenceA, setEvidenceA] = useState<EvidenceItem[]>([]);
  const [evidenceC, setEvidenceC] = useState<EvidenceItem[]>([]);
  const [evidenceErrorA, setEvidenceErrorA] = useState<string | null>(null);
  const [evidenceErrorC, setEvidenceErrorC] = useState<string | null>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState<boolean>(false);
  const [isMapMaximized, setIsMapMaximized] = useState<boolean>(false);
  const [mapHeightPct, setMapHeightPct] = useState<number>(50);
  const [selectedEvidence, setSelectedEvidence] = useState<{pmid: string, title?: string, journal?: string, year?: string, authors?: string, loading?: boolean} | null>(null);
  const [discoveryMode, setDiscoveryMode] = useState<'swanson' | 'pathfinder'>('swanson');
  const evidenceCache = useRef<Record<string, { 
    evidenceA: any[], 
    evidenceC: any[], 
    aiProposal: any, 
    loadedPaths?: Record<number, PathResult[]>,
    depth3State?: 'idle' | 'loading' | 'loaded' | 'error',
    depth7State?: 'idle' | 'loading' | 'loaded' | 'error',
    allRecursivePaths?: Record<string, Record<number, PathResult>>
  }>>({});
  const activeCacheKeyRef = useRef<string | null>(null);
  const sourceAutocompleteTimeoutRef = useRef<any>(null);
  const targetAutocompleteTimeoutRef = useRef<any>(null);
  const sourceAutocompleteAbortControllerRef = useRef<AbortController | null>(null);
  const targetAutocompleteAbortControllerRef = useRef<AbortController | null>(null);
  const latestSourceQueryRef = useRef<string>('');
  const latestTargetQueryRef = useRef<string>('');


  // RLHF Learning State
  const [rlhfInsights, setRlhfInsights] = useState<{ id: string; status: 'approved' | 'discarded'; bTerm: string; mechanism: string }[]>([]);
  const [isRlhfAnimating, setIsRlhfAnimating] = useState(false);

  const [docsContent, setDocsContent] = useState("");
  useEffect(() => {
    if (isDocsOpen && !docsContent) {
      fetch('/docs.md').then(r => r.text()).then(setDocsContent);
    }
  }, [isDocsOpen, docsContent]);

  useEffect(() => {
    document.title = `${BRAND_NAME} — Next-Gen LBD Discovery Engine`;
  }, []);

  const handleMouseDownResizer = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = mapHeightPct;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const containerHeight = window.innerHeight;
      const deltaY = moveEvent.clientY - startY;
      const deltaPct = (deltaY / containerHeight) * 100;
      let newPct = startHeight + deltaPct;
      if (newPct < 20) newPct = 20;
      if (newPct > 80) newPct = 80;
      setMapHeightPct(newPct);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSelectEvidence = async (pmid: string) => {
    const rawId = pmid.replace('PMID:', '');
    if (selectedEvidence?.pmid === rawId) {
      setSelectedEvidence(null); // toggle off
      return;
    }
    setSelectedEvidence({ pmid: rawId, loading: true });
    try {
      const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${rawId}&retmode=json`);
      const data = await res.json();
      const result = data.result[rawId];
      if (result) {
        setSelectedEvidence({
          pmid: rawId,
          loading: false,
          title: result.title,
          journal: result.fulljournalname || result.source,
          year: result.pubdate,
          authors: result.authors ? result.authors.map((a: any) => a.name).join(', ') : ''
        });
      } else {
        setSelectedEvidence({ pmid: rawId, loading: false });
      }
    } catch (e) {
      console.error(e);
      setSelectedEvidence({ pmid: rawId, loading: false });
    }
  };
  interface AIProposal {
    mechanismSummary: string;
    discoveryValue: string;
    experimentalValidation: string[];
    drugRepurposing?: string;
    targetDruggability?: string;
    structureActivity?: string;
    clinicalTranslational?: string;
  }
  const [aiProposal, setAiProposal] = useState<AIProposal | null>(null);
  const [isLoadingAiProposal, setIsLoadingAiProposal] = useState<boolean>(false);

  // Structured Pharma validation lookups
  const [chemblData, setChemblData] = useState<any | null>(null);
  const [otData, setOtData] = useState<any | null>(null);
  const [isLoadingPharma, setIsLoadingPharma] = useState<boolean>(false);



  // Advanced Filters
  const [minScore, setMinScore] = useState<number>(0.0);
  const [includedTypes, setIncludedTypes] = useState<Set<string>>(new Set(['compound', 'target', 'pathway', 'disease', 'phenotype']));

  // SVG Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs for clicking outside autocomplete dropdowns
  const sourceRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  // Click outside listener for autocomplete
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setShowSourceSuggestions(false);
      }
      if (targetRef.current && !targetRef.current.contains(event.target as Node)) {
        setShowTargetSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAutocompleteFetch = (val: string, target: 'source' | 'target') => {
    const timeoutRef = target === 'source' ? sourceAutocompleteTimeoutRef : targetAutocompleteTimeoutRef;
    const abortRef = target === 'source' ? sourceAutocompleteAbortControllerRef : targetAutocompleteAbortControllerRef;

    if (target === 'source') {
      latestSourceQueryRef.current = val;
    } else {
      latestTargetQueryRef.current = val;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (val.trim().length < 2) {
      if (target === 'source') setSourceSuggestions([]);
      else setTargetSuggestions([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(val)}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          const latestQuery = target === 'source' ? latestSourceQueryRef.current : latestTargetQueryRef.current;
          if (latestQuery === val) {
            if (target === 'source') {
              setSourceSuggestions(data);
            } else {
              setTargetSuggestions(data);
            }
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error("Suggestions fetch failed", e);
        }
      }
    }, 150); // 150ms debounce
  };

  // Split expansion triggers
  const handleExpandSource = async (term: string) => {
    const t = term.trim();
    if (!t) return;
    if (t === lastExpandedSource && expandedSources.length > 0) return;
    setLastExpandedSource(t);
    setIsExpandingSource(true);
    setSourceSynonyms([]);
    setSourceBroader([]);
    setSourceNarrower([]);
    setExpandedSources([]);
    try {
      const res = await fetch(`/api/expand?term=${encodeURIComponent(t)}`);
      if (res.ok) {
        const data = await res.json();
        const syns = data.synonyms || [t];
        const broader = data.broader || [];
        const narrower = data.narrower || [];
        setSourceSynonyms(syns);
        setSourceBroader(broader);
        setSourceNarrower(narrower);
        setExpandedSources([...syns, ...broader, ...narrower]);
        setSelectedSources(new Set(syns));
      } else {
        setSourceSynonyms([t]);
        setExpandedSources([t]);
        setSelectedSources(new Set([t]));
      }
    } catch (err) {
      console.error(err);
      setSourceSynonyms([t]);
      setExpandedSources([t]);
      setSelectedSources(new Set([t]));
    } finally {
      setIsExpandingSource(false);
    }
  };

  const handleExpandTarget = async (term: string) => {
    const t = term.trim();
    if (!t) return;
    if (t === lastExpandedTarget && expandedTargets.length > 0) return;
    setLastExpandedTarget(t);
    setIsExpandingTarget(true);
    setTargetSynonyms([]);
    setTargetBroader([]);
    setTargetNarrower([]);
    setExpandedTargets([]);
    try {
      const res = await fetch(`/api/expand?term=${encodeURIComponent(t)}`);
      if (res.ok) {
        const data = await res.json();
        const syns = data.synonyms || [t];
        const broader = data.broader || [];
        const narrower = data.narrower || [];
        setTargetSynonyms(syns);
        setTargetBroader(broader);
        setTargetNarrower(narrower);
        setExpandedTargets([...syns, ...broader, ...narrower]);
        setSelectedTargets(new Set(syns));
      } else {
        setTargetSynonyms([t]);
        setExpandedTargets([t]);
        setSelectedTargets(new Set([t]));
      }
    } catch (err) {
      console.error(err);
      setTargetSynonyms([t]);
      setExpandedTargets([t]);
      setSelectedTargets(new Set([t]));
    } finally {
      setIsExpandingTarget(false);
    }
  };

  
  // Run Open Discovery (Single-Term Disjoint Structural Gaps)
  const handleOpenDiscovery = async (term?: string, context?: string) => {
    const queryTerm = term || sourceConcept;
    if (!queryTerm) return;
    
    // Enforce Authentication First
    if (!authUser) {
      setPendingLaunchPreset({ source: queryTerm, target: '' });
      setAuthIntentMessage('Create your free scientist account to start AI literature discovery (5 complimentary queries included).');
      setIsAuthModalOpen(true);
      return;
    }

    // Check account-linked free query limit (5 queries)
    const uKey = authUser.email || authUser.uid || 'anonymous_user';
    const userQueryCount = parseInt(localStorage.getItem(`drugdiscovery_queries_${uKey}`) || '0', 10);
    if (accountTier === 'free' && userQueryCount >= 5) {
      setIsPricingModalOpen(true);
      setPaymentBanner('⚠️ Complimentary Limit Reached (5 of 5 free queries used). Choose the $7.99 7-Day Scientist Trial, $49.99/mo Pro Plan, or enter your VIP Reviewer Code below.');
      return;
    }
    if (accountTier === 'free') {
      const nextCount = userQueryCount + 1;
      localStorage.setItem(`drugdiscovery_queries_${uKey}`, nextCount.toString());
      setFreeQueryCount(nextCount);
    }

    setIsOpenDiscoveryLoading(true);
    setActiveWorkspaceMode('open_discovery');
    setOpenDiscoveryResult(null);
    setStatusMessage(`Scanning empirical literature for ${queryTerm}...`);
    
    try {
      const qContext = context !== undefined ? context : researchContext;
      const res = await fetch(`/api/open-discovery?term=${encodeURIComponent(queryTerm)}${qContext ? `&context=${encodeURIComponent(qContext)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setOpenDiscoveryResult(data);
        if (data.source?.name) {
          setSourceConcept(data.source.name);
          setHypothesisBreadcrumbs([data.source.name]);
        }
      }
    } catch (err) {
      console.error("Open discovery failed:", err);
    } finally {
      setIsOpenDiscoveryLoading(false);
    }
  };

  // Pivot Action: Make B the new A, append to journal, and re-query
  const handlePivotB = (bTerm: BTerm) => {
    const currentA = sourceConcept;
    const targetC = targetConcept;
    
    // Add step to hypothesis journal
    const newStep: JournalStep = {
      from: currentA,
      to: bTerm.word,
      type: bTerm.type,
      citationsA: bTerm.countA,
      citationsC: bTerm.countC,
      score: bTerm.score,
      rationale: `Locked in intermediate empirical bridge ${bTerm.word} (${bTerm.countA} papers from ${currentA}, ${bTerm.countC} papers to ${targetC})`,
      timestamp: new Date().toLocaleTimeString()
    };
    setJournalSteps(prev => [...prev, newStep]);
    setHypothesisBreadcrumbs(prev => [...prev, bTerm.word]);
    
    // Shift sourceConcept to B, and execute search towards C
    setSourceConcept(bTerm.word);
    executeSearch(bTerm.word, targetC);
  };

  // Generate formal publication dossier
  const handleGenerateDossier = async () => {
    if (!sourceConcept) return;

    if (!authUser) {
      setAuthIntentMessage('Sign in to generate publication-grade research dossiers.');
      setIsAuthModalOpen(true);
      return;
    }

    if (accountTier === 'free') {
      setIsPricingModalOpen(true);
      setPaymentBanner('🔒 Formal IND Publication Dossiers with In-Vitro Protocols are a Pro feature. Upgrade to the $7.99 7-Day Trial or Pro Plan ($49.99/mo) to export formal dossiers.');
      return;
    }

    setIsGeneratingDossier(true);
    setIsDossierModalOpen(true);
    try {
      const rootSource = hypothesisBreadcrumbs[0] || sourceConcept;
      const res = await fetch('/api/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: rootSource,
          target: targetConcept || 'Novel Indications',
          chain: journalSteps,
          notes: journalNotes,
          context: researchContext
        })
      });
      if (res.ok) {
        const dossier = await res.json();
        setFormalDossier(dossier);
      }
    } catch (err) {
      console.error("Dossier generation failed:", err);
    } finally {
      setIsGeneratingDossier(false);
    }
  };

  const executeSearch = async (src: string, tgt?: string, excludeList = '') => {
    if (!src) return;
    if (!tgt || !tgt.trim()) {
      // Single-term Open Discovery mode
      handleOpenDiscovery(src, researchContext);
      return;
    }

    // Enforce Authentication First
    if (!authUser) {
      setPendingLaunchPreset({ source: src, target: tgt });
      setAuthIntentMessage('Create your free scientist account to start AI literature discovery (5 complimentary queries included).');
      setIsAuthModalOpen(true);
      return;
    }

    // Check account-linked free query limit (5 queries)
    const uKey = authUser.email || authUser.uid || 'anonymous_user';
    const userQueryCount = parseInt(localStorage.getItem(`drugdiscovery_queries_${uKey}`) || '0', 10);
    if (accountTier === 'free' && userQueryCount >= 5) {
      setIsPricingModalOpen(true);
      setPaymentBanner('⚠️ Complimentary Limit Reached (5 of 5 free queries used). Choose the $7.99 7-Day Scientist Trial, $49.99/mo Pro Plan, or enter your VIP Reviewer Code below.');
      return;
    }
    if (accountTier === 'free') {
      const nextCount = userQueryCount + 1;
      localStorage.setItem(`drugdiscovery_queries_${uKey}`, nextCount.toString());
      setFreeQueryCount(nextCount);
    }

    setActiveWorkspaceMode('mechanistic_bridging');
    setIsSearching(true);
    setDiscoveryMode('swanson');
    setSwansonBList([]);
    setDbPaths([]);
    setMergedPathsLimit(1);
    setSelectedB(null);
    setCheckedBTerms(new Set());
    setEvidenceA([]);
    setEvidenceC([]);
    setChemblData(null);
    setOtData(null);
    setDepth3State('idle');
    setDepth7State('idle');
    
    if (hypothesisBreadcrumbs.length === 0) {
      setHypothesisBreadcrumbs([src]);
    }
    
    // Trigger synonym expansions here instead of onBlur
    if (!expandedSources.includes(src) && !selectedSources.has(src)) {
      handleExpandSource(src);
    }
    if (!expandedTargets.includes(tgt) && !selectedTargets.has(tgt)) {
      handleExpandTarget(tgt);
    }

    const swansonUrl = `/api/swanson?source=${encodeURIComponent(src)}&target=${encodeURIComponent(tgt)}${excludeList ? `&exclude=${encodeURIComponent(excludeList)}` : ''}`;

    try {
      const swansonRes = await fetch(swansonUrl);

      if (swansonRes.ok) {
        const swansonData = await swansonRes.json();
        if (swansonData && !swansonData.error) {
          setDirectCount(swansonData.directCount || 0);
          setIsAiAugmented(!!swansonData.isAugmentedByAI);
          if (swansonData.grounding) {
            setSourceGrounding(swansonData.grounding.source || null);
            setTargetGrounding(swansonData.grounding.target || null);
          } else {
            setSourceGrounding(null);
            setTargetGrounding(null);
          }
          const rawBList = swansonData.bList || [];
          // Filter out extremely generic terms
          const exclude = ['study', 'adult', 'child', 'poland', 'naslawice', 'cohort', 'female', 'male'];
          const normalizeType = (t: string) => t ? (t.toLowerCase() === 'gene' ? 'target' : t.toLowerCase() === 'chemical' ? 'compound' : t.toLowerCase()) : 'target';
          const filtered = rawBList.filter((b: any) => 
            !exclude.some(ex => b.word.toLowerCase().includes(ex))
          ).map((b: any) => ({ ...b, type: normalizeType(b.type) }));
          setSwansonBList(filtered);
          
          // Automatically select the top B-term
          if (filtered.length > 0) {
            handleSelectB(filtered[0]);
          }
        }
      }
    } catch (err) {
      console.error("Discovery engine queries failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const loadPharmaData = async (name: string, id: string, type: string) => {
    setChemblData(null);
    setOtData(null);
    setIsLoadingPharma(true);
    try {
      const cleanType = type.toLowerCase();
      if (cleanType === 'compound') {
        let chemblId = '';
        if (id.includes('CHEMBL')) {
          const match = id.match(/CHEMBL\d+/);
          if (match) chemblId = match[0];
        }
        if (!chemblId) {
          // Check if custom ID formats match
          const match = id.match(/CHEMBL_\w+/);
          if (match) chemblId = match[0].replace('CHEMBL_', 'CHEMBL');
        }
        if (chemblId) {
          const data = await fetchChEMBLMolecule(chemblId);
          setChemblData(data);
        } else {
          // Fallback to searching by name if no explicit ChEMBL ID is in the DB
          const data = await searchChEMBLMolecule(name);
          setChemblData(data);
        }
      } else if (cleanType === 'target') {
        const symbol = name.replace('TARGET:', '').replace('-', '').toUpperCase();
        const data = await fetchOpenTargetsTarget(symbol);
        setOtData(data);
      }
    } catch (e) {
      console.error("Pharma validation lookup failed:", e);
    } finally {
      setIsLoadingPharma(false);
    }
  };

  const loadEvidence = async (bTermName: string, bTermType = 'target', customSource?: string, customTarget?: string, customSourceType?: string, customTargetType?: string) => {
    const isSegmentDetail = !!(customSource || customTarget);
    
    setIsLoadingEvidence(true);
    setEvidenceA([]);
    setEvidenceC([]);
    setEvidenceErrorA(null);
    setEvidenceErrorC(null);
    setAiProposal(null);
    
    // Only reset graph-wide paths and loading states if it's NOT a segment detail selection
    if (!isSegmentDetail) {
      setDbPaths([]);
      setActivePathIndex(0);
      setMergedPathsLimit(1);
      setLoadedPaths({});
      setDepth3State('loading'); // Immediately show loading state for depth 3
      setDepth7State('idle');
      setPathDepth(1);
    }
    
    const srcParam = customSource || Array.from(selectedSources).join(',') || sourceConcept;
    const tgtParam = customTarget || Array.from(selectedTargets).join(',') || targetConcept;
    setEvidenceSource(srcParam);
    setEvidenceTarget(tgtParam);

    const srcTypeParam = customSourceType || selectedSourceType || 'compound';
    const tgtTypeParam = customTargetType || selectedTargetType || 'disease';
    setEvidenceSourceType(srcTypeParam);
    setEvidenceTargetType(tgtTypeParam);
    const cacheKey = `${srcParam}__${bTermName}__${tgtParam}`;
    
    // Only use activeCacheKeyRef for general B-term load to prevent segment selections from clashing with background loaders
    if (!isSegmentDetail) {
      activeCacheKeyRef.current = cacheKey;
    }

    if (evidenceCache.current[cacheKey]) {
      const cached = evidenceCache.current[cacheKey];
      setEvidenceA(cached.evidenceA);
      setEvidenceC(cached.evidenceC);
      setAiProposal(cached.aiProposal);
      
      if (!isSegmentDetail) {
        setLoadedPaths(cached.loadedPaths || {});
        setDepth3State(cached.depth3State || 'idle');
        setDepth7State(cached.depth7State || 'idle');
        setDbPaths(cached.loadedPaths?.[1] || []);
        setActivePathIndex(0);
        setMergedPathsLimit(1);
        setPathDepth(1);
        
        if (cached.allRecursivePaths) {
          setAllRecursivePaths(cached.allRecursivePaths);
        }
      }
      
      setIsLoadingEvidence(false);
      return;
    }

    let loadedDataA: any[] = [];
    let loadedDataC: any[] = [];

    try {
      const res = await fetch(`/api/evidence-comparison?node1=${encodeURIComponent(srcParam)}&node2=${encodeURIComponent(bTermName)}&node3=${encodeURIComponent(tgtParam)}&limit=5`);
      if (res.ok) {
        const compData = await res.json();
        loadedDataA = compData.evidenceA || [];
        loadedDataC = compData.evidenceC || [];
        
        // Update states if cacheKey is still active or it's a segment detail
        if (isSegmentDetail || activeCacheKeyRef.current === cacheKey) {
          setEvidenceA(loadedDataA);
          setEvidenceC(loadedDataC);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (isSegmentDetail || activeCacheKeyRef.current === cacheKey) {
          setEvidenceErrorA(errData.error || 'Failed to load comparison evidence.');
          setEvidenceErrorC(errData.error || 'Failed to load comparison evidence.');
        }
      }
    } catch (err) {
      console.error("Failed to load evidence quotes:", err);
      if (isSegmentDetail || activeCacheKeyRef.current === cacheKey) {
        setEvidenceErrorA('Failed to fetch evidence.');
        setEvidenceErrorC('Failed to fetch evidence.');
      }
    } finally {
      if (isSegmentDetail || activeCacheKeyRef.current === cacheKey) {
        setIsLoadingEvidence(false);
      }
    }

    // Progressive cache entry
    evidenceCache.current[cacheKey] = {
      evidenceA: loadedDataA,
      evidenceC: loadedDataC,
      aiProposal: null,
      loadedPaths: {},
      depth3State: 'idle',
      depth7State: 'idle',
      allRecursivePaths: {}
    };

    // Spawn AI proposal summary in background
    setIsLoadingAiProposal(true);
    const fetchAiProposal = async () => {
      let proposalData = null;
      try {
        const res = await fetch('/api/summarize-hypothesis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: srcParam,
            bridge: bTermName,
            target: tgtParam,
            sentencesA: loadedDataA,
            sentencesC: loadedDataC,
            sourceType: srcTypeParam,
            bridgeType: bTermType,
            targetType: tgtTypeParam
          })
        });
        if (res.ok) {
          proposalData = await res.json();
          if (isSegmentDetail || activeCacheKeyRef.current === cacheKey) {
            setAiProposal(proposalData);
          }
          if (evidenceCache.current[cacheKey]) {
            evidenceCache.current[cacheKey].aiProposal = proposalData;
          }
        }
      } catch (e) {
        console.error("Failed to fetch AI proposal summary:", e);
      } finally {
        if (isSegmentDetail || activeCacheKeyRef.current === cacheKey) {
          setIsLoadingAiProposal(false);
        }
      }
      return proposalData;
    };

    // If it's a segment detail load (clicked an intermediate node in a path), stop here and only generate the AI proposal!
    if (isSegmentDetail) {
      fetchAiProposal();
      return;
    }

    // Concurrent path depth traversals for all displayed B terms in background
    const fetchAllPathDepths = async () => {
      const pathsMap: Record<number, PathResult[]> = {};

      // Start fetching AI proposal concurrently
      const aiPromise = fetchAiProposal();

      // Compute display B-terms
      const sorted = [...swansonBList].sort((a, b) => {
        const scoreA = (a.countA * a.countC) / (a.totalOccurrences || 1);
        const scoreB = (b.countA * b.countC) / (b.totalOccurrences || 1);
        return scoreB - scoreA;
      });

      let bTermsToDisplay = sorted.filter(b => checkedBTerms.has(b.word));
      if (bTermsToDisplay.length === 0) {
        const top8 = sorted.slice(0, 8);
        const bNameMatch = top8.some(b => b.word === bTermName);
        const matchedB = swansonBList.find(b => b.word === bTermName);
        if (matchedB && !bNameMatch) {
          bTermsToDisplay = [...top8, matchedB];
        } else {
          bTermsToDisplay = top8;
        }
      } else {
        const matchedB = swansonBList.find(b => b.word === bTermName);
        if (matchedB && !bTermsToDisplay.some(b => b.word === bTermName)) {
          bTermsToDisplay = [matchedB, ...bTermsToDisplay];
        }
      }

      // 1. Fetch Depth 1 (Swanson)
      let paths1: PathResult[] = [];
      try {
        const traverseUrl = `/api/traverse?source=${encodeURIComponent(srcParam)}&target=${encodeURIComponent(tgtParam)}&hops=${maxHops}&bridge=${encodeURIComponent(bTermName)}`;
        const traverseRes = await fetch(traverseUrl);
        if (activeCacheKeyRef.current !== cacheKey) return;
        if (traverseRes.ok) {
          const data = await traverseRes.json();
          if (Array.isArray(data)) {
            const filteredPaths = data.filter(p => p.nodes.some((n: any) => n.name === bTermName));
            paths1 = filteredPaths.length > 0 ? filteredPaths : data;
            pathsMap[1] = paths1;
            setDbPaths(paths1);
            setLoadedPaths(prev => ({ ...prev, 1: paths1 }));
            if (evidenceCache.current[cacheKey]) {
              evidenceCache.current[cacheKey].loadedPaths = {
                ...evidenceCache.current[cacheKey].loadedPaths,
                1: paths1
              };
            }
          }
        }
      } catch (e) {
        console.error("Depth 1 path fetch failed:", e);
      }

      // 2. Fetch Depth 3 in background for ALL displayed B-terms
      if (activeCacheKeyRef.current === cacheKey) {
        setDepth3State('loading');
        if (evidenceCache.current[cacheKey]) {
          evidenceCache.current[cacheKey].depth3State = 'loading';
        }
      }

      try {
        const results3: any[] = [];
        const concurrencyLimit = 3;
        const queue3 = [...bTermsToDisplay];
        
        const worker3 = async () => {
          while (queue3.length > 0) {
            const bNode = queue3.shift();
            if (!bNode) break;
            try {
              const res = await fetch(`/api/recursive-swanson?source=${encodeURIComponent(srcParam)}&target=${encodeURIComponent(tgtParam)}&bridge=${encodeURIComponent(bNode.word)}&depth=3`);
              if (res.ok) {
                const data = await res.json();
                if (data && !data.error) {
                  const normalizeType = (t: string) => t ? (t.toLowerCase() === 'gene' ? 'target' : t.toLowerCase() === 'chemical' ? 'compound' : t.toLowerCase()) : 'target';
                  if (data.nodes) data.nodes = data.nodes.map((n: any) => ({ ...n, type: normalizeType(n.type) }));
                  results3.push({ word: bNode.word, path: data });
                }
              }
            } catch (e) {
              console.error(`Depth 3 fetch failed for ${bNode.word}:`, e);
            }
          }
        };

        const workers3 = Array(Math.min(concurrencyLimit, queue3.length)).fill(null).map(worker3);
        await Promise.all(workers3);
        if (activeCacheKeyRef.current !== cacheKey) return;

        const updatedPaths: Record<string, Record<number, PathResult>> = {};
        results3.forEach(res => {
          if (res) {
            updatedPaths[res.word] = { 3: res.path };
          }
        });

        setAllRecursivePaths(prev => {
          const next = { ...prev };
          Object.keys(updatedPaths).forEach(w => {
            next[w] = { ...next[w], 3: updatedPaths[w][3] };
          });
          return next;
        });

        const selectedBPath3 = updatedPaths[bTermName]?.[3];
        if (selectedBPath3) {
          setLoadedPaths(prev => ({ ...prev, 3: [selectedBPath3] }));
          pathsMap[3] = [selectedBPath3];
        }

        const successCount3 = results3.filter(Boolean).length;
        if (successCount3 > 0) {
          setDepth3State('loaded');
          if (evidenceCache.current[cacheKey]) {
            evidenceCache.current[cacheKey].depth3State = 'loaded';
            evidenceCache.current[cacheKey].loadedPaths = {
              ...evidenceCache.current[cacheKey].loadedPaths,
              3: pathsMap[3] || []
            };
            evidenceCache.current[cacheKey].allRecursivePaths = {
              ...evidenceCache.current[cacheKey].allRecursivePaths,
              ...updatedPaths
            };
          }
        } else {
          setDepth3State('loaded');
          if (evidenceCache.current[cacheKey]) {
            evidenceCache.current[cacheKey].depth3State = 'loaded';
          }
        }
      } catch (err) {
        console.error("Depth 3 parallel fetch failed:", err);
        if (activeCacheKeyRef.current === cacheKey) {
          setDepth3State('error');
          if (evidenceCache.current[cacheKey]) {
            evidenceCache.current[cacheKey].depth3State = 'error';
          }
        }
      }

      // 3. Fetch Depth 7 in background for ALL displayed B-terms
      if (activeCacheKeyRef.current === cacheKey) {
        setDepth7State('loading');
        if (evidenceCache.current[cacheKey]) {
          evidenceCache.current[cacheKey].depth7State = 'loading';
        }
      }

      try {
        const results7: any[] = [];
        const concurrencyLimit = 3;
        const queue7 = [...bTermsToDisplay];
        
        const worker7 = async () => {
          while (queue7.length > 0) {
            const bNode = queue7.shift();
            if (!bNode) break;
            try {
              const res = await fetch(`/api/recursive-swanson?source=${encodeURIComponent(srcParam)}&target=${encodeURIComponent(tgtParam)}&bridge=${encodeURIComponent(bNode.word)}&depth=7`);
              if (res.ok) {
                const data = await res.json();
                if (data && !data.error) {
                  const normalizeType = (t: string) => t ? (t.toLowerCase() === 'gene' ? 'target' : t.toLowerCase() === 'chemical' ? 'compound' : t.toLowerCase()) : 'target';
                  if (data.nodes) data.nodes = data.nodes.map((n: any) => ({ ...n, type: normalizeType(n.type) }));
                  results7.push({ word: bNode.word, path: data });
                }
              }
            } catch (e) {
              console.error(`Depth 7 fetch failed for ${bNode.word}:`, e);
            }
          }
        };

        const workers7 = Array(Math.min(concurrencyLimit, queue7.length)).fill(null).map(worker7);
        await Promise.all(workers7);
        if (activeCacheKeyRef.current !== cacheKey) return;

        const updatedPaths7: Record<string, Record<number, PathResult>> = {};
        results7.forEach(res => {
          if (res) {
            updatedPaths7[res.word] = { 7: res.path };
          }
        });

        setAllRecursivePaths(prev => {
          const next = { ...prev };
          Object.keys(updatedPaths7).forEach(w => {
            next[w] = { ...next[w], 7: updatedPaths7[w][7] };
          });
          return next;
        });

        const selectedBPath7 = updatedPaths7[bTermName]?.[7];
        if (selectedBPath7) {
          setLoadedPaths(prev => ({ ...prev, 7: [selectedBPath7] }));
          pathsMap[7] = [selectedBPath7];
        }

        const successCount7 = results7.filter(Boolean).length;
        if (successCount7 > 0) {
          setDepth7State('loaded');
          if (evidenceCache.current[cacheKey]) {
            evidenceCache.current[cacheKey].depth7State = 'loaded';
            evidenceCache.current[cacheKey].loadedPaths = {
              ...evidenceCache.current[cacheKey].loadedPaths,
              7: pathsMap[7] || []
            };
            
            const nextAllRec = { ...evidenceCache.current[cacheKey].allRecursivePaths };
            Object.keys(updatedPaths7).forEach(w => {
              nextAllRec[w] = { ...nextAllRec[w], 7: updatedPaths7[w][7] };
            });
            evidenceCache.current[cacheKey].allRecursivePaths = nextAllRec;
          }
        } else {
          setDepth7State('loaded');
          if (evidenceCache.current[cacheKey]) {
            evidenceCache.current[cacheKey].depth7State = 'loaded';
          }
        }
      } catch (err) {
        console.error("Depth 7 parallel fetch failed:", err);
        if (activeCacheKeyRef.current === cacheKey) {
          setDepth7State('error');
          if (evidenceCache.current[cacheKey]) {
            evidenceCache.current[cacheKey].depth7State = 'error';
          }
        }
      }

      await aiPromise;
    };

    fetchAllPathDepths();
  };

  const handleRlhfAction = (action: 'approved' | 'discarded') => {
    if (!selectedB || !aiProposal) return;
    const insightId = `insight-${selectedB.id || selectedB.word}-${Date.now()}`;
    
    setRlhfInsights(prev => [...prev, {
      id: insightId,
      status: action,
      bTerm: selectedB.word,
      mechanism: aiProposal.mechanismSummary
    }]);

    setIsRlhfAnimating(true);
    setTimeout(() => setIsRlhfAnimating(false), 1500);

    if (action === 'discarded') {
      // Visually remove it from the map if it was on there
      const newChecked = new Set(checkedBTerms);
      newChecked.delete(selectedB.word);
      setCheckedBTerms(newChecked);
      
      // Optionally deselect it
      setSelectedB(null);
      setSelectedConcept(null);
      setAiProposal(null);
    }
  };

  const handleSelectB = (bTerm: BTerm) => {
    setSelectedB(bTerm);
    if (pathDepth > 1) {
      handleSelectNode(bTerm.word, bTerm.type);
    } else {
      setSelectedConcept({
        name: bTerm.word,
        type: bTerm.type,
        id: bTerm.id,
        countA: bTerm.countA,
        countC: bTerm.countC,
        totalOccurrences: bTerm.totalOccurrences,
        isBridge: true
      });
      loadEvidence(bTerm.word, bTerm.type);
      loadPharmaData(bTerm.word, bTerm.id, bTerm.type);
    }
  };

  const handleSelectNode = async (name: string, type: string, parentBName?: string) => {
    setSelectedConcept({
      name,
      type,
      isBridge: true
    });
    setIsLoadingPharma(true);
    setChemblData(null);
    setOtData(null);
    try {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(name)}`);
      if (res.ok) {
        const suggestions = await res.json();
        const match = suggestions.find((s: any) => s.name.toLowerCase() === name.toLowerCase()) || suggestions[0];
        if (match) {
          await loadPharmaData(match.name, match.id, match.type);
        } else {
          await loadPharmaData(name, name, type);
        }
      } else {
        await loadPharmaData(name, name, type);
      }
    } catch (e) {
      console.error(e);
      await loadPharmaData(name, name, type);
    } finally {
      setIsLoadingPharma(false);
    }

    // Determine path context: predecessor and successor
    let pred = Array.from(selectedSources).join(',') || sourceConcept;
    let succ = Array.from(selectedTargets).join(',') || targetConcept;
    let predType = selectedSourceType || 'compound';
    let succType = selectedTargetType || 'disease';
    
    const isPathfinder = discoveryMode === 'pathfinder' || (pathDepth > 1 && selectedB !== null);
    
    if (isPathfinder) {
      const activePath = dbPaths[activePathIndex];
      if (activePath && activePath.nodes) {
        const idx = activePath.nodes.findIndex((n: any) => n.name.toLowerCase() === name.toLowerCase());
        if (idx !== -1) {
          if (idx > 0) {
            pred = activePath.nodes[idx - 1].name;
            predType = activePath.nodes[idx - 1].type;
          }
          if (idx < activePath.nodes.length - 1) {
            succ = activePath.nodes[idx + 1].name;
            succType = activePath.nodes[idx + 1].type;
          }
        }
      }
    } else if (pathDepth > 1) {
      const targetB = parentBName || name;
      const recPath = allRecursivePaths[targetB]?.[pathDepth];
      if (recPath && recPath.nodes) {
        const idx = recPath.nodes.findIndex((n: any) => n.name.toLowerCase() === name.toLowerCase());
        if (idx !== -1) {
          if (idx > 0) {
            pred = recPath.nodes[idx - 1].name;
            predType = recPath.nodes[idx - 1].type;
          }
          if (idx < recPath.nodes.length - 1) {
            succ = recPath.nodes[idx + 1].name;
            succType = recPath.nodes[idx + 1].type;
          }
        }
      }
    }

    loadEvidence(name, type, pred, succ, predType, succType);
  };

  const handleSortToggle = (field: 'relevance' | 'novelty' | 'ab' | 'bc' | 'name') => {
    let order: 'asc' | 'desc' = 'desc';
    if (sortBy === field) {
      order = sortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      if (field === 'novelty') order = 'asc';
      else order = 'desc';
    }
    setSortBy(field);
    setSortOrder(order);
  };

  const handleToggleBTerm = (word: string) => {
    const updated = new Set(checkedBTerms);
    if (updated.has(word)) {
      updated.delete(word);
    } else {
      updated.add(word);
    }
    setCheckedBTerms(updated);
  };



  const handleClearHistory = () => {
    setHistoryTrail([]);
    const srcParam = Array.from(selectedSources).join(',') || sourceConcept;
    const tgtParam = Array.from(selectedTargets).join(',') || targetConcept;
    executeSearch(srcParam, tgtParam, '');
  };

  const handleIterate = (bTermName: string) => {
    // Append current search parameters to the history trail
    const currentA = Array.from(selectedSources).length > 0 
      ? Array.from(selectedSources) 
      : [sourceConcept];
    const currentC = Array.from(selectedTargets).length > 0 
      ? Array.from(selectedTargets) 
      : [targetConcept];
      
    const nextTrail = [...historyTrail];
    currentA.forEach(a => { if (!nextTrail.includes(a)) nextTrail.push(a); });
    currentC.forEach(c => { if (!nextTrail.includes(c)) nextTrail.push(c); });
    setHistoryTrail(nextTrail);

    // Set the B-term as the new Source
    setSourceConcept(bTermName);
    setSelectedSources(new Set([bTermName]));
    setExpandedSources([]); // Clear so they can compute synonym clusters for the pivoted term!

    // Keep the target (C) synonyms the same
    const tgtParam = Array.from(selectedTargets).join(',') || targetConcept;
    executeSearch(bTermName, tgtParam, nextTrail.concat(bTermName).join(','));
  };



  const submitProInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProTier) return;
    
    if (!authUser) {
      alert("Please sign in first to upgrade to Pro.");
      loginWithGoogle();
      return;
    }
    
    setIsSendingInquiry(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedProTier,
          uid: authUser.uid
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert("Failed to initialize checkout. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error initiating checkout.");
    } finally {
      setIsSendingInquiry(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Filter B-List based on score and included types
  const filteredBList = useMemo(() => {
    return swansonBList.filter(b => {
      if (b.score < minScore) return false;
      if (!includedTypes.has(b.type.toLowerCase())) return false;
      return true;
    });
  }, [swansonBList, minScore, includedTypes]);

  const sortedBList = useMemo(() => {
    const sorted = [...filteredBList];
    sorted.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'relevance') {
        valA = a.score;
        valB = b.score;
      } else if (sortBy === 'novelty') {
        valA = a.totalOccurrences;
        valB = b.totalOccurrences;
      } else if (sortBy === 'ab') {
        valA = a.countA;
        valB = b.countA;
      } else if (sortBy === 'bc') {
        valA = a.countC;
        valB = b.countC;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.word.localeCompare(b.word) 
          : b.word.localeCompare(a.word);
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredBList, sortBy, sortOrder]);

  // Synchronize selectedB when filters (includedTypes or minScore) filter it out
  useEffect(() => {
    if (selectedB) {
      const isStillActive = includedTypes.has(selectedB.type.toLowerCase()) && selectedB.score >= minScore;
      if (!isStillActive) {
        // Find the first available B-term in the filtered list
        const nextB = sortedBList[0] || null;
        if (nextB) {
          handleSelectB(nextB);
        } else {
          setSelectedB(null);
          setSelectedConcept(null);
        }
      }
    }
  }, [includedTypes, minScore, selectedB, sortedBList]);

  // Dimensions
  const width = 1200;
  const baseHeight = 400;

  // Render SVG Graph Elements (Tripartite Swanson LBD)
  const tripartiteGraphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];

    // Left Column (A synonyms)
    const srcNodesList = Array.from(selectedSources).length > 0 
      ? Array.from(selectedSources) 
      : [sourceConcept || 'Concept A'];
      
    // Right Column (C synonyms)
    const tgtNodesList = Array.from(selectedTargets).length > 0 
      ? Array.from(selectedTargets) 
      : [targetConcept || 'Concept C'];

    // Center Column (B bridges)
    let bTermsToDisplay = sortedBList.filter(b => checkedBTerms.has(b.word));
    const isSelectedBActive = selectedB && includedTypes.has(selectedB.type.toLowerCase()) && selectedB.score >= minScore;
    if (bTermsToDisplay.length === 0) {
      const top8 = sortedBList.slice(0, 8);
      if (isSelectedBActive && !top8.some(b => b.word === selectedB.word)) {
        bTermsToDisplay = [...top8, selectedB];
      } else {
        bTermsToDisplay = top8;
      }
    } else {
      if (isSelectedBActive && !bTermsToDisplay.some(b => b.word === selectedB.word)) {
        bTermsToDisplay = [selectedB, ...bTermsToDisplay];
      }
    }

    const A_count = srcNodesList.length;
    const B_count = bTermsToDisplay.length;
    const C_count = tgtNodesList.length;

    // Calculate dynamic height to fit all nodes cleanly without clipping
    const maxNodesInCol = Math.max(A_count, Math.max(B_count, C_count));
    const dynamicHeight = Math.max(baseHeight, maxNodesInCol * 70 + 40);

    // Layout A nodes
    const aNodes = srcNodesList.map((name, idx) => {
      const x = 200;
      const y = A_count > 1 ? 60 + idx * ((dynamicHeight - 120) / (A_count - 1)) : dynamicHeight / 2;
      return { id: `A-${idx}`, name, type: selectedSourceType || 'compound', x, y };
    });
    nodes.push(...aNodes);

    // Layout C nodes
    const cNodes = tgtNodesList.map((name, idx) => {
      const x = 1000;
      const y = C_count > 1 ? 60 + idx * ((dynamicHeight - 120) / (C_count - 1)) : dynamicHeight / 2;
      return { id: `C-${idx}`, name, type: selectedTargetType || 'disease', x, y };
    });
    nodes.push(...cNodes);

    // Layout B nodes vertically aligned with dynamic proximity pull clustering
    const bNodes = bTermsToDisplay.map((b, idx) => {
      const totalCount = b.countA + b.countC;
      let x = 600;
      if (totalCount > 0) {
        const pull = (b.countC - b.countA) / totalCount;
        x = 600 + pull * 240; // pull up to 240px closer to A or C
      }
      let y = B_count > 1 ? 60 + idx * ((dynamicHeight - 120) / (B_count - 1)) : dynamicHeight / 2;
      // Stagger B nodes slightly vertically to prevent adjacent label overlaps
      y += (idx % 2 === 0 ? -12 : 12);
      return { id: b.id || `B-${b.word}`, name: b.word, type: b.type, x, y, data: b };
    });
    nodes.push(...bNodes);

    // Generate links A -> B and B -> C (or recursive path segments if pathDepth > 1)
    bNodes.forEach(bNode => {
      const b = bNode.data;
      
      let recPath = allRecursivePaths[bNode.name]?.[pathDepth] 
                 || allRecursivePaths[b.word]?.[pathDepth];
                 
      if (!recPath) {
        // Fallback: search keys case-insensitively
        const foundKey = Object.keys(allRecursivePaths).find(k => k.toLowerCase().trim() === bNode.name.toLowerCase().trim());
        if (foundKey) {
           recPath = allRecursivePaths[foundKey]?.[pathDepth];
        }
      }
      
      let pathNodes = recPath && recPath.nodes ? recPath.nodes : [];

      if (pathDepth > 1) {
        if (!pathNodes || pathNodes.length <= 2) {
            // Provide a graceful visual fallback if the backend hasn't supplied the path yet, or failed
            pathNodes = [
                aNodes[0], 
                { name: `Evaluating Depth ${pathDepth}...`, type: 'pathway', id: `loading-1-${bNode.name}` }, 
                bNode, 
                { name: `Analyzing Literature...`, type: 'pathway', id: `loading-2-${bNode.name}` }, 
                cNodes[0]
            ];
        }

        // Filter intermediate nodes by includedTypes
        pathNodes = pathNodes.filter((n: any, idx: number, arr: any[]) => {
          if (idx === 0) return true; // Keep A
          if (idx === arr.length - 1) return true; // Keep C
          if (n.name.toLowerCase() === bNode.name.toLowerCase()) return true; // Keep B
          return n.type && includedTypes.has(n.type.toLowerCase());
        });
        
        // Find the index of B in pathNodes
        let bIdx = pathNodes.findIndex((n: any) => n.name.toLowerCase().trim() === bNode.name.toLowerCase().trim());
        
        if (bIdx === -1) {
          // If B is missing from pathNodes (due to name mismatch), force insert it in the middle!
          bIdx = Math.floor(pathNodes.length / 2);
          pathNodes.splice(bIdx, 0, bNode);
        }
        
        if (bIdx !== -1) {
          // Let's create layout nodes for all intermediate nodes in pathNodes
          // (excluding A and C, and B itself which is already bNode)
          const layoutNodes = pathNodes.map((n: any, idx: number) => {
            if (idx === 0) {
              // A node
              return aNodes[0];
            }
            if (idx === pathNodes.length - 1) {
              // C node
              return cNodes[0];
            }
            if (idx === bIdx) {
              // B node itself
              return bNode;
            }
            
            // Intermediate node spacing between 200 and 1000 dynamically shifting with pull
            let x = bNode.x;
            if (idx < bIdx) {
              // Left side intermediate node (spacing between 200 and bNode.x)
              x = 200 + idx * ((bNode.x - 200) / bIdx);
            } else {
              // Right side intermediate node (spacing between bNode.x and 1000)
              const rightIdx = idx - bIdx;
              const rightCount = pathNodes.length - 1 - bIdx;
              x = bNode.x + rightIdx * ((1000 - bNode.x) / rightCount);
            }
            
            // Stagger node coordinates vertically to prevent labels from overlapping
            const staggerY = idx % 2 === 0 ? -16 : 16;
            const y = bNode.y + staggerY;
            
            return {
              id: `intermediate-${bNode.name}-${n.name}-${idx}`,
              name: n.name,
              type: n.type || 'target',
              x,
              y,
              isIntermediate: true,
              parentB: bNode.name
            };
          });
          
          // Add only intermediate layout nodes to nodes array
          layoutNodes.forEach((n, idx) => {
            if (idx > 0 && idx < pathNodes.length - 1 && idx !== bIdx) {
              nodes.push(n);
            }
          });
          
          // Create links between consecutive layout nodes in the path
          for (let i = 0; i < layoutNodes.length - 1; i++) {
            const u = layoutNodes[i];
            const v = layoutNodes[i+1];
            const isHighlighted = selectedB && selectedB.word === bNode.name;
            
            links.push({
              id: `link-${u.id}-${v.id}`,
              source: u,
              target: v,
              count: isHighlighted ? 15 : 5, // driving line thickness
              dir: i < bIdx ? 'AB' : 'BC',
              bData: b,
              isRecursive: true
            });
          }
          return; // Skip fallback
        }
      }

      // Fallback: simple single-hop A -> B and B -> C links
      aNodes.forEach(aNode => {
        links.push({
          id: `link-${aNode.id}-${bNode.id}`,
          source: aNode,
          target: bNode,
          count: b.countA,
          dir: 'AB',
          bData: b
        });
      });

      cNodes.forEach(cNode => {
        links.push({
          id: `link-${bNode.id}-${cNode.id}`,
          source: bNode,
          target: cNode,
          count: b.countC,
          dir: 'BC',
          bData: b
        });
      });
    });

    return { nodes, links, dynamicHeight };
  }, [sourceConcept, targetConcept, selectedSources, selectedTargets, selectedB, checkedBTerms, sortedBList, selectedSourceType, selectedTargetType, allRecursivePaths, pathDepth, includedTypes]);

  // Render SVG Graph Elements (Pathfinder Traversal)
  const pathfinderGraphData = useMemo(() => {
    if (dbPaths.length === 0) return null;

    const nodesMap = new Map();
    const linksMap = new Map();

    // Include top mergedPathsLimit paths plus the active path if outside the limit
    let pathsToProcess = dbPaths.slice(0, mergedPathsLimit);
    if (activePathIndex >= mergedPathsLimit && activePathIndex < dbPaths.length) {
      pathsToProcess = [...pathsToProcess, dbPaths[activePathIndex]];
    }

    if (pathsToProcess.length === 0) return null;

    const activePaths = pathsToProcess.map(path => {
      return path.nodes.filter((n: any, idx: number) => 
        idx === 0 || 
        idx === path.nodes.length - 1 || 
        (n.type && includedTypes.has(n.type.toLowerCase()))
      );
    });
    const maxLen = Math.max(...activePaths.map(nodes => nodes.length));

    // First pass: collect all unique nodes and links
    pathsToProcess.forEach((path, pathIdx) => {
      const activePathNodes = activePaths[pathIdx];
      
      activePathNodes.forEach((n, idx) => {
        if (!nodesMap.has(n.name)) {
          nodesMap.set(n.name, {
            id: n.id || n.name,
            name: n.name,
            type: n.type || 'target',
            depth: idx,
            isEndNode: idx === activePathNodes.length - 1
          });
        }
      });

      for (let i = 0; i < activePathNodes.length - 1; i++) {
        const src = activePathNodes[i].name;
        const tgt = activePathNodes[i + 1].name;
        const linkId = `path-link-${src}-${tgt}`;
        if (!linksMap.has(linkId)) {
          linksMap.set(linkId, {
            id: linkId,
            sourceName: src,
            targetName: tgt,
            edgeInfo: path.edges[i]
          });
        }
      }
    });

    const nodes = Array.from(nodesMap.values());
    const nodesByDepth: Record<number, any[]> = {};
    
    // Group by depth to space them vertically
    nodes.forEach(n => {
      if (!nodesByDepth[n.depth]) nodesByDepth[n.depth] = [];
      nodesByDepth[n.depth].push(n);
    });

    const dynamicHeight = Math.max(baseHeight, Math.max(...Object.values(nodesByDepth).map(g => g.length)) * 50 + 40);

    // Assign final coordinates
    Object.values(nodesByDepth).forEach(depthGroup => {
      const N = depthGroup.length;
      depthGroup.forEach((n, i) => {
        if (maxLen > 1) {
          if (n.depth === 0) {
            n.x = 200;
          } else if (n.isEndNode) {
            n.x = 1000;
          } else {
            n.x = 200 + n.depth * ((1000 - 200) / (maxLen - 1));
          }
        } else {
          n.x = width / 2;
        }
        n.y = N > 1 ? 60 + i * ((dynamicHeight - 120) / (N - 1)) : dynamicHeight / 2;
        // Stagger intermediate nodes vertically to prevent labels from overlapping
        if (n.depth > 0 && !n.isEndNode) {
          n.y += (i % 2 === 0 ? -16 : 16);
        }
      });
    });

    const links = Array.from(linksMap.values()).map(l => ({
      id: l.id,
      source: nodes.find(n => n.name === l.sourceName),
      target: nodes.find(n => n.name === l.targetName),
      edgeInfo: l.edgeInfo
    }));

    return { nodes, links, dynamicHeight };
  }, [dbPaths, mergedPathsLimit, activePathIndex, includedTypes]);

  const generatePathfinderHypothesis = (pathResult: PathResult) => {
    const nodes = pathResult.nodes;
    const edges = pathResult.edges;
    if (!nodes || nodes.length < 2) return '';
    
    let text = `<strong>Multi-Hop Chain Discovery Proposal:</strong><br/><br/>`;
    text += `We identified a causal literature chain connecting <strong>${nodes[0].name}</strong> to <strong>${nodes[nodes.length - 1].name}</strong> through ${nodes.length - 2} intermediate bridges:<br/>`;
    
    const pathSteps = nodes.map(n => `<span style="color: var(--color-node-${n.type.toLowerCase()})">${n.name}</span>`).join(' &rarr; ');
    text += `<div style="margin: 0.5rem 0; font-weight: bold; font-size: 0.85rem; padding: 0.4rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; display: inline-block;">${pathSteps}</div><br/><br/>`;
    
    text += `<strong>Literature Evidence Trail:</strong><ul style="padding-left: 1.2rem; margin-top: 0.35rem; display: flex; flexDirection: column; gap: 0.4rem;">`;
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const srcNode = nodes[i];
      const tgtNode = nodes[i+1];
      if (!srcNode || !tgtNode) continue;
      text += `<li style="margin-bottom: 0.5rem; line-height: 1.35;">`;
      text += `<strong>Hop ${i+1}</strong> (${srcNode.name} &rarr; ${tgtNode.name}): `;
      if (edge.sentence) {
        text += `<span style="font-style: italic; color: var(--text-normal);">"${edge.sentence}"</span> `;
      } else {
        text += `Co-occurrence in literature. `;
      }
      if (edge.pmid) {
        text += `<a href="https://pubmed.ncbi.nlm.nih.gov/${edge.pmid}" target="_blank" style="color: var(--color-cyan); text-decoration: underline; margin-left: 0.25rem;">PubMed: ${edge.pmid}</a>`;
      }
      text += `</li>`;
    }
    text += `</ul>`;
    
    return text;
  };

  const parseHypothesisMarkdown = (text?: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\* (.*?)$/gm, '<li class="hypo-bullet">$1</li>')
      .replace(/\n\n/g, '<br/><br/>');
  };

  const loadPreset = async (src: string, tgt: string, srcType = 'compound', tgtType = 'disease') => {
    setSourceConcept(src);
    setTargetConcept(tgt);
    setSelectedSourceType(srcType);
    setSelectedTargetType(tgtType);
    setHistoryTrail([]);
    setIsExpandingSource(true);
    setIsExpandingTarget(true);
    setSourceSynonyms([]);
    setSourceBroader([]);
    setSourceNarrower([]);
    setTargetSynonyms([]);
    setTargetBroader([]);
    setTargetNarrower([]);
    
    try {
      const [resS, resT] = await Promise.all([
        fetch(`/api/expand?term=${encodeURIComponent(src)}`),
        fetch(`/api/expand?term=${encodeURIComponent(tgt)}`)
      ]);
      let finalS = [src];
      let finalT = [tgt];
      if (resS.ok) {
        const data = await resS.json();
        const syns = data.synonyms || [src];
        const broader = data.broader || [];
        const narrower = data.narrower || [];
        setSourceSynonyms(syns);
        setSourceBroader(broader);
        setSourceNarrower(narrower);
        setExpandedSources([...syns, ...broader, ...narrower]);
        setSelectedSources(new Set(syns));
        setLastExpandedSource(src);
        finalS = syns;
      } else {
        setSourceSynonyms([src]);
        setExpandedSources([src]);
        setSelectedSources(new Set([src]));
      }
      if (resT.ok) {
        const data = await resT.json();
        const syns = data.synonyms || [tgt];
        const broader = data.broader || [];
        const narrower = data.narrower || [];
        setTargetSynonyms(syns);
        setTargetBroader(broader);
        setTargetNarrower(narrower);
        setExpandedTargets([...syns, ...broader, ...narrower]);
        setSelectedTargets(new Set(syns));
        setLastExpandedTarget(tgt);
        finalT = syns;
      } else {
        setTargetSynonyms([tgt]);
        setExpandedTargets([tgt]);
        setSelectedTargets(new Set([tgt]));
      }
      executeSearch(finalS.join(','), finalT.join(','), '');
    } catch (e) {
      console.error(e);
      executeSearch(src, tgt, '');
    } finally {
      setIsExpandingSource(false);
      setIsExpandingTarget(false);
    }
  };

  const handleToggleType = (type: string) => {
    const updated = new Set(includedTypes);
    if (updated.has(type)) {
      updated.delete(type);
    } else {
      updated.add(type);
    }
    setIncludedTypes(updated);
  };

  const toggleSourceSynonym = (syn: string) => {
    setSelectedSources(prev => {
      const next = new Set(prev);
      if (next.has(syn)) {
        next.delete(syn);
      } else {
        next.add(syn);
      }
      return next;
    });
  };

  const toggleTargetSynonym = (syn: string) => {
    setSelectedTargets(prev => {
      const next = new Set(prev);
      if (next.has(syn)) {
        next.delete(syn);
      } else {
        next.add(syn);
      }
      return next;
    });
  };

  const selectAllSourceSynonyms = () => {
    setSelectedSources(new Set([...sourceSynonyms, ...sourceBroader, ...sourceNarrower]));
  };

  const clearAllSourceSynonyms = () => {
    setSelectedSources(new Set());
  };

  const selectAllTargetSynonyms = () => {
    setSelectedTargets(new Set([...targetSynonyms, ...targetBroader, ...targetNarrower]));
  };

  const clearAllTargetSynonyms = () => {
    setSelectedTargets(new Set());
  };

  const showPathfinderGraph = discoveryMode === 'pathfinder';

  const canvasHeight = useMemo(() => {
    if (!showPathfinderGraph) {
      if (tripartiteGraphData) {
        return tripartiteGraphData.dynamicHeight;
      }
    } else {
      if (pathfinderGraphData) {
        return pathfinderGraphData.dynamicHeight;
      }
    }
    return baseHeight;
  }, [showPathfinderGraph, tripartiteGraphData, pathfinderGraphData]);

  // Curved horizontal Bezier math
  const getBezierPath = (x1: number, y1: number, x2: number, y2: number, bend = 0) => {
    const cx1 = (x1 + x2) / 2;
    const cy1 = y1 + bend;
    const cx2 = (x1 + x2) / 2;
    const cy2 = y2 + bend;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  const isEmailPro = (email?: string | null) => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return (
      clean === 'clee@oncotelic.com' ||
      clean === 'michael.janis@gmail.com' ||
      clean === 'mjanis@siliconresearchgroup.com' ||
      clean.endsWith('@oncotelic.com') ||
      clean.endsWith('@siliconresearchgroup.com')
    );
  };

  const handleAuthenticate = async (targetEmail: string) => {
    const clean = targetEmail.trim();
    if (!clean) return;
    
    const u = loginWithEmail(clean);
    setAuthUser(u);
    const uKey = clean.toLowerCase();

    if (isEmailPro(clean)) {
      setAccountTier('pro');
      localStorage.setItem('drugdiscovery_tier', 'pro');
      localStorage.setItem(`drugdiscovery_tier_${uKey}`, 'pro');
      setPaymentBanner(`🎉 Pro Scientist Verified! Welcome ${clean} — Unlimited Compute Activated.`);
    } else {
      try {
        const checkRes = await fetch(`/api/billing/check-subscription?email=${encodeURIComponent(uKey)}`);
        if (checkRes.ok) {
          const subData = await checkRes.json();
          if (subData.active && subData.tier) {
            setAccountTier(subData.tier);
            localStorage.setItem('drugdiscovery_tier', subData.tier);
            localStorage.setItem(`drugdiscovery_tier_${uKey}`, subData.tier);
            setPaymentBanner(`🎉 Welcome ${clean}! Pro Scientist Tier Activated.`);
          } else {
            const count = parseInt(localStorage.getItem(`drugdiscovery_queries_${uKey}`) || '0', 10);
            setFreeQueryCount(count);
            setPaymentBanner(`🎉 Welcome ${clean}! 5 Free Scientist Queries Activated.`);
          }
        }
      } catch (err) {
        console.warn(err);
      }
    }

    setIsAuthModalOpen(false);
    setViewMode('app');
    if (pendingLaunchPreset) {
      setSourceConcept(pendingLaunchPreset.source);
      setTargetConcept(pendingLaunchPreset.target);
      executeSearch(pendingLaunchPreset.source, pendingLaunchPreset.target);
      setPendingLaunchPreset(null);
    }
  };

  const renderAuthModal = () => {
    if (!isAuthModalOpen) return null;
    return (
      <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '2rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#0f172a', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={22} style={{ color: '#0284c7' }} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Scientist Sign-In &amp; Access</h3>
            </div>
            <button onClick={() => setIsAuthModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <p style={{ color: '#475569', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            {authIntentMessage || 'Sign in with your Google account or email to access AI literature discovery traversals and interactive target graphs.'}
          </p>

          {/* Email / Lab Sign-In Form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            const inputEmail = customEmailInput.trim();
            if (inputEmail) {
              handleAuthenticate(inputEmail);
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.55rem 0.75rem', gap: '0.5rem' }}>
              <Mail size={16} style={{ color: '#64748b' }} />
              <input
                type="email"
                placeholder="scientist@biopharma.org or yourname@gmail.com"
                value={customEmailInput}
                onChange={(e) => setCustomEmailInput(e.target.value)}
                autoFocus
                required
                style={{ background: 'transparent', border: 'none', color: '#0f172a', fontSize: '0.88rem', width: '100%', outline: 'none' }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.7rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)'
              }}
            >
              Continue with Email &rarr;
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>or 1-click access</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              onClick={async () => {
                const u = await loginWithGoogle();
                if (u?.email) {
                  handleAuthenticate(u.email);
                } else if (customEmailInput.trim()) {
                  handleAuthenticate(customEmailInput.trim());
                }
              }}
              style={{
                background: '#f8fafc',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <User size={16} />
              <span>Continue with Google Account</span>
            </button>

            <button
              onClick={() => handleAuthenticate('scientist@institution.org')}
              style={{
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.55rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⚡ Instant Academic Guest Access
            </button>
          </div>

        </div>
      </div>
    );
  };

  const renderPricingModal = () => {
    if (!isPricingModalOpen && !isProModalOpen) return null;
    return (
      <div className="modal-overlay" onClick={() => { setIsPricingModalOpen(false); setIsProModalOpen(false); }}>
        <div 
          className="modal-content" 
          onClick={(e) => e.stopPropagation()} 
          style={{ 
            maxWidth: '920px', 
            maxHeight: '88vh', 
            overflowY: 'auto', 
            padding: '2.25rem', 
            background: '#0a0f1d', 
            border: '1px solid rgba(255,255,255,0.15)', 
            borderRadius: '16px', 
            color: 'white', 
            boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: '#06b6d4' }} />
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Scientist &amp; Lab Access Plans</h2>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                Instant activation via Card, Google Pay, Apple Pay, or XPRIZE Reviewer Passcode
              </p>
            </div>
            <button onClick={() => { setIsPricingModalOpen(false); setIsProModalOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* 7-Day Scientist Pass ($7.99) */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>7-Day Trial</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.3rem 0' }}>$7.99 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>/ 7 days</span></div>
                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                  Full platform access for early translational exploration.
                </p>
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li><strong>Unlimited</strong> Traversals</li>
                  <li><strong>5 IND Dossiers</strong></li>
                  <li>AI Mechanism Synthesis</li>
                  <li>Live Literature AI Swarm</li>
                </ul>
              </div>
              <button
                onClick={() => handleStartCheckout('trial')}
                disabled={isCheckingOutPlan === 'trial'}
                style={{ marginTop: '1rem', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', color: '#38bdf8', padding: '0.55rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {isCheckingOutPlan === 'trial' ? 'Connecting...' : 'Start Trial ($7.99)'}
              </button>
            </div>

            {/* Pro Scientist Plan ($49.99/mo) - FEATURED */}
            <div style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.2) 0%, rgba(15,23,42,0.9) 100%)', border: '2px solid #6366f1', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '12px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', fontSize: '0.62rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                Most Popular
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase' }}>Pro Scientist</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.3rem 0' }}>$49.99 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>/ mo</span></div>
                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                  For discovery chemists and translational leads (cancel anytime).
                </p>
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li><strong>Unlimited</strong> Multi-Hop Traversals</li>
                  <li><strong>25 Formal IND Dossiers / mo</strong></li>
                  <li>Autonomous AI Synthesis</li>
                  <li>Live Literature AI Swarm</li>
                  <li>AI Safety &amp; Tox Screening</li>
                </ul>
              </div>
              <button
                onClick={() => handleStartCheckout('pro')}
                disabled={isCheckingOutPlan === 'pro'}
                style={{ marginTop: '1rem', background: '#6366f1', border: 'none', color: 'white', padding: '0.55rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
              >
                {isCheckingOutPlan === 'pro' ? 'Connecting...' : 'Subscribe ($49.99/mo)'}
              </button>
            </div>

            {/* Biotech Lab Plan ($199/mo) */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase' }}>Biotech Lab</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.3rem 0' }}>$199 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>/ mo</span></div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                  For biotech startups &amp; collaborative lab teams (5 seats).
                </p>
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li><strong>5 Scientist User Seats</strong></li>
                  <li>Shared Team Lab Journals</li>
                  <li><strong>100 IND Dossiers / mo</strong></li>
                  <li>In-Vitro Assay Protocols</li>
                </ul>
              </div>
              <button
                onClick={() => handleStartCheckout('team')}
                disabled={isCheckingOutPlan === 'team'}
                style={{ marginTop: '1rem', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', color: '#06b6d4', padding: '0.55rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {isCheckingOutPlan === 'team' ? 'Connecting...' : 'Subscribe Lab ($199)'}
              </button>
            </div>

            {/* Single Dossier Micro-Credit */}
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Micro-Credit</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.3rem 0' }}>$5 <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>/ dossier</span></div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                  One-time single research dossier synthesis.
                </p>
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>1 Full Publication Dossier</li>
                  <li>Experimental Protocols</li>
                  <li>Toxicology Screening</li>
                  <li>PDF / Word / Markdown Export</li>
                </ul>
              </div>
              <button
                onClick={() => handleStartCheckout('dossier')}
                disabled={isCheckingOutPlan === 'dossier'}
                style={{ marginTop: '1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', padding: '0.55rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {isCheckingOutPlan === 'dossier' ? 'Connecting...' : 'Buy 1 Dossier ($5)'}
              </button>
            </div>
          </div>

          {/* XPRIZE Judge & Academic VIP Passcode Box */}
          <div style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={16} style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>XPRIZE Judge &amp; Academic Reviewer Access</span>
                </div>
                <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>
                  Enter your reviewer passcode (e.g. <code>XPRIZE2026</code>) for instant unlimited Pro compute.
                </p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const clean = vipCode.trim().toUpperCase();
                if (clean === 'XPRIZE2026' || clean === 'SILICON2026' || clean === 'DEVPOST2026' || clean === 'ACADEMIC' || clean === 'DEMO') {
                  setAccountTier('pro');
                  localStorage.setItem('drugdiscovery_tier', 'pro');
                  setIsPricingModalOpen(false);
                  setIsProModalOpen(false);
                  setViewMode('app');
                  setPaymentBanner('🎉 VIP Reviewer Passcode Applied! Welcome to Pro Scientist Discovery Studio.');
                } else {
                  setVipError('Invalid passcode. Use XPRIZE2026 or click 1-Click Instant Demo below.');
                }
              }} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Code (e.g. XPRIZE2026)"
                  value={vipCode}
                  onChange={(e) => { setVipCode(e.target.value); setVipError(''); }}
                  style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '0.8rem', textTransform: 'uppercase', width: '180px' }}
                />
                <button type="submit" style={{ padding: '0.45rem 0.9rem', borderRadius: '6px', background: 'linear-gradient(135deg, #06b6d4, #38bdf8)', color: '#030712', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Apply Code &amp; Launch &rarr;
                </button>
              </form>
            </div>
            {vipError && <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.5rem' }}>{vipError}</div>}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setAccountTier('pro');
                  localStorage.setItem('drugdiscovery_tier', 'pro');
                  setIsPricingModalOpen(false);
                  setIsProModalOpen(false);
                  setViewMode('app');
                  setPaymentBanner('🎉 Pro Scientist Demo Access Activated! Welcome to Discovery Studio.');
                }}
                style={{ background: 'transparent', border: 'none', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                ⚡ Or click here for 1-Click Instant Pro Demo Unlock &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onLaunchApp={(preset) => {
            if (!authUser) {
              setPendingLaunchPreset(preset || null);
              setAuthIntentMessage(preset 
                ? `Sign up or sign in to investigate ${preset.source} → ${preset.target} (5 free AI discovery runs included).`
                : 'Sign up or sign in to enter the Drug Discovery Studio (5 free AI discovery runs included).');
              setIsAuthModalOpen(true);
              return;
            }
            setViewMode('app');
            if (preset) {
              setSourceConcept(preset.source);
              setTargetConcept(preset.target);
              executeSearch(preset.source, preset.target);
            }
          }}
          onOpenDocs={() => setIsDocumentationOpen(true)}
          onOpenPricing={() => setIsPricingModalOpen(true)}
          onLogin={() => {
            setAuthIntentMessage('Sign in or create your free scientist account to access AI literature discovery (5 free runs included).');
            setIsAuthModalOpen(true);
          }}
          authUser={authUser}
          onLogout={logout}
          accountTier={accountTier}
          freeQueryCount={freeQueryCount}
        />

        {/* Global Modals accessible from Landing Page */}
        {renderAuthModal()}
        {renderPricingModal()}
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left-group">
          <button className="menu-toggle-btn left-toggle" onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} aria-label="Toggle Controls">
            {leftSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          
          <div className="logo-section" style={{ display: 'flex', alignItems: 'center' }}>
            <Logo size="sm" onClick={() => setViewMode('landing')} />
          </div>
        </div>

        <div className="system-status-hud">
          <span className="status-traffic-light">
            <span className={`status-pulse-ring ${getStatusPulseColorClass()} ${getStatusPulseClass()}`}></span>
            <span className={`status-dot ${getStatusPulseColorClass()}`}></span>
          </span>
          <span style={{ fontWeight: 500, color: 'white' }}>
            {getStatusText()}
          </span>
        </div>

        <div className="header-meta">
          <button 
            className="row-btn" 
            onClick={() => setViewMode('landing')}
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.3rem 0.65rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              background: 'rgba(56, 189, 248, 0.08)', 
              borderColor: 'rgba(56, 189, 248, 0.25)', 
              color: '#38bdf8', 
              height: '1.8rem', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <Compass size={13} />
            <span>Overview</span>
          </button>

          <button 
            className="row-btn" 
            onClick={() => setIsDocumentationOpen(true)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.03)', borderColor: 'var(--border-color)', height: '1.8rem', borderRadius: '4px', cursor: 'pointer' }}
          >
            <Info size={13} style={{ color: 'var(--color-cyan)' }} />
            <span>User Guide</span>
          </button>

          <button 
            className="row-btn" 
            onClick={() => setIsFeedbackOpen(true)}
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.3rem 0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.15) 100%)', 
              borderColor: 'rgba(168,85,247,0.4)', 
              color: '#c084fc',
              height: '1.8rem', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Sparkles size={13} style={{ color: '#c084fc' }} />
            <span>Feedback &amp; Requests</span>
          </button>

          <button 
            className="row-btn" 
            onClick={() => setIsCopilotOpen(true)}
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.3rem 0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(99,102,241,0.18) 100%)', 
              border: '1px solid rgba(6, 182, 212, 0.45)', 
              color: '#38bdf8',
              height: '1.8rem', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)'
            }}
          >
            <Bot size={13} style={{ color: '#38bdf8' }} />
            <span>Translational Bio-AI</span>
          </button>

          {/* Notification Bell with Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="row-btn"
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              style={{
                fontSize: '0.72rem',
                padding: '0.3rem 0.55rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'var(--border-color)',
                height: '1.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                color: notifications.some(n => !n.read) ? '#38bdf8' : 'var(--text-muted)'
              }}
              title="System & Account Notifications"
            >
              <Bell size={13} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{
                  background: '#0284c7',
                  color: 'white',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  padding: '0.05rem 0.35rem',
                  lineHeight: 1
                }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {isNotifDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: '#0f172a',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                borderRadius: '10px',
                padding: '0.75rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(6, 182, 212, 0.2)',
                zIndex: 1100,
                color: '#ffffff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>Notifications &amp; Release Feed</span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{notifications.length} Total</span>
                </div>
                <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkNotifRead(n.id)}
                        style={{
                          background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(6, 182, 212, 0.08)',
                          border: n.read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(6, 182, 212, 0.3)',
                          borderRadius: '6px',
                          padding: '0.55rem 0.65rem',
                          cursor: 'pointer',
                          fontSize: '0.74rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, color: n.read ? '#cbd5e1' : '#38bdf8' }}>{n.title}</span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{n.timestamp}</span>
                        </div>
                        <p style={{ margin: 0, color: n.read ? '#94a3b8' : '#e2e8f0', fontSize: '0.72rem', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            className="row-btn" 
            onClick={() => setIsPricingModalOpen(true)}
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.3rem 0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              background: accountTier === 'pro' 
                ? 'rgba(16,185,129,0.12)' 
                : freeQueryCount >= 5 
                  ? 'rgba(239,68,68,0.15)' 
                  : 'rgba(245,158,11,0.12)', 
              borderColor: accountTier === 'pro' 
                ? 'rgba(16,185,129,0.4)' 
                : freeQueryCount >= 5 
                  ? 'rgba(239,68,68,0.4)' 
                  : 'rgba(245,158,11,0.35)', 
              color: accountTier === 'pro' 
                ? 'var(--color-emerald)' 
                : freeQueryCount >= 5 
                  ? '#fca5a5' 
                  : '#fef08a', 
              height: '1.8rem', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Sparkles size={13} style={{ color: accountTier === 'pro' ? 'var(--color-emerald)' : freeQueryCount >= 5 ? '#f87171' : 'var(--color-amber)' }} />
            <span>
              {accountTier === 'pro' 
                ? '✨ Pro Scientist' 
                : accountTier === 'trial'
                  ? '✨ 7-Day Trial Pass'
                  : freeQueryCount >= 5 
                    ? '⚠️ Free Cap Reached (5/5) — Upgrade' 
                    : `⚡ Free Account (${Math.max(0, 5 - freeQueryCount)} of 5 left)`}
            </span>
          </button>

          {authUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="row-btn" onClick={() => setIsJournalOpen(true)} style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', background: 'transparent', border: '1px solid var(--border-color)', height: '1.8rem', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                Research Journal ({journalSteps.length})
              </button>
              {authUser.photoURL && (
                <img src={authUser.photoURL} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border-color)' }} />
              )}
              <button className="row-btn" onClick={logout} style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                Logout
              </button>
            </div>
          ) : (
            <button className="row-btn" onClick={() => setIsAuthModalOpen(true)} style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'white', color: '#0f172a', border: 'none', height: '1.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
              <User size={13} />
              <span>Sign In</span>
            </button>
          )}

          {rlhfInsights.length > 0 && (
            <div className="latency-indicator" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <BrainCircuit size={12} />
              <span>Saved Insights: {rlhfInsights.filter(i => i.status === 'approved').length}</span>
            </div>
          )}

          <button className="menu-toggle-btn right-toggle" onClick={() => setRightSidebarOpen(!rightSidebarOpen)} aria-label="Toggle Research Panel" title="Toggle Research Panel">
            {rightSidebarOpen ? <X size={18} /> : <Layers2 size={18} />}
          </button>
        </div>
      </header>

      {/* Payment / Upgrade Confirmation Banner */}
      {paymentBanner && (
        <div style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.2) 0%, rgba(99,102,241,0.2) 100%)', borderBottom: '1px solid rgba(16,185,129,0.4)', padding: '0.6rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--color-emerald)' }} />
            <span style={{ fontWeight: 600 }}>{paymentBanner}</span>
          </div>
          <button onClick={() => setPaymentBanner(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Workbench Grid */}
      <div className="dashboard-grid">
        
        {/* Left Panel: Sidebar Inputs */}
        <aside className={`sidebar ${leftSidebarOpen ? 'open' : ''}`}>

          {/* Presets */}
          <div className={`control-section ${showOnboarding ? 'onboarding-dimmed' : ''}`}>
            <span className="panel-title">
              <span>Benchmark Discovery Presets</span>
              <Compass size={12} style={{ color: 'var(--text-muted)' }} />
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              <button 
                className="row-btn"
                onClick={() => {
                  setSourceConcept('Semaglutide');
                  setTargetConcept('Alzheimer Disease');
                  setSelectedSources(new Set(['Semaglutide']));
                  setSelectedTargets(new Set(['Alzheimer Disease']));
                  executeSearch('Semaglutide', 'Alzheimer Disease');
                }}
              >
                Semaglutide &rarr; Alzheimer's
              </button>
              <button 
                className="row-btn"
                onClick={() => {
                  setSourceConcept('Olaparib');
                  setTargetConcept('Triple-Negative Breast Cancer');
                  setSelectedSources(new Set(['Olaparib']));
                  setSelectedTargets(new Set(['Triple-Negative Breast Cancer']));
                  executeSearch('Olaparib', 'Triple-Negative Breast Cancer');
                }}
              >
                Olaparib &rarr; TNBC
              </button>
              <button 
                className="row-btn"
                onClick={() => {
                  setSourceConcept('Lenalidomide');
                  setTargetConcept('Multiple Myeloma');
                  setSelectedSources(new Set(['Lenalidomide']));
                  setSelectedTargets(new Set(['Multiple Myeloma']));
                  executeSearch('Lenalidomide', 'Multiple Myeloma');
                }}
              >
                Lenalidomide &rarr; Myeloma
              </button>
              <button 
                className="row-btn"
                onClick={() => {
                  setSourceConcept('Metformin');
                  setTargetConcept('Glioblastoma');
                  setSelectedSources(new Set(['Metformin']));
                  setSelectedTargets(new Set(['Glioblastoma']));
                  executeSearch('Metformin', 'Glioblastoma');
                }}
              >
                Metformin &rarr; GBM Stem
              </button>
            </div>
          </div>

          {/* Concepts Entry */}
          <div className="control-section">
            <span className="panel-title">Research Anchors & Intent</span>
            
            {/* Concept A Input */}
            <div className="input-group" ref={sourceRef}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Concept A (Source / Drug)</span>
                {hypothesisBreadcrumbs.length > 1 && (
                  <span style={{ color: 'var(--color-amber)', fontSize: '0.65rem' }}>
                    Pivoted (Step {hypothesisBreadcrumbs.length})
                  </span>
                )}
              </label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="workbench-input"
                  placeholder="e.g. Metformin or Magnesium"
                  value={sourceConcept}
                  onChange={(e) => {
                    setSourceConcept(e.target.value);
                    handleAutocompleteFetch(e.target.value, 'source');
                    setShowSourceSuggestions(true);
                  }}
                  onFocus={() => setShowSourceSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowSourceSuggestions(false);
                      executeSearch(sourceConcept, targetConcept);
                    }
                  }}
                />
                {showSourceSuggestions && sourceSuggestions.length > 0 && (
                  <ul className="autocomplete-dropdown">
                    {sourceSuggestions.map(s => (
                      <li 
                        key={s.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setSourceConcept(s.name);
                          setSelectedSources(new Set([s.name]));
                          setSelectedSourceType(s.type);
                          setShowSourceSuggestions(false);
                        }}
                      >
                        <span className="dropdown-name">{s.name}</span>
                        <span className={`dropdown-type badge-${s.type.toLowerCase()}`}>{s.type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Research Intent / Context (Optional) */}
            <div className="input-group" style={{ marginTop: '0.75rem' }}>
              <label className="input-label">Clinical Intent / Context <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>(Optional)</span></label>
              <input 
                type="text" 
                className="workbench-input"
                placeholder="e.g. cellular senescence, cardioprotection"
                value={researchContext}
                onChange={(e) => setResearchContext(e.target.value)}
                style={{ fontSize: '0.75rem' }}
              />
            </div>

            {/* Concept C Input (Optional for Open Discovery) */}
            <div className="input-group" ref={targetRef} style={{ marginTop: '0.75rem' }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Concept C (Target Indication)</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Leave empty for Open Discovery</span>
              </label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="workbench-input"
                  placeholder="e.g. Alzheimer Disease or Migraine"
                  value={targetConcept}
                  onChange={(e) => {
                    setTargetConcept(e.target.value);
                    handleAutocompleteFetch(e.target.value, 'target');
                    setShowTargetSuggestions(true);
                  }}
                  onFocus={() => setShowTargetSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowTargetSuggestions(false);
                      executeSearch(sourceConcept, targetConcept);
                    }
                  }}
                />
                {showTargetSuggestions && targetSuggestions.length > 0 && (
                  <ul className="autocomplete-dropdown">
                    {targetSuggestions.map(s => (
                      <li 
                        key={s.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setTargetConcept(s.name);
                          setSelectedTargets(new Set([s.name]));
                          setSelectedTargetType(s.type);
                          setShowTargetSuggestions(false);
                        }}
                      >
                        <span className="dropdown-name">{s.name}</span>
                        <span className={`dropdown-type badge-${s.type.toLowerCase()}`}>{s.type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Search Execution Button */}
            <div style={{ marginTop: '1.25rem' }}>
              <button 
                onClick={() => executeSearch(sourceConcept, targetConcept)}
                disabled={isSearching || isOpenDiscoveryLoading || !sourceConcept}
                style={{
                  width: '100%',
                  background: targetConcept?.trim() 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  opacity: (!sourceConcept || isSearching || isOpenDiscoveryLoading) ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                {(isSearching || isOpenDiscoveryLoading) ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : targetConcept?.trim() ? (
                  <Activity size={16} />
                ) : (
                  <Zap size={16} />
                )}
                {(isSearching || isOpenDiscoveryLoading) 
                  ? 'Analyzing PubMed Graph...' 
                  : targetConcept?.trim() 
                    ? '🔬 Run Mechanistic Bridging (A ➔ B ➔ C)' 
                    : '⚡ Run Open Discovery (Scan Gaps)'}
              </button>
              
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setIsJournalOpen(true)}
                  className="row-btn"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    color: 'var(--color-indigo)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  <FileText size={13} />
                  <span>Hypothesis Journal ({journalSteps.length})</span>
                </button>
              </div>
            </div>

          </div>

        </aside>

        {/* Center Panel: Main Workspace */}
        <main className="center-workspace" style={{ background: 'var(--bg-primary)', position: 'relative', display: 'flex', flexDirection: 'column' }}>

          {/* Multi-Stage Discovery Progress HUD Overlay */}
          <DiscoveryProgressHud
            isSearching={isSearching}
            isOpenDiscoveryLoading={isOpenDiscoveryLoading}
            sourceConcept={sourceConcept}
            targetConcept={targetConcept}
          />

          {/* Breadcrumb Journey Header */}
          {hypothesisBreadcrumbs.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid var(--border-color)', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Exploration Journey:</span>
                {hypothesisBreadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <span 
                      style={{ 
                        color: idx === hypothesisBreadcrumbs.length - 1 ? 'var(--color-cyan)' : 'var(--text-secondary)',
                        fontWeight: idx === hypothesisBreadcrumbs.length - 1 ? 700 : 500,
                        background: 'rgba(255,255,255,0.05)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px'
                      }}
                    >
                      {crumb}
                    </span>
                    {idx < hypothesisBreadcrumbs.length - 1 && <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />}
                  </React.Fragment>
                ))}
                {targetConcept && (
                  <>
                    <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--color-emerald)', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      Target: {targetConcept}
                    </span>
                  </>
                )}
              </div>

              {journalSteps.length > 0 && (
                <button 
                  onClick={handleGenerateDossier}
                  className="row-btn"
                  style={{ background: 'var(--color-indigo)', color: 'white', border: 'none', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Sparkles size={13} />
                  <span>Synthesize Discovery Dossier</span>
                </button>
              )}
            </div>
          )}

          {/* VIEW SWITCHER & WORKSPACE BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

            {/* OPEN DISCOVERY VIEW */}
            {activeWorkspaceMode === 'open_discovery' && openDiscoveryResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Executive Landscape Synthesis Card */}
                {openDiscoveryResult.landscape_synthesis && (
                  <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', padding: '1.2rem 1.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <BrainCircuit size={20} style={{ color: 'var(--color-cyan)' }} />
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                        Executive Landscape &amp; Structural Gap Synthesis
                      </h3>
                    </div>
                    <p style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>
                      {openDiscoveryResult.landscape_synthesis}
                    </p>
                  </div>
                )}

                {/* Domain & Druggability Filter Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-secondary)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: '110px' }}>Clinical Domain:</span>
                    {[
                      { id: 'all', label: 'All Hypotheses' },
                      { id: 'Rare', label: '🧬 Rare & Pediatric' },
                      { id: 'Neuro', label: '🧠 Neurology' },
                      { id: 'Cardio', label: '🫀 Cardiovascular' },
                      { id: 'Inflam', label: '🛡️ Immunology' },
                      { id: 'Metabolic', label: '⚡ Metabolic' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedCategoryFilter(tab.id)}
                        className="row-btn"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.6rem',
                          background: selectedCategoryFilter === tab.id ? 'var(--color-indigo)' : 'rgba(255,255,255,0.05)',
                          color: selectedCategoryFilter === tab.id ? 'white' : 'var(--text-secondary)',
                          borderColor: selectedCategoryFilter === tab.id ? 'var(--color-indigo)' : 'var(--border-color)',
                          fontWeight: selectedCategoryFilter === tab.id ? 700 : 500
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: '110px' }}>Druggability Tier:</span>
                    {[
                      { id: 'all', label: 'All Modalities' },
                      { id: 'small_molecule', label: '💊 Small Molecule' },
                      { id: 'antibody', label: '💉 Biologics / mAb' },
                      { id: 'protac', label: '🧪 PROTAC / Degrader' },
                      { id: 'transporter', label: '⚡ Transporter / Enzyme' }
                    ].map(mod => (
                      <button
                        key={mod.id}
                        onClick={() => setSelectedModalityFilter(mod.id)}
                        className="row-btn"
                        style={{
                          fontSize: '0.73rem',
                          padding: '0.2rem 0.55rem',
                          background: selectedModalityFilter === mod.id ? 'var(--color-cyan)' : 'rgba(255,255,255,0.04)',
                          color: selectedModalityFilter === mod.id ? 'black' : 'var(--text-secondary)',
                          borderColor: selectedModalityFilter === mod.id ? 'var(--color-cyan)' : 'var(--border-color)',
                          fontWeight: selectedModalityFilter === mod.id ? 700 : 500
                        }}
                      >
                        {mod.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Two-Column Grid: Known Universe vs Novel Structural Gaps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '1.25rem' }}>
                  
                  {/* LEFT: THE KNOWN UNIVERSE (Consensus) */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>The Known Universe</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Established direct co-occurrences in PubMed</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        {openDiscoveryResult.known_universe?.length || 0} Targets
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
                      {openDiscoveryResult.known_universe?.map((item: any, idx: number) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 600, color: 'white', fontSize: '0.85rem' }}>{item.name}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.category || ''}</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {item.direct_a_c} direct PubMed papers with {openDiscoveryResult.source?.name}
                            </span>
                          </div>
                          <button 
                            className="row-btn"
                            onClick={() => {
                              setTargetConcept(item.name);
                              setSelectedTargets(new Set([item.name]));
                              executeSearch(openDiscoveryResult.source?.name, item.name);
                            }}
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem', color: 'var(--color-cyan)', borderColor: 'rgba(6,182,212,0.3)' }}
                          >
                            Trace Mechanism &rarr;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: NOVEL STRUCTURAL GAPS (Dark Matter) */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Zap size={16} style={{ color: 'var(--color-cyan)' }} />
                          <h4 style={{ margin: 0, color: 'white', fontSize: '0.92rem', fontWeight: 700 }}>Unexplored Structural Gaps (Dark Matter)</h4>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Neglected or 0 direct papers &bull; High empirical multi-bridge connectivity</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(6,182,212,0.1)', color: 'var(--color-cyan)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        {openDiscoveryResult.novel_structural_gaps?.filter((g: any) => selectedCategoryFilter === 'all' || (g.category && g.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase()))).length || 0} Viable Hypotheses
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto' }}>
                      {openDiscoveryResult.novel_structural_gaps
                        ?.filter((gap: any) => selectedCategoryFilter === 'all' || (gap.category && gap.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase())))
                        .map((gap: any, idx: number) => (
                        <div key={idx} style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '8px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{gap.name}</span>
                              <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.45rem', borderRadius: '4px', color: '#cbd5e1' }}>
                                {gap.category || 'Clinical Pathology'}
                              </span>
                              <span style={{ 
                                background: gap.direct_a_c === 0 ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)', 
                                color: gap.direct_a_c === 0 ? 'var(--color-rose)' : 'var(--color-amber)', 
                                fontSize: '0.65rem', 
                                padding: '0.1rem 0.4rem', 
                                borderRadius: '4px', 
                                fontWeight: 700 
                              }}>
                                {gap.direct_a_c === 0 ? '0 Direct Papers (Pure Gap)' : `${gap.direct_a_c} Direct Papers (Neglected)`}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', fontWeight: 700 }}>
                              Score: {gap.gap_score}
                            </span>
                          </div>

                          {/* Mediating Bridges */}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Empirical Multi-Bridges:</span>
                            {gap.bridges?.slice(0, 3).map((b: any, bIdx: number) => (
                              <span key={bIdx} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: '#e2e8f0' }}>
                                <strong>{b.b_name}</strong> (A&rarr;B: {b.ab_count}, B&rarr;C: {b.bc_count})
                              </span>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.2rem' }}>
                            <button 
                              onClick={() => {
                                const step = {
                                  from: openDiscoveryResult.source?.name,
                                  to: gap.name,
                                  type: gap.type,
                                  citationsA: gap.bridges?.[0]?.ab_count || 1,
                                  citationsC: gap.bridges?.[0]?.bc_count || 1,
                                  score: gap.gap_score,
                                  rationale: `Added structural gap candidate ${gap.name} connected via ${gap.bridges?.map((b: any) => b.b_name).slice(0, 2).join(', ')}`,
                                  timestamp: new Date().toLocaleTimeString()
                                };
                                setJournalSteps(prev => [...prev, step]);
                                setIsJournalOpen(true);
                              }}
                              className="row-btn"
                              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                            >
                              + Add to Journal
                            </button>
                            <button 
                              className="action-btn explore-btn ready"
                              onClick={() => {
                                setTargetConcept(gap.name);
                                setSelectedTargets(new Set([gap.name]));
                                executeSearch(openDiscoveryResult.source?.name, gap.name);
                              }}
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
                            >
                              Trace Mechanism ({openDiscoveryResult.source?.name} &rarr; {gap.name})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* MECHANISTIC BRIDGING VIEW (SWANSON TABLE) */}
            {activeWorkspaceMode === 'mechanistic_bridging' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Direct Consensus & AI Normalization Banner */}
                <div style={{ background: directCount > 0 ? 'rgba(59,130,246,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${directCount > 0 ? 'rgba(59,130,246,0.3)' : 'rgba(244,63,94,0.3)'}`, borderRadius: '6px', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>
                        Literature Baseline: {sourceConcept} &bull; {targetConcept}
                      </span>
                      {sourceGrounding?.canonical && sourceGrounding.canonical.toLowerCase() !== sourceConcept.toLowerCase() && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '4px', color: '#38bdf8' }}>
                          Grounded: {sourceGrounding.canonical}
                        </span>
                      )}
                      {targetGrounding?.canonical && targetGrounding.canonical.toLowerCase() !== targetConcept.toLowerCase() && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', color: '#818cf8' }}>
                          Grounded: {targetGrounding.canonical}
                        </span>
                      )}
                      {isAiAugmented && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.2))', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '4px', color: '#e879f9', fontWeight: 600 }}>
                          ✨ Live 2026 Literature AI Swarm
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {directCount > 0 
                        ? `Found ${directCount} direct peer-reviewed papers co-mentioning both terms.` 
                        : isAiAugmented 
                          ? `0 local graph baseline co-occurrences. Automatically augmented with live Europe PMC & ChEMBL multi-agent reasoning.` 
                          : `0 direct co-occurrences found in PubMed baseline. This is a pure disjoint discovery hypothesis.`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {directCount > 0 && (
                      <a 
                        href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`("${sourceConcept}") AND ("${targetConcept}")`)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="row-btn"
                        style={{ fontSize: '0.75rem', textDecoration: 'none', color: 'var(--color-cyan)' }}
                      >
                        View Direct Papers &rarr;
                      </a>
                    )}
                  </div>
                </div>

                {/* Swanson B-Terms Table */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>
                        Ranked Empirical Intermediate Bridges (B-Terms)
                      </h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Select a bridge to inspect co-occurrence evidence, or click "Pivot & Deepen" to step forward.
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {swansonBList.length} Intermediary Candidates
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.6rem' }}>Intermediate Bridge (B)</th>
                          <th style={{ padding: '0.6rem' }}>Entity Type</th>
                          <th style={{ padding: '0.6rem' }}>A &rarr; B Papers</th>
                          <th style={{ padding: '0.6rem' }}>B &rarr; C Papers</th>
                          <th style={{ padding: '0.6rem' }}>Relevance Score</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right' }}>Stepwise Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {swansonBList.map((b, idx) => (
                          <tr 
                            key={idx} 
                            style={{ 
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              background: selectedB?.word === b.word ? 'rgba(6,182,212,0.08)' : 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleSelectB(b)}
                          >
                            <td style={{ padding: '0.6rem', fontWeight: 600, color: 'white' }}>
                              {b.word}
                            </td>
                            <td style={{ padding: '0.6rem' }}>
                              <span className={`dropdown-type badge-${(b.type || 'target').toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                                {b.type}
                              </span>
                            </td>
                            <td style={{ padding: '0.6rem', color: 'var(--color-indigo)', fontWeight: 600 }}>
                              {b.countA}
                            </td>
                            <td style={{ padding: '0.6rem', color: 'var(--color-cyan)', fontWeight: 600 }}>
                              {b.countC}
                            </td>
                            <td style={{ padding: '0.6rem', color: 'var(--color-emerald)', fontWeight: 700 }}>
                              {b.score.toFixed(3)}
                            </td>
                            <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePivotB(b);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Set this B-term as the new starting A-term and explore next-hop connections to C"
                              >
                                Pivot &amp; Deepen &rarr;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* INITIAL EMPTY STATE */}
            {!openDiscoveryResult && swansonBList.length === 0 && !isSearching && !isOpenDiscoveryLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', textAlign: 'center', padding: '2rem' }}>
                <BrainCircuit size={48} style={{ color: 'var(--color-cyan)', marginBottom: '1rem', opacity: 0.8 }} />
                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                  Empirical Literature-Based Discovery Studio
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '32rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                  Enter a single drug or disease concept on the left to scan for <strong>unexplored structural gaps (0-paper dark matter)</strong>, or enter both Concept A and Concept C to dissect <strong>multi-hop intermediate mechanisms</strong>.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={() => {
                      setSourceConcept('Metformin');
                      handleOpenDiscovery('Metformin');
                    }}
                    className="action-btn explore-btn ready"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    ⚡ Try Metformin Open Discovery
                  </button>
                  <button 
                    onClick={() => {
                      setSourceConcept('Semaglutide');
                      setTargetConcept('Alzheimer Disease');
                      executeSearch('Semaglutide', 'Alzheimer Disease');
                    }}
                    className="action-btn"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    🧠 Try Semaglutide ➔ Alzheimer's Bridging
                  </button>
                  <button 
                    onClick={() => {
                      setSourceConcept('Olaparib');
                      setTargetConcept('Triple-Negative Breast Cancer');
                      executeSearch('Olaparib', 'Triple-Negative Breast Cancer');
                    }}
                    className="action-btn outline"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    🧬 Try Olaparib ➔ TNBC Synergies
                  </button>
                </div>
              </div>
            )}

          </div>

        </main>

        {/* Right Panel: Details & AI Hypothesis */}
        {!(!isSearching && swansonBList.length === 0 && dbPaths.length === 0) && (
          <aside className={`right-sidebar ${rightSidebarOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="panel-title">Hypothesis & Evidence Workbench</span>
          
          {/* Executive Translation & Action Plan Card */}
          <div style={{ padding: '0 0.25rem', marginBottom: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(99,102,241,0.12) 100%)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', boxShadow: '0 4px 15px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={15} style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'white' }}>Executive Translation &amp; Action Plan</span>
                </div>
                <span style={{ fontSize: '0.65rem', background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)', color: '#a5f3fc', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                  AI Synthesis
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {sourceConcept && targetConcept ? `Synthesize the convergent mechanistic axes for ${sourceConcept} ➔ ${targetConcept} and auto-generate stage-gated wet-lab validation protocols.` : 'Synthesize big-picture mechanistic axes and auto-generate stage-gated next steps.'}
              </p>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsCopilotOpen(true)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 8px rgba(2,132,199,0.3)'
                  }}
                >
                  <Bot size={13} />
                  <span>🧭 What Does This Mean? (Big Picture)</span>
                </button>

                <button
                  onClick={() => setIsJournalOpen(true)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <FileText size={13} style={{ color: '#34d399' }} />
                  <span>Journal ({journalSteps.length + journalNotes.length})</span>
                </button>
              </div>
            </div>
          </div>

          {selectedConcept ? (
            <div className="hypothesis-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Concept summary card */}
              <div className="hypothesis-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-header-row">
                  <span className="cvs-badge">{selectedConcept.isBridge ? 'LBD BRIDGE' : 'SEARCH ANCHOR'}</span>
                  {selectedConcept.isBridge && selectedB && (
                    <span className="logo-subtitle" style={{ fontSize: '0.65rem' }}>
                      Score: {selectedB.score.toFixed(3)}
                    </span>
                  )}
                </div>
                <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>
                  {selectedConcept.name}
                </h3>
                <p className="card-description-text" style={{ textTransform: 'capitalize', color: 'var(--color-node-' + selectedConcept.type.toLowerCase() + ')' }}>
                  Biological Type: {selectedConcept.type}
                </p>
                {selectedConcept.isBridge ? (
                  selectedConcept.name !== selectedB?.word ? (
                    <p className="card-description-text">
                      This term acts as an intermediate bridge along the multi-hop path. It connects predecessor <strong>{evidenceSource}</strong> to successor <strong>{evidenceTarget}</strong>.
                    </p>
                  ) : (
                    <p className="card-description-text">
                      This term acts as an indirect connection. A total of <strong>{selectedConcept.countA || selectedB?.countA}</strong> articles co-occur with the {sourceConcept || 'Source'} cluster, and <strong>{selectedConcept.countC || selectedB?.countC}</strong> articles co-occur with the {targetConcept || 'Target'} cluster. No direct literature links them.
                    </p>
                  )
                ) : (
                  <p className="card-description-text">
                    This term acts as a search anchor ({selectedConcept.type === 'compound' ? 'Source' : 'Target'}). Validated synonyms and children are mapped in the tripartite graph.
                  </p>
                )}
                
                {/* Iterative Action Pivot */}
                {selectedConcept.name === selectedB?.word && (
                  <div className="recursive-actions-row" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <button 
                      className="row-btn action-btn explore-btn" 
                      onClick={() => handleIterate(selectedConcept.name)}
                      style={{ fontSize: '0.75rem', height: '2rem', width: '100%' }}
                    >
                      <RefreshCw size={12} />
                      <span>Pivot &amp; Iterate Search</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Structured Biological & Clinical Database validation overlays */}
              <div className="hypothesis-card">
                <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-cyan)', marginBottom: '0.5rem' }}>
                  <Activity size={14} />
                  Structured Biological Validation
                </span>
                
                {isLoadingPharma ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Fetching target/chemical profiles...</span>
                  </div>
                ) : chemblData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <div><strong style={{ color: 'white' }}>ChEMBL ID:</strong> <code style={{ color: 'var(--color-cyan)' }}>{chemblData.chemblId}</code></div>
                    <div><strong style={{ color: 'white' }}>Clinical Status:</strong> <span className={`checkbox-badge ${chemblData.maxPhase === 4 ? 'badge-compound' : 'badge-disease'}`} style={{ marginLeft: 0 }}>{chemblData.maxPhase === 4 ? 'Approved' : `Clinical Phase ${chemblData.maxPhase}`}</span></div>
                    <div><strong style={{ color: 'white' }}>Molecule Type:</strong> {chemblData.moleculeType}</div>
                    {chemblData.therapeuticClass && <div><strong style={{ color: 'white' }}>Class:</strong> {chemblData.therapeuticClass}</div>}
                    {chemblData.structureSMILES && <div style={{ wordBreak: 'break-all', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '4px', marginTop: '0.25rem' }}><strong>SMILES:</strong> {chemblData.structureSMILES}</div>}
                  </div>
                ) : otData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <div><strong style={{ color: 'white' }}>Gene Target:</strong> <code style={{ color: 'var(--color-indigo)' }}>{otData.symbol}</code></div>
                    <div><strong style={{ color: 'white' }}>Description:</strong> {otData.approvedName}</div>
                    {otData.targetClass && <div><strong style={{ color: 'white' }}>Target Class:</strong> {otData.targetClass}</div>}
                    {otData.tractability && otData.tractability.length > 0 && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <strong style={{ color: 'white', display: 'block', marginBottom: '0.15rem' }}>Druggability Tractability:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                          {otData.tractability.map((t: any) => (
                            <span key={t.id} className="checkbox-badge badge-pathway" style={{ marginLeft: 0, textTransform: 'capitalize' }}>
                              {t.modality.replace('_', ' ')}: YES
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem', fontStyle: 'italic' }}>
                    No matching structured molecule/target record in ChEMBL or Open Targets.
                  </div>
                )}
              </div>

              {/* AI Proposed hypothesis */}
              {selectedConcept.isBridge && selectedB && (
                <div className="hypothesis-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '20rem' }}>
                  <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-amber)', marginBottom: '0.5rem', width: '100%' }}>
                    <BrainCircuit size={14} />
                    <span>AI Mechanistic Discovery Analysis: {selectedConcept?.name || selectedB.word}</span>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(251, 191, 36, 0.85)', background: 'rgba(251, 191, 36, 0.08)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.25)', marginLeft: 'auto', fontWeight: 600 }}>
                      SRG Engine 0.7
                    </span>
                  </span>
                  
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--color-amber)' }}>●</span>
                    <span>AI prompt is dynamically optimized based on <strong>{evidenceSource}</strong> ({evidenceSourceType}) &rarr; <strong>{selectedConcept?.name || selectedB?.word}</strong> ({selectedConcept?.type}) &rarr; <strong>{evidenceTarget}</strong> ({evidenceTargetType}).</span>
                  </div>
                  
                  {isLoadingAiProposal ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem', gap: '0.5rem' }}>
                      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-amber)' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Synthesizing biological evidence...</span>
                    </div>
                  ) : aiProposal ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                      <div>
                        <strong style={{ color: 'white', display: 'block', marginBottom: '0.2rem' }}>Mechanistic Hypothesis:</strong>
                        <p style={{ margin: 0, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{aiProposal.mechanismSummary}</p>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                        <strong style={{ color: 'white', display: 'block', marginBottom: '0.2rem' }}>Discovery Value:</strong>
                        <p style={{ margin: 0, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{aiProposal.discoveryValue}</p>
                      </div>
                      {aiProposal.drugRepurposing && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                          <strong style={{ color: 'white', display: 'block', marginBottom: '0.2rem' }}>Repurposing Implications:</strong>
                          <p style={{ margin: 0, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{aiProposal.drugRepurposing}</p>
                        </div>
                      )}
                      {aiProposal.targetDruggability && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                          <strong style={{ color: 'white', display: 'block', marginBottom: '0.2rem' }}>Target Druggability & Structural Validation:</strong>
                          <p style={{ margin: 0, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{aiProposal.targetDruggability}</p>
                        </div>
                      )}
                      {aiProposal.structureActivity && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                          <strong style={{ color: 'white', display: 'block', marginBottom: '0.2rem' }}>Structure-Activity (SAR) & MOA Insights:</strong>
                          <p style={{ margin: 0, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{aiProposal.structureActivity}</p>
                        </div>
                      )}
                      {aiProposal.clinicalTranslational && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                          <strong style={{ color: 'white', display: 'block', marginBottom: '0.2rem' }}>Clinical & Translational Feasibility:</strong>
                          <p style={{ margin: 0, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{aiProposal.clinicalTranslational}</p>
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                        <strong style={{ color: 'white', display: 'block', marginBottom: '0.4rem' }}>Suggested Validation Assays:</strong>
                        <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {aiProposal.experimentalValidation.map((assay, i) => (
                            <li key={i} style={{ color: 'var(--text-secondary)' }}>{assay}</li>
                          ))}
                        </ul>
                      </div>
                      <div className={`rlhf-controls ${isRlhfAnimating ? 'animating' : ''}`} style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="action-btn explore-btn" 
                          onClick={() => handleRlhfAction('approved')}
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                        >
                          <Check size={14} />
                          Approve Insight
                        </button>
                        <button 
                          className="action-btn outline" 
                          onClick={() => handleRlhfAction('discarded')}
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--color-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                        >
                          <X size={14} />
                          Discard
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pathfinder-hypothesis-box" style={{ background: 'none', border: 'none', padding: 0 }}>
                      <div className="hypothesis-body">
                        <strong>Hypothesis Formulation:</strong><br/><br/>
                        We propose that modulating <strong>{Array.from(selectedSources).join(', ') || sourceConcept}</strong> exerts downstream clinical responses on the <strong>{Array.from(selectedTargets).join(', ') || targetConcept}</strong> pathology by targeting the intermediate biomarker or receptor <strong>{selectedConcept.name}</strong>.<br/><br/>
                        This bridge is supported by <strong>{selectedConcept.countA}</strong> publications linking the {sourceConcept || 'Source'} cluster to {selectedConcept.name}, and <strong>{selectedConcept.countC}</strong> publications connecting {selectedConcept.name} to the {targetConcept || 'Target'} cluster.
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="empty-state">
              <Compass size={40} className="empty-icon" />
              <h3>Select a Concept</h3>
              <p className="card-description-text" style={{ maxWidth: '15rem' }}>
                Run an autopilot search, then click on any bridging term in the table or visualizer to build a scientific hypothesis.
              </p>
            </div>
          )}
        </aside>
        )}

      </div>



      {/* Global Footer */}
      <footer className="app-footer">
        <div className="footer-left">
          <span>&copy; 2026 Silicon Research Group. All Rights Reserved.</span>
          <span className="footer-divider">|</span>
          <span className="research-use-only-badge">FOR RESEARCH USE ONLY</span>
        </div>
        <div className="footer-right">
          <span className="footer-disclaimer-text">
            Disclaimer: Not for clinical or diagnostic use.
          </span>
          <button className="footer-disclaimer-link" onClick={() => setIsDisclaimerOpen(true)}>
            View Full Disclaimer
          </button>
        </div>
      </footer>

      
      {/* Living Hypothesis Journal Modal / Drawer */}
      {isJournalOpen && (
        <div className="modal-overlay" onClick={() => setIsJournalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '42rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--color-indigo)' }} />
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>Living Hypothesis Journal</h3>
              </div>
              <button onClick={() => setIsJournalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {/* Journal Persistence HUD */}
              {accountTier === 'free' ? (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock size={14} style={{ color: '#fbbf24' }} />
                    <span style={{ fontSize: '0.75rem', color: '#fef08a', fontWeight: 600 }}>Free Account (Session-Only Notebook)</span>
                  </div>
                  <button 
                    onClick={() => { setIsJournalOpen(false); setIsPricingModalOpen(true); }}
                    style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fef08a', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Upgrade to Save Permanently &rarr;
                  </button>
                </div>
              ) : (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} style={{ color: 'var(--color-emerald)' }} />
                  <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600 }}>Pro Scientist Cloud Synced Notebook (Auto-Saved)</span>
                </div>
              )}

              <div>
                <h4 style={{ color: 'var(--color-cyan)', margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>Exploration Path Breadcrumbs</h4>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {hypothesisBreadcrumbs.map((crumb, i) => (
                    <React.Fragment key={i}>
                      <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>
                        {crumb}
                      </span>
                      {i < hypothesisBreadcrumbs.length - 1 && <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />}
                    </React.Fragment>
                  ))}
                  {targetConcept && (
                    <>
                      <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--color-emerald)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>
                        {targetConcept}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Recorded Pivot Steps */}
              <div>
                <h4 style={{ color: 'var(--color-cyan)', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>Recorded Stepwise Milestones ({journalSteps.length})</h4>
                {journalSteps.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    No pivot steps recorded yet. Click "Pivot & Deepen" on any B-term to log steps into this notebook.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {journalSteps.map((step, idx) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.65rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: 'white', fontWeight: 700 }}>Step {idx + 1}: {step.from} &rarr; {step.to}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{step.timestamp}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {step.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Researcher Lab Notes */}
              <div>
                <h4 style={{ color: 'var(--color-cyan)', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>Researcher Lab Notes</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Add observation or mechanistic note..." 
                    value={currentNoteInput}
                    onChange={(e) => setCurrentNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && currentNoteInput.trim()) {
                        setJournalNotes(prev => [...prev, currentNoteInput.trim()]);
                        setCurrentNoteInput('');
                      }
                    }}
                    style={{ flex: 1, background: '#0a0a0a', border: '1px solid var(--border-color)', color: 'white', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}
                  />
                  <button 
                    onClick={() => {
                      if (currentNoteInput.trim()) {
                        setJournalNotes(prev => [...prev, currentNoteInput.trim()]);
                        setCurrentNoteInput('');
                      }
                    }}
                    className="row-btn"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Add Note
                  </button>
                </div>
                {journalNotes.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {journalNotes.map((n, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{n}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* AI Co-Scientist Real-Time Safety & Plausibility Critique */}
              <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BrainCircuit size={16} style={{ color: 'var(--color-indigo)' }} />
                    <span style={{ fontWeight: 700, color: 'white', fontSize: '0.85rem' }}>AI Co-Scientist Safety &amp; Plausibility Review</span>
                  </div>
                  <button
                    onClick={async () => {
                      setIsReviewingJournal(true);
                      try {
                        const fallbackSteps = journalSteps.length ? journalSteps : [{
                          source: sourceConcept || 'Compound',
                          bTerm: selectedB?.word || selectedConcept?.name || 'Target Pathway',
                          target: targetConcept || 'Disease Indication',
                          score: 0.95,
                          timestamp: new Date().toLocaleTimeString()
                        }];
                        const res = await fetch('/api/journal/review', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            steps: fallbackSteps,
                            notes: journalNotes,
                            source: sourceConcept,
                            target: targetConcept
                          })
                        });
                        const data = await res.json();
                        setAiReviewResult(data);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsReviewingJournal(false);
                      }
                    }}
                    disabled={isReviewingJournal}
                    className="row-btn"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', color: 'var(--color-cyan)', borderColor: 'rgba(6,182,212,0.4)', cursor: 'pointer' }}
                  >
                    {isReviewingJournal ? 'Evaluating Safety...' : '🛡️ Run AI Safety Screen'}
                  </button>
                </div>

                {aiReviewResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', background: 'rgba(0,0,0,0.3)', padding: '0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mechanistic Plausibility:</span>
                      <span style={{ fontWeight: 800, color: aiReviewResult.plausibilityScore >= 80 ? 'var(--color-emerald)' : 'var(--color-amber)', fontSize: '0.85rem' }}>
                        {aiReviewResult.plausibilityScore} / 100
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: '#cbd5e1' }}>Mechanism Analysis: </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{aiReviewResult.moaAnalysis}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--color-amber)' }}>🛡️ Safety &amp; Toxicology Screen: </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{aiReviewResult.toxicologyScreen}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--color-cyan)' }}>🧪 Recommended In-Vitro Assay: </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{aiReviewResult.recommendedAssay}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  setJournalSteps([]);
                  setJournalNotes([]);
                  setHypothesisBreadcrumbs([]);
                  setAiReviewResult(null);
                }}
                className="row-btn"
                style={{ fontSize: '0.75rem', color: 'var(--color-rose)', borderColor: 'rgba(244,63,94,0.3)' }}
              >
                Clear Notebook
              </button>
              <button 
                onClick={handleGenerateDossier}
                className="action-btn explore-btn ready"
                style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Sparkles size={14} />
                <span>Synthesize Discovery Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Dossier Modal */}
      {isDossierModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDossierModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '50rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: 'var(--color-indigo)' }} />
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 700 }}>
                  Formal Hypothesis Discovery Dossier
                </h3>
              </div>
              <button onClick={() => setIsDossierModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '0.5rem' }}>
              {isGeneratingDossier ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-indigo)', marginBottom: '1rem' }} />
                  <span style={{ color: 'white', fontWeight: 600 }}>Synthesizing publication-grade dossier & experimental protocols...</span>
                </div>
              ) : formalDossier ? (
                <>
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <h2 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.2rem', fontWeight: 800 }}>
                      {formalDossier.title}
                    </h2>
                    <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                      {formalDossier.executiveSummary}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--color-cyan)', margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}>Molecular Mechanism of Action</h4>
                    <p style={{ color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {formalDossier.mechanisticNarrative}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--color-emerald)', margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}>Translational &amp; Clinical Impact</h4>
                    <p style={{ color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                      {formalDossier.clinicalValue}
                    </p>
                  </div>

                  {formalDossier.experimentalValidation?.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.85rem' }}>
                      <h4 style={{ color: 'var(--color-amber)', margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>Recommended Wet-Lab Experimental Protocols</h4>
                      <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#e2e8f0', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {formalDossier.experimentalValidation.map((assay: string, aIdx: number) => (
                          <li key={aIdx}>{assay}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {formalDossier.potentialPitfalls && (
                    <div style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', padding: '0.65rem' }}>
                      <span style={{ color: 'var(--color-rose)', fontWeight: 700, fontSize: '0.75rem' }}>Considerations &amp; Potential Off-Targets:</span>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#fda4af' }}>
                        {formalDossier.potentialPitfalls}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Failed to load dossier.</p>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Synthesized via Project Episteme Literature Graph Engine
              </span>
              <button 
                onClick={() => {
                  if (!formalDossier) return;
                  const text = `# ${formalDossier.title}\n\n## Executive Summary\n${formalDossier.executiveSummary}\n\n## Mechanism of Action\n${formalDossier.mechanisticNarrative}\n\n## Clinical Value\n${formalDossier.clinicalValue}\n\n## Wet-Lab Validation Protocols\n${(formalDossier.experimentalValidation || []).map((a: string) => `- ${a}`).join('\n')}\n`;
                  const blob = new Blob([text], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${sourceConcept}_Discovery_Dossier.md`;
                  a.click();
                }}
                className="action-btn outline"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
              >
                Download Markdown Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      {isDisclaimerOpen && (
        <div className="modal-overlay" onClick={() => setIsDisclaimerOpen(false)}>
          <div className="modal-content disclaimer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Legal Disclaimer & Usage Policy</h3>
              <button className="close-modal-btn" onClick={() => setIsDisclaimerOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-scroll-body" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <p>
                <strong style={{ color: 'white', display: 'block', marginBottom: '0.25rem' }}>1. Research Tool Only</strong>
                {BRAND_NAME} is a literature-based discovery research tool designed strictly to assist investigators in exploring literature-based associations and formulating scientific hypotheses. It is provided "as is" without warranty of any kind.
              </p>
              <p>
                <strong style={{ color: 'white', display: 'block', marginBottom: '0.25rem' }}>2. No Clinical or Medical Advice</strong>
                This software does not provide medical or clinical advice, diagnostics, or treatment recommendations. The findings, relationships, and AI-synthesized hypotheses generated by this tool are computed by automated text-mining algorithms and semantic models. They do not represent professional clinical judgment.
              </p>
              <p>
                <strong style={{ color: 'white', display: 'block', marginBottom: '0.25rem' }}>3. Empirical Validation Required</strong>
                All causal chains, bridging terms, and biological relationships identified by {BRAND_NAME} must be independently verified by empirical scientific research, laboratory experiments, and clinical trial evidence before any therapeutic, clinical, or diagnostic application.
              </p>
              <p>
                <strong style={{ color: 'white', display: 'block', marginBottom: '0.25rem' }}>4. Limitation of Liability</strong>
                Silicon Research Group (SRG) and its developers shall not be liable for any claims, damages, or liabilities arising from the use of this software, including but not limited to reliance on generated hypotheses for drug discovery, clinical trials, or patient care.
              </p>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="action-btn explore-btn ready" onClick={() => setIsDisclaimerOpen(false)}>
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Shared Modals & Bio-AI */}
      {renderAuthModal()}
      {renderPricingModal()}

      {/* Scientific Documentation & User Guide Modal */}
      <DocumentationModal
        isOpen={isDocumentationOpen}
        onClose={() => setIsDocumentationOpen(false)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onLaunchPreset={(preset) => {
          setSourceConcept(preset.source);
          setTargetConcept(preset.target);
          executeSearch(preset.source, preset.target);
        }}
      />

      {/* Dedicated Scientist Feedback & Feature Request Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        clientContext={{
          sourceConcept,
          targetConcept,
          selectedBTerm: selectedB?.word || selectedConcept?.name,
          activeBTerms: swansonBList,
          ledgerSteps: historyTrail,
          authUser,
          accountTier
        }}
      />

      {/* Translational Bio-AI Companion */}
      <CsoCopilot
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setCopilotInitialPrompt(null);
        }}
        initialPrompt={copilotInitialPrompt}
        onClearInitialPrompt={() => setCopilotInitialPrompt(null)}
        clientContext={{
          sourceConcept,
          targetConcept,
          selectedBTerm: selectedB?.word || selectedConcept?.name,
          activeBTerms: swansonBList,
          activeEvidence: [...(evidenceA || []), ...(evidenceC || [])],
          chemblData,
          otData,
          ledgerSteps: historyTrail,
          ledgerNotes: (rlhfInsights || []).map((r: any) => `[${r.status.toUpperCase()}] ${r.bTerm}: ${r.mechanism}`),
          safetyCritique: aiProposal?.clinicalTranslational || aiProposal?.mechanismSummary,
          openDiscoveryResult
        }}
        onAddToLedger={(note: string) => {
          const newStep: JournalStep = {
            from: sourceConcept || 'Compound A',
            to: selectedB?.word || selectedConcept?.name || targetConcept || 'Target C',
            type: 'Translational Bio-AI Insight',
            citationsA: 1,
            citationsC: 1,
            score: 0.99,
            rationale: note,
            timestamp: new Date().toLocaleTimeString()
          };
          setJournalSteps(prev => [...prev, newStep]);
          setJournalNotes(prev => [...prev, note]);
          setIsJournalOpen(true);
        }}
        onTriggerSearch={(s: string, t: string) => {
          setSourceConcept(s);
          setTargetConcept(t);
          executeSearch(s, t);
        }}
      />

      {/* Floating Bio-AI Trigger Button */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 900,
            background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '0.65rem 1.15rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.5), 0 0 15px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Sparkles size={16} />
          <span>Translational Bio-AI</span>
        </button>
      )}

    </div>
  );
}
