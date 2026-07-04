/**
 * Merch store — Supabase backed.
 *
 * Two tables back this module (see supabase/migrations/20260625000000_merch.sql):
 *   * products      — the catalog. RLS lets anyone read ACTIVE products; only
 *                     admins write. `isFeatured` + promo fields drive the home
 *                     featured section and the site-wide announcement bar.
 *   * merch_orders  — inquiry / reserve orders (NO online payment yet). Anyone
 *                     may submit a `pending` order (bare insert); the buyer +
 *                     admins read it; admins move it through the status flow.
 *
 * Checkout is reserve-only: submitting an order records the request and the team
 * arranges payment manually.
 *
 * If Supabase isn't configured the module runs in a degraded LOCAL-ONLY mode:
 * products come back empty (nothing to sell without a backend) and orders are
 * cached to localStorage so dev/UI still works without a project.
 */
import { supabase, isSupabaseConfigured } from './supabase';

const isRemote = isSupabaseConfigured;

const ORDERS_CACHE_KEY = 'alpas-merch-orders-v1';

/* ------------------------------- types -------------------------------- */

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;          // e.g. 'MYR'
  category?: string;
  imageUrl?: string;
  images: string[];          // extra photos
  sizes: string[];           // [] if not size-based
  stock?: number;            // undefined = unlimited; 0 = sold out
  isActive: boolean;
  isFeatured: boolean;
  promoLabel?: string;       // e.g. "LIMITED DROP"
  promoPrice?: number;       // sale price; show `price` struck-through when set
  sortOrder: number;
  createdAt: string;
};

export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'fulfilled' | 'cancelled';

export type DeliveryMethod = 'pickup' | 'delivery';

/** One line in an order — a snapshot so later catalog edits don't rewrite history. */
export type OrderItem = {
  productId: string;
  name: string;
  size?: string;
  qty: number;
  unitPrice: number;
};

export type MerchOrder = {
  id: string;
  userId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  items: OrderItem[];
  total: number;
  note?: string;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  estimatedDelivery?: string; // 'YYYY-MM-DD', set by admin
  createdAt: string;
  updatedAt: string;
};

/** Payload for a new order (server fills id / status / createdAt / userId). */
export type NewOrder = {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  items: OrderItem[];
  note?: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
};

/* --------------------------- DB row <-> type --------------------------- */

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  currency: string;
  category: string | null;
  image_url: string | null;
  images: string[] | null;
  sizes: string[] | null;
  stock: number | null;
  is_active: boolean;
  is_featured: boolean;
  promo_label: string | null;
  promo_price: number | string | null;
  sort_order: number;
  created_at: string;
};

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  description: r.description ?? undefined,
  price: Number(r.price),
  currency: r.currency,
  category: r.category ?? undefined,
  imageUrl: r.image_url ?? undefined,
  images: Array.isArray(r.images) ? r.images : [],
  sizes: Array.isArray(r.sizes) ? r.sizes : [],
  stock: r.stock ?? undefined,
  isActive: r.is_active,
  isFeatured: r.is_featured,
  promoLabel: r.promo_label ?? undefined,
  promoPrice: r.promo_price == null ? undefined : Number(r.promo_price),
  sortOrder: r.sort_order,
  createdAt: r.created_at,
});

type OrderRow = {
  id: string;
  user_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  items: OrderItem[] | null;
  total: number | string;
  note: string | null;
  status: OrderStatus;
  delivery_method: DeliveryMethod | null;
  delivery_address: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string | null;
};

const toOrder = (r: OrderRow): MerchOrder => ({
  id: r.id,
  userId: r.user_id ?? undefined,
  contactName: r.contact_name,
  contactEmail: r.contact_email,
  contactPhone: r.contact_phone ?? undefined,
  items: Array.isArray(r.items) ? r.items : [],
  total: Number(r.total),
  note: r.note ?? undefined,
  status: r.status,
  deliveryMethod: r.delivery_method ?? 'pickup',
  deliveryAddress: r.delivery_address ?? undefined,
  estimatedDelivery: r.estimated_delivery ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at ?? r.created_at,
});

/* ------------------------------ products ------------------------------ */

/**
 * All purchasable products, ordered by sort_order then name. RLS returns only
 * active rows to the public (admins see all). Empty array in local-only mode or
 * on error.
 */
export const fetchProducts = async (): Promise<Product[]> => {
  if (!isRemote) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error || !data) return [];
  return (data as ProductRow[]).map(toProduct);
};

/** A single active product by slug, or null if not found. */
export const fetchProduct = async (slug: string): Promise<Product | null> => {
  if (!isRemote) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return toProduct(data as ProductRow);
};

/** Featured products for the home section + announcement bar. */
export const fetchFeaturedProducts = async (): Promise<Product[]> => {
  if (!isRemote) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return (data as ProductRow[]).map(toProduct);
};

/* --------------------------- products (admin) -------------------------- */

/** Editable product fields (admin forms). */
export type ProductInput = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  imageUrl?: string;
  images: string[];
  sizes: string[];
  stock?: number; // undefined = unlimited
  isActive: boolean;
  isFeatured: boolean;
  promoLabel?: string;
  promoPrice?: number;
  sortOrder: number;
};

const toProductRow = (p: ProductInput) => ({
  name: p.name,
  slug: p.slug,
  description: p.description ?? null,
  price: p.price,
  currency: p.currency,
  category: p.category ?? null,
  image_url: p.imageUrl ?? null,
  images: p.images,
  sizes: p.sizes,
  stock: p.stock ?? null,
  is_active: p.isActive,
  is_featured: p.isFeatured,
  promo_label: p.promoLabel ?? null,
  promo_price: p.promoPrice ?? null,
  sort_order: p.sortOrder,
});

/** ALL products incl. inactive — admin only (RLS returns everything to admins). */
export const fetchAllProducts = async (): Promise<Product[]> => {
  if (!isRemote) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error || !data) return [];
  return (data as ProductRow[]).map(toProduct);
};

export const createProduct = async (input: ProductInput): Promise<void> => {
  const { error } = await supabase.from('products').insert(toProductRow(input));
  if (error) {
    if (/duplicate|unique/i.test(error.message)) throw new Error('A product with that slug already exists.');
    throw new Error(error.message || 'Could not create the product.');
  }
};

export const updateProduct = async (id: string, input: ProductInput): Promise<void> => {
  const { error } = await supabase.from('products').update(toProductRow(input)).eq('id', id);
  if (error) {
    if (/duplicate|unique/i.test(error.message)) throw new Error('A product with that slug already exists.');
    throw new Error(error.message || 'Could not update the product.');
  }
};

/** Quick field flip (active/featured) without a full form submit. */
export const setProductFlag = async (
  id: string,
  field: 'is_active' | 'is_featured',
  value: boolean,
): Promise<void> => {
  const { error } = await supabase.from('products').update({ [field]: value }).eq('id', id);
  if (error) throw new Error(error.message || 'Could not update the product.');
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Could not delete the product.');
};

/** Slugify a name for the slug field (admin convenience). */
export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ------------------------------- orders ------------------------------- */

/** The effective unit price for a product (promo price wins when present). */
export const effectivePrice = (p: Pick<Product, 'price' | 'promoPrice'>): number =>
  p.promoPrice != null ? p.promoPrice : p.price;

/** Sum an order's line items. */
export const orderTotal = (items: OrderItem[]): number =>
  items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);

const cachedOrders = (): MerchOrder[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as MerchOrder[]) : [];
  } catch {
    return [];
  }
};

const writeOrderCache = (orders: MerchOrder[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(orders));
};

/**
 * Submit a reserve/inquiry order. Anyone may submit (RLS forces status =
 * 'pending'); a logged-in user's id is filled by the DB default. Uses a BARE
 * insert (no .select()) because the public INSERT policy has no matching SELECT
 * for non-owners — same pattern as the public application form.
 */
export const submitOrder = async (order: NewOrder): Promise<void> => {
  const total = orderTotal(order.items);
  if (!isRemote) {
    const local: MerchOrder = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      items: order.items,
      total,
      note: order.note,
      status: 'pending',
      deliveryMethod: order.deliveryMethod,
      deliveryAddress: order.deliveryAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeOrderCache([...cachedOrders(), local]);
    return;
  }
  const { error } = await supabase.from('merch_orders').insert({
    contact_name: order.contactName,
    contact_email: order.contactEmail,
    contact_phone: order.contactPhone ?? null,
    items: order.items,
    total,
    note: order.note ?? null,
    status: 'pending',
    delivery_method: order.deliveryMethod,
    delivery_address: order.deliveryMethod === 'delivery' ? (order.deliveryAddress ?? null) : null,
  });
  if (error) {
    throw new Error(error.message || 'Could not submit your order. Please try again.');
  }
};

/**
 * The signed-in user's OWN orders (newest first), for the customer-facing
 * order-tracking page. Explicitly filters by user_id so an admin sees only
 * their own here (the admin board uses fetchOrders for everything).
 */
export const fetchMyOrders = async (): Promise<MerchOrder[]> => {
  if (!isRemote) return cachedOrders().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('merch_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as OrderRow[]).map(toOrder);
};

/** Orders visible to the caller (own rows; admins see all). Admin order board. */
export const fetchOrders = async (): Promise<MerchOrder[]> => {
  if (!isRemote) return cachedOrders();
  const { data, error } = await supabase
    .from('merch_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as OrderRow[]).map(toOrder);
};

/** Move an order to a new status. Admin only (enforced by RLS). */
export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
  if (!isRemote) {
    writeOrderCache(
      cachedOrders().map((o) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o)),
    );
    return;
  }
  const { error } = await supabase.from('merch_orders').update({ status }).eq('id', id);
  if (error) throw new Error(error.message || 'Could not update the order.');
};

/** Set/clear the estimated delivery date ('YYYY-MM-DD' or null). Admin only. */
export const setOrderEstimatedDelivery = async (id: string, date: string | null): Promise<void> => {
  if (!isRemote) {
    writeOrderCache(
      cachedOrders().map((o) => (o.id === id ? { ...o, estimatedDelivery: date ?? undefined } : o)),
    );
    return;
  }
  const { error } = await supabase
    .from('merch_orders')
    .update({ estimated_delivery: date })
    .eq('id', id);
  if (error) throw new Error(error.message || 'Could not update the delivery date.');
};

/* ------------------------------ helpers ------------------------------- */

/** Format a price with its currency, e.g. formatPrice(80, 'MYR') -> "RM 80". */
export const formatPrice = (amount: number, currency = 'MYR'): string => {
  const symbol = currency === 'MYR' ? 'RM' : currency === 'PHP' ? '₱' : `${currency} `;
  const n = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${symbol}${symbol.endsWith(' ') ? '' : ' '}${n}`.replace('  ', ' ');
};

/** Is a product purchasable right now? (active + has stock or unlimited). */
export const inStock = (p: Pick<Product, 'stock'>): boolean =>
  p.stock === undefined || p.stock > 0;
