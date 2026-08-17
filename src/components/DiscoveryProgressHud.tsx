import React, { useState, useEffect } from 'react';
import { Network, Dna, Brain, Sparkles, Shield, Activity, Clock, Layers, CheckCircle2, Cpu } from 'lucide-react';

interface DiscoveryProgressHudProps {
  isSearching: boolean;
  isOpenDiscoveryLoading: boolean;
  sourceConcept?: string;
  targetConcept?: string;
}

export const DiscoveryProgressHud: React.FC<DiscoveryProgressHudProps> = ({
  isSearching,
  isOpenDiscoveryLoading,
  sourceConcept,
  targetConcept
}) => {
  const isActive = isSearching || isOpenDiscoveryLoading;
  const [progress, setProgress] = useState<number>(12);
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const stages = [
    { title: "Graph Topology Traversal", desc: "Traversing 13.1M+ empirical co-occurrence edges across 38.2M PubMed papers..." },
    { title: "Intermediate B-Term Extraction", desc: "Extracting transitive biological bridges (receptors, kinases, transcription factors)..." },
    { title: "Cross-Database Enrichment", desc: "Querying ChEMBL 34 bioactivities & Open Targets subcellular localizations..." },
    { title: "Causal MoA & Safety Synthesis", desc: "Evaluating literature evidence, gap density, and preclinical liability screen..." },
    { title: "Graph Layout Construction", desc: "Finalizing interactive multi-hop causal graph topology and ranking..." }
  ];

  useEffect(() => {
    if (!isActive) {
      setProgress(12);
      setStageIndex(0);
      setElapsedMs(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedMs(elapsed);

      // Smooth realistic progression curve up to 94% until search returns
      if (elapsed < 600) {
        setProgress(Math.min(25, Math.floor((elapsed / 600) * 25)));
        setStageIndex(0);
      } else if (elapsed < 1400) {
        setProgress(Math.min(55, 25 + Math.floor(((elapsed - 600) / 800) * 30)));
        setStageIndex(1);
      } else if (elapsed < 2200) {
        setProgress(Math.min(78, 55 + Math.floor(((elapsed - 1400) / 800) * 23)));
        setStageIndex(2);
      } else if (elapsed < 3500) {
        setProgress(Math.min(92, 78 + Math.floor(((elapsed - 2200) / 1300) * 14)));
        setStageIndex(3);
      } else {
        setProgress(Math.min(96, 92 + Math.floor(((elapsed - 3500) / 3000) * 4)));
        setStageIndex(4);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  const currentStage = stages[Math.min(stageIndex, stages.length - 1)];

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '92%',
      maxWidth: '680px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(6, 182, 212, 0.4)',
      borderRadius: '20px',
      padding: '2rem 2.25rem',
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(6, 182, 212, 0.25)',
      zIndex: 50,
      textAlign: 'left',
      color: '#ffffff'
    }}>
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(2, 132, 199, 0.5)'
          }}>
            <Sparkles size={18} className="animate-spin" />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              {isOpenDiscoveryLoading ? 'Autonomous Open Discovery Engine' : 'Transitive Literature-Based Discovery'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              High-Dimensional Causal Pathfinding &bull; 8GB Priority Compute
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          padding: '0.3rem 0.65rem',
          fontSize: '0.75rem',
          color: '#38bdf8',
          fontWeight: 700
        }}>
          <Clock size={13} />
          <span>{(elapsedMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Query Anchors */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.25rem',
        fontSize: '0.82rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>Concept A:</span>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>{sourceConcept || 'Input Modality'}</span>
        </div>
        {targetConcept && (
          <>
            <span style={{ color: '#64748b' }}>➔</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>Concept C:</span>
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>{targetConcept}</span>
            </div>
          </>
        )}
      </div>

      {/* Progress Bar with Moving Shimmer */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
            {currentStage.title}
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8' }}>
            {progress}%
          </span>
        </div>

        {/* Track */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '9999px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #818cf8 100%)',
            borderRadius: '9999px',
            transition: 'width 0.15s ease',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.7)'
          }} />
        </div>

        {/* Current Description */}
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.45rem', minHeight: '1.2rem' }}>
          {currentStage.desc}
        </div>
      </div>

      {/* 5-Step Stage Checkpoint Bubbles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.4rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {stages.map((st, i) => {
          const isDone = i < stageIndex;
          const isCurrent = i === stageIndex;
          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0.25rem'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 800,
                background: isDone ? '#10b981' : isCurrent ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                border: isDone ? '1px solid #10b981' : isCurrent ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isDone ? '#ffffff' : isCurrent ? '#38bdf8' : '#64748b'
              }}>
                {isDone ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: isCurrent ? 700 : 500,
                color: isDone ? '#e2e8f0' : isCurrent ? '#38bdf8' : '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100px'
              }}>
                {st.title.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
