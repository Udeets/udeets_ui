"use client";

import { useSyncExternalStore } from "react";

export const UDEETS_MOCK_LOGGED_IN_KEY = "udeets_mock_logged_in";
export const UDEETS_MOCK_USER_KEY = "udeets_mock_user";
export const DEMO_MOCK_USER_AVATAR_SRC = "/mock/mock-user.jpg";
const MOCK_AUTH_EVENT = "udeets-mock-auth-change";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  location: string;
};

type MockAuthSnapshot = {
  loggedIn: boolean;
  user: MockUser | null;
  homeHref: "/" | "/dashboard";
};

export const DEMO_MOCK_USER: MockUser = {
  id: "demo-user-1",
  name: "Demo User",
  email: "demo@udeets.com",
  role: "Community Member",
  location: "Richmond, VA",
};

const SERVER_SNAPSHOT: MockAuthSnapshot = {
  loggedIn: false,
  user: null,
  homeHref: "/",
};

let cachedSnapshot: MockAuthSnapshot = SERVER_SNAPSHOT;

function canUseStorage() {
  return typeof window !== "undefined";
}

export function setMockSession(user: MockUser = DEMO_MOCK_USER) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(UDEETS_MOCK_LOGGED_IN_KEY, "true");
  window.localStorage.setItem(UDEETS_MOCK_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(MOCK_AUTH_EVENT));
}

export function clearMockSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(UDEETS_MOCK_LOGGED_IN_KEY);
  window.localStorage.removeItem(UDEETS_MOCK_USER_KEY);
  window.dispatchEvent(new Event(MOCK_AUTH_EVENT));
}

export function isMockLoggedIn() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(UDEETS_MOCK_LOGGED_IN_KEY) === "true";
}

export function getMockUser(): MockUser | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(UDEETS_MOCK_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function getMockHomeHref() {
  return isMockLoggedIn() ? "/dashboard" : "/";
}

function getSnapshot() {
  const loggedIn = isMockLoggedIn();
  const user = getMockUser();
  const homeHref = loggedIn ? "/dashboard" : "/";

  if (
    cachedSnapshot.loggedIn === loggedIn &&
    cachedSnapshot.homeHref === homeHref &&
    JSON.stringify(cachedSnapshot.user) === JSON.stringify(user)
  ) {
    return cachedSnapshot;
  }

  cachedSnapshot = {
    loggedIn,
    user,
    homeHref,
  };

  return cachedSnapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void) {
  if (!canUseStorage()) {
    return () => undefined;
  }

  const onChange = () => callback();

  window.addEventListener("storage", onChange);
  window.addEventListener(MOCK_AUTH_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(MOCK_AUTH_EVENT, onChange);
  };
}

export function useMockAuth() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
