---
name: Supabase env var confusion in Expo mobile artifacts
description: How to avoid/resolve users pasting the wrong Supabase value (URL vs anon/publishable key) into secrets, and why secret values can't be fixed once set incorrectly via requestEnvVar.
---

When requesting Supabase credentials for a mobile (Expo) artifact via `requestEnvVar`, non-technical users often paste the wrong field (e.g. the `sb_secret_...` or `sb_publishable_...` key into the URL field, or a whole `.env` block instead of a single value). There is no tool-level way to inspect a secret's actual value, delete a secret once created, or overwrite it directly — `deleteEnvVars`/`setEnvVars` only affect plain env vars and will error/no-op if a secret with the same key already exists.

**Why:** Repeatedly re-asking a confused user for "just the URL" can loop many turns without resolving, since the secret store can't be cleaned up programmatically once corrupted.

**How to apply:** If a sibling artifact (e.g. the web app) already has working Supabase credentials (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`), read them directly from that artifact's process env server-side (never print them) and reuse them for the new artifact — either write them to a gitignored `.env` file in the new artifact, and/or inline them into the workflow's dev script env vars (safe since Supabase anon/publishable keys are meant to be public/client-exposed). This avoids depending on the user correctly re-entering values, and sidesteps the fact that a bad secret value can't be overridden once set.
