import React, { useEffect, useMemo, useState } from 'react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import {
  fetchOrders,
  updateOrderStatus,
  setOrderEstimatedDelivery,
  formatPrice,
  type MerchOrder,
  type OrderStatus,
} from '../../utils/merch';

type Props = { showToast: ShowToast; c: ColorPalette; theme: 'dark' | 'light' };

// Reserve -> confirm availability & collect payment -> hand over. 'confirmed'
// is a legacy status from an older 4-step flow; kept in the type/records for
// backward compat with any old rows, but it's no longer part of the flow.
const STATUS_FLOW: OrderStatus[] = ['pending', 'paid', 'fulfilled'];
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#8b5cf6',
  paid: '#8b5cf6',
  fulfilled: '#16a34a',
  cancelled: '#ef4444',
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Reserved',
  confirmed: 'Confirmed & Paid',
  paid: 'Confirmed & Paid',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

// Fulfilled/cancelled orders are done business — no admin action needed until
// a rare audit, so they age out of the working list after this many days.
const ARCHIVE_AFTER_DAYS = 30;
const isArchived = (o: MerchOrder): boolean =>
  (o.status === 'fulfilled' || o.status === 'cancelled') &&
  Date.now() - new Date(o.updatedAt).getTime() > ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000;

/** Next status in the flow, or null at the end. Legacy 'confirmed' rows advance from 'paid'. */
const nextStatus = (s: OrderStatus): OrderStatus | null => {
  const i = STATUS_FLOW.indexOf(s === 'confirmed' ? 'paid' : s);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
};

export const AdminOrders: React.FC<Props> = ({ showToast, c, theme }) => {
  // Deep-navy `primary` is illegible on dark surfaces — use the brighter dark-bg
  // accent for text; light mode keeps the deep tone.
  const accent = theme === 'dark' ? c.accent : c.primary;
  const [orders, setOrders] = useState<MerchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all' | 'archived'>('all');
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await fetchOrders());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = async (id: string, status: OrderStatus) => {
    setBusyId(id);
    try {
      await updateOrderStatus(id, status);
      showToast(`Order marked ${STATUS_LABEL[status].toLowerCase()}.`, 'success');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update the order', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const saveEta = async (id: string, date: string) => {
    try {
      await setOrderEstimatedDelivery(id, date || null);
      showToast(date ? 'Estimated delivery date saved.' : 'Delivery date cleared.', 'success');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save the date', 'error');
    }
  };

  // Months with at least one order, newest first — powers the month filter.
  const monthOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const o of orders) {
      const key = o.createdAt.slice(0, 7); // 'YYYY-MM'
      if (!seen.has(key)) {
        seen.set(
          key,
          new Date(o.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        );
      }
    }
    return [...seen.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [orders]);

  // Search + month narrow the pool before status chips split it up, so chip
  // counts always reflect what search/month currently show.
  const q = query.trim().toLowerCase();
  const narrowed = orders.filter((o) => {
    if (month !== 'all' && !o.createdAt.startsWith(month)) return false;
    if (!q) return true;
    return (
      o.contactName.toLowerCase().includes(q) ||
      o.contactEmail.toLowerCase().includes(q) ||
      (o.contactPhone ?? '').toLowerCase().includes(q) ||
      o.items.some((it) => it.name.toLowerCase().includes(q))
    );
  });

  const narrowedActive = narrowed.filter((o) => !isArchived(o));
  const counts: Record<string, number> = { all: narrowedActive.length, archived: narrowed.length - narrowedActive.length };
  for (const s of [...STATUS_FLOW, 'cancelled' as OrderStatus]) counts[s] = narrowedActive.filter((o) => o.status === s).length;

  const visible =
    filter === 'all'
      ? narrowed.filter((o) => !isArchived(o))
      : filter === 'archived'
        ? narrowed.filter(isArchived)
        : narrowed.filter((o) => o.status === filter && !isArchived(o));

  const hasNarrowing = q !== '' || month !== 'all';
  const clearNarrowing = () => {
    setQuery('');
    setMonth('all');
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
        SHOP ORDERS
      </h1>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: '0 0 2rem' }}>
        Reserved → Paid → Fulfilled — click the button to move an order forward once you've collected payment or handed it over. Set an estimated delivery date before marking Paid so the buyer knows when to expect it.
      </p>

      {/* Search + month narrowing — kept on one row, shrinking together */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.6rem', flex: '1 1 260px', minWidth: 0 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, or item…"
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              boxSizing: 'border-box',
              minHeight: '2.75rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.45rem',
              border: `1px solid ${c.border}`,
              backgroundColor: c.surfaceAlt,
              color: c.text,
              fontSize: '16px',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Filter by month"
            style={{
              flex: '0 1 auto',
              width: '9.5rem',
              minWidth: '5.5rem',
              boxSizing: 'border-box',
              minHeight: '2.75rem',
              padding: '0.5rem 0.6rem',
              borderRadius: '0.45rem',
              border: `1px solid ${c.border}`,
              backgroundColor: c.surfaceAlt,
              color: c.text,
              fontSize: '16px',
              fontFamily: 'inherit',
            }}
          >
            <option value="all">All months</option>
            {monthOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {hasNarrowing && (
          <button
            onClick={clearNarrowing}
            style={{
              minHeight: '2.75rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '0.45rem',
              border: `1px solid ${c.border}`,
              backgroundColor: 'transparent',
              color: c.textSecondary,
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter chips with counts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} c={c} label="All" count={counts.all} />
        {[...STATUS_FLOW, 'cancelled' as OrderStatus].map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            c={c}
            label={STATUS_LABEL[s]}
            count={counts[s]}
            dot={STATUS_COLORS[s]}
          />
        ))}
        <FilterChip
          active={filter === 'archived'}
          onClick={() => setFilter('archived')}
          c={c}
          label="Archived"
          count={counts.archived}
          dot={c.textSecondary}
        />
      </div>
      {filter === 'archived' && (
        <p style={{ color: c.textSecondary, fontSize: '0.8rem', margin: '-1.25rem 0 1.75rem' }}>
          Fulfilled or cancelled orders older than {ARCHIVE_AFTER_DAYS} days — kept for audit, out of the working list.
        </p>
      )}

      {loading && <p style={{ color: c.textSecondary }}>Loading…</p>}
      {!loading && visible.length === 0 && (
        <p style={{ color: c.textSecondary, fontSize: '0.9rem' }}>
          {orders.length === 0
            ? 'No orders yet.'
            : hasNarrowing
              ? 'No orders match this search and filter combination.'
              : 'No orders in this status.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {visible.map((o) => {
          const next = nextStatus(o.status);
          const busy = busyId === o.id;
          const needsEta = next === 'paid' && !o.estimatedDelivery;
          return (
            <div
              key={o.id}
              style={{
                padding: '1rem',
                backgroundColor: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: '0.6rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: c.text }}>{o.contactName}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: c.textSecondary, marginTop: '0.25rem' }}>
                    {o.contactEmail}
                    {o.contactPhone ? ` • ${o.contactPhone}` : ''}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: c.text, marginTop: '0.4rem' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: o.deliveryMethod === 'delivery' ? accent : c.textSecondary,
                      }}
                    >
                      {o.deliveryMethod === 'delivery' ? 'Delivery' : 'Self pick-up'}
                    </span>
                    {o.deliveryMethod === 'delivery' && o.deliveryAddress && (
                      <span style={{ color: c.textSecondary }}> — {o.deliveryAddress}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: c.textSecondary, marginTop: '0.25rem' }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: c.text, whiteSpace: 'nowrap' }}>
                  {formatPrice(o.total, 'MYR')}
                </div>
              </div>

              {/* Items */}
              <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: '0.75rem 0 0', borderTop: `1px solid ${c.border}` }}>
                {o.items.map((it, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem', color: c.text, padding: '0.15rem 0' }}>
                    <span>
                      {it.qty}× {it.name}
                      {it.size ? <span style={{ color: c.textSecondary }}> · {it.size}</span> : ''}
                    </span>
                    <span style={{ color: c.textSecondary, whiteSpace: 'nowrap' }}>{formatPrice(it.unitPrice * it.qty, 'MYR')}</span>
                  </li>
                ))}
              </ul>

              {o.note && (
                <div style={{ fontSize: '0.8rem', color: c.textSecondary, marginTop: '0.6rem', fontStyle: 'italic' }}>
                  “{o.note}”
                </div>
              )}

              {/* Estimated delivery (admin-editable) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
                <label htmlFor={`eta-${o.id}`} style={{ fontSize: '0.8rem', color: c.textSecondary }}>
                  Est. delivery:
                </label>
                <input
                  id={`eta-${o.id}`}
                  type="date"
                  defaultValue={o.estimatedDelivery ?? ''}
                  onChange={(e) => saveEta(o.id, e.target.value)}
                  style={{
                    minHeight: '2.5rem',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '0.45rem',
                    border: `1px solid ${c.border}`,
                    backgroundColor: c.background,
                    color: c.text,
                    fontFamily: 'inherit',
                    fontSize: '16px',
                  }}
                />
                {o.estimatedDelivery && (
                  <button
                    onClick={() => saveEta(o.id, '')}
                    style={{ background: 'transparent', border: 'none', color: c.textSecondary, cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', minHeight: '2.5rem' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Actions */}
              {o.status !== 'cancelled' && o.status !== 'fulfilled' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
                  {next && (
                    <button
                      onClick={() => change(o.id, next)}
                      disabled={busy || needsEta}
                      title={needsEta ? 'Set an estimated delivery date first' : undefined}
                      style={{
                        minHeight: '2.75rem',
                        padding: '0.5rem 1.1rem',
                        backgroundColor: c.primary,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.45rem',
                        cursor: busy || needsEta ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        opacity: busy || needsEta ? 0.5 : 1,
                      }}
                    >
                      Mark {STATUS_LABEL[next].toLowerCase()}
                    </button>
                  )}
                  {needsEta && (
                    <span style={{ alignSelf: 'center', fontSize: '0.78rem', color: STATUS_COLORS.cancelled }}>
                      Add an est. delivery date to confirm
                    </span>
                  )}
                  <button
                    onClick={() => change(o.id, 'cancelled')}
                    disabled={busy}
                    style={{
                      minHeight: '2.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      color: c.textSecondary,
                      border: `1px solid ${c.border}`,
                      borderRadius: '0.45rem',
                      cursor: busy ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.15rem 0.55rem',
      borderRadius: '999px',
      backgroundColor: `${STATUS_COLORS[status]}22`,
      color: STATUS_COLORS[status],
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}
  >
    {STATUS_LABEL[status]}
  </span>
);

const FilterChip: React.FC<{
  active: boolean;
  onClick: () => void;
  c: ColorPalette;
  label: string;
  count: number;
  dot?: string;
}> = ({ active, onClick, c, label, count, dot }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      minHeight: '2.75rem',
      padding: '0.45rem 0.95rem',
      borderRadius: '999px',
      fontSize: '0.83rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      border: `1px solid ${active ? c.primary : c.border}`,
      backgroundColor: active ? c.primary : c.surface,
      color: active ? '#fff' : c.textSecondary,
    }}
  >
    {dot && <span aria-hidden="true" style={{ width: '7px', height: '7px', borderRadius: '999px', backgroundColor: dot }} />}
    {label}
    <span style={{ opacity: 0.8 }}>{count}</span>
  </button>
);
