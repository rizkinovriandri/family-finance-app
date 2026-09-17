"use client";

function formatDigits(value: number) {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
}

function getCurrencySymbol(currency: string) {
  const parts = new Intl.NumberFormat("id-ID", { style: "currency", currency }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}

export function CurrencyInput({
  value,
  onChange,
  currency = "IDR",
  placeholder,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    onChange(digitsOnly ? Number(digitsOnly) : 0);
  }

  return (
    <div className={`input flex items-center gap-2 ${disabled ? "opacity-60" : ""}`}>
      <span className="text-text-muted">{getCurrencySymbol(currency)}</span>
      <input
        type="text"
        inputMode="numeric"
        value={formatDigits(value)}
        onChange={handleChange}
        placeholder={placeholder ?? "0"}
        disabled={disabled}
        className="bg-transparent outline-none flex-1 text-text-primary placeholder:text-text-muted disabled:cursor-not-allowed"
      />
    </div>
  );
}
