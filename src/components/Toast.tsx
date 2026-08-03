export type ToastState = { message: string; color: string } | null;

export default function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed z-[4000] bottom-[30px] left-1/2 -translate-x-1/2 font-bold shadow-lg text-surface-dark text-center rounded-sm px-4 py-3 ${toast.color}`}
    >
      {toast.message}
    </div>
  );
}
