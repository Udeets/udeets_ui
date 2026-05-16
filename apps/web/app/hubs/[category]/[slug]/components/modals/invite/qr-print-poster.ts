import { hubJoinInviteMessage, hubJoinScanMessage } from "./invite-share-utils";

export function openQrPrintPoster(options: {
  hubName: string;
  hubLogoUrl?: string;
  joinUrl: string;
  qrSvgMarkup: string;
}): boolean {
  const { hubName, hubLogoUrl, joinUrl, qrSvgMarkup } = options;
  const scanMessage = hubJoinScanMessage(hubName);
  const inviteMessage = hubJoinInviteMessage(hubName);
  const absoluteLogo = hubLogoUrl ? toAbsoluteUrl(hubLogoUrl) : undefined;
  const logoBlock = absoluteLogo
    ? `<img src="${escapeHtml(absoluteLogo)}" alt="" class="logo" />`
    : `<div class="logo-fallback" aria-hidden="true">${escapeHtml(hubName.charAt(0).toUpperCase())}</div>`;

  const html = buildPrintHtml({
    hubName,
    scanMessage,
    inviteMessage,
    qrSvgMarkup,
    logoBlock,
  });

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, "_blank", "width=760,height=960");
  if (!win) {
    URL.revokeObjectURL(blobUrl);
    return false;
  }
  win.addEventListener("load", () => URL.revokeObjectURL(blobUrl), { once: true });
  return true;
}

function buildPrintHtml(parts: {
  hubName: string;
  scanMessage: string;
  inviteMessage: string;
  qrSvgMarkup: string;
  logoBlock: string;
}): string {
  const { hubName, scanMessage, inviteMessage, qrSvgMarkup, logoBlock } = parts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Join ${escapeHtml(hubName)} — uDeets</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .poster {
      width: 100%;
      max-width: 560px;
      padding: 2.5rem 2rem 2rem;
    }
    .brand-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2.25rem;
      text-align: center;
    }
    .brand-mark {
      flex-shrink: 0;
    }
    .logo {
      width: 104px;
      height: 104px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #e2e8f0;
      display: block;
    }
    .logo-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 104px;
      height: 104px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0c5c57, #1a8f7a);
      color: #fff;
      font-size: 2.75rem;
      font-weight: 700;
    }
    h1 {
      font-size: 2.125rem;
      font-weight: 700;
      line-height: 1.2;
      color: #0c5c57;
      text-align: center;
      max-width: 18ch;
    }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .scan-cta {
      font-size: 1.25rem;
      font-weight: 600;
      line-height: 1.35;
      color: #0c5c57;
      margin-bottom: 1.25rem;
      max-width: 28ch;
    }
    .qr-wrap {
      display: inline-flex;
      padding: 1.25rem;
      border: 2px solid #e2e8f0;
      border-radius: 1.25rem;
      background: #fff;
      margin-bottom: 1.75rem;
      box-shadow: 0 4px 24px rgba(12, 92, 87, 0.08);
    }
    .qr-wrap svg {
      display: block;
      width: 280px;
      height: 280px;
    }
    .invite-message {
      font-size: 1rem;
      line-height: 1.6;
      color: #475569;
      max-width: 40ch;
      margin-bottom: 1.75rem;
    }
    .footer {
      font-size: 0.75rem;
      color: #94a3b8;
      word-break: break-all;
      line-height: 1.4;
      text-align: center;
      padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
    }
    @media print {
      body { padding: 0; }
      .poster { max-width: none; }
    }
  </style>
</head>
<body>
  <article class="poster">
    <header class="brand-row">
      <div class="brand-mark">${logoBlock}</div>
      <h1>${escapeHtml(hubName)}</h1>
    </header>
    <section class="qr-section" aria-label="Join QR code">
      <p class="scan-cta">${escapeHtml(scanMessage)}</p>
      <div class="qr-wrap">${qrSvgMarkup}</div>
      <p class="invite-message">${escapeHtml(inviteMessage)}</p>
    </section>
    <footer class="footer">Powered by uDeets</footer>
  </article>
  <script>
    function runPrint() {
      var done = false;
      var finish = function() {
        if (done) return;
        done = true;
        window.focus();
        window.print();
      };
      var img = document.querySelector(".logo");
      if (img && !img.complete) {
        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
        setTimeout(finish, 800);
      } else {
        setTimeout(finish, 150);
      }
    }
    if (document.readyState === "complete") runPrint();
    else window.addEventListener("load", runPrint, { once: true });
  </script>
</body>
</html>`;
}

function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return new URL(url.startsWith("/") ? url : `/${url}`, window.location.origin).href;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
