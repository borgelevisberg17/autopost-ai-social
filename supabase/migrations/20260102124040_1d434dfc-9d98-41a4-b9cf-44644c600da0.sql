-- Add missing columns to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS brand_voice TEXT,
ADD COLUMN IF NOT EXISTS default_tone TEXT DEFAULT 'Profissional',
ADD COLUMN IF NOT EXISTS default_platform TEXT DEFAULT 'instagram';