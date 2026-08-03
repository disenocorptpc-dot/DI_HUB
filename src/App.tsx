import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BirthdayStrip from './components/BirthdayStrip';
import { LinkRow, NoteCard, PersonCard, PromptCard, WebAppCard } from './components/Cards';
import DetailModal from './components/DetailModal';
import type { ItemHandlers } from './components/ItemActions';
import ItemFormModal from './components/ItemFormModal';
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import Toast, { type ToastState } from './components/Toast';
import { createItem, deleteItem as requestDelete, errorMessage, fetchItems, safeHref, updateItem } from './lib/api';
import { collectTags, matchesQuery } from './lib/search';
import {
  ITEM_TYPES,
  TYPE_ICONS,
  draftFromItem,
  emptyDraft,
  type Item,
  type ItemDraft,
  type ItemType,
} from './types';

const FAVORITES_KEY = 'hub_favorites';

const readFavorites = (): number[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : [];
  } catch {
    // Storage corrupto no debe dejar la app en blanco.
    return [];
  }
};

const SECTION_TITLES: Record<ItemType, string> = {
  webapp: 'Web Apps Internas',
  prompt: 'Prompt Masters',
  link: 'SharePoint & Docs',
  note: 'Notas',
  person: 'Equipo',
};

const SECTION_EMPTY: Record<ItemType, string> = {
  webapp: 'Sin apps registradas todavía.',
  prompt: 'Sin prompts guardados todavía.',
  link: 'Sin links todavía.',
  note: 'Sin notas todavía. Aquí van juntas, ideas y procesos.',
  person: 'Sin personas todavía. Agrega a tu equipo y sus cumpleaños.',
};

const SECTION_GRIDS: Record<ItemType, string> = {
  webapp: 'grid grid-cols-1 lg:grid-cols-2 gap-2',
  prompt: 'space-y-3',
  link: 'space-y-2',
  note: 'grid grid-cols-1 lg:grid-cols-2 gap-2',
  person: 'space-y-2',
};

const ADD_LABELS: Record<ItemType, string> = {
  webapp: 'Agregar web app',
  prompt: 'Agregar prompt',
  link: 'Agregar link',
  note: 'Nueva nota',
  person: 'Agregar persona',
};

function Section({
  type,
  count,
  onAdd,
  children,
}: {
  type: ItemType;
  count: number;
  onAdd: (type: ItemType) => void;
  children: React.ReactNode;
}) {
  return (
    <section id={type} className="bg-surface border border-primary/10 p-5 rounded-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">{TYPE_ICONS[type]}</span> {SECTION_TITLES[type]}
        </h3>
        <div className="flex items-center gap-3">
          {count > 0 && <span className="text-xs text-slate-600 tabular-nums">{count}</span>}
          <button
            onClick={() => onAdd(type)}
            title={ADD_LABELS[type]}
            aria-label={ADD_LABELS[type]}
            className="w-7 h-7 grid place-items-center rounded-sm border border-primary/20 text-primary/70 hover:text-surface-dark hover:bg-primary hover:border-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const [favorites, setFavorites] = useState<number[]>(readFavorites);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [form, setForm] = useState<{ initial: ItemDraft; editingId: number | null } | null>(null);
  const [detail, setDetail] = useState<Item | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((message: string, color = 'bg-primary') => {
    window.clearTimeout(toastTimer.current);
    setToast({ message, color });
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // Incrementar el token vuelve a disparar la carga. Los setState viven dentro de
  // los callbacks de la promesa, no en el cuerpo del efecto.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken(token => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    fetchItems()
      .then(data => {
        if (cancelled) return;
        setItems(data);
        setLoadError('');
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(errorMessage(e, 'No se pudo cargar la base de datos.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Modo privado o storage lleno: los favoritos simplemente no persisten.
    }
  }, [favorites]);

  const copyText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast('✅ Copiado al portapapeles');
      } catch {
        showToast('No se pudo copiar', 'bg-red-400');
      }
    },
    [showToast],
  );

  const openEditor = useCallback((item: Item) => {
    setDetail(null);
    setForm({ initial: draftFromItem(item), editingId: item.id });
  }, []);

  /** Abre el formulario en blanco con el tipo ya elegido. */
  const startCreate = useCallback((type: ItemType) => {
    setForm({ initial: emptyDraft(type), editingId: null });
  }, []);

  const handlers: ItemHandlers = useMemo(
    () => ({
      isFavorite: id => favorites.includes(id),
      onToggleFavorite: (e, id) => {
        e.stopPropagation();
        e.preventDefault();
        const wasFav = favorites.includes(id);
        setFavorites(prev => (wasFav ? prev.filter(f => f !== id) : [...prev, id]));
        showToast(wasFav ? 'Retirado de favoritos' : '⭐ Añadido a favoritos', wasFav ? 'bg-slate-400' : 'bg-yellow-400');
      },
      onEdit: openEditor,
      onDelete: item => setPendingDelete(item),
    }),
    [favorites, showToast, openEditor],
  );

  const save = async (draft: ItemDraft) => {
    if (!form) return;

    if (form.editingId !== null) {
      await updateItem(form.editingId, draft);
      showToast('✅ Cambios guardados', 'bg-emerald-400');
    } else {
      await createItem(draft);
      showToast('🚀 Aporte guardado', 'bg-emerald-400');
    }

    setForm(null);
    reload();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;

    setDeleting(true);
    try {
      await requestDelete(target.id);
      setItems(prev => prev.filter(item => item.id !== target.id));
      setFavorites(prev => prev.filter(id => id !== target.id));
      if (detail?.id === target.id) setDetail(null);
      setPendingDelete(null);
      showToast('🗑️ Aporte eliminado', 'bg-slate-500');
    } catch (e) {
      showToast(errorMessage(e, 'Error al eliminar'), 'bg-red-400');
    } finally {
      setDeleting(false);
    }
  };

  const launch = useCallback(
    (item: Item) => {
      const href = safeHref(item.url);
      if (!href) {
        setDetail(item);
        return;
      }
      window.open(href, '_blank', 'noopener,noreferrer');
      showToast(`Abriendo ${item.title}…`, 'bg-emerald-400');
    },
    [showToast],
  );

  const counts = useMemo(() => {
    const base = { webapp: 0, prompt: 0, link: 0, note: 0, person: 0 } as Record<ItemType, number>;
    for (const item of items) base[item.type] += 1;
    return base;
  }, [items]);

  const tags = useMemo(() => collectTags(items), [items]);

  const isFiltering = query.trim() !== '' || typeFilter !== null || tagFilter !== null || favoritesOnly;

  const visible = useMemo(() => {
    const favSet = new Set(favorites);
    return items
      .filter(
        item =>
          (typeFilter === null || item.type === typeFilter) &&
          (tagFilter === null || item.tags.includes(tagFilter)) &&
          (!favoritesOnly || favSet.has(item.id)) &&
          matchesQuery(item, query),
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const aFav = favSet.has(a.id);
        const bFav = favSet.has(b.id);
        if (aFav !== bFav) return aFav ? -1 : 1;
        return b.id - a.id;
      });
  }, [items, favorites, typeFilter, tagFilter, favoritesOnly, query]);

  const groupOf = useCallback((type: ItemType) => visible.filter(item => item.type === type), [visible]);

  const renderCard = useCallback(
    (item: Item) => {
      const shared = { key: item.id, item, handlers };
      switch (item.type) {
        case 'webapp':
          return <WebAppCard {...shared} onOpen={launch} onDetail={next => setDetail(next)} />;
        case 'link':
          return <LinkRow {...shared} onOpen={launch} onDetail={next => setDetail(next)} />;
        case 'prompt':
          return <PromptCard {...shared} onOpen={next => setDetail(next)} />;
        case 'note':
          return <NoteCard {...shared} onOpen={next => setDetail(next)} />;
        case 'person':
          return <PersonCard {...shared} onOpen={next => setDetail(next)} />;
        default:
          return null;
      }
    },
    [handlers, launch],
  );

  const renderSection = useCallback(
    (type: ItemType) => {
      const group = groupOf(type);
      if (isFiltering && group.length === 0) return null;

      return (
        <Section key={type} type={type} count={group.length} onAdd={startCreate}>
          {group.length === 0 ? (
            <button
              onClick={() => startCreate(type)}
              className="w-full text-left text-xs text-slate-500 py-3 px-3 border border-dashed border-primary/20 rounded-sm hover:border-primary/40 hover:text-slate-400 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px] text-primary/50">add</span>
              {SECTION_EMPTY[type]}
            </button>
          ) : (
            <div className={SECTION_GRIDS[type]}>{group.map(renderCard)}</div>
          )}
        </Section>
      );
    },
    [groupOf, isFiltering, renderCard, startCreate],
  );

  const clearFilters = () => {
    setQuery('');
    setTypeFilter(null);
    setTagFilter(null);
    setFavoritesOnly(false);
  };

  const people = useMemo(() => items.filter(item => item.type === 'person'), [items]);

  return (
    <div className="min-h-screen bg-surface-dark font-body-md text-slate-200 selection:bg-primary-container selection:text-surface-dark">
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-6 py-3 h-16 bg-surface-dark border-b border-primary/10">
        <div className="flex items-center gap-8 min-w-0">
          <h1 className="text-xl font-bold text-primary-container tracking-tighter font-headline-md shrink-0">
            Corporate Hub
          </h1>
          <div className="hidden md:flex items-center bg-surface rounded px-3 py-1.5 border border-primary/10 w-96 transition-colors focus-within:border-primary/50">
            <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
            <input
              className="bg-transparent border-none text-sm w-full text-slate-200 placeholder-slate-500 outline-none"
              placeholder="Buscar apps, prompts, notas, personas…"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white" aria-label="Limpiar búsqueda">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => startCreate(typeFilter ?? 'webapp')}
            className="bg-primary-container text-surface-dark font-bold py-1.5 px-4 rounded transition-all hover:bg-primary text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm">add</span> Nuevo Aporte
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-surface grid place-items-center shrink-0">
            <span className="material-symbols-outlined text-slate-400">person</span>
          </div>
        </div>
      </header>

      <Sidebar
        counts={counts}
        activeType={typeFilter}
        onSelectType={setTypeFilter}
        favoritesOnly={favoritesOnly}
        onToggleFavoritesOnly={() => setFavoritesOnly(v => !v)}
        favoritesCount={favorites.length}
        tags={tags}
        activeTag={tagFilter}
        onSelectTag={setTagFilter}
      />

      <main className="md:ml-64 pt-24 pb-12 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="mb-8">
            <h3 className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-1">Misión Control</h3>
            <h2 className="text-3xl font-headline-xl text-white">Ecosistema de Herramientas</h2>
            <div className="h-1 w-12 bg-primary mt-4"></div>
          </div>

          {isFiltering && (
            <div className="mb-6 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-500">
                {visible.length} {visible.length === 1 ? 'resultado' : 'resultados'}
              </span>
              {query && <span className="bg-surface border border-primary/20 px-2 py-1 rounded-sm text-primary">“{query}”</span>}
              {typeFilter && (
                <span className="bg-surface border border-primary/20 px-2 py-1 rounded-sm text-primary">
                  {SECTION_TITLES[typeFilter]}
                </span>
              )}
              {tagFilter && (
                <span className="bg-surface border border-primary/20 px-2 py-1 rounded-sm text-primary">#{tagFilter}</span>
              )}
              {favoritesOnly && (
                <span className="bg-surface border border-yellow-400/30 px-2 py-1 rounded-sm text-yellow-400">Favoritos</span>
              )}
              <button onClick={clearFilters} className="text-slate-500 hover:text-white underline">
                Limpiar
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="text-slate-400 animate-pulse flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin">sync</span> Cargando base de datos…
            </div>
          ) : loadError ? (
            <div className="p-8 border border-red-400/30 bg-red-400/5 rounded text-center">
              <span className="material-symbols-outlined text-4xl mb-3 text-red-400/70">cloud_off</span>
              <p className="text-slate-300 mb-1">No se pudo cargar la base de datos.</p>
              <p className="text-xs text-slate-500 font-mono mb-4">{loadError}</p>
              <button
                onClick={() => {
                  setIsLoading(true);
                  reload();
                }}
                className="bg-primary text-surface-dark font-bold px-4 py-2 rounded-sm text-sm hover:bg-white transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 border border-dashed border-primary/20 rounded text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-3 opacity-50">database</span>
              <p>La base de datos está vacía. ¡Agrega tu primer aporte!</p>
            </div>
          ) : isFiltering ? (
            visible.length === 0 ? (
              <div className="p-10 border border-dashed border-primary/20 rounded text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">search_off</span>
                <p>Nada coincide con ese filtro.</p>
              </div>
            ) : (
              <div className="space-y-6">{ITEM_TYPES.map(renderSection)}</div>
            )
          ) : (
            <>
              <BirthdayStrip people={people} onOpen={next => setDetail(next)} />

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-7 space-y-6">
                  {renderSection('webapp')}
                  {renderSection('note')}
                </div>
                <div className="xl:col-span-5 space-y-6">
                  {renderSection('prompt')}
                  {renderSection('person')}
                  {renderSection('link')}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {form && (
        <ItemFormModal
          key={form.editingId ?? 'new'}
          initial={form.initial}
          editingId={form.editingId}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}

      {detail && (
        <DetailModal item={detail} onClose={() => setDetail(null)} onEdit={openEditor} onCopy={copyText} />
      )}

      {pendingDelete && (
        <Modal
          title="¿Eliminar este aporte?"
          size="sm"
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <button
                className="text-slate-400 hover:text-white px-4 py-2 text-sm transition-colors font-medium"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="bg-red-500 text-white font-bold px-6 py-2 rounded-sm text-sm hover:bg-red-400 transition-colors disabled:opacity-50"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-300">
            Se va a borrar <strong className="text-white">{pendingDelete.title}</strong> de forma permanente. Esta acción
            no se puede deshacer.
          </p>
        </Modal>
      )}

      <Toast toast={toast} />
    </div>
  );
}
