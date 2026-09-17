// Helper bareng untuk grafik bar chart dengan garis & label sumbu Y (dipakai
// di grafik mingguan Laporan dan grafik tren bulanan Dashboard).

export function formatCompactRupiah(amount: number) {
  if (amount === 0) return "0";
  if (amount >= 1_000_000) {
    const v = amount / 1_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}Jt`;
  }
  if (amount >= 1_000) {
    const v = amount / 1_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}Rb`;
  }
  return String(amount);
}

// Bulatkan ke kelipatan "rapi" (1/2/5 x 10^n) supaya garis sumbu Y & label-nya
// enak dibaca, meniru pola label "3M/2M/1M/0" di mockup.
export function niceStep(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  let niceNormalized;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
}

// 4 titik garis sumbu Y (3x, 2x, 1x, 0) dari nilai tertinggi data.
export function getYAxisTicks(maxValue: number) {
  const step = niceStep(maxValue / 3);
  const chartMax = step * 3;
  const ticks = [3, 2, 1, 0].map((i) => step * i);
  return { chartMax, ticks };
}
