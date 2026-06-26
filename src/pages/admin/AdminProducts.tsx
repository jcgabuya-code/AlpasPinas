import React, { useEffect, useState } from 'react';
import { type ColorPalette } from '../../styles/colors';
import { type ShowToast } from '../Admin';
import {
  fetchAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductFlag,
  slugify,
  formatPrice,
  effectivePrice,
  type Product,
  type ProductInput,
} from '../../utils/merch';

type Props = { showToast: ShowToast; c: ColorPalette };

type FormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  imageUrl: string;
  images: string; // newline/comma separated
  sizes: string; // comma separated
  stock: string; // '' = unlimited
  isActive: boolean;
  isFeatured: boolean;
  promoLabel: string;
  promoPrice: string;
  sortOrder: string;
};

const emptyForm: FormState = {
  name: '', slug: '', description: '', price: '', currency: 'MYR', category: '',
  imageUrl: '', images: '', sizes: '', stock: '', isActive: true, isFeatured: false,
  promoLabel: '', promoPrice: '', sortOrder: '0',
};

const toForm = (p: Product): FormState => ({
  name: p.name,
  slug: p.slug,
  description: p.description ?? '',
  price: String(p.price),
  currency: p.currency,
  category: p.category ?? '',
  imageUrl: p.imageUrl ?? '',
  images: p.images.join('\n'),
  sizes: p.sizes.join(', '),
  stock: p.stock == null ? '' : String(p.stock),
  isActive: p.isActive,
  isFeatured: p.isFeatured,
  promoLabel: p.promoLabel ?? '',
  promoPrice: p.promoPrice == null ? '' : String(p.promoPrice),
  sortOrder: String(p.sortOrder),
});

const splitList = (s: string): string[] =>
  s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);

export const AdminProducts: React.FC<Props> = ({ showToast, c }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setProducts(await fetchAllProducts());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId('new');
  };
  const openEdit = (p: Product) => {
    setForm(toForm(p));
    setEditingId(p.id);
  };
  const cancel = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim()) return showToast('Name is required.', 'error');
    if (Number.isNaN(price) || price < 0) return showToast('Enter a valid price.', 'error');

    const input: ProductInput = {
      name: form.name.trim(),
      slug: (form.slug.trim() || slugify(form.name)),
      description: form.description.trim() || undefined,
      price,
      currency: form.currency.trim() || 'MYR',
      category: form.category.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      images: splitList(form.images),
      sizes: splitList(form.sizes),
      stock: form.stock.trim() === '' ? undefined : Number(form.stock),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      promoLabel: form.promoLabel.trim() || undefined,
      promoPrice: form.promoPrice.trim() === '' ? undefined : Number(form.promoPrice),
      sortOrder: Number(form.sortOrder) || 0,
    };

    setSaving(true);
    try {
      if (editingId === 'new') {
        await createProduct(input);
        showToast('Product created.', 'success');
      } else if (editingId) {
        await updateProduct(editingId, input);
        showToast('Product updated.', 'success');
      }
      cancel();
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save the product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (p: Product, field: 'is_active' | 'is_featured') => {
    setBusyId(p.id);
    try {
      await setProductFlag(p.id, field, field === 'is_active' ? !p.isActive : !p.isFeatured);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await deleteProduct(id);
      showToast('Product deleted.', 'success');
      setConfirmDelete(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: '2rem 1.5rem 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            color: c.text,
            margin: 0,
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
        >
          SHOP PRODUCTS
        </h1>
        {editingId === null && (
          <button
            onClick={openNew}
            style={{
              minHeight: '2.75rem',
              padding: '0.55rem 1.1rem',
              backgroundColor: c.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 700,
            }}
          >
            + New product
          </button>
        )}
      </div>
      <p style={{ color: c.textSecondary, fontSize: '0.9rem', margin: '0 0 2rem' }}>
        Add gear, set prices and promos, and control what shows in the shop.
      </p>

      {/* Form */}
      {editingId !== null && (
        <form
          onSubmit={submit}
          style={{
            backgroundColor: c.surface,
            border: `1px solid ${c.primary}55`,
            borderRadius: '0.7rem',
            padding: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: c.text, margin: '0 0 1rem' }}>
            {editingId === 'new' ? 'New product' : 'Edit product'}
          </h2>

          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
            <Field label="Name" c={c}>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} style={inp(c)} required />
            </Field>
            <Field label="Slug (URL)" c={c} hint="Leave blank to auto-generate from name">
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={form.name ? slugify(form.name) : 'auto'} style={inp(c)} />
            </Field>
            <Field label="Category" c={c}>
              <input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Apparel" style={inp(c)} />
            </Field>
            <Field label="Price" c={c}>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} style={inp(c)} required />
            </Field>
            <Field label="Currency" c={c}>
              <input value={form.currency} onChange={(e) => set('currency', e.target.value)} style={inp(c)} />
            </Field>
            <Field label="Stock" c={c} hint="Blank = unlimited">
              <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="∞" style={inp(c)} />
            </Field>
            <Field label="Promo label" c={c} hint="e.g. LIMITED DROP">
              <input value={form.promoLabel} onChange={(e) => set('promoLabel', e.target.value)} style={inp(c)} />
            </Field>
            <Field label="Promo price" c={c} hint="Sale price; blank = none">
              <input type="number" min="0" step="0.01" value={form.promoPrice} onChange={(e) => set('promoPrice', e.target.value)} style={inp(c)} />
            </Field>
            <Field label="Sort order" c={c}>
              <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} style={inp(c)} />
            </Field>
            <Field label="Sizes" c={c} hint="Comma-separated, e.g. S, M, L">
              <input value={form.sizes} onChange={(e) => set('sizes', e.target.value)} style={inp(c)} />
            </Field>
            <Field label="Main image URL" c={c} hint="e.g. /shop/shirt-model1.png">
              <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} style={inp(c)} />
            </Field>
          </div>

          <div style={{ marginTop: '0.85rem' }}>
            <Field label="Gallery images" c={c} hint="One per line (or comma-separated)">
              <textarea value={form.images} onChange={(e) => set('images', e.target.value)} rows={3} style={{ ...inp(c), resize: 'vertical' }} />
            </Field>
            <Field label="Description" c={c}>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} style={{ ...inp(c), resize: 'vertical' }} />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', margin: '0.5rem 0 1.25rem' }}>
            <Check label="Active (visible in shop)" checked={form.isActive} onChange={(v) => set('isActive', v)} c={c} />
            <Check label="Featured (spotlight + promo bar)" checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} c={c} />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                minHeight: '2.6rem',
                padding: '0.6rem 1.4rem',
                backgroundColor: c.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : editingId === 'new' ? 'Create product' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={cancel}
              style={{
                minHeight: '2.6rem',
                padding: '0.6rem 1.2rem',
                backgroundColor: 'transparent',
                color: c.text,
                border: `1px solid ${c.border}`,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading && <p style={{ color: c.textSecondary }}>Loading…</p>}
      {!loading && products.length === 0 && (
        <p style={{ color: c.textSecondary, fontSize: '0.9rem' }}>No products yet — add your first above.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {products.map((p) => {
          const busy = busyId === p.id;
          const hasPromo = p.promoPrice != null && p.promoPrice < p.price;
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.85rem',
                backgroundColor: c.surface,
                border: `1px solid ${p.isActive ? c.border : `${c.border}`}`,
                borderRadius: '0.6rem',
                opacity: p.isActive ? 1 : 0.6,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: c.surfaceAlt, flexShrink: 0 }}>
                {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />}
              </div>

              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: c.text }}>{p.name}</span>
                  {p.isFeatured && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: c.sun, border: `1px solid ${c.sun}`, borderRadius: '999px', padding: '0.05rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Featured
                    </span>
                  )}
                  {!p.isActive && <span style={{ fontSize: '0.7rem', color: c.textSecondary }}>(hidden)</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: c.textSecondary, marginTop: '0.2rem' }}>
                  {p.category ? `${p.category} · ` : ''}
                  <span style={{ color: hasPromo ? c.sun : c.textSecondary, fontWeight: hasPromo ? 700 : 400 }}>
                    {formatPrice(effectivePrice(p), p.currency)}
                  </span>
                  {hasPromo && <span style={{ textDecoration: 'line-through', marginLeft: '0.35rem' }}>{formatPrice(p.price, p.currency)}</span>}
                  {p.stock != null && ` · ${p.stock} in stock`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <SmallBtn label={p.isActive ? 'Hide' : 'Show'} onClick={() => toggle(p, 'is_active')} disabled={busy} c={c} />
                <SmallBtn label={p.isFeatured ? 'Unfeature' : 'Feature'} onClick={() => toggle(p, 'is_featured')} disabled={busy} c={c} />
                <SmallBtn label="Edit" onClick={() => openEdit(p)} disabled={busy} c={c} primary />
                {confirmDelete === p.id ? (
                  <>
                    <SmallBtn label="Confirm" onClick={() => remove(p.id)} disabled={busy} c={c} danger />
                    <SmallBtn label="No" onClick={() => setConfirmDelete(null)} disabled={busy} c={c} />
                  </>
                ) : (
                  <SmallBtn label="Delete" onClick={() => setConfirmDelete(p.id)} disabled={busy} c={c} danger />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const inp = (c: ColorPalette): React.CSSProperties => ({
  width: '100%',
  padding: '0.6rem 0.7rem',
  borderRadius: '0.45rem',
  border: `1px solid ${c.border}`,
  backgroundColor: c.background,
  color: c.text,
  fontFamily: 'inherit',
  fontSize: '16px',
  boxSizing: 'border-box',
});

const Field: React.FC<{ label: string; c: ColorPalette; hint?: string; children: React.ReactNode }> = ({ label, c, hint, children }) => (
  <label style={{ display: 'block' }}>
    <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: c.text, marginBottom: '0.3rem' }}>{label}</span>
    {children}
    {hint && <span style={{ display: 'block', fontSize: '0.7rem', color: c.textSecondary, marginTop: '0.25rem' }}>{hint}</span>}
  </label>
);

const Check: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; c: ColorPalette }> = ({ label, checked, onChange, c }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: c.text, minHeight: '2.5rem' }}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: '1.1rem', height: '1.1rem', accentColor: c.primary }} />
    {label}
  </label>
);

const SmallBtn: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  c: ColorPalette;
  primary?: boolean;
  danger?: boolean;
}> = ({ label, onClick, disabled, c, primary, danger }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      minHeight: '2.75rem',
      padding: '0.45rem 0.9rem',
      backgroundColor: primary ? c.primary : 'transparent',
      color: primary ? '#fff' : danger ? '#ef4444' : c.textSecondary,
      border: primary ? 'none' : `1px solid ${danger ? '#ef444455' : c.border}`,
      borderRadius: '0.4rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '0.8rem',
      fontWeight: 600,
      opacity: disabled ? 0.6 : 1,
    }}
  >
    {label}
  </button>
);
