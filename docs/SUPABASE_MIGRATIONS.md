# Supabase migrations — Vendora

Database migrations are versioned in `supabase/migrations/` and applied to the production Supabase project by GitHub Actions.

## One-time GitHub configuration

In the repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Personal access token created in the Supabase dashboard |
| `SUPABASE_DB_PASSWORD` | Database password for the linked Supabase project |

The project reference is already defined in `supabase/config.toml` and in the workflow as `ecfxulsjdqcqavbaglwm`.

Never commit these values to the repository, frontend variables, or workflow YAML.

## Automatic deployment

After the secrets are configured:

1. A commit pushed to `main` that changes `supabase/migrations/**` or `supabase/config.toml` starts the **Supabase database migrations** workflow.
2. The runner uses Supabase CLI v2.84.2, targets the project reference in the workflow, previews pending migrations with `supabase db push --remote --dry-run`, and then applies them with `supabase db push --remote --yes`.
3. GitHub Actions reports success or the exact failing step in the workflow run.

A manual run is also available under **Actions → Supabase database migrations → Run workflow**.

The workflow is serialized so two production migration jobs cannot run concurrently. A failed dry-run prevents the apply step.

## Important: first deployment / migration history

This repository already contains historical migrations. Before enabling the first production run, check **Supabase → SQL Editor** or run `supabase migration list --linked` from a trusted local environment after authenticating and targeting the project.

The remote `supabase_migrations.schema_migrations` history must accurately represent migrations already applied to this database. If the database was originally created by Lovable or manual SQL, do not blindly mark every local migration as applied and do not reset the production database. Reconcile the remote migration history against the actual schema and migration contents first. If history is out of sync, the workflow should fail rather than guessing.

Only use `supabase migration repair --status applied <version>` for a migration after independently verifying that its complete SQL effects are already present in production. Record the decision in a reviewed commit or deployment note.

## Current security migration

The migration `20261113000000_security_hardening_public_data.sql` is pending until the workflow successfully applies it. A GitHub commit is not proof that the SQL has reached the remote database.

After deployment, verify the anonymous grants and policies on `public.companies`, and test public order tracking without exposing customer-identifying fields.

## Operational safeguards

- Keep migrations additive and backward-compatible where possible.
- Never edit a migration that has already been applied to production; create a new migration instead.
- Back up production before destructive schema changes.
- Review every SQL migration before merging it into `main`.
- Do not put secrets in migration files.
