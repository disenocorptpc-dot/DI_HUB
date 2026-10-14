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
import { collectCategories, collectTags, domainFromUrl, inferFromUrl, isUnclassified, matchesQuery } from './lib/search';
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
    return [];
  }
};

const SECTION_TITLES: Record<ItemType, string> = {
  webapp: 'Web Apps Internas',
  prompt: 'Prompt Masters',
  link: 'SharePoint & Docs',
  note: 'Notas & Acuerdos',
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
  prompt: 'space-y-2.5',
  link: 'space-y-1.5',
  note: 'grid grid-cols-1 lg:grid-cols-2 gap-2.5',
  person: 'space-y-2',
};

const ADD_LABELS: Record<ItemType, string> = {
  webapp: 'Agregar web app',
  prompt: 'Agregar prompt',
  link: 'Agregar link',
  note: 'Nueva nota',
  person: 'Agregar persona',
};

type SortMode = 'recent' | 'alpha' | 'updated';

const UNFILED_KEY = '__sin_carpeta__';

function Section({
  type,
  items,
  selectedCategory,
  onSelectCategory,
  groupByCategory,
  onAdd,
  renderCard,
}: {
  type: ItemType;
  items: Item[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  groupByCategory: boolean;
  onAdd: (type: ItemType) => void;
  renderCard: (item: Item) => React.ReactNode;
}) {
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let unfiled = 0;
    for (const item of items) {
      const cat = item.category.trim();
      if (cat) {
        map.set(cat, (map.get(cat) ?? 0) + 1);
      } else {
        unfiled += 1;
      }
    }
    const list = [...map.entries()]
      .map(([name, count]) => ({ key: name, label: name, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    if (unfiled > 0 && list.length > 0) {
      list.push({ key: UNFILED_KEY, label: 'Sin carpeta', count: unfiled });
    }
    return list;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    if (selectedCategory === UNFILED_KEY) return items.filter(i => !i.category.trim());
    return items.filter(i => i.category.trim() === selectedCategory);
  }, [items, selectedCategory]);

  const groupedBlocks = useMemo(() => {
    if (!groupByCategory || selectedCategory) return null;
    const map = new Map<string, Item[]>();
    for (const item of filteredItems) {
      const key = item.category.trim() || 'General / Sin carpeta';
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    if (map.size <= 1) return null;
    return [...map.entries()];
  }, [filteredItems, groupByCategory, selectedCategory]);

  return (
    <section id={type} className="bg-surface border border-primary/10 p-5 rounded-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">{TYPE_ICONS[type]}</span> {SECTION_TITLES[type]}
        </h3>
        <div className="flex items-center gap-3">
          {items.length > 0 && <span className="text-xs text-slate-500 tabular-nums">{items.length}</span>}
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

      {/* Sub-pestañas automáticas por carpeta cuando hay más de una */}
      {categoryBreakdown.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3 pb-2 border-b border-primary/10">
          <button
            onClick={() => onSelectCategory(null)}
            className={`text-[10px] px-2 py-0.5 rounded-sm border transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-surface-dark border-primary font-bold'
                : 'bg-surface-dark text-slate-400 border-primary/10 hover:text-white'
            }`}
          >
            Todas ({items.length})
          </button>
          {categoryBreakdown.map(cat => (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(selectedCategory === cat.key ? null : cat.key)}
              className={`text-[10px] px-2 py-0.5 rounded-sm border transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-primary text-surface-dark border-primary font-bold'
                  : 'bg-surface-dark text-slate-400 border-primary/10 hover:text-white'
              }`}
            >
              {cat.label} <span className="opacity-60">{cat.count}</span>
            </button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <button
          onClick={() => onAdd(type)}
          className="w-full text-left text-xs text-slate-500 py-3 px-3 border border-dashed border-primary/20 rounded-sm hover:border-primary/40 hover:text-slate-400 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px] text-primary/50">add</span>
          {SECTION_EMPTY[type]}
        </button>
      ) : groupedBlocks ? (
        <div className="space-y-4">
          {groupedBlocks.map(([folderName, folderItems]) => (
            <div key={folderName} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-primary/60">folder</span>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">{folderName}</span>
                <span className="text-[10px] text-slate-600">({folderItems.length})</span>
                <div className="flex-1 border-b border-primary/10" />
              </div>
              <div className={SECTION_GRIDS[type]}>{folderItems.map(renderCard)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className={SECTION_GRIDS[type]}>{filteredItems.map(renderCard)}</div>
      )}
    </section>
  );
}

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [favorites, setFavorites] = useState<number[]>(readFavorites);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [unclassifiedOnly, setUnclassifiedOnly] = useState(false);

  // Sub-filtro de carpeta local por sección
  const [sectionCategory, setSectionCategory] = useState<Partial<Record<ItemType, string | null>>>({});

  // Controles de visualización
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  // Barra de captura rápida ("Brain Dump" en 1 paso)
  const [quickText, setQuickText] = useState('');
  const [quickType, setQuickType] = useState<ItemType | 'auto'>('auto');
  const [quickSaving, setQuickSaving] = useState(false);

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

  // Atajo Ctrl+K o "/" para ir directo al buscador
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
      // Ignorar si storage está lleno
    }
  }, [favorites]);

  const copyText = useCallback(
    async (text: string, label = 'Copiado al portapapeles') => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`✅ ${label}`);
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

  const startCreate = useCallback((type: ItemType) => {
    setForm({ initial: emptyDraft(type), editingId: null });
  }, []);

  const togglePin = useCallback(
    async (e: React.MouseEvent, item: Item) => {
      e.stopPropagation();
      e.preventDefault();
      const nextPinned = !item.pinned;
      // Actualización optimista inmediata
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, pinned: nextPinned } : i)));
      try {
        await updateItem(item.id, { ...draftFromItem(item), pinned: nextPinned });
        showToast(nextPinned ? '📌 Fijado arriba en su sección' : 'Desfijado', nextPinned ? 'bg-primary' : 'bg-slate-400');
      } catch (err) {
        setItems(prev => prev.map(i => (i.id === item.id ? { ...i, pinned: item.pinned } : i)));
        showToast(errorMessage(err, 'No se pudo actualizar el pin'), 'bg-red-400');
      }
    },
    [showToast],
  );

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
      onTogglePin: togglePin,
      onCopy: copyText,
      onEdit: openEditor,
      onDelete: item => setPendingDelete(item),
    }),
    [favorites, showToast, togglePin, copyText, openEditor],
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

  /** Captura rápida de 1 línea para vaciar la mente sin llenar formularios. */
  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickText.trim();
    if (!raw || quickSaving) return;

    const looksLikeUrl = /^https?:\/\/\S+$/i.test(raw) || /^[a-z0-9.-]+\.(com|app|dev|mx|org|io|net)(\/\S*)?$/i.test(raw);
    const resolvedType: ItemType =
      quickType !== 'auto' ? quickType : looksLikeUrl ? 'link' : 'note';

    const draft = emptyDraft(resolvedType);

    if (looksLikeUrl) {
      const normalizedUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const inferred = inferFromUrl(normalizedUrl);
      const host = domainFromUrl(normalizedUrl);
      draft.url = normalizedUrl;
      draft.title = inferred.category ? `${inferred.category} — ${host}` : host || normalizedUrl;
      draft.category = inferred.category ?? '';
      draft.tags = inferred.tags ?? [];
    } else if (resolvedType === 'note' || resolvedType === 'prompt') {
      const firstLine = raw.split('\n')[0].trim();
      draft.title = firstLine.length > 55 ? `${firstLine.slice(0, 55)}…` : firstLine;
      draft.content = raw;
      draft.category = resolvedType === 'note' ? 'Ideas' : 'Antigravity';
    } else {
      draft.title = raw;
    }

    setQuickSaving(true);
    try {
      await createItem(draft);
      setQuickText('');
      showToast(`⚡ Guardado en ${SECTION_TITLES[resolvedType]}`, 'bg-emerald-400');
      reload();
    } catch (err) {
      showToast(errorMessage(err, 'No se pudo guardar'), 'bg-red-400');
    } finally {
      setQuickSaving(false);
    }
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

  const pinnedCount = useMemo(() => items.filter(i => i.pinned).length, [items]);
  const unclassifiedCount = useMemo(() => items.filter(isUnclassified).length, [items]);

  const tags = useMemo(() => collectTags(items), [items]);
  const categories = useMemo(() => collectCategories(items, typeFilter ?? undefined), [items, typeFilter]);

  const existingCategoriesByType = useMemo(() => {
    const map: Record<ItemType, string[]> = {
      webapp: [],
      prompt: [],
      link: [],
      note: [],
      person: [],
    };
    for (const t of ITEM_TYPES) {
      map[t] = collectCategories(items, t).map(c => c.category);
    }
    return map;
  }, [items]);

  const isFiltering =
    query.trim() !== '' ||
    typeFilter !== null ||
    categoryFilter !== null ||
    tagFilter !== null ||
    favoritesOnly ||
    pinnedOnly ||
    unclassifiedOnly;

  const visible = useMemo(() => {
    const favSet = new Set(favorites);
    return items
      .filter(
        item =>
          (typeFilter === null || item.type === typeFilter) &&
          (categoryFilter === null || item.category.trim() === categoryFilter) &&
          (tagFilter === null || item.tags.some(t => t.toLowerCase() === tagFilter.toLowerCase())) &&
          (!favoritesOnly || favSet.has(item.id)) &&
          (!pinnedOnly || item.pinned) &&
          (!unclassifiedOnly || isUnclassified(item)) &&
          matchesQuery(item, query),
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const aFav = favSet.has(a.id);
        const bFav = favSet.has(b.id);
        if (aFav !== bFav) return aFav ? -1 : 1;

        if (sortMode === 'alpha') {
          return a.title.localeCompare(b.title);
        }
        if (sortMode === 'updated') {
          return (b.updated_at || '').localeCompare(a.updated_at || '') || b.id - a.id;
        }
        return b.id - a.id;
      });
  }, [
    items,
    favorites,
    typeFilter,
    categoryFilter,
    tagFilter,
    favoritesOnly,
    pinnedOnly,
    unclassifiedOnly,
    query,
    sortMode,
  ]);

  const groupOf = useCallback((type: ItemType) => visible.filter(item => item.type === type), [visible]);

  const renderCard = useCallback(
    (item: Item) => {
      const shared = { key: item.id, item, handlers, compact: compactMode };
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
    [handlers, launch, compactMode],
  );

  const renderSection = useCallback(
    (type: ItemType) => {
      const group = groupOf(type);
      if (isFiltering && group.length === 0) return null;

      return (
        <Section
          key={type}
          type={type}
          items={group}
          selectedCategory={sectionCategory[type] ?? null}
          onSelectCategory={cat => setSectionCategory(prev => ({ ...prev, [type]: cat }))}
          groupByCategory={groupByCategory}
          onAdd={startCreate}
          renderCard={renderCard}
        />
      );
    },
    [groupOf, isFiltering, sectionCategory, groupByCategory, startCreate, renderCard],
  );

  const clearFilters = () => {
    setQuery('');
    setTypeFilter(null);
    setCategoryFilter(null);
    setTagFilter(null);
    setFavoritesOnly(false);
    setPinnedOnly(false);
    setUnclassifiedOnly(false);
    setSectionCategory({});
  };

  const people = useMemo(() => items.filter(item => item.type === 'person'), [items]);

  return (
    <div className="min-h-screen bg-surface-dark font-body-md text-slate-200 selection:bg-primary-container selection:text-surface-dark">
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-6 py-3 h-16 bg-surface-dark border-b border-primary/10">
        <div className="flex items-center gap-6 min-w-0">
          <button
            onClick={clearFilters}
            className="text-xl font-bold text-primary-container tracking-tighter font-headline-md shrink-0 hover:text-primary transition-colors text-left"
          >
            DI HUB
          </button>
          <div className="hidden md:flex items-center bg-surface rounded px-3 py-1.5 border border-primary/10 w-96 transition-colors focus-within:border-primary/50">
            <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
            <input
              ref={searchInputRef}
              className="bg-transparent border-none text-sm w-full text-slate-200 placeholder-slate-500 outline-none"
              placeholder="Buscar apps, prompts, notas, personas… (Ctrl+K)"
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

        <div className="flex items-center gap-2.5">
          {/* Controles rápidos de vista */}
          <div className="hidden lg:flex items-center bg-surface border border-primary/10 rounded-sm p-0.5 text-xs">
            <button
              onClick={() => setGroupByCategory(v => !v)}
              className={`px-2.5 py-1 rounded-sm flex items-center gap-1 transition-colors ${
                groupByCategory ? 'bg-primary/15 text-primary font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Agrupar por carpetas dentro de cada sección"
            >
              <span className="material-symbols-outlined text-[15px]">folder</span>
              Carpetas
            </button>
            <button
              onClick={() => setCompactMode(v => !v)}
              className={`px-2.5 py-1 rounded-sm flex items-center gap-1 transition-colors ${
                compactMode ? 'bg-primary/15 text-primary font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Alternar vista compacta para ver más items sin hacer scroll"
            >
              <span className="material-symbols-outlined text-[15px]">view_compact</span>
              Compacto
            </button>
          </div>

          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            aria-label="Ordenar aportes"
            className="hidden sm:block bg-surface border border-primary/10 rounded-sm px-2.5 py-1.5 text-xs text-slate-300 focus:border-primary focus:outline-none"
          >
            <option value="recent">Orden: Recientes</option>
            <option value="updated">Orden: Editados</option>
            <option value="alpha">Orden: A–Z</option>
          </select>

          <button
            onClick={() => startCreate(typeFilter ?? 'note')}
            className="bg-primary-container text-surface-dark font-bold py-1.5 px-4 rounded transition-all hover:bg-primary text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm">add</span> Nuevo Aporte
          </button>
        </div>
      </header>

      <Sidebar
        counts={counts}
        activeType={typeFilter}
        onSelectType={setTypeFilter}
        favoritesOnly={favoritesOnly}
        onToggleFavoritesOnly={() => setFavoritesOnly(v => !v)}
        favoritesCount={favorites.length}
        pinnedOnly={pinnedOnly}
        onTogglePinnedOnly={() => setPinnedOnly(v => !v)}
        pinnedCount={pinnedCount}
        unclassifiedOnly={unclassifiedOnly}
        onToggleUnclassifiedOnly={() => setUnclassifiedOnly(v => !v)}
        unclassifiedCount={unclassifiedCount}
        categories={categories}
        activeCategory={categoryFilter}
        onSelectCategory={setCategoryFilter}
        tags={tags}
        activeTag={tagFilter}
        onSelectTag={setTagFilter}
      />

      <main className="md:ml-64 pt-22 pb-12 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8">
          {/* Header + Barra de Captura Rápida ("Brain Dump") */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h3 className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-1">Segundo Cerebro · Diseño Industrial</h3>
              <h2 className="text-2xl md:text-3xl font-headline-xl text-white">Ecosistema de Herramientas</h2>
              <div className="h-1 w-12 bg-primary mt-3"></div>
            </div>

            {/* Captura rápida en 1 segundo sin llenar campos */}
            <form
              onSubmit={handleQuickCapture}
              className="flex-1 max-w-2xl bg-surface border border-primary/20 rounded-sm p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 focus-within:border-primary/60 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0 px-1">
                <span className="material-symbols-outlined text-primary text-lg shrink-0">bolt</span>
                <input
                  type="text"
                  value={quickText}
                  onChange={e => setQuickText(e.target.value)}
                  placeholder="Sácalo de tu mente: pega un link o escribe una nota rápida y da Enter…"
                  className="bg-transparent border-none text-sm w-full text-white placeholder-slate-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 justify-end shrink-0">
                <select
                  value={quickType}
                  onChange={e => setQuickType(e.target.value as ItemType | 'auto')}
                  aria-label="Tipo de captura rápida"
                  className="bg-surface-dark border border-primary/15 text-[11px] text-slate-300 rounded-sm px-2 py-1.5 focus:outline-none focus:border-primary"
                >
                  <option value="auto">✨ Auto (Nota / Link)</option>
                  <option value="note">📝 Nota rápida</option>
                  <option value="link">🔗 Link / Doc</option>
                  <option value="webapp">🚀 Web App</option>
                  <option value="prompt">🤖 Prompt</option>
                </select>
                <button
                  type="submit"
                  disabled={!quickText.trim() || quickSaving}
                  className="bg-primary text-surface-dark font-bold text-xs px-3 py-1.5 rounded-sm hover:bg-white transition-colors disabled:opacity-40"
                >
                  {quickSaving ? '…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>

          {isFiltering && (
            <div className="mb-6 flex items-center gap-2 flex-wrap text-xs bg-surface/60 border border-primary/15 px-3 py-2 rounded-sm">
              <span className="text-slate-400 font-medium">
                Mostrando {visible.length} {visible.length === 1 ? 'aporte' : 'aportes'}:
              </span>
              {query && (
                <span className="bg-surface-dark border border-primary/20 px-2 py-0.5 rounded-sm text-primary">
                  “{query}”
                </span>
              )}
              {typeFilter && (
                <span className="bg-surface-dark border border-primary/20 px-2 py-0.5 rounded-sm text-primary">
                  {SECTION_TITLES[typeFilter]}
                </span>
              )}
              {categoryFilter && (
                <span className="bg-surface-dark border border-primary/20 px-2 py-0.5 rounded-sm text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">folder</span>
                  {categoryFilter}
                </span>
              )}
              {tagFilter && (
                <span className="bg-surface-dark border border-primary/20 px-2 py-0.5 rounded-sm text-primary">
                  #{tagFilter}
                </span>
              )}
              {pinnedOnly && (
                <span className="bg-surface-dark border border-primary/30 px-2 py-0.5 rounded-sm text-primary">
                  📌 Fijados
                </span>
              )}
              {favoritesOnly && (
                <span className="bg-surface-dark border border-yellow-400/30 px-2 py-0.5 rounded-sm text-yellow-400">
                  ⭐ Favoritos
                </span>
              )}
              {unclassifiedOnly && (
                <span className="bg-surface-dark border border-amber-400/30 px-2 py-0.5 rounded-sm text-amber-300">
                  Sin carpeta / tag
                </span>
              )}
              <button onClick={clearFilters} className="text-slate-400 hover:text-white underline ml-auto">
                Ver todo de nuevo
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
              <p>La base de datos está vacía. ¡Agrega tu primer aporte arriba!</p>
            </div>
          ) : isFiltering ? (
            visible.length === 0 ? (
              <div className="p-10 border border-dashed border-primary/20 rounded text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">search_off</span>
                <p>Nada coincide con ese filtro.</p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  Limpiar filtros
                </button>
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
                  {renderSection('link')}
                  {renderSection('person')}
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
          existingCategories={existingCategoriesByType}
          existingTags={tags.map(t => t.tag)}
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

