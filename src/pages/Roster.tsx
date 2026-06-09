import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { MemberCard } from '../components/MemberCard';
import { fetchRoster, getAllRoster, subscribeRoster, type Member } from '../utils/roster';

type SortKey = 'name' | 'joined';

export const Roster: React.FC = () => {
  const { theme } = useTheme();
  const c = colors[theme];
  const [all, setAll] = useState<Member[]>(() => getAllRoster());
  const [roleFilter, setRoleFilter] = useState('All');
  const [sideFilter, setSideFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('joined');

  // Fetch from sheet on load; re-render whenever the cache changes (same + other tabs).
  useEffect(() => {
    fetchRoster().then(setAll);
    return subscribeRoster(() => setAll(getAllRoster()));
  }, []);

  // Derive role + side options from data so adding new ones in roster.json works automatically.
  const roleOptions = useMemo(() => {
    const set = new Set(all.map((m) => m.role));
    return ['All', ...Array.from(set)];
  }, [all]);

  const sideOptions = useMemo(() => {
    const set = new Set(all.map((m) => m.side).filter((s) => s !== '—'));
    return ['All', ...Array.from(set)];
  }, [all]);

  const filtered = useMemo(() => {
    const list = all.filter(
      (m) =>
        (roleFilter === 'All' || m.role === roleFilter) &&
        (sideFilter === 'All' || m.side === sideFilter),
    );
    return list.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      return a.joined - b.joined; // oldest members first
    });
  }, [all, roleFilter, sideFilter, sortKey]);

  return (
    <>
      {/* Team photo banner */}
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
          alt="AlpasPinas Dragonboat Team — paddlers with team flag at the beach"
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
            Full Roster
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
            THE <span style={{ color: c.primary }}>CREW</span>
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
            {all.length} paddlers, coaches, and crew. Filter by role or paddling
            side to find who you're looking for.
          </p>
        </div>
      </section>

      {/* Filters + grid */}
      <section
        style={{
          padding: '2rem 1.5rem 5rem',
          backgroundColor: c.background,
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Filter bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              padding: '1.25rem',
              backgroundColor: c.surface,
              borderRadius: '0.85rem',
              border: `1px solid ${c.border}`,
              marginBottom: '2rem',
            }}
          >
            <FilterGroup
              label="Role"
              options={roleOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              colorPrimary={c.primary}
              colorBorder={c.border}
              colorText={c.text}
              colorTextSecondary={c.textSecondary}
              colorBg={c.background}
            />

            <FilterGroup
              label="Side"
              options={sideOptions}
              value={sideFilter}
              onChange={setSideFilter}
              colorPrimary={c.primary}
              colorBorder={c.border}
              colorText={c.text}
              colorTextSecondary={c.textSecondary}
              colorBg={c.background}
            />

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: c.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}
              >
                Sort
              </span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                style={{
                  padding: '0.45rem 0.7rem',
                  borderRadius: '0.45rem',
                  backgroundColor: c.background,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <option value="joined">Seniority (longest first)</option>
                <option value="name">Name (A–Z)</option>
              </select>
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
            Showing <strong style={{ color: c.text }}>{filtered.length}</strong>{' '}
            of {all.length} members
            {(roleFilter !== 'All' || sideFilter !== 'All') && (
              <>
                {' · '}
                <button
                  onClick={() => {
                    setRoleFilter('All');
                    setSideFilter('All');
                  }}
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
                  Clear filters
                </button>
              </>
            )}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filtered.map((m) => (
                <MemberCard key={m.name} member={m} />
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
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤔</div>
              <div style={{ fontWeight: 600, color: c.text, marginBottom: '0.35rem' }}>
                No members match those filters
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                Try clearing the role or side filter.
              </div>
            </div>
          )}

          {/* Footer note */}
          <p
            style={{
              marginTop: '2rem',
              color: c.textSecondary,
              fontSize: '0.78rem',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            Roster is sample data — edit{' '}
            <code style={{ color: c.primary }}>src/data/roster.json</code> to plug
            in the real team.
          </p>
        </div>
      </section>
    </>
  );
};

const FilterGroup: React.FC<{
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  colorPrimary: string;
  colorBorder: string;
  colorText: string;
  colorTextSecondary: string;
  colorBg: string;
}> = ({ label, options, value, onChange, colorPrimary, colorBorder, colorText, colorTextSecondary, colorBg }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
    <span
      style={{
        fontSize: '0.72rem',
        color: colorTextSecondary,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              backgroundColor: active ? colorPrimary : colorBg,
              color: active ? '#fff' : colorText,
              border: `1px solid ${active ? colorPrimary : colorBorder}`,
              transition: 'all 0.15s ease',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);
