import { hubJoinInviteMessage, hubJoinScanMessage } from "./invite-share-utils";

const POSTER_WIDTH = 560;
const PAD = 36;
const BRAND = "#0c5c57";
const MUTED = "#475569";
const FOOTER = "#94a3b8";
const BORDER = "#e2e8f0";

export type JoinPosterRenderInput = {
  hubName: string;
  hubLogoUrl?: string;
  qrCanvas: HTMLCanvasElement;
};

/** Renders the same poster layout as print (logo, title, scan CTA, QR, invite message). */
export async function renderJoinPosterCanvas(input: JoinPosterRenderInput): Promise<HTMLCanvasElement> {
  const { hubName, hubLogoUrl, qrCanvas } = input;
  const scanMessage = hubJoinScanMessage(hubName);
  const inviteMessage = hubJoinInviteMessage(hubName);
  const contentW = POSTER_WIDTH - PAD * 2;

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = "600 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  const logoSize = 96;
  const qrDisplay = 240;
  const qrFramePad = 18;

  const titleLines = wrapLines(measure, hubName, contentW, "700 26px system-ui, sans-serif");
  const scanLines = wrapLines(measure, scanMessage, contentW * 0.9, "600 17px system-ui, sans-serif");
  const inviteLines = wrapLines(measure, inviteMessage, contentW, "400 15px system-ui, sans-serif");

  const titleH = titleLines.length * 32;
  const scanH = scanLines.length * 24;
  const inviteH = inviteLines.length * 22;
  const qrBlock = qrDisplay + qrFramePad * 2;

  let y = PAD;
  y += logoSize + 16 + titleH + 28 + scanH + 20 + qrBlock + 24 + inviteH + 28 + 20;

  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = y;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, POSTER_WIDTH, y);

  let cursor = PAD;
  const cx = POSTER_WIDTH / 2;

  const logoImg = hubLogoUrl ? await loadImage(toAbsoluteUrl(hubLogoUrl)) : null;
  drawLogo(ctx, cx, cursor + logoSize / 2, logoSize / 2, logoImg, hubName);
  cursor += logoSize + 16;

  ctx.fillStyle = BRAND;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "700 26px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  for (const line of titleLines) {
    ctx.fillText(line, cx, cursor);
    cursor += 32;
  }
  cursor += 12;

  ctx.font = "600 17px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  for (const line of scanLines) {
    ctx.fillText(line, cx, cursor);
    cursor += 24;
  }
  cursor += 16;

  const frameW = qrDisplay + qrFramePad * 2;
  const frameX = (POSTER_WIDTH - frameW) / 2;
  drawRoundedRect(ctx, frameX, cursor, frameW, qrBlock, 16, BORDER, "#ffffff");
  ctx.drawImage(
    qrCanvas,
    frameX + qrFramePad,
    cursor + qrFramePad,
    qrDisplay,
    qrDisplay,
  );
  cursor += qrBlock + 20;

  ctx.fillStyle = MUTED;
  ctx.font = "400 15px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  for (const line of inviteLines) {
    ctx.fillText(line, cx, cursor);
    cursor += 22;
  }
  cursor += 16;

  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, cursor);
  ctx.lineTo(POSTER_WIDTH - PAD, cursor);
  ctx.stroke();
  cursor += 12;

  ctx.fillStyle = FOOTER;
  ctx.font = "400 12px system-ui, sans-serif";
  ctx.fillText("Powered by uDeets", cx, cursor);

  return canvas;
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  img: HTMLImageElement | null,
  hubName: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  if (img) {
    ctx.clip();
    const size = r * 2;
    ctx.drawImage(img, cx - r, cy - r, size, size);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = BORDER;
    ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, "#0c5c57");
    g.addColorStop(1, "#1a8f7a");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hubName.charAt(0).toUpperCase(), cx, cy);
    ctx.restore();
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  stroke: string,
  fill: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  ctx.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return new URL(url.startsWith("/") ? url : `/${url}`, window.location.origin).href;
}
