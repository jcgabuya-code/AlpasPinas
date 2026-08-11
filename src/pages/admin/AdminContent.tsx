import React, { useEffect, useState } from 'react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import { CONTENT_KEYS, fetchSiteContent, updateSiteContent } from '../../utils/siteContent';

type Props = { showToast: ShowToast; c: ColorPalette };

// Label + fallback shown when a key hasn't been saved yet — the same defaults
// baked into each component, so an empty field never means a blank homepage.
const FIELDS: { key: (typeof CONTENT_KEYS)[number]; label: string; fallback: string }[] = [
  {
    key: 'hero.intro',
    label: 'Hero — intro line',
    fallback: 'Start with a weekend session. No experience needed, all gear provided, and a crew that will get you on the water fast.',
  },
  {
    key: 'about.manifesto',
    label: 'About — manifesto',
    fallback: "AlpasPinas is a Filipino dragon boat crew in Malaysia — a home away from home that moves on a single beat. We paddle to break away: from the pack on the start line, and from anything that says a crew this far from home can't line up and win.",
  },
  {
    key: 'training.intro',
    label: 'Training — intro line',
    fallback: 'Four sessions a week — weeknights for fitness and technique, weekends for full-crew water time. Sessions marked open welcome drop-ins, no confirmation needed.',
  },
  {
    key: 'training.cta',
    label: 'Training — "New here?" callout',
    fallback: 'Weekend sessions are beginner-friendly and all gear is provided. Message us to reserve your seat for this week.',
  },
  {
    key: 'featuredGear.note',
    label: 'Gear — note under the shop teaser',
    fallback: 'Members race in club kit. Your jersey, paddle, and PFD are provided once you join the crew.',
  },
  {
    key: 'raceRecord.intro',
    label: 'Race Record — intro line',
    fallback: "Seasons of racing across the region and a growing trophy shelf. Here's where we've lined up lately.",
  },
  {
    key: 'contact.invite',
    label: 'Contact — invite paragraph',
    fallback: "There's a seat in the boat with your name on it. Come try a session — no experience needed, all gear provided. We'll get you on the water within a week or two.",
  },
];

export const AdminContent: React.FC<Props> = ({ showToast, c }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteContent()
      .then((content) =>
        setValues(Object.fromEntries(FIELDS.map((f) => [f.key, content[f.key] ?? f.fallback]))),
      )
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load content', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (key: string) => {
    setSavingKey(key);
    try {
      await updateSiteContent(key, values[key] ?? '');
      showToast('Saved. Refresh the site to see it live.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save', 'error');
    } finally {
      setSavingKey(null);
    }
  };

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
        SITE CONTENT
      </h1>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: '0 0 1.75rem', maxWidth: '560px' }}>
        The write-up paragraphs on the home page. Shared by desktop and mobile — editing one
        updates both. Visitors see the change on their next page load.
      </p>

      {loading ? (
        <div style={{ color: c.textSecondary }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '640px' }}>
          {FIELDS.map((f) => (
            <div
              key={f.key}
              style={{
                border: `1px solid ${c.border}`,
                borderRadius: '0.75rem',
                padding: '1.1rem 1.25rem',
                backgroundColor: c.surface,
              }}
            >
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: c.text, marginBottom: '0.55rem' }}>
                {f.label}
              </label>
              <textarea
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${c.border}`,
                  backgroundColor: c.background,
                  color: c.text,
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => save(f.key)}
                  disabled={savingKey === f.key}
                  style={{
                    padding: '0.5rem 1.1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: c.primary,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: savingKey === f.key ? 'default' : 'pointer',
                    opacity: savingKey === f.key ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {savingKey === f.key ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
