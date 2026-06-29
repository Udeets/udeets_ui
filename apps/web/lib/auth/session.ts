export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationComplete: boolean;
  authMethods: string[];
  oauthProviders: string[];
  user_metadata: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string | null;
  expires_at: number | null;
  user: AuthUser;
};

export function buildSessionFromAuthMe(me: {
  id: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  verificationComplete?: boolean;
  authMethods?: string[];
  oauthProviders?: string[];
}): AuthSession {
  const fullName = me.fullName ?? null;
  return {
    access_token: null,
    expires_at: null,
    user: {
      id: me.id,
      email: me.email ?? null,
      phone: me.phone ?? null,
      fullName,
      avatarUrl: me.avatarUrl ?? null,
      emailVerified: Boolean(me.emailVerified),
      phoneVerified: Boolean(me.phoneVerified),
      verificationComplete: Boolean(me.verificationComplete),
      authMethods: me.authMethods ?? [],
      oauthProviders: me.oauthProviders ?? [],
      user_metadata: {
        full_name: fullName ?? "",
        avatar_url: me.avatarUrl ?? "",
      },
    },
  };
}

/** @deprecated JWT is HttpOnly; use fetchAuthMe() instead of reading cookies client-side. */
export function buildSessionFromToken(_accessToken: string | null): AuthSession | null {
  return null;
}

/** @deprecated Use buildSessionFromAuthMe */
export function buildSessionFromTokens(
  accessToken: string | null,
  _idToken?: string | null,
): AuthSession | null {
  return buildSessionFromToken(accessToken);
}
