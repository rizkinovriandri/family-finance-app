"use client";

import { useRouter } from "next/navigation";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";

export function RealtimeDashboardSync({ familyId }: { familyId: string }) {
  const router = useRouter();

  useRealtimeTable("transactions", familyId, () => router.refresh());
  useRealtimeTable("accounts", familyId, () => router.refresh());
  useRealtimeTable("budgets", familyId, () => router.refresh());

  return null;
}
