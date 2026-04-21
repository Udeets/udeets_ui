export const COMPOSER_INPUT =
  "w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-4 py-2.5 text-sm text-[var(--ud-text-primary)] outline-none transition focus:border-[var(--ud-border-focus)] focus:ring-2 focus:ring-[var(--ud-brand-light)]";

export const COMPOSER_TOGGLE =
  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200";

export const COMPOSER_TOGGLE_KNOB =
  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200";

/** Native `<select>` — pair with `COMPOSER_SELECT_CHEVRON_WRAP` for a custom chevron. */
export const COMPOSER_SELECT =
  "w-full min-h-[42px] cursor-pointer appearance-none rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-input)] pl-3.5 pr-10 py-2 text-sm font-medium text-[var(--ud-text-primary)] outline-none transition focus:border-[var(--ud-border-focus)] focus:ring-2 focus:ring-[var(--ud-brand-light)] disabled:cursor-not-allowed disabled:opacity-50";

/** Relative wrapper; place chevron absolutely on the right. */
export const COMPOSER_SELECT_CHEVRON_WRAP = "relative min-w-0";
