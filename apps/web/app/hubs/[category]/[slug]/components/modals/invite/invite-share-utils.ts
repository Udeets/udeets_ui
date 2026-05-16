export function hubJoinInviteMessage(hubName: string): string {
  return `Join ${hubName} to stay connected with announcements, events, updates, and community conversations.`;
}

export function hubJoinScanMessage(hubName: string): string {
  return `Scan the QR code to join ${hubName}`;
}

export function hubJoinShareTitle(hubName: string): string {
  return `Join ${hubName} on uDeets`;
}

export function safeHubFileName(hubName: string): string {
  return hubName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "hub";
}

export async function qrCanvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Canonical URL for sharing (trimmed, parsed when possible). */
export function normalizeShareUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  try {
    return new URL(trimmed).href;
  } catch {
    return trimmed;
  }
}

/**
 * Invite copy for WhatsApp and similar apps — they only auto-link URLs present in
 * plain `text`, not the Web Share API `url` field.
 */
export function buildJoinLinkShareText(hubName: string, joinUrl: string): string {
  const url = normalizeShareUrl(joinUrl);
  return `${hubJoinInviteMessage(hubName)}\n\n${url}`;
}

export async function copyJoinLinkForShare(joinUrl: string, hubName: string): Promise<boolean> {
  return copyTextToClipboard(buildJoinLinkShareText(hubName, joinUrl));
}

/**
 * Shares invite message with the join URL on its own line in `text` so WhatsApp
 * renders a tappable link.
 */
export async function nativeShareJoinLink(joinUrl: string, hubName: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;

  const title = hubJoinShareTitle(hubName);
  const text = buildJoinLinkShareText(hubName, joinUrl);
  const url = normalizeShareUrl(joinUrl);

  const attempts: ShareData[] = [
    { text },
    { title, text },
    // Fallback for targets that use `url` for link previews (not WhatsApp).
    { title, text, url },
    { title, url },
  ];

  for (const data of attempts) {
    if (navigator.canShare && !navigator.canShare(data)) continue;
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return true;
    }
  }

  return false;
}

/**
 * Shares a full join poster image (logo, messages, QR). Falls back to download when unsupported.
 */
export async function nativeShareJoinPoster(
  posterCanvas: HTMLCanvasElement,
  hubName: string,
): Promise<"shared" | "unsupported" | "aborted"> {
  if (typeof navigator === "undefined" || !navigator.share) return "unsupported";

  const blob = await qrCanvasToPngBlob(posterCanvas);
  if (!blob) return "unsupported";

  const file = new File([blob], `${safeHubFileName(hubName)}-join-poster.png`, { type: "image/png" });
  const title = hubJoinShareTitle(hubName);

  const attempts: ShareData[] = [
    { files: [file], title },
    { files: [file] },
  ];

  for (const data of attempts) {
    if (navigator.canShare && !navigator.canShare(data)) continue;
    try {
      await navigator.share(data);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "aborted";
    }
  }

  return "unsupported";
}

export function downloadPosterCanvas(posterCanvas: HTMLCanvasElement, hubName: string) {
  downloadDataUrl(`${safeHubFileName(hubName)}-join-poster.png`, posterCanvas.toDataURL("image/png"));
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}
