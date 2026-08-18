import React, { useState } from 'react';
import { Sparkles, MessageSquare, CheckCircle2, X, Send, AlertCircle, ArrowRight } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  clientContext
}) => {
  const [category, setCategory] = useState<string>('Feature Request');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>(clientContext?.authUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackText,
          category,
          userEmail: contactEmail.trim() || clientContext?.authUser?.email || 'scientist@institution.org',
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
        setSubmittedTicketId(data.ticketId);
        setFeedbackText('');
      } else {
        alert(data.error || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      alert('Error submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1300 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '580px', 
          width: '92%',
          background: '#0f172a', 
          border: '1px solid rgba(6, 182, 212, 0.4)', 
          borderRadius: '16px', 
          color: '#ffffff', 
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(6, 182, 212, 0.2)',
          padding: '2rem',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
        >
          <X size={20} />
        </button>

        {submittedTicketId ? (
          <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <CheckCircle2 size={30} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
              Feedback Logged (Ticket #{submittedTicketId})
            </h3>

            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              Thank you! Our engineering and translational discovery team has received your request and will review it promptly. You will receive an in-app notification when an update or fix is deployed.
            </p>

            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.75rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}>
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  Scientist Feedback &amp; Feature Requests
                </h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Direct line to our engineering &amp; translational science team
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    outline: 'none'
                  }}
                >
                  <option value="Feature Request">🚀 Feature Request / New Modality</option>
                  <option value="Biological Filter">🔬 Biological Methodology &amp; Target Filtering</option>
                  <option value="Toxicology Protocol">🛡️ Toxicology &amp; Assay Validation Screen</option>
                  <option value="Bug Report">🐛 Bug Report / Data Discrepancy</option>
                  <option value="Custom Integration">💼 Enterprise / Custom Pipeline Integration</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  What would you like to see or improve?
                </label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Describe your request, proposed biological filter (e.g. blood-brain barrier permeability, kinase selectivity), or workflow enhancement..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.5,
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Contact Email (Optional for direct reply)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your.email@institution.org"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    padding: '0.65rem 1.1rem',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !feedbackText.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: isSubmitting || !feedbackText.trim() ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || !feedbackText.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Sending...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
