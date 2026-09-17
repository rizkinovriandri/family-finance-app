// Konversi Date -> "YYYY-MM-DD" pakai komponen tanggal LOKAL, bukan UTC.
// new Date().toISOString().slice(0,10) salah di timezone timur UTC
// (mis. WIB/UTC+7): jam 00:00-06:59 lokal dibulatkan mundur ke hari
// sebelumnya karena toISOString() mengonversi ke UTC dulu.
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// "Bulan" finansial keluarga bisa dimulai dari hari selain tanggal 1
// (mis. siklus gajian tanggal 25), diatur lewat families.month_start_day
// (1-28, default 1 = sama seperti bulan kalender biasa). Dibatasi maksimum
// 28 supaya selalu valid di semua bulan termasuk Februari.

// Tanggal mulai siklus yang MENCAKUP anchorDate. Kalau tanggal anchorDate
// masih di bawah monthStartDay, siklusnya sebenarnya dimulai bulan
// sebelumnya (mis. monthStartDay=25: tanggal 10 Sept masuk siklus
// "25 Agustus - 24 September").
export function getCycleStart(anchorDate: Date, monthStartDay: number): Date {
  const day = anchorDate.getDate();
  const cycleMonth = day >= monthStartDay ? anchorDate.getMonth() : anchorDate.getMonth() - 1;
  return new Date(anchorDate.getFullYear(), cycleMonth, monthStartDay);
}

// Rentang [start, end) siklus yang dimulai persis di cycleStart (day-nya
// harus sudah = monthStartDay, biasanya hasil dari getCycleStart atau
// shiftCycle).
export function getCycleRange(cycleStart: Date, monthStartDay: number) {
  const end = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, monthStartDay);
  return { start: toLocalISODate(cycleStart), end: toLocalISODate(end) };
}

// Geser cycleStart maju/mundur sejumlah siklus (dipakai navigasi bulan
// sebelumnya/berikutnya).
export function shiftCycle(cycleStart: Date, delta: number): Date {
  return new Date(cycleStart.getFullYear(), cycleStart.getMonth() + delta, cycleStart.getDate());
}

// Label tampilan untuk satu siklus. Kalau monthStartDay=1 (default, belum
// diubah user) tampil seperti biasa "September 2026". Kalau custom, tampil
// sebagai rentang tanggal supaya tidak ambigu bulan mana yang dimaksud.
export function formatCycleLabel(cycleStart: Date, monthStartDay: number): string {
  if (monthStartDay === 1) {
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
      cycleStart
    );
  }
  const cycleEndInclusive = new Date(
    cycleStart.getFullYear(),
    cycleStart.getMonth() + 1,
    monthStartDay - 1
  );
  const startLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    cycleStart
  );
  const endLabel = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(cycleEndInclusive);
  return `${startLabel} – ${endLabel}`;
}
