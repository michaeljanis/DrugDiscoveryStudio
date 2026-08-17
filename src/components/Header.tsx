import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { loginWithGoogle, logout, subscribeToAuthChanges } from '../services/firebase';

interface HeaderProps {
  onOpenUpgradeModal: () => void;
  onOpenWorkspaces: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUpgradeModal, onOpenWorkspaces }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 32px',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc' }}>
          Episteme <span style={{ opacity: 0.5 }}>LBD</span>
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            <button 
              onClick={onOpenWorkspaces}
              style={{
                background: 'transparent',
                color: '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              My Workspaces
            </button>
            <button 
              onClick={onOpenUpgradeModal}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              Upgrade to Pro
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              {user.photoURL && (
                <img src={user.photoURL} alt="Profile" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
              )}
              <button 
                onClick={logout}
                style={{
                  background: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={() => loginWithGoogle()}
            style={{
              background: '#f8fafc',
              color: '#0f172a',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
};
