import { useMemo, useState } from 'react';
import Modal from './Modal';
import { MONTHS, buildBirthday, parseBirthday } from '../lib/dates';
import { errorMessage, parseTags } from '../lib/api';
import { inferFromUrl } from '../lib/search';
import {
  ITEM_TYPES,
  SUGGESTED_CATEGORIES,
  TYPE_LABELS,
  VAULTS,
  type ItemDraft,
  type ItemMeta,
  type ItemType,
} from '../types';

const inputClass =
  'w-full bg-surface-dark border border-primary/20 rounded-sm p-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors';

const Label = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
    {children}
    {hint && <span className="block normal-case tracking-normal text-[10px] text-slate-500 mt-0.5">{hint}</span>}
  </label>
);

const CATEGORY_LABELS: Record<ItemType, string> = {
  webapp: 'Categoría / Departamento',
  prompt: 'IA / Categoría',
  link: 'Carpeta / Ubicación',
  note: 'Carpeta / Tema',
  person: 'Área / Equipo',
};

type Props = {
  initial: ItemDraft;
  /** null cuando es creación; el id cuando es edición. */
  editingId: number | null;
  existingCategories?: Record<ItemType, string[]>;
  existingTags?: string[];
  onClose: () => void;
  onSave: (draft: ItemDraft) => Promise<void>;
};

const hasOptionalData = (draft: ItemDraft): boolean => {
  if (draft.type === 'webapp' || draft.type === 'link') {
    return Boolean(
      draft.description.trim() ||
        draft.meta.loginUser ||
        draft.meta.vault ||
        draft.meta.vaultUrl ||
        draft.meta.owner,
    );
  }
  if (draft.type === 'prompt') return Boolean(draft.description.trim());
  if (draft.type === 'note') return Boolean(draft.meta.source?.trim());
  if (draft.type === 'person') {
    return Boolean(draft.meta.email?.trim() || draft.meta.phone?.trim() || draft.content.trim());
  }
  return false;
};

export default function ItemFormModal({
  initial,
  editingId,
  existingCategories,
  existingTags = [],
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<ItemDraft>(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(', '));
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showOptional, setShowOptional] = useState(() => hasOptionalData(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const birthday = parseBirthday(draft.meta.birthday);
  const [bMonth, setBMonth] = useState(birthday?.month ?? 0);
  const [bDay, setBDay] = useState(birthday?.day ?? 0);
  const [bYear, setBYear] = useState(birthday?.year ?? null);

  const patch = (changes: Partial<ItemDraft>) => setDraft(current => ({ ...current, ...changes }));
  const patchMeta = (changes: Partial<ItemMeta>) =>
    setDraft(current => ({ ...current, meta: { ...current.meta, ...changes } }));

  const setBirthdayPart = (month: number, day: number, year: number | null) => {
    setBMonth(month);
    setBDay(day);
    setBYear(year);
    patchMeta({ birthday: buildBirthday(month, day, year) });
  };

  const type = draft.type;

  const categoryChoices = useMemo(() => {
    const base = SUGGESTED_CATEGORIES[type] ?? [];
    const custom = existingCategories?.[type] ?? [];
    const merged = new Set<string>([...custom, ...base]);
    if (draft.category.trim()) merged.add(draft.category.trim());
    return [...merged];
  }, [type, existingCategories, draft.category]);

  const activeTags = useMemo(() => parseTags(tagsText), [tagsText]);

  const toggleTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    const exists = activeTags.some(t => t.toLowerCase() === clean);
    const next = exists ? activeTags.filter(t => t.toLowerCase() !== clean) : [...activeTags, clean];
    setTagsText(next.join(', '));
  };

  const handleUrlChange = (url: string) => {
    const inferred = inferFromUrl(url);
    setDraft(current => {
      const nextCategory = current.category.trim() ? current.category : (inferred.category ?? '');
      return { ...current, url, category: nextCategory };
    });
    if (inferred.tags && inferred.tags.length > 0 && activeTags.length === 0) {
      setTagsText(inferred.tags.join(', '));
    }
  };

  const submit = async () => {
    let finalTitle = draft.title.trim();

    // Si en una nota o prompt escribieron el contenido rápido sin poner título,
    // tomamos la primera línea para no bloquear la captura.
    if (!finalTitle && (type === 'note' || type === 'prompt') && draft.content.trim()) {
      const firstLine = draft.content.trim().split('\n')[0].trim();
      finalTitle = firstLine.length > 55 ? `${firstLine.slice(0, 55)}…` : firstLine;
    }

    if (!finalTitle) {
      setError('Escribe al menos un título o contenido.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        ...draft,
        title: finalTitle,
        tags: parseTags(tagsText).map(t => t.toLowerCase()),
      });
    } catch (e) {
      setError(errorMessage(e, 'No se pudo guardar.'));
      setSaving(false);
    }
  };

  const isEditing = editingId !== null;

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">{isEditing ? 'edit' : 'bolt'}</span>
          {isEditing ? 'Editar aporte' : 'Captura rápida'}
        </span>
      }
      size="md"
      onClose={onClose}
      footer={
        <>
          {error && <span className="text-xs text-red-400 mr-auto self-center">{error}</span>}
          <button
            className="text-slate-400 hover:text-white px-4 py-2 text-sm transition-colors font-medium"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="bg-primary text-surface-dark font-bold px-6 py-2 rounded-sm text-sm hover:bg-white transition-colors disabled:opacity-50"
            onClick={submit}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>¿Qué quieres guardar?</Label>
          <div className="grid grid-cols-5 gap-1 bg-surface-dark p-1 border border-primary/10 rounded-sm">
            {ITEM_TYPES.map(option => (
              <button
                key={option}
                type="button"
                className={`font-medium py-1.5 rounded-sm text-[11px] transition-all ${
                  type === option
                    ? 'bg-surface border border-primary/30 text-primary font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => patch({ type: option })}
              >
                {TYPE_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        {/* Campos esenciales según el tipo */}
        <div>
          <Label
            hint={
              type === 'note' || type === 'prompt'
                ? 'Opcional si escribes el contenido abajo: tomaremos la primera línea automáticamente.'
                : undefined
            }
          >
            {type === 'person' ? 'Nombre completo' : 'Título / Nombre'}
          </Label>
          <input
            type="text"
            value={draft.title}
            onChange={e => patch({ title: e.target.value })}
            className={inputClass}
            placeholder={
              type === 'person'
                ? 'Ej. Homero / Mitchell / Marlon'
                : type === 'note'
                  ? 'Ej. Acuerdo de medidas Tencard (o déjalo vacío y escribe abajo)'
                  : type === 'prompt'
                    ? 'Ej. Revisor de planos KCL'
                    : 'Ej. PULSE / Carpeta de Renders'
            }
            autoFocus
          />
        </div>

        {(type === 'webapp' || type === 'link') && (
          <div>
            <Label hint="Al pegar el link detectamos la carpeta automáticamente si la dejas vacía.">URL / Link</Label>
            <input
              type="text"
              value={draft.url}
              onChange={e => handleUrlChange(e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="https://…"
            />
          </div>
        )}

        {type === 'prompt' && (
          <div>
            <Label>Contenido del prompt</Label>
            <textarea
              value={draft.content}
              onChange={e => patch({ content: e.target.value })}
              className={`${inputClass} h-36 resize-y font-mono`}
              placeholder="Pega o escribe aquí el prompt…"
            />
          </div>
        )}

        {type === 'note' && (
          <div>
            <Label>Nota / Idea rápida</Label>
            <textarea
              value={draft.content}
              onChange={e => patch({ content: e.target.value })}
              className={`${inputClass} h-36 resize-y`}
              placeholder="Sácalo de tu mente y escríbelo aquí sin preocuparte por el formato…"
            />
          </div>
        )}

        {type === 'person' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Puesto / Rol</Label>
              <input
                type="text"
                value={draft.meta.role ?? ''}
                onChange={e => patchMeta({ role: e.target.value })}
                className={inputClass}
                placeholder="Ej. Diseñador Industrial"
              />
            </div>
            <div>
              <Label>Cumpleaños (opcional)</Label>
              <div className="grid grid-cols-[1.3fr_0.8fr] gap-1.5">
                <select
                  value={bMonth}
                  onChange={e => setBirthdayPart(Number(e.target.value), bDay || 1, bYear)}
                  className={`${inputClass} appearance-none`}
                >
                  <option value={0}>Mes</option>
                  {MONTHS.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={bDay || ''}
                  onChange={e => setBirthdayPart(bMonth, Number(e.target.value), bYear)}
                  className={inputClass}
                  placeholder="Día"
                />
              </div>
            </div>
          </div>
        )}

        {/* Categoría con chips de 1 clic (excepto en Persona) */}
        {type !== 'person' && (
          <div>
            <Label hint="Un clic para elegir carpeta, o déjalo sin carpeta.">
              {CATEGORY_LABELS[type]}
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {categoryChoices.map(option => {
                const selected = draft.category === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => patch({ category: selected ? '' : option })}
                    className={`text-xs px-2.5 py-1 rounded-sm border transition-all ${
                      selected
                        ? 'bg-primary text-surface-dark border-primary font-bold'
                        : 'bg-surface-dark text-slate-400 border-primary/15 hover:border-primary/40 hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowCustomCategory(v => !v)}
                className="text-xs px-2.5 py-1 rounded-sm border border-dashed border-primary/25 text-primary/80 hover:border-primary hover:text-primary transition-colors"
              >
                + Otra…
              </button>
            </div>
            {showCustomCategory && (
              <input
                type="text"
                value={draft.category}
                onChange={e => patch({ category: e.target.value })}
                className={inputClass}
                placeholder="Escribe el nombre de la nueva carpeta o categoría…"
              />
            )}
          </div>
        )}

        {/* Tags con chips de 1 clic */}
        <div>
          <Label hint="Toca para activar o escribe separados por coma (opcional).">Tags rápidos</Label>
          {existingTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {existingTags.slice(0, 14).map(tag => {
                const active = activeTags.some(t => t.toLowerCase() === tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[11px] px-2 py-0.5 rounded-sm border transition-colors ${
                      active
                        ? 'bg-primary/20 text-primary border-primary/50 font-semibold'
                        : 'bg-surface-dark text-slate-500 border-primary/10 hover:text-slate-300'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
          <input
            type="text"
            value={tagsText}
            onChange={e => setTagsText(e.target.value)}
            className={inputClass}
            placeholder="3d, produccion, urgente…"
          />
        </div>

        {/* Acordeón de campos opcionales para no saturar la captura */}
        <div className="border-t border-primary/10 pt-3">
          <button
            type="button"
            onClick={() => setShowOptional(v => !v)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-primary py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-base">
                {showOptional ? 'expand_less' : 'expand_more'}
              </span>
              {type === 'webapp'
                ? 'Datos de acceso, gestor de contraseñas y descripción (opcional)'
                : type === 'person'
                  ? 'Correo, extensión, año de nacimiento y notas (opcional)'
                  : 'Más detalles / descripción / fuente (opcional)'}
            </span>
            {hasOptionalData(draft) && (
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Con datos</span>
            )}
          </button>

          {showOptional && (
            <div className="mt-3 space-y-4 bg-surface-dark/40 border border-primary/10 p-3.5 rounded-sm">
              {(type === 'webapp' || type === 'prompt' || type === 'link') && (
                <div>
                  <Label>{type === 'prompt' ? '¿Cuándo o para qué usar este prompt?' : 'Descripción corta'}</Label>
                  <textarea
                    value={draft.description}
                    onChange={e => patch({ description: e.target.value })}
                    className={`${inputClass} h-16 resize-none`}
                    placeholder="Opcional…"
                  />
                </div>
              )}

              {type === 'note' && (
                <div>
                  <Label hint="De dónde salió (link, junta, persona).">Fuente / Origen</Label>
                  <input
                    type="text"
                    value={draft.meta.source ?? ''}
                    onChange={e => patchMeta({ source: e.target.value })}
                    className={inputClass}
                    placeholder="https://… o 'Junta con Marlon'"
                  />
                </div>
              )}

              {type === 'webapp' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-sm">key</span>
                    <span className="text-[11px] uppercase tracking-wider font-bold">
                      Referencia de acceso (sin contraseñas)
                    </span>
                  </div>

                  <div>
                    <Label>Usuario / Email de acceso</Label>
                    <input
                      type="text"
                      value={draft.meta.loginUser ?? ''}
                      onChange={e => patchMeta({ loginUser: e.target.value })}
                      className={inputClass}
                      placeholder="usuario@thepalacecompany.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Gestor</Label>
                      <select
                        value={draft.meta.vault ?? ''}
                        onChange={e => patchMeta({ vault: e.target.value })}
                        className={`${inputClass} appearance-none`}
                      >
                        <option value="">— Ninguno —</option>
                        {VAULTS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Responsable</Label>
                      <input
                        type="text"
                        value={draft.meta.owner ?? ''}
                        onChange={e => patchMeta({ owner: e.target.value })}
                        className={inputClass}
                        placeholder="Quién la administra"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Link directo en el gestor</Label>
                    <input
                      type="text"
                      value={draft.meta.vaultUrl ?? ''}
                      onChange={e => patchMeta({ vaultUrl: e.target.value })}
                      className={`${inputClass} font-mono`}
                      placeholder="https://…"
                    />
                  </div>
                </div>
              )}

              {type === 'person' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>Año nac.</Label>
                      <input
                        type="number"
                        min={1940}
                        max={2025}
                        value={bYear ?? ''}
                        onChange={e => setBirthdayPart(bMonth, bDay, e.target.value ? Number(e.target.value) : null)}
                        className={inputClass}
                        placeholder="Ej. 1992"
                      />
                    </div>
                    <div>
                      <Label>Correo</Label>
                      <input
                        type="text"
                        value={draft.meta.email ?? ''}
                        onChange={e => patchMeta({ email: e.target.value })}
                        className={inputClass}
                        placeholder="correo@…"
                      />
                    </div>
                    <div>
                      <Label>Teléfono / Ext.</Label>
                      <input
                        type="text"
                        value={draft.meta.phone ?? ''}
                        onChange={e => patchMeta({ phone: e.target.value })}
                        className={inputClass}
                        placeholder="Ext. 1234"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Notas sobre la persona</Label>
                    <textarea
                      value={draft.content}
                      onChange={e => patch({ content: e.target.value })}
                      className={`${inputClass} h-20 resize-none`}
                      placeholder="Proyectos asignados, fortalezas, pendientes…"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={draft.pinned}
            onChange={e => patch({ pinned: e.target.checked })}
            className="accent-primary w-4 h-4"
          />
          <span className="text-xs text-slate-400">📌 Fijar hasta arriba en su sección</span>
        </label>
      </div>
    </Modal>
  );
}

