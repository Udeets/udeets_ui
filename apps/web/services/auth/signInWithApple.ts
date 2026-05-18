import {
  buildCognitoAuthorizeUrl,
  getCognitoAppleIdentityProvider,
} from "@/lib/auth/cognito";

export async function signInWithApple() {
  if (typeof window === "undefined") {
    throw new Error("Apple sign-in must be started from the browser.");
  }
  const url = buildCognitoAuthorizeUrl({
    identityProvider: getCognitoAppleIdentityProvider(),
  });
  window.location.assign(url);
}
