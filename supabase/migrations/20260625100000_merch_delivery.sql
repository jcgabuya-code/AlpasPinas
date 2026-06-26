-- ============================================================================
-- AlpasPinas — merch_orders delivery fields
-- ============================================================================
-- Adds fulfilment details to shop orders:
--   * delivery_method     'pickup' (self pick-up) or 'delivery'
--   * delivery_address     required when method = 'delivery'
--   * estimated_delivery   target date; set/edited by admins
--
-- Idempotent (add column if not exists + guarded constraint) so it re-applies
-- cleanly. RLS is unchanged: the public insert policy still only checks
-- status='pending', so buyers can set method/address on submit; the admin
-- update policy already covers estimated_delivery.
-- ============================================================================

alter table public.merch_orders
  add column if not exists delivery_method text not null default 'pickup'
    check (delivery_method in ('pickup', 'delivery'));

alter table public.merch_orders
  add column if not exists delivery_address text;

alter table public.merch_orders
  add column if not exists estimated_delivery date;

-- Cross-field integrity: a delivery order must carry a non-empty address.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'merch_orders_delivery_addr_chk'
  ) then
    alter table public.merch_orders
      add constraint merch_orders_delivery_addr_chk
      check (
        delivery_method <> 'delivery'
        or (delivery_address is not null and length(btrim(delivery_address)) > 0)
      );
  end if;
end $$;
