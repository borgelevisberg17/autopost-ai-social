-- Add new columns to business_settings for social media and preferences
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS auto_hashtags BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS include_emojis BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS include_cta BOOLEAN DEFAULT true;