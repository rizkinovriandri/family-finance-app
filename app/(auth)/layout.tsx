export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center justify-center px-6 py-10 overflow-y-auto">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
