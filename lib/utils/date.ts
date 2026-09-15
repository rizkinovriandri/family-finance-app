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
