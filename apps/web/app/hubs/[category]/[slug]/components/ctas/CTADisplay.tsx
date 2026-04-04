"use client";

import {
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  FileText,
  Instagram,
  type LucideIcon,
} from "lucide-react";
import type { HubCTARecord } from "@/lib/services/ctas/cta-types";
import { cn } from "../hubUtils";

const ACTION_ICONS: Record<string, LucideIcon> = {
  url: ExternalLink,
  whatsapp: MessageCircle,
  phone: Phone,
  maps: MapPin,
  email: Mail,
  doordash: ExternalLink,
  ubereats: ExternalLink,
  opentable: ExternalLink,
  instagram: Instagram,
  pdf: FileText,
};

function buildHref(actionType: string, actionValue: string): string {
  switch (actionType) {
    case "phone":
      return `tel:${actionValue}`;
    case "email":
      return `mailto:${actionValue}`;
    case "whatsapp":
      return `https://wa.me/${actionValue.replace(/\D/g, "")}`;
    case "maps":
      return actionValue.startsWith("http")
        ? actionValue
        : `https://maps.google.com/?q=${encodeURIComponent(actionValue)}`;
    default:
      return actionValue.startsWith("http") ? actionValue : `https://${actionValue}`;
  }
}

export function CTADisplay({ ctas }: { ctas: HubCTARecord[] }) {
  const visible = ctas.filter((c) => c.is_visible);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((cta) => {
        const Icon = ACTION_ICONS[cta.action_type] ?? ExternalLink;
        const href = buildHref(cta.action_type, cta.action_value);

        return (
          <a
            key={cta.id}
            href={href}
            target={["phone", "email"].includes(cta.action_type) ? undefined : "_blank"}
            rel={["phone", "email"].includes(cta.action_type) ? undefined : "noreferrer"}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border border-[var(--ud-brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--ud-brand-primary)]",
              "transition hover:bg-[var(--ud-brand-light)] active:scale-[0.97]"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {cta.label}
          </a>
        );
      })}
    </div>
  );
}
