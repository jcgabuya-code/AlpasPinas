import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { colors, type ColorPalette } from '../styles/colors';
import { fetchMyOrders, formatPrice, type MerchOrder, type OrderStatus } from '../utils/merch';

// The forward fulfilment path: reserve -> confirm availability & collect
// payment -> hand over. 'confirmed' is a legacy status from an older 4-step
// flow; normalizeStatus folds it into 'paid' so any old rows still render.
const FLOW: OrderStatus[] = ['pending', 'paid', 'fulfilled'];
const STEP_LABEL: Record<OrderStatus, string> = {
  pending: 'Reserved',
  confirmed: 'Confirmed & Paid',
  paid: 'Confirmed & Paid',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};
const normalizeStatus = (status: OrderStatus): OrderStatus => (status === 'confirmed' ? 'paid' : status);

const longDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

export const MyOrders: React.FC = () => {
  const { theme, brand } = useTheme();
  const c = colors[brand][theme];
  const [orders, setOrders] = useState<MerchOrder[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchMyOrders().then((o) => {
      if (active) setOrders(o);
    });
    return () => {
      active = false;
    };
  }, []);

  const { active, history } = useMemo(() => {
    const list = orders ?? [];
    return {
      active: list.filter((o) => o.status !== 'fulfilled' && o.status !== 'cancelled'),
      history: list.filter((o) => o.status === 'fulfilled' || o.status === 'cancelled'),
    };
  }, [orders]);

  return (
    <section style={{ padding: '2.5rem 1.5rem 5rem', backgroundColor: c.background, minHeight: '60vh' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <Link to="/shop" style={{ display: 'inline-block', color: c.textSecondary, textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          ← Back to the shop
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', color: c.text, margin: '0 0 0.5rem', letterSpacing: '0.02em' }}>
          MY <span style={{ color: c.primary }}>ORDERS</span>
        </h1>
        <p style={{ color: c.textSecondary, fontSize: '1rem', margin: '0 0 2rem', lineHeight: 1.6 }}>
          Track your reservations and see past orders. We'll reach out by email as each one moves along.
        </p>

        {orders === null ? (
          <div aria-hidden="true" style={{ height: '8rem', borderRadius: '0.85rem', backgroundColor: c.surface, border: `1px solid ${c.border}` }} />
        ) : orders.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: c.surface, borderRadius: '0.85rem', border: `1px dashed ${c.border}` }}>
            <div style={{ fontWeight: 600, color: c.text, marginBottom: '0.35rem' }}>No orders yet</div>
            <div style={{ fontSize: '0.85rem', color: c.textSecondary, marginBottom: '1.25rem' }}>
              Reserve some gear and it'll show up here.
            </div>
            <Link to="/shop" style={{ display: 'inline-block', background: c.primary, color: '#fff', textDecoration: 'none', padding: '0.7rem 1.4rem', borderRadius: '0.6rem', fontWeight: 700 }}>
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div style={{ marginBottom: history.length > 0 ? '2.5rem' : 0 }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: c.text, marginBottom: '1rem' }}>Active</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {active.map((o) => (
                    <OrderCard key={o.id} order={o} c={c} />
                  ))}
                </div>
              </div>
            )}
            {history.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: c.text, marginBottom: '1rem' }}>History</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {history.map((o) => (
                    <OrderCard key={o.id} order={o} c={c} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const OrderCard: React.FC<{ order: MerchOrder; c: ColorPalette }> = ({ order, c }) => {
  const cancelled = order.status === 'cancelled';
  const itemCount = order.items.reduce((n, i) => n + i.qty, 0);

  return (
    <div style={{ padding: '1.1rem', backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'baseline', marginBottom: '0.85rem' }}>
        <div style={{ fontSize: '0.8rem', color: c.textSecondary }}>
          Placed {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {itemCount} item{itemCount === 1 ? '' : 's'}
        </div>
        <div style={{ fontWeight: 700, color: c.text }}>{formatPrice(order.total, 'MYR')}</div>
      </div>

      {/* Status */}
      {cancelled ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.7rem',
            borderRadius: '999px',
            backgroundColor: '#ef444422',
            color: '#ef4444',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '0.85rem',
          }}
        >
          Cancelled
        </div>
      ) : (
        <StatusTracker status={order.status} c={c} />
      )}

      {/* Fulfilment + ETA */}
      <div style={{ fontSize: '0.83rem', color: c.textSecondary, marginTop: '0.85rem', lineHeight: 1.6 }}>
        <span style={{ color: c.text, fontWeight: 600 }}>
          {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Self pick-up'}
        </span>
        {order.deliveryMethod === 'delivery' && order.deliveryAddress && <> · {order.deliveryAddress}</>}
        {order.estimatedDelivery && (
          <>
            {' '}· Est. {order.deliveryMethod === 'delivery' ? 'delivery' : 'ready'} {longDate(order.estimatedDelivery)}
          </>
        )}
      </div>

      {/* Items */}
      <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: '0.75rem 0 0', borderTop: `1px solid ${c.border}` }}>
        {order.items.map((it, i) => (
          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem', color: c.text, padding: '0.15rem 0' }}>
            <span>
              {it.qty}× {it.name}
              {it.size ? <span style={{ color: c.textSecondary }}> · {it.size}</span> : ''}
            </span>
            <span style={{ color: c.textSecondary, whiteSpace: 'nowrap' }}>{formatPrice(it.unitPrice * it.qty, 'MYR')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const StatusTracker: React.FC<{ status: OrderStatus; c: ColorPalette }> = ({ status, c }) => {
  const currentIndex = FLOW.indexOf(normalizeStatus(status));
  return (
    <ol
      aria-label="Order status"
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '0.4rem' }}
    >
      {FLOW.map((step, i) => {
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div
              aria-hidden="true"
              style={{
                height: '6px',
                borderRadius: '999px',
                backgroundColor: reached ? c.primary : c.border,
                marginBottom: '0.4rem',
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? c.primary : reached ? c.text : c.textSecondary,
                lineHeight: 1.2,
                display: 'block',
              }}
            >
              {STEP_LABEL[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
};
