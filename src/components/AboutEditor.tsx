import React, { useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useContent } from '../context/SiteContentContext';
import { updateSiteContent } from '../utils/siteContent';
import { colors } from '../styles/colors';

const MANIFESTO_FALLBACK = "Founded in 2024 by Filipino expats in Malaysia, AlpasPinas began as a way to bring a piece of home closer - dragon boat is just the excuse. Filipino spirit and camaraderie come first - we work hard on the water and laugh harder off it - and we've built a name for being the crew that welcomes anyone with open arms, no experience required. We paddle to break away: from the pack on the start line, and from anything that says a crew this far from home can't line up and win.";

/** Admin-only, on-page editor for the About manifesto. */
export const AboutEditor: React.FC = () => {
  const { user } = useAuth();
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const manifesto = useContent('about.manifesto', MANIFESTO_FALLBACK);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(manifesto);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!user?.isAdmin) return null;

  const save = async () => {
    if (!draft.trim()) {
      setNotice('The manifesto cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateSiteContent('about.manifesto', draft.trim());
      setNotice('About section saved.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save the About section.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => { setDraft(manifesto); setNotice(null); setOpen(true); }} aria-label="Edit About section" title="Edit About section" style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${c.border}`, background: c.surface, color: c.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <Pencil size={16} aria-hidden="true" />
      </button>
      <style>{`.about-editor { position: fixed; inset: 0; margin: auto; width: min(680px, calc(100vw - 2rem)); max-height: min(620px, calc(100dvh - 2rem)); padding: 0; border: 1px solid ${c.border}; border-radius: 0.75rem; background: ${c.background}; color: ${c.text}; box-shadow: 0 24px 64px rgba(0,0,0,0.3); } .about-editor::backdrop { background: rgba(10,16,24,0.65); }`}</style>
      <dialog ref={dialogRef} className="about-editor" onClose={() => setOpen(false)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.1rem 1.25rem', borderBottom: `1px solid ${c.border}`, background: c.surface }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', lineHeight: 1, letterSpacing: '0.02em' }}>EDIT OUR STORY</div>
            <div style={{ color: c.textSecondary, fontSize: '0.82rem', marginTop: '0.35rem' }}>Changes publish to the home page immediately.</div>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close editor" title="Close editor" style={{ width: 36, height: 36, border: `1px solid ${c.border}`, borderRadius: '0.45rem', background: 'transparent', color: c.text, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} aria-hidden="true" /></button>
        </div>
        <div style={{ padding: '1.25rem' }}>
          {notice && <div role="status" style={{ marginBottom: '1rem', padding: '0.7rem 0.85rem', borderRadius: '0.5rem', background: `${c.primary}18`, color: c.text, fontSize: '0.85rem', fontWeight: 600 }}>{notice}</div>}
          <label htmlFor="about-manifesto" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: c.textSecondary, marginBottom: '0.4rem' }}>About story</label>
          <textarea id="about-manifesto" value={draft} onChange={(event) => setDraft(event.target.value)} rows={9} style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.45rem', border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontFamily: 'inherit', fontSize: '16px', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.85rem' }}><button type="button" onClick={save} disabled={saving} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.45rem', background: c.primary, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save story'}</button></div>
        </div>
      </dialog>
    </>
  );
};