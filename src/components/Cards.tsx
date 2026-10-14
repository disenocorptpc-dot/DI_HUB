import ItemActions, { TagList, type ItemHandlers } from './ItemActions';
import { safeHref } from '../lib/api';
import { daysUntilBirthday, formatBirthday } from '../lib/dates';
import { domainFromUrl } from '../lib/search';
import type { Item } from '../types';

type CardProps = {
  item: Item;
  handlers: ItemHandlers;
  /** Acción primaria del card: lanzar la app/link, o abrir la ficha en los demás tipos. */
  onOpen: (item: Item) => void;
  /** Solo para webapp y link, donde el clic principal ya lanza la URL. */
  onDetail?: (item: Item) => void;
  compact?: boolean;
};

function DetailButton({ item, onDetail }: { item: Item; onDetail?: (item: Item) => void }) {
  if (!onDetail) return null;

  const hasAccess = Boolean(item.meta.loginUser || item.meta.vault || item.meta.vaultUrl);

  return (
    <button
      className={`transition-all p-1 shrink-0 ${
        hasAccess
          ? 'text-primary/80 hover:text-primary'
          : 'text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 focus:opacity-100'
      }`}
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
        onDetail(item);
      }}
      title={hasAccess ? `Datos de acceso (${item.meta.vault || item.meta.loginUser})` : 'Ver ficha / detalles'}
      aria-label={`Ver ficha de ${item.title}`}
    >
      <span className="material-symbols-outlined text-[16px]">{hasAccess ? 'key' : 'info'}</span>
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

export function WebAppCard({ item, handlers, onOpen, onDetail, compact }: CardProps) {
  const href = safeHref(item.url);
  const domain = domainFromUrl(item.url);
  const subtitle = item.category || domain;

  return (
    <div
      className={`group flex items-center gap-3 ${
        compact ? 'p-2' : 'p-3'
      } bg-surface-dark border ${
        item.pinned ? 'border-primary/35 bg-primary/[0.03]' : 'border-primary/10'
      } hover:border-primary/40 hover:bg-primary/5 transition-all rounded-sm cursor-pointer`}
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
      <div
        className={`${
          compact ? 'w-7 h-7' : 'w-9 h-9'
        } rounded bg-primary/10 grid place-items-center text-primary shrink-0 group-hover:scale-105 transition-transform`}
      >
        <span className="material-symbols-outlined text-[18px]">{href ? 'rocket_launch' : 'apps'}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">
            {item.title}
          </h4>
        </div>
        {!compact && (subtitle || item.tags.length > 0 || item.description) && (
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            {item.category ? (
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 shrink-0">
                {item.category}
              </span>
            ) : domain ? (
              <span className="text-[10px] font-mono text-slate-500 truncate">{domain}</span>
            ) : null}
            <TagList tags={item.tags} max={2} />
            {item.description && item.tags.length === 0 && (
              <span className="text-[11px] text-slate-500 truncate">{item.description}</span>
            )}
          </div>
        )}
      </div>

      <DetailButton item={item} onDetail={onDetail} />
      <ItemActions item={item} handlers={handlers} />
    </div>
  );
}

export function PromptCard({ item, handlers, onOpen, compact }: CardProps) {
  const bodyText = item.content.trim() || item.description.trim();

  return (
    <div
      className={`group bg-surface-dark border ${
        item.pinned ? 'border-accent-antigravity/40 bg-accent-antigravity/[0.03]' : 'border-primary/10'
      } ${compact ? 'p-2.5' : 'p-3'} hover:border-accent-antigravity/40 transition-all rounded-sm cursor-pointer`}
      onClick={() => onOpen(item)}
    >
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-accent-antigravity/10 text-accent-antigravity px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border border-accent-antigravity/20 flex items-center gap-1 shrink-0">
            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
            {item.category || 'Prompt'}
          </span>
          <span className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">
            {item.title}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {bodyText && (
            <button
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                handlers.onCopy(item.content || item.description, 'Prompt copiado al portapapeles');
              }}
              className="text-[11px] text-slate-300 hover:text-surface-dark hover:bg-primary bg-white/5 border border-white/10 hover:border-primary px-2 py-0.5 rounded-sm transition-colors flex items-center gap-1"
              title="Copiar prompt en 1 clic"
            >
              <span className="material-symbols-outlined text-[13px]">content_copy</span>
              <span className="hidden sm:inline">Copiar</span>
            </button>
          )}
          <ItemActions item={item} handlers={handlers} size="sm" />
        </div>
      </div>

      {!compact && item.tags.length > 0 && (
        <div className="mt-1.5">
          <TagList tags={item.tags} />
        </div>
      )}

      {!compact && bodyText && (
        <div className="bg-black/30 p-2.5 rounded border border-white/5 mt-2 max-h-16 overflow-hidden relative fade-bottom">
          <code className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed block">
            {bodyText}
          </code>
        </div>
      )}
    </div>
  );
}

export function LinkRow({ item, handlers, onOpen, onDetail, compact }: CardProps) {
  const href = safeHref(item.url);
  const domain = domainFromUrl(item.url);
  const subLabel = item.category || domain || item.description;

  return (
    <div
      className={`group flex items-center justify-between gap-3 ${
        compact ? 'p-2' : 'p-2.5'
      } bg-surface-dark hover:bg-primary/10 border ${
        item.pinned ? 'border-primary/35' : 'border-primary/5'
      } hover:border-primary/30 transition-all rounded-sm cursor-pointer`}
      onClick={() => onOpen(item)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded bg-blue-500/10 grid place-items-center text-blue-400 shrink-0">
          <span className="material-symbols-outlined text-lg">{href ? 'link' : 'bookmark'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-200 group-hover:text-primary transition-colors truncate">
            {item.title}
          </p>
          {(subLabel || item.tags.length > 0) && (
            <div className="flex items-center gap-2 mt-0.5">
              {subLabel && (
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate">{subLabel}</p>
              )}
              {!compact && <TagList tags={item.tags} max={2} />}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center shrink-0">
        {href && (
          <button
            className="text-slate-600 hover:text-primary transition-all opacity-0 group-hover:opacity-100 p-1"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              handlers.onCopy(href, 'Link copiado');
            }}
            title="Copiar URL"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
          </button>
        )}
        <DetailButton item={item} onDetail={onDetail} />
        <ItemActions item={item} handlers={handlers} />
      </div>
    </div>
  );
}

export function NoteCard({ item, handlers, onOpen, compact }: CardProps) {
  const preview = item.content.trim() || item.description.trim();

  return (
    <div
      className={`group bg-surface-dark border ${
        item.pinned ? 'border-primary/35 bg-primary/[0.03]' : 'border-primary/10'
      } hover:border-primary/40 transition-all rounded-sm ${compact ? 'p-2.5' : 'p-3'} cursor-pointer flex flex-col justify-between`}
      onClick={() => onOpen(item)}
    >
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-primary/60 text-[18px] shrink-0">sticky_note_2</span>
            <h4 className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">
              {item.title}
            </h4>
          </div>
          <div className="flex items-center shrink-0">
            {preview && (
              <button
                className="text-slate-500 hover:text-primary transition-all opacity-0 group-hover:opacity-100 p-1"
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  handlers.onCopy(preview, 'Nota copiada');
                }}
                title="Copiar texto de la nota"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
              </button>
            )}
            <ItemActions item={item} handlers={handlers} />
          </div>
        </div>

        {(item.category || item.meta.source) && (
          <div className="flex items-center gap-2 mt-1 ml-6">
            {item.category && (
              <span className="text-[9px] uppercase tracking-widest text-primary/80 font-semibold">
                {item.category}
              </span>
            )}
            {item.meta.source && (
              <span className="text-[10px] text-slate-500 truncate">· {item.meta.source}</span>
            )}
          </div>
        )}

        {!compact && preview && (
          <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-3 whitespace-pre-wrap">{preview}</p>
        )}
      </div>

      {!compact && item.tags.length > 0 && (
        <div className="mt-2 pt-1">
          <TagList tags={item.tags} />
        </div>
      )}
    </div>
  );
}

export function PersonCard({ item, handlers, onOpen, compact }: CardProps) {
  const days = daysUntilBirthday(item.meta.birthday);
  const soon = days !== null && days <= 7;

  return (
    <div
      className={`group flex items-center gap-3 ${
        compact ? 'p-2' : 'p-2.5'
      } bg-surface-dark border ${
        item.pinned ? 'border-primary/35' : 'border-primary/10'
      } hover:border-primary/40 transition-all rounded-sm cursor-pointer`}
      onClick={() => onOpen(item)}
    >
      <div className="w-9 h-9 rounded-full bg-primary/15 grid place-items-center text-primary text-xs font-bold shrink-0 border border-primary/20">
        {initials(item.title) || '?'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate group-hover:text-primary transition-colors">
          {item.title}
        </p>
        {item.meta.role && <p className="text-[10px] text-slate-400 truncate">{item.meta.role}</p>}
      </div>

      {item.meta.birthday && (
        <span
          className={`text-[9px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 ${
            soon ? 'text-yellow-400' : 'text-slate-500'
          }`}
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

