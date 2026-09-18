export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center justify-center px-6 py-10 pt-[max(2.5rem,env(safe-area-inset-top,0px))] pl-[calc(1.5rem+env(safe-area-inset-left,0px))] pr-[calc(1.5rem+env(safe-area-inset-right,0px))] overflow-y-auto">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
