import React, { useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/SiteContentContext';
import { updateSiteContent } from '../utils/siteContent';
import { colors } from '../styles/colors';
import { AdminProducts } from '../pages/admin/AdminProducts';
import type { ShowToast, ToastType } from '../pages/Admin';

const NOTE_FALLBACK = 'Members race in club kit. Your jersey, paddle, and PFD are provided once you join the crew.';

/** Admin-only, on-page editor for the Gear Up section and shop catalog. */
export const GearEditor: React.FC = () => {
  const { user } = useAuth();
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const note = useContent('featuredGear.note', NOTE_FALLBACK);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(note);
  const [savingNote, setSavingNote] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!user?.isAdmin) return null;

  const showToast: ShowToast = (message, type = 'success') => setNotice({ message, type });
  const saveNote = async () => {
    if (!noteDraft.trim()) {
      showToast('The member note cannot be empty.', 'error');
      return;
    }
    setSavingNote(true);
    try {
      await updateSiteContent('featuredGear.note', noteDraft.trim());
      showToast('Member note saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save the member note.', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => { setNoteDraft(note); setNotice(null); setOpen(true); }} aria-label="Edit Gear section" title="Edit Gear section" style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${c.border}`, background: c.surface, color: c.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Pencil size={16} aria-hidden="true" /></button>
      <style>{`.gear-editor { position: fixed; inset: 0; margin: auto; width: min(1050px, calc(100vw - 2rem)); max-height: min(860px, calc(100dvh - 2rem)); padding: 0; border: 1px solid ${c.border}; border-radius: 0.75rem; background: ${c.background}; color: ${c.text}; box-shadow: 0 24px 64px rgba(0,0,0,0.3); } .gear-editor::backdrop { background: rgba(10,16,24,0.65); }`}</style>
      <dialog ref={dialogRef} className="gear-editor" onClose={() => setOpen(false)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.1rem 1.25rem', borderBottom: `1px solid ${c.border}`, background: c.surface }}>
          <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', lineHeight: 1, letterSpacing: '0.02em' }}>EDIT GEAR</div><div style={{ color: c.textSecondary, fontSize: '0.82rem', marginTop: '0.35rem' }}>Catalog changes publish to the shop immediately.</div></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close editor" title="Close editor" style={{ width: 36, height: 36, border: `1px solid ${c.border}`, borderRadius: '0.45rem', background: 'transparent', color: c.text, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} aria-hidden="true" /></button>
        </div>
        <div style={{ maxHeight: 'calc(min(860px, 100dvh - 2rem) - 82px)', overflowY: 'auto', padding: '1.25rem' }}>
          {notice && <div role="status" style={{ marginBottom: '1rem', padding: '0.7rem 0.85rem', borderRadius: '0.5rem', background: notice.type === 'error' ? '#ef44441f' : `${c.primary}18`, color: notice.type === 'error' ? '#b91c1c' : c.text, fontSize: '0.85rem', fontWeight: 600 }}>{notice.message}</div>}
          <div style={{ paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: `1px solid ${c.border}` }}>
            <label htmlFor="gear-member-note" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: c.textSecondary, marginBottom: '0.4rem' }}>Member note</label>
            <textarea id="gear-member-note" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} rows={3} style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.45rem', border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontFamily: 'inherit', fontSize: '16px', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}><button type="button" onClick={saveNote} disabled={savingNote} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.45rem', background: c.primary, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: savingNote ? 'not-allowed' : 'pointer', opacity: savingNote ? 0.6 : 1 }}>{savingNote ? 'Saving...' : 'Save note'}</button></div>
          </div>
          <AdminProducts c={c} showToast={showToast} />
        </div>
      </dialog>
    </>
  );
};