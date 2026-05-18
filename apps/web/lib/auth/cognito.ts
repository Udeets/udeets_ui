import { getAuthCallbackUrl } from "@/lib/auth/auth-next-cookie";

function required(name: string, value: string | undefined): string {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    throw new Error(`${name} is not configured.`);
  }
  return trimmed;
}

export function getCognitoDomain(): string {
  const value = required(
    "COGNITO_DOMAIN",
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN || process.env.COGNITO_DOMAIN,
  );
  return value.replace(/\/$/, "");
}

export function getCognitoClientId(): string {
  return required(
    "COGNITO_CLIENT_ID",
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || process.env.COGNITO_CLIENT_ID,
  );
}

export function getCognitoRedirectUri(origin?: string): string {
  const configured =
    process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI || process.env.COGNITO_REDIRECT_URI;
  if (configured?.trim()) return configured.trim();
  return getAuthCallbackUrl(origin);
}

export function getCognitoOAuthScopes(): string {
  const configured =
    process.env.NEXT_PUBLIC_COGNITO_OAUTH_SCOPES?.trim() ||
    process.env.COGNITO_OAUTH_SCOPES?.trim();
  return configured || "openid email phone";
}

/** Must match Cognito federated IdP name (User pool → Sign-in → Federated providers). */
export function getCognitoGoogleIdentityProvider(): string {
  return (
    process.env.NEXT_PUBLIC_COGNITO_GOOGLE_IDP?.trim() ||
    process.env.COGNITO_GOOGLE_IDP?.trim() ||
    "Google"
  );
}

/** Must match Cognito federated IdP name (often `SignInWithApple`, not `Apple`). */
export function getCognitoAppleIdentityProvider(): string {
  return (
    process.env.NEXT_PUBLIC_COGNITO_APPLE_IDP?.trim() ||
    process.env.COGNITO_APPLE_IDP?.trim() ||
    "SignInWithApple"
  );
}

export function buildCognitoAuthorizeUrl(options: {
  /** Federated IdP name sent as `identity_provider` (skips Cognito Hosted UI chooser when correct). */
  identityProvider?: string;
  state?: string;
} = {}): string {
  const url = new URL(`${getCognitoDomain()}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getCognitoClientId());
  url.searchParams.set("redirect_uri", getCognitoRedirectUri());
  url.searchParams.set("scope", getCognitoOAuthScopes());
  if (options.identityProvider) {
    url.searchParams.set("identity_provider", options.identityProvider);
  }
  if (options.state) {
    url.searchParams.set("state", options.state);
  }
  return url.toString();
}

export function buildCognitoLogoutUrl(postLogoutRedirectUri: string): string {
  const url = new URL(`${getCognitoDomain()}/logout`);
  url.searchParams.set("client_id", getCognitoClientId());
  url.searchParams.set("logout_uri", postLogoutRedirectUri);
  return url.toString();
}
