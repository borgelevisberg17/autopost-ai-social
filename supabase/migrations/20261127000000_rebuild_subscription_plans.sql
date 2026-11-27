-- Rebuild subscription_plans with market-calibrated pricing and limits
-- Preserves existing plan IDs (free, basic, pro) for full compatibility with companies, grants, and coupons,
-- and adds an enterprise tier for high-volume merchants.

INSERT INTO public.subscription_plans (
  id,
  name,
  monthly_price,
  currency,
  product_limit,
  monthly_ai_limit,
  features,
  enabled,
  updated_at
)
VALUES
  (
    'free',
    'Starter Free',
    0,
    'USD',
    25,
    15,
    ARRAY['marketing'],
    true,
    now()
  ),
  (
    'basic',
    'Essencial',
    39,
    'USD',
    500,
    400,
    ARRAY['marketing', 'analytics'],
    true,
    now()
  ),
  (
    'pro',
    'Pro Autónoma',
    99,
    'USD',
    5000,
    3000,
    ARRAY['marketing', 'analytics', 'sales', 'whatsapp'],
    true,
    now()
  ),
  (
    'enterprise',
    'Enterprise',
    NULL,
    'USD',
    25000,
    15000,
    ARRAY['marketing', 'analytics', 'sales', 'whatsapp'],
    true,
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  currency = EXCLUDED.currency,
  product_limit = EXCLUDED.product_limit,
  monthly_ai_limit = EXCLUDED.monthly_ai_limit,
  features = EXCLUDED.features,
  enabled = EXCLUDED.enabled,
  updated_at = now();
