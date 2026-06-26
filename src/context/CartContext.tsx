/**
 * Cart — client-side only.
 *
 * Reserve-only checkout means there's no server cart: items live in React state
 * + a localStorage cache so the cart survives reloads and syncs across tabs.
 * Each line snapshots the product's name + unit price at add-time, so the
 * /cart and order payload don't depend on a re-fetch.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { OrderItem, Product } from '../utils/merch';
import { effectivePrice } from '../utils/merch';

const CART_KEY = 'alpas-cart-v1';

/** A cart line carries enough to render without re-fetching the product. */
export type CartLine = OrderItem & {
  slug: string;
  imageUrl?: string;
  currency: string;
};

interface CartContextType {
  lines: CartLine[];
  count: number;                 // total quantity across lines
  subtotal: number;
  addItem: (product: Product, opts?: { size?: string; qty?: number }) => void;
  setQty: (productId: string, size: string | undefined, qty: number) => void;
  removeItem: (productId: string, size?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const readCache = (): CartLine[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
};

/** Lines for the same product+size collapse into one — this is the match key. */
const sameLine = (a: { productId: string; size?: string }, b: { productId: string; size?: string }) =>
  a.productId === b.productId && (a.size ?? '') === (b.size ?? '');

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lines, setLines] = useState<CartLine[]>(readCache);

  // Persist + notify other tabs.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines]);

  // Cross-tab sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setLines(readCache());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addItem = useCallback<CartContextType['addItem']>((product, opts) => {
    const size = opts?.size;
    const qty = Math.max(1, opts?.qty ?? 1);
    setLines((prev) => {
      const existing = prev.find((l) => sameLine(l, { productId: product.id, size }));
      if (existing) {
        return prev.map((l) =>
          sameLine(l, { productId: product.id, size }) ? { ...l, qty: l.qty + qty } : l,
        );
      }
      const line: CartLine = {
        productId: product.id,
        name: product.name,
        size,
        qty,
        unitPrice: effectivePrice(product),
        slug: product.slug,
        imageUrl: product.imageUrl,
        currency: product.currency,
      };
      return [...prev, line];
    });
  }, []);

  const setQty = useCallback<CartContextType['setQty']>((productId, size, qty) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => !sameLine(l, { productId, size }))
        : prev.map((l) => (sameLine(l, { productId, size }) ? { ...l, qty } : l)),
    );
  }, []);

  const removeItem = useCallback<CartContextType['removeItem']>((productId, size) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, { productId, size })));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0), [lines]);

  const value = useMemo(
    () => ({ lines, count, subtotal, addItem, setQty, removeItem, clear }),
    [lines, count, subtotal, addItem, setQty, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
