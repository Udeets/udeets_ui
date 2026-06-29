"use client";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
};

/** US phone entry with fixed +1 country code. Stores 10-digit national number in `value`. */
export function PhoneInput({
  value,
  onChange,
  className,
  inputClassName,
  id,
  required,
  autoComplete = "tel-national",
}: PhoneInputProps) {
  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    onChange(digits);
  }

  return (
    <div
      className={cx(
        "mt-1 flex overflow-hidden rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-page)] focus-within:border-[var(--ud-brand-primary)]",
        className,
      )}
    >
      <span className="flex shrink-0 items-center border-r border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] px-3 text-sm font-medium text-[var(--ud-text-secondary)]">
        +1
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        placeholder="555 123 4567"
        className={cx(
          "min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[var(--ud-text-primary)] outline-none",
          inputClassName,
        )}
      />
    </div>
  );
}
