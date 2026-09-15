"use client";

function formatDigits(value: number) {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
}

export function CurrencyInput({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    onChange(digitsOnly ? Number(digitsOnly) : 0);
  }

  return (
    <div className="input flex items-center gap-2">
      <span className="text-text-muted">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={formatDigits(value)}
        onChange={handleChange}
        placeholder={placeholder ?? "0"}
        className="bg-transparent outline-none flex-1 text-text-primary placeholder:text-text-muted"
      />
    </div>
  );
}
