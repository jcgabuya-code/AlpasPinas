import React, { useEffect, useState } from 'react';
import { Check, X, Copy, Mail } from 'lucide-react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  getApplications,
  approveApplication,
  rejectApplication,
  sendRegistrationEmail,
  isAutoApproveEnabled,
  setAutoApprove,
  type Application,
} from '../../utils/users';

const registrationLink = (token: string) =>
  `${window.location.origin}/register?token=${encodeURIComponent(token)}`;

const isTokenLive = (app: Application) =>
  Boolean(
    app.registrationToken &&
    !app.tokenUsedAt &&
    app.tokenExpiresAt &&
    new Date(app.tokenExpiresAt).getTime() > Date.now(),
  );

type Theme = 'dark' | 'light';
type StatusInfo = { label: string; bg: string; fg: string };

// Theme-aware status pills. Foreground/background chosen so small bold pill text
// clears WCAG AA (≥4.5:1) in BOTH modes — measured, not eyeballed.
const STATUS: Record<Theme, Record<'pending' | 'approved' | 'declined', { bg: string; fg: string }>> = {
  dark: {
    pending:  { bg: 'rgba(245,158,11,0.22)', fg: '#fbbf24' },
    approved: { bg: 'rgba(22,163,74,0.22)',  fg: '#4ade80' },
    declined: { bg: 'rgba(239,68,68,0.22)',  fg: '#f87171' },
  },
  light: {
    pending:  { bg: 'rgba(245,158,11,0.16)', fg: '#854d0e' },
    approved: { bg: 'rgba(22,163,74,0.16)',  fg: '#14532d' },
    declined: { bg: 'rgba(239,68,68,0.16)',  fg: '#991b1b' },
  },
};

const statusInfo = (app: Application, theme: Theme): StatusInfo => {
  const set = STATUS[theme];
  if (app.status === 'pending') return { label: 'Pending', ...set.pending };
  if (app.status === 'rejected') return { label: 'Declined', ...set.declined };
  return { label: 'Approved', ...set.approved };
};

const Pill: React.FC<{ info: StatusInfo }> = ({ info }) => (
  <span
    style={{
      display: 'inline-flex',
      padding: '0.25rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 700,
      backgroundColor: info.bg,
      color: info.fg,
    }}
  >
    {info.label}
  </span>
);

const IconBtn: React.FC<{ onClick: () => void; disabled?: boolean; color: string; bg: string; title: string; size: number; children: React.ReactNode }> = ({
  onClick, disabled, color, bg, title, size, children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className="admin-focus"
    style={{
      width: size,
      height: size,
      borderRadius: '0.5rem',
      border: 'none',
      backgroundColor: bg,
      color,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
      flexShrink: 0,
    }}
  >
    {children}
  </button>
);

type Props = { showToast: ShowToast; c: ColorPalette; theme: Theme };

export const AdminApplications: React.FC<Props> = ({ showToast, c, theme }) => {
  const isMobile = useIsMobile();
  const iconSize = isMobile ? 44 : 34;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingMobile, setRejectingMobile] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busyMobile, setBusyMobile] = useState<string | null>(null);
  const [autoApprove, setAutoApproveState] = useState<boolean | null>(null);
  const [togglingApprove, setTogglingApprove] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const apps = await getApplications();
      setApplications(apps);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load applications';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    isAutoApproveEnabled().then(setAutoApproveState).catch(() => setAutoApproveState(false));
  }, []);

  const handleToggleAutoApprove = async () => {
    if (autoApprove === null || togglingApprove) return;
    const next = !autoApprove;
    setTogglingApprove(true);
    try {
      const saved = await setAutoApprove(next);
      setAutoApproveState(saved);
      showToast(
        saved
          ? 'Auto-approval on — new applicants get their registration link instantly.'
          : 'Auto-approval off — applications now wait for your review.',
        'success',
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update setting';
      showToast(msg, 'error');
    } finally {
      setTogglingApprove(false);
    }
  };

  // Approve (or re-approve to regenerate an expired link), then email the
  // registration link. Approval already succeeded if the email fails — the
  // admin can still use Copy Link on the approved card.
  const handleApprove = async (mobile: string) => {
    setBusyMobile(mobile);
    try {
      const { token, email, name } = await approveApplication(mobile);
      const emailSent = await sendRegistrationEmail(email, name, token);
      if (emailSent) {
        showToast(`Approved — registration link emailed to ${email}.`, 'success');
      } else {
        showToast('Approved, but the email failed to send. Use "Copy link" to share it manually.', 'error');
      }
      await loadApplications();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to approve application';
      showToast(msg, 'error');
    } finally {
      setBusyMobile(null);
    }
  };

  const handleCopyLink = async (app: Application) => {
    if (!app.registrationToken) return;
    try {
      await navigator.clipboard.writeText(registrationLink(app.registrationToken));
      showToast('Registration link copied to clipboard.', 'success');
    } catch {
      showToast('Could not copy — your browser blocked clipboard access.', 'error');
    }
  };

  const handleReject = async (mobile: string) => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    setBusyMobile(mobile);
    try {
      await rejectApplication(mobile, rejectionReason);
      showToast('Application rejected', 'success');
      setRejectingMobile(null);
      setRejectionReason('');
      await loadApplications();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reject application';
      showToast(msg, 'error');
    } finally {
      setBusyMobile(null);
    }
  };

  const pending = applications.filter((a) => a.status === 'pending');
  const sorted = [...applications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const columns = '2fr 2fr 1.1fr 0.9fr 1.2fr';

  return (
    <div style={{ padding: isMobile ? '1.25rem 1rem 3rem' : '2rem 1.5rem 4rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: isMobile ? '0.5rem' : '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              color: c.text,
              margin: '0 0 0.4rem',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            REGISTRATIONS
          </h1>
          <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: 0 }}>
            Review and confirm new member applications
          </p>
        </div>
        <button
          type="button"
          onClick={loadApplications}
          disabled={loading}
          className="admin-focus"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 1rem',
            minHeight: 40,
            borderRadius: '999px',
            border: `1px solid ${c.border}`,
            backgroundColor: 'transparent',
            color: loading ? c.textSecondary : c.text,
            fontSize: '0.82rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ display: 'inline-block', animation: loading ? 'spin 0.9s linear infinite' : 'none' }}>↻</span>
          {loading ? 'Syncing…' : 'Refresh'}
        </button>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .admin-focus:focus-visible { outline: 2px solid ${c.primary}; outline-offset: 2px; }
      `}</style>

      {/* Trial toggle: when on, applicants get their registration link instantly
          (no manual approve). Flip off after the trial to restore the review gate. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: isMobile ? '0.9rem 1rem' : '1rem 1.25rem',
          marginBottom: isMobile ? '1rem' : '1.25rem',
          backgroundColor: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: '0.85rem',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: c.text }}>
            Instant approval (trial)
          </div>
          <div style={{ fontSize: '0.8rem', color: c.textSecondary, marginTop: '0.2rem', lineHeight: 1.5 }}>
            {autoApprove
              ? 'New applicants are emailed their registration link automatically — no review needed.'
              : 'New applications wait here for you to approve before a link is sent.'}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoApprove ?? false}
          aria-label="Toggle instant approval"
          onClick={handleToggleAutoApprove}
          disabled={autoApprove === null || togglingApprove}
          className="admin-focus"
          style={{
            position: 'relative',
            flexShrink: 0,
            width: 52,
            height: 30,
            borderRadius: '999px',
            border: 'none',
            padding: 0,
            cursor: autoApprove === null || togglingApprove ? 'not-allowed' : 'pointer',
            backgroundColor: autoApprove ? c.primary : c.border,
            opacity: autoApprove === null ? 0.5 : 1,
            transition: 'background-color 0.2s',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: autoApprove ? 25 : 3,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'left 0.2s',
            }}
          />
        </button>
      </div>

      <div style={{ fontSize: '0.85rem', color: c.textSecondary, margin: `0 0 ${isMobile ? '1rem' : '1.25rem'}` }}>
        {loading ? 'Fetching…' : `${applications.length} application${applications.length === 1 ? '' : 's'} · ${pending.length} pending review`}
      </div>

      <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '1rem', overflow: 'hidden' }}>
        {!isMobile && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: columns,
              gap: '1rem',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: c.textSecondary,
              borderBottom: `1px solid ${c.border}`,
            }}
          >
            <div>Name</div><div>Email</div><div>Applied</div><div>Status</div><div>Actions</div>
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div style={{ padding: '2rem 1.25rem', textAlign: 'center', color: c.textSecondary, fontSize: '0.88rem' }}>
            No applications yet.
          </div>
        )}

        {sorted.map((app, i) => {
          const info = statusInfo(app, theme);
          const busy = busyMobile === app.mobile;
          const live = isTokenLive(app);
          const registered = Boolean(app.tokenUsedAt);
          const isLast = i === sorted.length - 1;
          const rejecting = rejectingMobile === app.mobile;

          const nameEmailApplied = (
            <>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: c.text }}>{app.name}</div>
              <div style={{ fontSize: '0.82rem', color: c.textSecondary, marginTop: isMobile ? '0.2rem' : 0 }}>{app.email}</div>
              {isMobile && (
                <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.2rem' }}>
                  Applied {new Date(app.createdAt).toLocaleDateString()}
                </div>
              )}
            </>
          );

          const actions = app.status === 'pending' ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <IconBtn onClick={() => handleApprove(app.mobile)} disabled={busy} size={iconSize} color={STATUS[theme].approved.fg} bg={STATUS[theme].approved.bg} title="Approve">
                <Check size={16} strokeWidth={2.4} />
              </IconBtn>
              <IconBtn onClick={() => setRejectingMobile(rejecting ? null : app.mobile)} disabled={busy} size={iconSize} color={STATUS[theme].declined.fg} bg={STATUS[theme].declined.bg} title="Reject">
                <X size={16} strokeWidth={2.4} />
              </IconBtn>
            </div>
          ) : app.status === 'approved' && !registered ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {live && (
                <IconBtn onClick={() => handleCopyLink(app)} disabled={busy} size={iconSize} color={c.text} bg={c.hover} title="Copy registration link">
                  <Copy size={15} strokeWidth={2} />
                </IconBtn>
              )}
              <IconBtn onClick={() => handleApprove(app.mobile)} disabled={busy} size={iconSize} color={c.primary} bg={`${c.primary}22`} title="Resend email">
                <Mail size={15} strokeWidth={2} />
              </IconBtn>
            </div>
          ) : (
            <span style={{ fontSize: '0.8rem', color: c.textSecondary }}>
              {registered ? 'Registered ✓' : app.status === 'rejected' ? 'Reviewed' : ''}
            </span>
          );

          if (isMobile) {
            return (
              <div key={app.mobile} style={{ padding: '1rem 1.1rem', borderBottom: isLast && !rejecting ? 'none' : `1px solid ${c.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ minWidth: 0 }}>{nameEmailApplied}</div>
                  <Pill info={info} />
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>{actions}</div>
                {rejecting && (
                  <RejectForm
                    c={c}
                    reason={rejectionReason}
                    setReason={setRejectionReason}
                    onConfirm={() => handleReject(app.mobile)}
                    onCancel={() => { setRejectingMobile(null); setRejectionReason(''); }}
                  />
                )}
              </div>
            );
          }

          return (
            <div key={app.mobile} style={{ borderBottom: isLast && !rejecting ? 'none' : `1px solid ${c.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: columns, gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: c.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</div>
                <div style={{ fontSize: '0.85rem', color: c.textSecondary, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.email}>{app.email}</div>
                <div style={{ fontSize: '0.85rem', color: c.textSecondary }}>{new Date(app.createdAt).toLocaleDateString()}</div>
                <div><Pill info={info} /></div>
                {actions}
              </div>
              {rejecting && (
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                  <RejectForm
                    c={c}
                    compact
                    reason={rejectionReason}
                    setReason={setRejectionReason}
                    onConfirm={() => handleReject(app.mobile)}
                    onCancel={() => { setRejectingMobile(null); setRejectionReason(''); }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RejectForm: React.FC<{
  c: ColorPalette;
  reason: string;
  setReason: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  compact?: boolean;
}> = ({ c, reason, setReason, onConfirm, onCancel, compact }) => (
  <div style={{ padding: '0.85rem', backgroundColor: c.surfaceAlt, borderRadius: '0.6rem', marginTop: '0.75rem', maxWidth: compact ? '420px' : undefined }}>
    <label htmlFor="reject-reason" style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '0.4rem' }}>
      REJECTION REASON
    </label>
    <textarea
      id="reject-reason"
      className="admin-focus"
      value={reason}
      onChange={(e) => setReason(e.target.value)}
      placeholder="Optional reason for rejection..."
      style={{
        width: '100%',
        padding: '0.5rem',
        borderRadius: '0.4rem',
        border: `1px solid ${c.border}`,
        backgroundColor: c.background,
        color: c.text,
        // Keep ≥16px on mobile so iOS Safari doesn't auto-zoom on focus
        // (and then get stuck zoomed once this form unmounts).
        fontSize: compact ? '0.85rem' : '16px',
        fontFamily: 'inherit',
        marginBottom: '0.5rem',
        minHeight: '60px',
        boxSizing: 'border-box',
        resize: 'vertical',
      }}
    />
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        onClick={onConfirm}
        className="admin-focus"
        style={{
          flex: compact ? '0 0 auto' : 1,
          padding: compact ? '0.6rem 1.1rem' : '0.6rem',
          minHeight: 44,
          backgroundColor: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '0.4rem',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        Confirm Rejection
      </button>
      <button
        onClick={onCancel}
        className="admin-focus"
        style={{
          padding: '0.6rem 1rem',
          minHeight: 44,
          backgroundColor: 'transparent',
          color: c.text,
          border: `1px solid ${c.border}`,
          borderRadius: '0.4rem',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        Cancel
      </button>
    </div>
  </div>
);
