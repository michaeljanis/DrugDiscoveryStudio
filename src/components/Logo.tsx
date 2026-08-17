import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
  theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
  onClick,
  theme = 'dark'
}) => {
  // Dimensions based on size variant
  const dimensions = {
    sm: { icon: 22, title: '0.95rem', subtitle: '0.62rem', gap: '0.5rem' },
    md: { icon: 30, title: '1.25rem', subtitle: '0.72rem', gap: '0.65rem' },
    lg: { icon: 42, title: '1.65rem', subtitle: '0.8rem', gap: '0.85rem' },
    xl: { icon: 56, title: '2.2rem', subtitle: '0.92rem', gap: '1.1rem' }
  }[size];

  return (
    <div 
      className={`brand-logo-container ${className}`} 
      onClick={onClick}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: dimensions.gap,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      {/* Modern High-Precision Causal Graph Vector Mark */}
      <svg 
        width={dimensions.icon} 
        height={dimensions.icon} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: theme === 'light' ? 'drop-shadow(0 2px 8px rgba(6, 182, 212, 0.25))' : 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.4))' }}
      >
        <defs>
          <linearGradient id="ddsGradientPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="ddsGradientAccent" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <radialGradient id="ddsCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Center Glow */}
        <circle cx="50" cy="50" r="30" fill="url(#ddsCenterGlow)" opacity={theme === 'light' ? 0.6 : 1} />

        {/* Topological Knowledge Graph Edges */}
        <line x1="50" y1="15" x2="80" y2="35" stroke="url(#ddsGradientPrimary)" strokeWidth="3.5" strokeOpacity="0.7" />
        <line x1="80" y1="35" x2="80" y2="75" stroke="url(#ddsGradientPrimary)" strokeWidth="3.5" strokeOpacity="0.7" />
        <line x1="80" y1="75" x2="50" y2="90" stroke="url(#ddsGradientPrimary)" strokeWidth="3.5" strokeOpacity="0.7" />
        <line x1="50" y1="90" x2="20" y2="75" stroke="url(#ddsGradientPrimary)" strokeWidth="3.5" strokeOpacity="0.7" />
        <line x1="20" y1="75" x2="20" y2="35" stroke="url(#ddsGradientPrimary)" strokeWidth="3.5" strokeOpacity="0.7" />
        <line x1="20" y1="35" x2="50" y2="15" stroke="url(#ddsGradientPrimary)" strokeWidth="3.5" strokeOpacity="0.7" />

        {/* Multi-Hop Causal Bridges to Central Hub */}
        <line x1="50" y1="15" x2="50" y2="50" stroke="url(#ddsGradientAccent)" strokeWidth="3" strokeDasharray="3 3" />
        <line x1="80" y1="35" x2="50" y2="50" stroke="url(#ddsGradientAccent)" strokeWidth="3" />
        <line x1="80" y1="75" x2="50" y2="50" stroke="url(#ddsGradientAccent)" strokeWidth="3" strokeDasharray="3 3" />
        <line x1="50" y1="90" x2="50" y2="50" stroke="url(#ddsGradientAccent)" strokeWidth="3" />
        <line x1="20" y1="75" x2="50" y2="50" stroke="url(#ddsGradientAccent)" strokeWidth="3" strokeDasharray="3 3" />
        <line x1="20" y1="35" x2="50" y2="50" stroke="url(#ddsGradientAccent)" strokeWidth="3" />

        {/* Outer Peripheral Bio-Entity Nodes */}
        <circle cx="50" cy="15" r="6" fill={theme === 'light' ? '#ffffff' : '#0f172a'} stroke="#06b6d4" strokeWidth="3" />
        <circle cx="80" cy="35" r="5.5" fill={theme === 'light' ? '#ffffff' : '#0f172a'} stroke="#3b82f6" strokeWidth="3" />
        <circle cx="80" cy="75" r="5.5" fill={theme === 'light' ? '#ffffff' : '#0f172a'} stroke="#8b5cf6" strokeWidth="3" />
        <circle cx="50" cy="90" r="6" fill={theme === 'light' ? '#ffffff' : '#0f172a'} stroke="#10b981" strokeWidth="3" />
        <circle cx="20" cy="75" r="5.5" fill={theme === 'light' ? '#ffffff' : '#0f172a'} stroke="#06b6d4" strokeWidth="3" />
        <circle cx="20" cy="35" r="5.5" fill={theme === 'light' ? '#ffffff' : '#0f172a'} stroke="#3b82f6" strokeWidth="3" />

        {/* Central Frontier AI Discovery Core */}
        <circle cx="50" cy="50" r="10" fill="url(#ddsGradientPrimary)" />
        <circle cx="50" cy="50" r="4.5" fill="#ffffff" />
      </svg>

      {/* Typography Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <div style={{ 
          fontSize: dimensions.title, 
          fontWeight: 800, 
          fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
          letterSpacing: '-0.025em',
          color: theme === 'light' ? '#0f172a' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem'
        }}>
          <span>DrugDiscovery</span>
          <span style={{ 
            background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800
          }}>
            .Studio
          </span>
        </div>
        {showSubtitle && (
          <span style={{ 
            fontSize: dimensions.subtitle, 
            color: theme === 'light' ? '#64748b' : '#94a3b8', 
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginTop: '0.15rem'
          }}>
            Autonomous Biomedical AI Discovery
          </span>
        )}
      </div>
    </div>
  );
};
