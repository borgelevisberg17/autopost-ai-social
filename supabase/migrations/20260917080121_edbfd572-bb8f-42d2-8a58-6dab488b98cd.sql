ALTER TABLE public.content_history
  ADD COLUMN IF NOT EXISTS publish_error text,
  ADD COLUMN IF NOT EXISTS publish_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS external_post_id text;

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS auto_publish boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS content_history_due_idx
  ON public.content_history (scheduled_at)
  WHERE status = 'scheduled';