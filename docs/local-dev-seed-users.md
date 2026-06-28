# Local dev test users (Google OAuth)

Authentication uses **Google OAuth**. Sign in with any Google account you control.

## Option 1 — Sign in via the app (simplest)

1. Run `npm run dev` with Google OAuth env configured (see [local-dev-bootstrap.md](local-dev-bootstrap.md)).
2. Open [http://localhost:3000/auth](http://localhost:3000/auth).
3. Click **Continue with Google**.

Ensure your Google OAuth client allows:

- `http://localhost:3000/auth/callback`
- `http://127.0.0.1:3000/auth/callback`

## Profile row

On first Google sign-in, the API creates `users`, `oauth_accounts`, and `profiles` rows automatically (`full_name`, `email`, `avatar_url` from Google).

## Suggested test flow

1. Sign in with a personal Google account.
2. Confirm you land on `/dashboard`.
3. Check `profiles` in Postgres for your name and email.
