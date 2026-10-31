export default function Loading() {
  return (
    <div role="status" aria-label="Chargement" className="animate-pulse space-y-4">
      <div className="h-9 w-56 rounded-xl bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-36 rounded-[var(--radius-card)] bg-surface" />
        <div className="h-36 rounded-[var(--radius-card)] bg-surface" />
      </div>
      <div className="h-64 rounded-[var(--radius-card)] bg-surface" />
    </div>
  );
}
