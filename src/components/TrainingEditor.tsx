import React, { useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/SiteContentContext';
import { updateSiteContent } from '../utils/siteContent';
import { colors } from '../styles/colors';
import { useIsMobile } from '../hooks/useIsMobile';
import { TrainingTab } from '../pages/admin/AdminEvents';
import type { ShowToast, ToastType } from '../pages/Admin';

const INTRO_FALLBACK = 'Weeknights we build the engine on land. Weekends we put it in the boat. Hover a side to lean in - tap it for the full frame.';
const CTA_FALLBACK = 'Four sessions a week. Weekend sessions are beginner-friendly and all gear is provided.';

/** Admin-only, on-page editor for the Training section. */
export const TrainingEditor: React.FC = () => {
  const { user } = useAuth();
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isMobile = useIsMobile();
  const intro = useContent('training.intro', INTRO_FALLBACK);
  const cta = useContent('training.cta', CTA_FALLBACK);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [introDraft, setIntroDraft] = useState(intro);
  const [ctaDraft, setCtaDraft] = useState(cta);
  const [savingCopy, setSavingCopy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!user?.isAdmin) return null;

  const showToast: ShowToast = (message, type = 'success') => setNotice({ message, type });

  const saveCopy = async () => {
    if (!introDraft.trim() || !ctaDraft.trim()) {
      showToast('Training copy cannot be empty.', 'error');
      return;
    }
    setSavingCopy(true);
    try {
      await Promise.all([
        updateSiteContent('training.intro', introDraft.trim()),
        updateSiteContent('training.cta', ctaDraft.trim()),
      ]);
      showToast('Training copy saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save training copy.', 'error');
    } finally {
      setSavingCopy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => { setIntroDraft(intro); setCtaDraft(cta); setNotice(null); setOpen(true); }} aria-label="Edit Training section" title="Edit Training section" style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${c.border}`, background: c.surface, color: c.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <Pencil size={16} aria-hidden="true" />
      </button>
      <style>{`.training-editor { position: fixed; inset: 0; margin: auto; width: min(1050px, calc(100vw - 2rem)); max-height: min(860px, calc(100dvh - 2rem)); padding: 0; border: 1px solid ${c.border}; border-radius: 0.75rem; background: ${c.background}; color: ${c.text}; box-shadow: 0 24px 64px rgba(0,0,0,0.3); } .training-editor::backdrop { background: rgba(10,16,24,0.65); } .training-editor .admin-focus:focus-visible { outline: 2px solid ${c.primary}; outline-offset: 2px; }`}</style>
      <dialog ref={dialogRef} className="training-editor" onClose={() => setOpen(false)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.1rem 1.25rem', borderBottom: `1px solid ${c.border}`, background: c.surface }}>
          <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', lineHeight: 1, letterSpacing: '0.02em' }}>EDIT TRAINING</div><div style={{ color: c.textSecondary, fontSize: '0.82rem', marginTop: '0.35rem' }}>Changes publish to the home page immediately.</div></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close editor" title="Close editor" style={{ width: 36, height: 36, border: `1px solid ${c.border}`, borderRadius: '0.45rem', background: 'transparent', color: c.text, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} aria-hidden="true" /></button>
        </div>
        <div style={{ maxHeight: 'calc(min(860px, 100dvh - 2rem) - 82px)', overflowY: 'auto', padding: '1.25rem' }}>
          {notice && <div role="status" style={{ marginBottom: '1rem', padding: '0.7rem 0.85rem', borderRadius: '0.5rem', background: notice.type === 'error' ? '#ef44441f' : `${c.primary}18`, color: notice.type === 'error' ? '#b91c1c' : c.text, fontSize: '0.85rem', fontWeight: 600 }}>{notice.message}</div>}
          <div style={{ display: 'grid', gap: '0.85rem', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: `1px solid ${c.border}` }}>
            <div><label htmlFor="training-intro" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: c.textSecondary, marginBottom: '0.4rem' }}>Section intro</label><textarea id="training-intro" value={introDraft} onChange={(event) => setIntroDraft(event.target.value)} rows={3} style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.45rem', border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontFamily: 'inherit', fontSize: '16px', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} /></div>
            <div><label htmlFor="training-cta" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: c.textSecondary, marginBottom: '0.4rem' }}>Newcomer callout</label><textarea id="training-cta" value={ctaDraft} onChange={(event) => setCtaDraft(event.target.value)} rows={2} style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.45rem', border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontFamily: 'inherit', fontSize: '16px', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="button" onClick={saveCopy} disabled={savingCopy} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.45rem', background: c.primary, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: savingCopy ? 'not-allowed' : 'pointer', opacity: savingCopy ? 0.6 : 1 }}>{savingCopy ? 'Saving...' : 'Save copy'}</button></div>
          </div>
          <TrainingTab c={c} showToast={showToast} isMobile={isMobile} />
        </div>
      </dialog>
    </>
  );
};