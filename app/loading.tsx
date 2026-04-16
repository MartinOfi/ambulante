export default function GlobalLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      aria-label="Cargando"
      role="status"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
