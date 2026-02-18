export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-background"
      role="status"
      aria-label={label}
    >
      <div className="animate-pulse text-muted-foreground text-sm">{label}…</div>
    </div>
  );
}
