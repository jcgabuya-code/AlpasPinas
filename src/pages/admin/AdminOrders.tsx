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

type Props = { showToast: ShowToast; c: ColorPalette };

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'paid', 'fulfilled'];
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#0ea5e9',
  paid: '#8b5cf6',
  fulfilled: '#16a34a',
  cancelled: '#ef4444',
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

/** Next status in the flow, or null at the end. */
const nextStatus = (s: OrderStatus): OrderStatus | null => {
  const i = STATUS_FLOW.indexOf(s);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
};

export const AdminOrders: React.FC<Props> = ({ showToast, c }) => {
  const [orders, setOrders] = useState<MerchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

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

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: orders.length };
    for (const s of [...STATUS_FLOW, 'cancelled' as OrderStatus]) m[s] = orders.filter((o) => o.status === s).length;
    return m;
  }, [orders]);

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

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
        Reservations from the shop. Move each through the flow as you confirm and collect payment.
      </p>

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
      </div>

      {loading && <p style={{ color: c.textSecondary }}>Loading…</p>}
      {!loading && visible.length === 0 && (
        <p style={{ color: c.textSecondary, fontSize: '0.9rem' }}>
          {orders.length === 0 ? 'No orders yet.' : 'No orders in this status.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {visible.map((o) => {
          const next = nextStatus(o.status);
          const busy = busyId === o.id;
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
                        color: o.deliveryMethod === 'delivery' ? c.primary : c.textSecondary,
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
                      disabled={busy}
                      style={{
                        minHeight: '2.75rem',
                        padding: '0.5rem 1.1rem',
                        backgroundColor: c.primary,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.45rem',
                        cursor: busy ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      Mark {STATUS_LABEL[next].toLowerCase()}
                    </button>
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
