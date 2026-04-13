/**
 * Phosphor-based icons for the post composer toolbar.
 * Soft, rounded, consistent-stroke style.
 *
 * Install: npm install @phosphor-icons/react
 */
"use client";

import {
  ImageSquare,
  Smiley,
  Megaphone,
  ChartBar,
  Briefcase,
  Paperclip,
  CalendarBlank,
  MapPin,
  Warning,
  ListChecks,
  CurrencyDollarSimple,
} from "@phosphor-icons/react";

type IconProps = { className?: string; size?: number };

export function ComposerPhotoIcon({ className, size = 22 }: IconProps) {
  return <ImageSquare size={size} weight="regular" className={className} />;
}

export function ComposerEmojiIcon({ className, size = 22 }: IconProps) {
  return <Smiley size={size} weight="regular" className={className} />;
}

export function ComposerAnnouncementIcon({ className, size = 22 }: IconProps) {
  return <Megaphone size={size} weight="regular" className={className} />;
}

export function ComposerPollIcon({ className, size = 22 }: IconProps) {
  return <ChartBar size={size} weight="regular" className={className} />;
}

export function ComposerJobsIcon({ className, size = 22 }: IconProps) {
  return <Briefcase size={size} weight="regular" className={className} />;
}

export function ComposerAttachIcon({ className, size = 22 }: IconProps) {
  return <Paperclip size={size} weight="regular" className={className} />;
}

export function ComposerCalendarIcon({ className, size = 22 }: IconProps) {
  return <CalendarBlank size={size} weight="regular" className={className} />;
}

export function ComposerLocationIcon({ className, size = 22 }: IconProps) {
  return <MapPin size={size} weight="regular" className={className} />;
}

export function ComposerAlertIcon({ className, size = 22 }: IconProps) {
  return <Warning size={size} weight="regular" className={className} />;
}

export function ComposerSurveyIcon({ className, size = 22 }: IconProps) {
  return <ListChecks size={size} weight="regular" className={className} />;
}

export function ComposerPaymentIcon({ className, size = 22 }: IconProps) {
  return <CurrencyDollarSimple size={size} weight="regular" className={className} />;
}
