import { TYPE_ICONS, TYPE_LABELS, ITEM_TYPES, type ItemType } from '../types';

const SECTION_LABELS: Record<ItemType, string> = {
  webapp: 'Web Apps & Tools',
  prompt: 'Prompt Masters',
  link: 'SharePoint & Links',
  note: 'Notas',
  person: 'Equipo',
};

type Props = {
  counts: Record<ItemType, number>;
  activeType: ItemType | null;
  onSelectType: (type: ItemType | null) => void;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favoritesCount: number;
  pinnedOnly: boolean;
  onTogglePinnedOnly: () => void;
  pinnedCount: number;
  unclassifiedOnly: boolean;
  onToggleUnclassifiedOnly: () => void;
  unclassifiedCount: number;
  categories: { category: string; count: number }[];
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  tags: { tag: string; count: number }[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
};

export default function Sidebar({
  counts,
  activeType,
  onSelectType,
  favoritesOnly,
  onToggleFavoritesOnly,
  favoritesCount,
  pinnedOnly,
  onTogglePinnedOnly,
  pinnedCount,
  unclassifiedOnly,
  onToggleUnclassifiedOnly,
  unclassifiedCount,
  categories,
  activeCategory,
  onSelectCategory,
  tags,
  activeTag,
  onSelectTag,
}: Props) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <aside className="hidden md:flex flex-col h-screen pt-20 pb-6 w-64 bg-surface border-r border-primary/10 fixed left-0 top-0 z-30 overflow-y-auto">
      <nav className="flex-1 px-2 space-y-1 mt-4">
        <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 mb-2">Directorio</p>

        <button
          onClick={() => onSelectType(null)}
          className={`w-full flex items-center gap-3 px-4 py-2 transition-all text-sm font-medium ${
            activeType === null && !favoritesOnly && !pinnedOnly && !unclassifiedOnly && !activeCategory && !activeTag
              ? 'bg-surface-dark text-primary-container border-l-2 border-primary-container'
              : 'text-slate-400 hover:bg-surface-dark/50 hover:text-primary border-l-2 border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="flex-1 text-left">Todo el Hub</span>
          {totalCount > 0 && <span className="text-[10px] text-slate-600 tabular-nums">{totalCount}</span>}
        </button>

        {ITEM_TYPES.map(type => (
          <button
            key={type}
            onClick={() => onSelectType(activeType === type ? null : type)}
            className={`w-full flex items-center gap-3 px-4 py-2 transition-all text-sm ${
              activeType === type
                ? 'bg-surface-dark text-primary border-l-2 border-primary'
                : 'text-slate-400 hover:bg-surface-dark/50 hover:text-primary border-l-2 border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{TYPE_ICONS[type]}</span>
            <span className="flex-1 text-left truncate">{SECTION_LABELS[type]}</span>
            {counts[type] > 0 && <span className="text-[10px] text-slate-600 tabular-nums">{counts[type]}</span>}
          </button>
        ))}

        <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 mt-6 mb-2">Vistas Rápidas</p>

        <button
          onClick={onTogglePinnedOnly}
          className={`w-full flex items-center gap-3 px-4 py-2 transition-all text-sm ${
            pinnedOnly
              ? 'bg-surface-dark text-primary border-l-2 border-primary'
              : 'text-slate-400 hover:bg-surface-dark/50 hover:text-primary border-l-2 border-transparent'
          }`}
        >
          <span
            className="material-symbols-outlined text-[19px]"
            style={pinnedOnly ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            keep
          </span>
          <span className="flex-1 text-left">Fijados arriba</span>
          {pinnedCount > 0 && <span className="text-[10px] text-slate-600 tabular-nums">{pinnedCount}</span>}
        </button>

        <button
          onClick={onToggleFavoritesOnly}
          className={`w-full flex items-center gap-3 px-4 py-2 transition-all text-sm ${
            favoritesOnly
              ? 'bg-surface-dark text-yellow-400 border-l-2 border-yellow-400'
              : 'text-slate-400 hover:bg-surface-dark/50 hover:text-yellow-400 border-l-2 border-transparent'
          }`}
        >
          <span
            className="material-symbols-outlined text-[19px]"
            style={favoritesOnly ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            star
          </span>
          <span className="flex-1 text-left">Mis Favoritos</span>
          {favoritesCount > 0 && <span className="text-[10px] text-slate-600 tabular-nums">{favoritesCount}</span>}
        </button>

        {unclassifiedCount > 0 && (
          <button
            onClick={onToggleUnclassifiedOnly}
            className={`w-full flex items-center gap-3 px-4 py-2 transition-all text-sm ${
              unclassifiedOnly
                ? 'bg-surface-dark text-amber-300 border-l-2 border-amber-300'
                : 'text-slate-400 hover:bg-surface-dark/50 hover:text-amber-300 border-l-2 border-transparent'
            }`}
            title="Aportes capturados rápido sin carpeta ni tags"
          >
            <span className="material-symbols-outlined text-[19px]">inbox</span>
            <span className="flex-1 text-left">Sin carpeta / tag</span>
            <span className="text-[10px] text-amber-400/80 tabular-nums">{unclassifiedCount}</span>
          </button>
        )}

        {categories.length > 0 && (
          <>
            <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 mt-6 mb-2">Carpetas</p>
            <div className="px-3 flex flex-wrap gap-1.5">
              {categories.slice(0, 12).map(({ category, count }) => (
                <button
                  key={category}
                  onClick={() => onSelectCategory(activeCategory === category ? null : category)}
                  className={`text-[10px] px-2 py-1 rounded-sm border transition-colors flex items-center gap-1 ${
                    activeCategory === category
                      ? 'bg-primary text-surface-dark border-primary font-bold'
                      : 'bg-surface-dark text-slate-400 border-primary/15 hover:text-primary hover:border-primary/40'
                  }`}
                >
                  <span className="truncate max-w-[125px]">{category}</span>
                  <span className={activeCategory === category ? 'text-surface-dark/70' : 'text-slate-600'}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {tags.length > 0 && (
          <>
            <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 mt-6 mb-2">Tags</p>
            <div className="px-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 18).map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(activeTag === tag ? null : tag)}
                  className={`text-[10px] px-2 py-1 rounded-sm border transition-colors ${
                    activeTag === tag
                      ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
                      : 'bg-surface-dark text-slate-500 border-primary/10 hover:text-primary hover:border-primary/30'
                  }`}
                >
                  #{tag} <span className="text-slate-600">{count}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      <p className="px-4 text-[9px] text-slate-600 leading-relaxed mt-6">
        {TYPE_LABELS.note}s, {TYPE_LABELS.person.toLowerCase()}s y links viven en la misma base. Nada se oculta ni se archiva.
      </p>
    </aside>
  );
}

