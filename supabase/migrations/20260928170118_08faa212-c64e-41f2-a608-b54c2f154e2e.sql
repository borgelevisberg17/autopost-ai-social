REVOKE EXECUTE ON FUNCTION public.add_company_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restock_cancelled_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_company_admin(uuid, uuid) FROM PUBLIC, anon;