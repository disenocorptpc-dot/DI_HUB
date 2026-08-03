import type { Item } from '../types';

export type ItemHandlers = {
  isFavorite: (id: number) => boolean;
  onToggleFavorite: (e: React.MouseEvent, id: number) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
};

type Props = {
  item: Item;
  handlers: ItemHandlers;
  /** `sm` para filas densas, `md` para cards. */
  size?: 'sm' | 'md';
};

/**
 * Botones de favorito / editar / borrar. El de favorito siempre se ve cuando está
 * activo; los otros dos aparecen al hacer hover sobre el contenedor `group`.
 */
export default function ItemActions({ item, handlers, size = 'sm' }: Props) {
  const textSize = size === 'sm' ? 'text-[16px]' : 'text-lg';
  const fav = handlers.isFavorite(item.id);

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    fn();
  };

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        className="text-slate-500 hover:text-primary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 p-1"
        onClick={stop(() => handlers.onEdit(item))}
        title="Editar"
        aria-label={`Editar ${item.title}`}
      >
        <span className={`material-symbols-outlined ${textSize}`}>edit</span>
      </button>

      <button
        className="text-red-400/60 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 p-1"
        onClick={stop(() => handlers.onDelete(item))}
        title="Eliminar"
        aria-label={`Eliminar ${item.title}`}
      >
        <span className={`material-symbols-outlined ${textSize}`}>delete</span>
      </button>

      <button
        className={`transition-colors p-1 ${fav ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400 opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
        onClick={e => handlers.onToggleFavorite(e, item.id)}
        title={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        aria-label={fav ? `Quitar ${item.title} de favoritos` : `Añadir ${item.title} a favoritos`}
      >
        <span
          className={`material-symbols-outlined ${textSize}`}
          style={fav ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          star
        </span>
      </button>
    </div>
  );
}

export function TagList({ tags, max = 3 }: { tags: string[]; max?: number }) {
  if (tags.length === 0) return null;
  const shown = tags.slice(0, max);
  const rest = tags.length - shown.length;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {shown.map(tag => (
        <span key={tag} className="text-[9px] uppercase tracking-wider text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-sm">
          {tag}
        </span>
      ))}
      {rest > 0 && <span className="text-[9px] text-slate-600">+{rest}</span>}
    </div>
  );
}
