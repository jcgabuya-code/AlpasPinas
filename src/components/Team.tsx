import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { fetchRoster, getAllRoster, subscribeRoster, type Member } from '../utils/roster';
import { CrewCard } from './CrewCard';
import { SectionHeader } from './SectionHeader';
import { sectionShell, contentMaxWidth } from '../styles/tokens';
import { useInView } from '../hooks/useInView';

// How many cards the teaser shows before the closing "join" card.
const TEASER_COUNT = 7;

export const Team: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const isDark = theme === 'dark';
  const [gridRef, inView] = useInView<HTMLDivElement>();
  const [joinHover, setJoinHover] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>(() => getAllRoster());

  useEffect(() => {
    fetchRoster().then(setAllMembers);
    return subscribeRoster(() => setAllMembers(getAllRoster()));
  }, []);

  const members = allMembers.slice(0, TEASER_COUNT);
  const remaining = allMembers.length - members.length;
  const accent = isDark ? c.primaryLight : c.primary;

  return (
    <section id="team" style={{ backgroundColor: c.surface, borderTop: `1px solid ${c.border}`, ...sectionShell }}>
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="The Crew"
          style={{ marginBottom: '2.5rem' }}
          trailing={
            <div style={{ color: c.textSecondary, fontSize: '0.9rem' }}>
              {allMembers.length} paddlers ·{' '}
              <Link to="/roster" style={{ color: c.primary, textDecoration: 'none' }}>
                See full roster →
              </Link>
            </div>
          }
        >
          MEET THE <span style={{ color: c.primary }}>CREW</span>
        </SectionHeader>

        {/* Crew cards — photo + profile stats, with a closing "join" card */}
        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {members.map((m, i) => (
            <div key={m.name} className={`reveal${inView ? ' is-visible' : ''}`} style={{ animationDelay: `${i * 0.07}s` }}>
              <CrewCard member={m} />
            </div>
          ))}

          {/* Join card — the open roster spot, as the conversion hook */}
          <a
            href="#contact"
            onMouseEnter={() => setJoinHover(true)}
            onMouseLeave={() => setJoinHover(false)}
            className={`reveal${inView ? ' is-visible' : ''}`}
            style={{
              animationDelay: `${members.length * 0.07}s`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              textAlign: 'center',
              textDecoration: 'none',
              padding: '1.5rem',
              borderRadius: '0.9rem',
              border: `1.5px dashed ${joinHover ? c.primary : `${c.primary}80`}`,
              backgroundColor: joinHover ? `${c.primary}14` : `${c.primary}08`,
              color: accent,
              transform: joinHover ? 'translateY(-4px)' : 'translateY(0)',
              transition: 'transform 0.25s ease, background-color 0.2s ease, border-color 0.2s ease',
            }}
          >
            <span
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                border: `2px dashed ${c.primary}aa`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 6v12M6 12h12" />
              </svg>
            </span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.02em', color: c.text, lineHeight: 1 }}>
                Your card here?
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.45rem' }}>
                Join the crew →
              </div>
            </div>
          </a>
        </div>

        {/* Bottom CTA: view full roster */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link
            to="/roster"
            style={{
              display: 'inline-block',
              color: c.text,
              padding: '0.85rem 1.5rem',
              borderRadius: '999px',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.92rem',
              border: `1px solid ${c.border}`,
            }}
          >
            View all {allMembers.length} paddlers
            {remaining > 0 ? ` (+${remaining} more)` : ''} →
          </Link>
        </div>
      </div>
    </section>
  );
};
