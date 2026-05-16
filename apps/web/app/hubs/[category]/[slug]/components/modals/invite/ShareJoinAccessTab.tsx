"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Link2, Loader2, Printer, QrCode, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

import { cn } from "../../hubUtils";
import { buildHubJoinUrl, fetchOrCreateHubJoinLink } from "@/lib/services/hubs/hub-join-link-client";
import {
  copyJoinLinkForShare,
  downloadPosterCanvas,
  nativeShareJoinLink,
  nativeShareJoinPoster,
} from "./invite-share-utils";
import { openQrPrintPoster } from "./qr-print-poster";
import { renderJoinPosterCanvas } from "./qr-poster-canvas";

const QR_SIZE = 148;
const QR_FG = "#0C5C57";

export function ShareJoinAccessTab({
  hubId,
  hubName,
  hubCategory,
  hubSlug,
  hubLogoUrl,
  onToast,
}: {
  hubId: string;
  hubName: string;
  hubCategory: string;
  hubSlug: string;
  hubLogoUrl?: string;
  onToast: (message: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [joinUrl, setJoinUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadJoinLink = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const state = await fetchOrCreateHubJoinLink(hubId);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (state?.token && !state.disabled) {
      setJoinUrl(buildHubJoinUrl(origin, hubCategory, hubSlug, state.token));
    } else {
      setJoinUrl("");
      setLoadError(true);
    }
    setLoading(false);
  }, [hubId, hubCategory, hubSlug]);

  useEffect(() => {
    void loadJoinLink();
  }, [loadJoinLink]);

  const buildPoster = useCallback(async () => {
    const qrCanvas = canvasRef.current;
    if (!qrCanvas || !joinUrl) return null;
    return renderJoinPosterCanvas({ hubName, hubLogoUrl, qrCanvas });
  }, [hubName, hubLogoUrl, joinUrl]);

  const handleShareQr = async () => {
    try {
      const poster = await buildPoster();
      if (!poster) return;
      const result = await nativeShareJoinPoster(poster, hubName);
      if (result === "shared" || result === "aborted") return;
      downloadPosterCanvas(poster, hubName);
      onToast("Poster saved — attach it from your downloads to share.");
    } catch {
      onToast("Could not create the share image.");
    }
  };

  const handleDownloadPoster = async () => {
    try {
      const poster = await buildPoster();
      if (!poster) return;
      downloadPosterCanvas(poster, hubName);
      onToast("Poster downloaded");
    } catch {
      onToast("Could not download the poster.");
    }
  };

  const handleShareLink = async () => {
    if (!joinUrl) return;
    const shared = await nativeShareJoinLink(joinUrl, hubName);
    if (shared) return;
    const copied = await copyJoinLinkForShare(joinUrl, hubName);
    onToast(
      copied
        ? "Invite copied — paste in WhatsApp to send a clickable link"
        : "Sharing is not available on this device",
    );
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas || !joinUrl) return;
    const svgMarkup = buildQrSvgFromCanvas(canvas);
    const opened = openQrPrintPoster({ hubName, hubLogoUrl, joinUrl, qrSvgMarkup: svgMarkup });
    if (!opened) onToast("Allow pop-ups to print the QR poster.");
  };

  return (
    <section
      className="rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/40"
      aria-label="Join link and QR code"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--ud-brand-primary)]" aria-label="Loading" />
        </div>
      ) : loadError ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-[var(--ud-text-secondary)]">Could not load join access.</p>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-[var(--ud-brand-primary)] hover:underline"
            onClick={() => void loadJoinLink()}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2 px-4 pb-3 pt-4">
            <div className="flex w-full items-center justify-center gap-1.5 text-[var(--ud-brand-primary)]">
              <QrCode className="h-3.5 w-3.5" aria-hidden />
              <span className="text-xs font-semibold text-[var(--ud-text-primary)]">QR code</span>
            </div>
            <div
              className="rounded-xl border border-[var(--ud-border-subtle)] bg-white p-2.5 shadow-sm"
              aria-label={`QR code to join ${hubName}`}
            >
              <QRCodeCanvas
                ref={canvasRef}
                value={joinUrl}
                size={QR_SIZE}
                level="M"
                bgColor="#ffffff"
                fgColor={QR_FG}
              />
            </div>
            <div className="flex w-full max-w-[220px] justify-center gap-1.5">
              <CompactAction icon={Share2} label="Share QR" onClick={() => void handleShareQr()} />
              <CompactAction
                icon={Download}
                label="Download"
                onClick={() => void handleDownloadPoster()}
              />
              <CompactAction icon={Printer} label="Print" onClick={handlePrint} />
            </div>
          </div>

          <div className="border-t border-[var(--ud-border-subtle)] px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-[var(--ud-brand-primary)]" aria-hidden />
              <span className="text-xs font-semibold text-[var(--ud-text-primary)]">Invite link</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                readOnly
                value={joinUrl}
                className="min-w-0 flex-1 truncate rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-2.5 py-2 text-[11px] text-[var(--ud-text-secondary)] outline-none focus:border-[var(--ud-brand-primary)] focus:ring-1 focus:ring-[var(--ud-brand-primary)]"
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Invite link URL"
              />
              <button
                type="button"
                onClick={() => void handleShareLink()}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden />
                Share
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function CompactAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Share2;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-1.5 py-2",
        "text-[10px] font-medium text-[var(--ud-text-secondary)] transition",
        "hover:border-[var(--ud-brand-primary)]/30 hover:text-[var(--ud-brand-primary)]",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}

/** Build SVG markup for print from canvas pixel data (same encoding as on screen). */
function buildQrSvgFromCanvas(canvas: HTMLCanvasElement): string {
  const size = canvas.width;
  const dataUrl = canvas.toDataURL("image/png");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><image href="${dataUrl}" width="${size}" height="${size}"/></svg>`;
}
