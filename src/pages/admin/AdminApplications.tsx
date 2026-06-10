import React, { useEffect, useState } from 'react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { getApplications, approveApplication, rejectApplication, type Application } from '../../utils/users';

type Props = { showToast: ShowToast; c: ColorPalette };

export const AdminApplications: React.FC<Props> = ({ showToast, c }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingMobile, setRejectingMobile] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvingMobile, setApprovingMobile] = useState<string | null>(null);

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
  }, []);

  const handleApprove = async (mobile: string) => {
    setApprovingMobile(mobile);
    try {
      await approveApplication(mobile);
      showToast(`Application approved. They can now register.`, 'success');
      await loadApplications();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to approve application';
      showToast(msg, 'error');
    } finally {
      setApprovingMobile(null);
    }
  };

  const handleReject = async (mobile: string) => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    try {
      await rejectApplication(mobile, rejectionReason);
      showToast('Application rejected', 'success');
      setRejectingMobile(null);
      setRejectionReason('');
      await loadApplications();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reject application';
      showToast(msg, 'error');
    }
  };

  const pending = applications.filter((a) => a.status === 'pending');
  const approved = applications.filter((a) => a.status === 'approved');
  const rejected = applications.filter((a) => a.status === 'rejected');

  return (
    <div style={{ padding: '2rem 1.5rem 4rem' }}>
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
        APPLICATIONS
      </h1>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: '0 0 2rem' }}>
        Manage team join applications
      </p>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            padding: '1rem',
            backgroundColor: c.surface,
            border: `1px solid ${pending.length > 0 ? '#f59e0b' : c.border}`,
            borderRadius: '0.55rem',
          }}
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: pending.length > 0 ? '#f59e0b' : c.primary }}>
            {pending.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: c.textSecondary }}>Pending</div>
        </div>
        <div
          style={{
            padding: '1rem',
            backgroundColor: c.surface,
            border: `1px solid ${c.primary}`,
            borderRadius: '0.55rem',
          }}
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: c.primary }}>
            {approved.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: c.textSecondary }}>Approved</div>
        </div>
        <div
          style={{
            padding: '1rem',
            backgroundColor: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: '0.55rem',
          }}
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: c.textSecondary }}>
            {rejected.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: c.textSecondary }}>Rejected</div>
        </div>
      </div>

      {/* Pending applications */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: c.text, marginBottom: '1rem' }}>
          Pending ({pending.length})
        </h2>
        {loading && <p style={{ color: c.textSecondary }}>Loading...</p>}
        {!loading && pending.length === 0 && (
          <p style={{ color: c.textSecondary, fontSize: '0.9rem' }}>No pending applications</p>
        )}
        {pending.map((app) => (
          <div
            key={app.mobile}
            style={{
              padding: '1rem',
              marginBottom: '0.75rem',
              backgroundColor: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '0.55rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: c.text }}>{app.name}</div>
              <div style={{ fontSize: '0.85rem', color: c.textSecondary, marginTop: '0.25rem' }}>
                {app.mobile} • {app.email}
              </div>
              <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.25rem' }}>
                Applied {new Date(app.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleApprove(app.mobile)}
                disabled={approvingMobile === app.mobile}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: c.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.4rem',
                  cursor: approvingMobile === app.mobile ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  opacity: approvingMobile === app.mobile ? 0.6 : 1,
                }}
              >
                {approvingMobile === app.mobile ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => setRejectingMobile(app.mobile)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: c.textSecondary,
                  border: `1px solid ${c.border}`,
                  borderRadius: '0.4rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Reject
              </button>
            </div>

            {/* Rejection reason modal */}
            {rejectingMobile === app.mobile && (
              <div
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: c.surfaceAlt,
                  borderRadius: '0.4rem',
                  marginTop: '0.5rem',
                }}
              >
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '0.5rem' }}>
                  REJECTION REASON
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Optional reason for rejection..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.4rem',
                    border: `1px solid ${c.border}`,
                    backgroundColor: c.background,
                    color: c.text,
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    marginBottom: '0.5rem',
                    minHeight: '60px',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleReject(app.mobile)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => {
                      setRejectingMobile(null);
                      setRejectionReason('');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      color: c.text,
                      border: `1px solid ${c.border}`,
                      borderRadius: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Approved applications */}
      {approved.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: c.text, marginBottom: '1rem' }}>
            Approved ({approved.length})
          </h2>
          {approved.map((app) => (
            <div
              key={app.mobile}
              style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                backgroundColor: c.surface,
                border: `1px solid ${c.primary}55`,
                borderRadius: '0.55rem',
              }}
            >
              <div style={{ fontWeight: 600, color: c.text }}>{app.name}</div>
              <div style={{ fontSize: '0.85rem', color: c.textSecondary, marginTop: '0.25rem' }}>
                {app.mobile} • {app.email}
              </div>
              <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.25rem' }}>
                Approved {new Date(app.createdAt).toLocaleDateString()} • Awaiting registration
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejected applications */}
      {rejected.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: c.text, marginBottom: '1rem' }}>
            Rejected ({rejected.length})
          </h2>
          {rejected.map((app) => (
            <div
              key={app.mobile}
              style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                backgroundColor: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: '0.55rem',
                opacity: 0.7,
              }}
            >
              <div style={{ fontWeight: 600, color: c.text }}>{app.name}</div>
              <div style={{ fontSize: '0.85rem', color: c.textSecondary, marginTop: '0.25rem' }}>
                {app.mobile} • {app.email}
              </div>
              {app.rejectionReason && (
                <div style={{ fontSize: '0.8rem', color: c.textSecondary, marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Reason: {app.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
