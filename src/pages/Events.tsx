import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, type ColorPalette } from '../styles/colors';
import eventsData from '../data/events.json';
import {
  EventCard,
  isUpcoming,
  parseEventDate,
  type RaceEvent,
} from '../components/EventCard';

export const Events: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];
  const all = eventsData as RaceEvent[];
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [typeFilter, setTypeFilter] = useState('All');

  const typeOptions = useMemo(() => {
    const set = new Set(all.map((e) => e.type));
    return ['All', ...Array.from(set)];
  }, [all]);

  const upcomingCount = useMemo(() => all.filter((e) => isUpcoming(e.date)).length, [all]);
  const pastCount = all.length - upcomingCount;

  const filtered = useMemo(() => {
    const list = all
      .filter((e) => (tab === 'upcoming' ? isUpcoming(e.date) : !isUpcoming(e.date)))
      .filter((e) => typeFilter === 'All' || e.type === typeFilter);
    return list.sort((a, b) => {
      const da = parseEventDate(a.date).getTime();
      const db = parseEventDate(b.date).getTime();
      return tab === 'upcoming' ? da - db : db - da;
    });
  }, [all, tab, typeFilter]);

  const totalInTab = tab === 'upcoming' ? upcomingCount : pastCount;

  return (
    <>
      {/* Hero banner */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(140px, 22vw, 240px)',
          overflow: 'hidden',
          backgroundColor: c.surface,
        }}
      >
        <img
          src="/team.jpg"
          alt="AlpasPinas Dragonboat Team racing"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 25%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 45%, ${c.background} 100%)`,
          }}
        />
      </section>

      {/* Page header */}
      <section
        style={{
          padding: '2.5rem 1.5rem 2rem',
          backgroundColor: c.background,
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              color: c.textSecondary,
              textDecoration: 'none',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            ← Back to home
          </Link>

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
              marginBottom: '1rem',
            }}
          >
            Races & Results
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
              color: c.text,
              margin: '0 0 0.75rem 0',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            ON THE <span style={{ color: c.primary }}>WATER</span>
          </h1>

          <p
            style={{
              color: c.textSecondary,
              fontSize: '1rem',
              maxWidth: '600px',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {upcomingCount} upcoming {upcomingCount === 1 ? 'race' : 'races'} on the
            calendar and {pastCount} past {pastCount === 1 ? 'result' : 'results'} in
            the books.
          </p>
        </div>
      </section>

      {/* Tab strip + filter + grid */}
      <section
        style={{
          padding: '1rem 1.5rem 5rem',
          backgroundColor: c.background,
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Tab strip */}
          <div
            role="tablist"
            aria-label="Events tab"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <TabButton
              active={tab === 'upcoming'}
              onClick={() => setTab('upcoming')}
              c={c}
              label="Upcoming"
              count={upcomingCount}
            />
            <TabButton
              active={tab === 'past'}
              onClick={() => setTab('past')}
              c={c}
              label="Past results"
              count={pastCount}
            />
          </div>

          {/* Type filter */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              padding: '1.25rem',
              backgroundColor: c.surface,
              borderRadius: '0.85rem',
              border: `1px solid ${c.border}`,
              marginBottom: '1.5rem',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: c.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
              }}
            >
              Type
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {typeOptions.map((opt) => {
                const active = opt === typeFilter;
                return (
                  <button
                    key={opt}
                    onClick={() => setTypeFilter(opt)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      backgroundColor: active ? c.primary : c.background,
                      color: active ? '#fff' : c.text,
                      border: `1px solid ${active ? c.primary : c.border}`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result count */}
          <div
            style={{
              color: c.textSecondary,
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            Showing <strong style={{ color: c.text }}>{filtered.length}</strong> of{' '}
            {totalInTab} {tab === 'upcoming' ? 'upcoming' : 'past'}{' '}
            {totalInTab === 1 ? 'event' : 'events'}
            {typeFilter !== 'All' && (
              <>
                {' · '}
                <button
                  onClick={() => setTypeFilter('All')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: c.primary,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  Clear filter
                </button>
              </>
            )}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filtered.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '4rem 1rem',
                textAlign: 'center',
                color: c.textSecondary,
                backgroundColor: c.surface,
                borderRadius: '0.85rem',
                border: `1px dashed ${c.border}`,
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛶</div>
              <div style={{ fontWeight: 600, color: c.text, marginBottom: '0.35rem' }}>
                {tab === 'upcoming'
                  ? 'No upcoming events match that filter'
                  : 'No past results match that filter'}
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                Try the All chip or switch tabs.
              </div>
            </div>
          )}

          <p
            style={{
              marginTop: '2rem',
              color: c.textSecondary,
              fontSize: '0.78rem',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            Events are sample data — edit{' '}
            <code style={{ color: c.primary }}>src/data/events.json</code> to plug in
            the real season.
          </p>
        </div>
      </section>
    </>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  c: ColorPalette;
  label: string;
  count: number;
}> = ({ active, onClick, c, label, count }) => (
  <button
    role="tab"
    aria-selected={active}
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.55rem 1.1rem',
      borderRadius: '999px',
      fontSize: '0.88rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      border: `1px solid ${active ? c.primary : c.border}`,
      backgroundColor: active ? c.primary : c.surface,
      color: active ? '#fff' : c.textSecondary,
      transition: 'all 0.15s ease',
      letterSpacing: '0.02em',
      boxShadow: active ? `0 4px 14px ${c.primary}33` : 'none',
    }}
  >
    {label}
    <span
      style={{
        marginLeft: '0.45rem',
        padding: '0.05rem 0.45rem',
        borderRadius: '999px',
        backgroundColor: active ? 'rgba(255,255,255,0.2)' : c.background,
        color: active ? '#fff' : c.textSecondary,
        fontSize: '0.72rem',
        fontWeight: 600,
        border: active ? 'none' : `1px solid ${c.border}`,
      }}
    >
      {count}
    </span>
  </button>
);
