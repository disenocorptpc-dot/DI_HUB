import { useEffect, type ReactNode } from 'react';

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

type ModalProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  size?: keyof typeof WIDTHS;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export default function Modal({ title, subtitle, size = 'md', onClose, children, footer }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Evita que la página de atrás se desplace mientras el modal está abierto.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div
        className={`relative w-full ${WIDTHS[size]} bg-surface border border-primary/20 rounded-sm shadow-2xl flex flex-col max-h-[90vh] m-4 animate-in fade-in zoom-in duration-200`}
      >
        <div className="flex justify-between items-start gap-4 p-5 border-b border-primary/10 bg-surface-dark rounded-t-sm shrink-0">
          <div className="min-w-0">
            <h3 className="text-xl font-headline-md text-white truncate">{title}</h3>
            {subtitle && <div className="mt-2">{subtitle}</div>}
          </div>
          <button
            className="text-slate-400 hover:text-white transition-colors bg-surface p-1 rounded border border-primary/10 shrink-0"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="p-5 border-t border-primary/10 flex justify-end gap-3 bg-surface-dark rounded-b-sm shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
