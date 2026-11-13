REVOKE ALL ON public.integration_credentials FROM anon,authenticated;
GRANT ALL ON public.integration_credentials TO service_role;