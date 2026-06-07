# Local dev test users (Cognito)

Authentication uses **AWS Cognito**, not Supabase. Create test users through one of the options below.

## Option 1 — Sign up in the app (simplest)

1. Run `npm run dev` with bootstrap/Cognito env configured.
2. Open [http://localhost:3000/auth](http://localhost:3000/auth).
3. Register with email/password or Google/Apple (if configured on the pool).

Ensure the Cognito app client allows:

- `http://localhost:3000/auth/callback`
- `http://127.0.0.1:3000/auth/callback`

## Option 2 — AWS Console

1. Cognito → User pools → your pool → **Users**.
2. **Create user** with email and a temporary password.
3. Sign in locally; complete password change if required.

## Option 3 — AWS CLI (bulk dev users)

Requires IAM permission `cognito-idp:AdminCreateUser`.

```bash
aws cognito-idp admin-create-user \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username "alice.test@udeets.dev" \
  --user-attributes Name=email,Value=alice.test@udeets.dev Name=email_verified,Value=true Name=name,Value="Alice Martin" \
  --temporary-password "ChangeMe-2026!" \
  --message-action SUPPRESS
```

Repeat for additional testers. Users sign in with the temporary password and set a new one on first login.

## Suggested test accounts

| Name | Email |
|------|-------|
| Alice Martin | alice.test@udeets.dev |
| Bob Sharma | bob.test@udeets.dev |
| Carol Chen | carol.test@udeets.dev |

Use distinct emails your team controls. Do not commit real passwords.

## Profile row

On first OAuth/sign-in, `apps/web/app/auth/callback/route.ts` upserts the profile via FastAPI (`POST /api/v1/profiles/me/upsert`). No separate seed script is required for `profiles`.

## Removed script

`scripts/create-mock-users.mjs` (Supabase) was removed. Use this doc instead.
