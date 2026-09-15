"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// Refresh callback lewat ref supaya effect tidak perlu re-subscribe tiap
// kali komponen re-render (cuma bergantung pada table + familyId).
export function useRealtimeTable(table: string, familyId: string, onChange: () => void) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-${table}-${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `family_id=eq.${familyId}` },
        () => onChangeRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, familyId]);
}
