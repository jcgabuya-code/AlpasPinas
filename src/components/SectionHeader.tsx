import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/colors';
import { eyebrowChip, displayStyle, type DisplaySize } from '../styles/tokens';

// Eyebrow — the small uppercase label that leads a section, with the amber `sun`
// beat-dot tying it back to the hero's stroke-cadence signature. Brand colors are
// applied here (primary tint + sun dot); the shape/spacing comes from the token.
export const Eyebrow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const accent = theme === 'dark' ? c.accent : c.primary;
  return (
    <span
      style={{
        ...eyebrowChip,
        border: `1px solid ${accent}55`,
        backgroundColor: `${accent}15`,
        color: accent,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: c.sun, flexShrink: 0 }}
      />
      {children}
    </span>
  );
};

// SectionHeader — eyebrow + display headline, with an optional `trailing` slot for
// header-row content (e.g. a count + "see all" link). The headline is passed as
// children so each section keeps control of its own accent word.
export const SectionHeader: React.FC<{
  eyebrow?: React.ReactNode;
  size?: DisplaySize;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ eyebrow, size = 'md', trailing, children, style }) => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];

  // The branded eyebrow is an anchor cue, not section grammar — only sections that
  // open a story carry it (see Features / Contact). Index sections with a trailing
  // link omit it and let the headline + link stand alone.
  const heading = (
    <div>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 style={{ ...displayStyle(size), color: c.text }}>{children}</h2>
    </div>
  );

  if (!trailing) return <div style={style}>{heading}</div>;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '1rem',
        ...style,
      }}
    >
      {heading}
      {trailing}
    </div>
  );
};
