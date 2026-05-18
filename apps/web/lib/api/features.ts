const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function envTrue(value: string | undefined): boolean {
  if (!value) return false;
  return TRUE_VALUES.has(value.toLowerCase());
}

export function useFastApiGeo(): boolean {
  return envTrue(process.env.NEXT_PUBLIC_USE_FASTAPI_GEO);
}

export function useFastApiHubs(): boolean {
  return envTrue(process.env.NEXT_PUBLIC_USE_FASTAPI_HUBS);
}

export function useFastApiMembers(): boolean {
  return envTrue(process.env.NEXT_PUBLIC_USE_FASTAPI_MEMBERS);
}

export function useFastApiInvites(): boolean {
  return envTrue(process.env.NEXT_PUBLIC_USE_FASTAPI_INVITES);
}
