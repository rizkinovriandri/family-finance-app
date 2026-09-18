import { BottomNav } from "@/components/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pb-20 pl-[env(safe-area-inset-left,0px)]">
      {children}
      <BottomNav />
    </div>
  );
}
