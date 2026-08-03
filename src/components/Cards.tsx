import ItemActions, { TagList, type ItemHandlers } from './ItemActions';
import { safeHref } from '../lib/api';
import { daysUntilBirthday, formatBirthday } from '../lib/dates';
import type { Item } from '../types';

type CardProps = {
  item: Item;
  handlers: ItemHandlers;
  /** Acción primaria del card: lanzar la app/link, o abrir la ficha en los demás tipos. */
  onOpen: (item: Item) => void;
  /** Solo para webapp y link, donde el clic principal ya lanza la URL. */
  onDetail?: (item: Item) => void;
};

function DetailButton({ item, onDetail }: { item: Item; onDetail?: (item: Item) => void }) {
  if (!onDetail) return null;

  return (
    <button
      className="text-slate-600 hover:text-primary transition-all p-1 shrink-0"
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
        onDetail(item);
      }}
      title="Ver ficha y datos de acceso"
      aria-label={`Ver ficha de ${item.title}`}
    >
      <span className="material-symbols-outlined text-[16px]">key</span>
    </button>
  );
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0] ?? '')
    .join('')
    .toUpperCase();

/**
 * Web app en fila densa. Antes cada tarjeta gastaba ~200px de alto para mostrar
 * título y categoría; ahora son ~60px.
 */
export function WebAppCard({ item, handlers, onOpen, onDetail }: CardProps) {
  const href = safeHref(item.url);

  return (
    <div
      className="group flex items-center gap-3 p-3 bg-surface-dark border border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all rounded-sm cursor-pointer"
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item);
        }
      }}
    >
      <div className="w-9 h-9 rounded bg-primary/10 grid place-items-center text-primary shrink-0 group-hover:scale-105 transition-transform">
        <span className="material-symbols-outlined text-[20px]">{href ? 'rocket_launch' : 'link_off'}</span>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          {item.category && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 shrink-0">
              {item.category}
            </span>
          )}
          <TagList tags={item.tags} max={2} />
        </div>
      </div>

      <DetailButton item={item} onDetail={onDetail} />
      <ItemActions item={item} handlers={handlers} />
    </div>
  );
}

export function PromptCard({ item, handlers, onOpen }: CardProps) {
  return (
    <div
      className="group bg-surface-dark border border-primary/10 p-3 hover:border-accent-antigravity/40 transition-all rounded-sm cursor-pointer"
      onClick={() => onOpen(item)}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-accent-antigravity/10 text-accent-antigravity px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-accent-antigravity/20 flex items-center gap-1 shrink-0">
            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
            {item.category || 'IA'}
          </span>
          <span className="text-xs text-slate-300 font-bold truncate">{item.title}</span>
        </div>
        <ItemActions item={item} handlers={handlers} size="md" />
      </div>

      <TagList tags={item.tags} />

      <div className="bg-black/30 p-3 rounded border border-white/5 mt-2 h-16 overflow-hidden relative fade-bottom">
        <code className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">{item.content}</code>
      </div>
    </div>
  );
}

export function LinkRow({ item, handlers, onOpen, onDetail }: CardProps) {
  const href = safeHref(item.url);

  return (
    <div
      className="group flex items-center justify-between gap-3 p-2.5 bg-surface-dark hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all rounded-sm cursor-pointer"
      onClick={() => onOpen(item)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded bg-blue-500/10 grid place-items-center text-blue-400 shrink-0">
          <span className="material-symbols-outlined text-lg">{href ? 'link' : 'link_off'}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors truncate">
            {item.title}
          </p>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate">{item.category}</p>
        </div>
      </div>
      <div className="flex items-center">
        <DetailButton item={item} onDetail={onDetail} />
        <ItemActions item={item} handlers={handlers} />
      </div>
    </div>
  );
}

export function NoteCard({ item, handlers, onOpen }: CardProps) {
  return (
    <div
      className="group bg-surface-dark border border-primary/10 hover:border-primary/40 transition-all rounded-sm p-3 cursor-pointer flex flex-col"
      onClick={() => onOpen(item)}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary/60 text-[18px] shrink-0">sticky_note_2</span>
          <h4 className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">
            {item.title}
          </h4>
        </div>
        <ItemActions item={item} handlers={handlers} />
      </div>

      {item.category && (
        <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-1 ml-6">{item.category}</span>
      )}

      <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-3 whitespace-pre-wrap">{item.content}</p>

      <div className="mt-2">
        <TagList tags={item.tags} />
      </div>
    </div>
  );
}

export function PersonCard({ item, handlers, onOpen }: CardProps) {
  const days = daysUntilBirthday(item.meta.birthday);
  const soon = days !== null && days <= 7;

  return (
    <div
      className="group flex items-center gap-3 p-2.5 bg-surface-dark border border-primary/10 hover:border-primary/40 transition-all rounded-sm cursor-pointer"
      onClick={() => onOpen(item)}
    >
      <div className="w-9 h-9 rounded-full bg-primary/15 grid place-items-center text-primary text-xs font-bold shrink-0 border border-primary/20">
        {initials(item.title) || '?'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">
          {item.title}
        </p>
        <p className="text-[10px] text-slate-500 truncate">{item.meta.role || item.category || 'Sin puesto'}</p>
      </div>

      {item.meta.birthday && (
        <span
          className={`text-[9px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 ${soon ? 'text-yellow-400' : 'text-slate-600'}`}
          title={`Cumpleaños: ${formatBirthday(item.meta.birthday)}`}
        >
          <span className="material-symbols-outlined text-[13px]">cake</span>
          {formatBirthday(item.meta.birthday)}
        </span>
      )}

      <ItemActions item={item} handlers={handlers} />
    </div>
  );
}
