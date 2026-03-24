import Image from "next/image";
import { UDEETS_BRAND_NAME, UDEETS_LOGO_SRC } from "@/lib/branding";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type UdeetsLogoIconProps = {
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  decorative?: boolean;
  alt?: string;
};

export function UdeetsLogoIcon({
  className,
  imageClassName,
  sizes,
  priority = false,
  decorative = false,
  alt = `${UDEETS_BRAND_NAME} logo`,
}: UdeetsLogoIconProps) {
  return (
    <span className={cn("relative block shrink-0", className)} aria-hidden={decorative || undefined}>
      <Image
        src={UDEETS_LOGO_SRC}
        alt={decorative ? "" : alt}
        fill
        sizes={sizes}
        className={cn("object-contain", imageClassName)}
        priority={priority}
      />
    </span>
  );
}

type UdeetsBrandLockupProps = {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  priority?: boolean;
};

const BRAND_WORDMARK_STYLE = "truncate font-sans text-[#0C5C57] font-semibold tracking-[-0.03em] leading-none";

export function UdeetsBrandLockup({
  className,
  logoClassName,
  textClassName,
  priority = false,
}: UdeetsBrandLockupProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2 sm:gap-3", className)}>
      <UdeetsLogoIcon className={cn("h-10 w-10", logoClassName)} priority={priority} decorative />
      <span className={cn(BRAND_WORDMARK_STYLE, textClassName)}>{UDEETS_BRAND_NAME}</span>
    </span>
  );
}
