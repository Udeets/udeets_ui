import {
  buildCognitoAuthorizeUrl,
  getCognitoGoogleIdentityProvider,
} from "@/lib/auth/cognito";

export async function signInWithGoogle(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Google sign-in must be started from the browser.");
  }

  const url = buildCognitoAuthorizeUrl({
    identityProvider: getCognitoGoogleIdentityProvider(),
  });
  window.location.assign(url);
}
