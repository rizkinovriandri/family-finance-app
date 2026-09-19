"use client";

import { useEffect, useId, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Refresh callback lewat ref supaya effect tidak perlu re-subscribe tiap
// kali komponen re-render (cuma bergantung pada table + familyId).
export function useRealtimeTable(table: string, familyId: string, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  // Nama channel harus unik per instance hook — createClient() di browser
  // mengembalikan client yang sama (singleton), jadi kalau 2 komponen
  // berbeda subscribe ke table+familyId yang sama, mereka akan berebut
  // channel yang sama dan gagal dengan "cannot add postgres_changes
  // callbacks after subscribe()".
  const instanceId = useId();

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-${table}-${familyId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `family_id=eq.${familyId}` },
        () => onChangeRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, familyId, instanceId]);
}
