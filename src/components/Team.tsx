import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { fetchRoster, getAllRoster, subscribeRoster, type Member } from '../utils/roster';
import { MemberCard } from './MemberCard';

const TEASER_COUNT = 4;

export const Team: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];
  const [allMembers, setAllMembers] = useState<Member[]>(() => getAllRoster());

  useEffect(() => {
    fetchRoster().then(setAllMembers);
    return subscribeRoster(() => setAllMembers(getAllRoster()));
  }, []);

  const members = allMembers.slice(0, TEASER_COUNT);
  const remaining = allMembers.length - members.length;

  return (
    <section
      id="team"
      style={{
        backgroundColor: c.surface,
        padding: '6rem 1.5rem',
        borderTop: `1px solid ${c.border}`,
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: `1px solid ${c.primary}55`,
                backgroundColor: `${c.primary}15`,
                color: c.primary,
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '0.85rem',
              }}
            >
              ✦ The Roster
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
                color: c.text,
                margin: 0,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              MEET THE <span style={{ color: c.primary }}>CREW</span>
            </h2>
          </div>

          <div style={{ color: c.textSecondary, fontSize: '0.9rem' }}>
            {allMembers.length} active members ·{' '}
            <Link to="/roster" style={{ color: c.primary, textDecoration: 'none' }}>
              See full roster →
            </Link>
          </div>
        </div>

        {/* Roster grid (teaser) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {members.map((m) => (
            <MemberCard key={m.name} member={m} />
          ))}
        </div>

        {/* Bottom CTA: view full roster */}
        <div style={{ textAlign: 'center', marginTop: '2.25rem' }}>
          <Link
            to="/roster"
            style={{
              display: 'inline-block',
              backgroundColor: 'transparent',
              color: c.text,
              padding: '0.85rem 1.5rem',
              borderRadius: '999px',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.92rem',
              border: `1px solid ${c.border}`,
            }}
          >
            View all {allMembers.length} members
            {remaining > 0 ? ` (+${remaining} more)` : ''} →
          </Link>
        </div>
      </div>
    </section>
  );
};
