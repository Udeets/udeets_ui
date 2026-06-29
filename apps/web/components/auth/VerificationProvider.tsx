"use client";

import { AlertCircle, X } from "lucide-react";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { VerificationModal } from "@/components/auth/VerificationModal";
import { VERIFICATION_RESTRICTED_ACCESS_MESSAGE } from "@/lib/auth/verification-messages";
import { useAuthSession } from "@/services/auth/useAuthSession";

type VerificationFocus = "phone" | "email";

type VerificationContextValue = {
  openVerification: (focus?: VerificationFocus) => void;
  needsVerification: boolean;
};

const VerificationContext = createContext<VerificationContextValue | null>(null);

function UnverifiedAccountBanner({
  onVerify,
  onDismiss,
}: {
  onVerify: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">Account verification needed</p>
          <p className="mt-0.5 text-xs text-amber-800 sm:text-sm">{VERIFICATION_RESTRICTED_ACCESS_MESSAGE}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onVerify}
            className="rounded-full bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 sm:text-sm"
          >
            Verify now
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full p-1 text-amber-700 hover:bg-amber-100"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function VerificationProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, status } = useAuthSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFocus, setModalFocus] = useState<VerificationFocus>("phone");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const needsVerification = Boolean(isAuthenticated && user && !user.verificationComplete);

  const openVerification = useCallback((focus: VerificationFocus = "phone") => {
    setModalFocus(focus);
    setModalOpen(true);
    setBannerDismissed(false);
  }, []);

  useEffect(() => {
    const verifyOpen = searchParams.get("verifyOpen");
    if (verifyOpen !== "phone" && verifyOpen !== "email") return;
    if (status !== "authenticated") return;

    openVerification(verifyOpen);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("verifyOpen");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, status, openVerification, router, pathname]);

  useEffect(() => {
    if (!needsVerification) {
      setBannerDismissed(false);
      setModalOpen(false);
    }
  }, [needsVerification]);

  const contextValue = useMemo<VerificationContextValue>(
    () => ({
      openVerification,
      needsVerification,
    }),
    [openVerification, needsVerification],
  );

  const defaultFocus: VerificationFocus =
    user?.phone && !user.phoneVerified ? "phone" : "email";

  const showBanner =
    needsVerification &&
    !bannerDismissed &&
    !pathname.startsWith("/auth") &&
    status === "authenticated";

  return (
    <VerificationContext.Provider value={contextValue}>
      {showBanner ? (
        <UnverifiedAccountBanner
          onVerify={() => openVerification(defaultFocus)}
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}
      {children}
      <VerificationModal
        open={modalOpen && needsVerification}
        focus={modalFocus}
        onClose={() => setModalOpen(false)}
        onVerified={() => {
          setModalOpen(false);
          router.refresh();
        }}
      />
    </VerificationContext.Provider>
  );
}

export function VerificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <VerificationProviderInner>{children}</VerificationProviderInner>
    </Suspense>
  );
}

export function useVerification() {
  const ctx = useContext(VerificationContext);
  if (!ctx) {
    throw new Error("useVerification must be used within VerificationProvider");
  }
  return ctx;
}

/** Safe hook when provider may be absent (e.g. tests). */
export function useVerificationOptional() {
  return useContext(VerificationContext);
}
