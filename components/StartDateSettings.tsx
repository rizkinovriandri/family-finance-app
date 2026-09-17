"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateMonthStartDay } from "@/lib/supabase/queries/families";
import { ChevronLeftIcon } from "@/components/icons";
import { formatCycleLabel, getCycleStart } from "@/lib/utils/date";

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export function StartDateSettings({
  familyId,
  initialMonthStartDay,
}: {
  familyId: string;
  initialMonthStartDay: number;
}) {
  const router = useRouter();
  const [monthStartDay, setMonthStartDay] = useState(initialMonthStartDay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewLabel = formatCycleLabel(getCycleStart(new Date(), monthStartDay), monthStartDay);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      await updateMonthStartDay(supabase, familyId, monthStartDay);
      router.push("/more");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pengaturan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center gap-2">
        <Link
          href="/more"
          className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary shrink-0"
          aria-label="Kembali"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-text-primary">Tanggal Awal</h1>
      </div>

      <p className="text-sm text-text-secondary">
        Tanggal ini jadi acuan mulainya "satu bulan" untuk Budget, Dashboard, dan
        Laporan — berguna kalau siklus keuangan keluarga tidak mengikuti tanggal 1
        kalender (mis. mengikuti tanggal gajian).
      </p>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
        <p className="text-sm text-text-secondary mb-3">Pilih tanggal (1-28)</p>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const active = day === monthStartDay;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setMonthStartDay(day)}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                  active
                    ? "bg-accent text-white font-medium"
                    : "bg-bg-page text-text-secondary"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
        <p className="text-sm text-text-secondary">Siklus bulan berjalan</p>
        <p className="text-text-primary font-medium mt-0.5">{previewLabel}</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={handleSave}
        disabled={loading || monthStartDay === initialMonthStartDay}
        className="rounded-xl bg-accent py-3 text-white font-medium disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  );
}
