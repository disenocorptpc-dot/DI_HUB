import { useState } from 'react';
import Modal from './Modal';
import { MONTHS, buildBirthday, parseBirthday } from '../lib/dates';
import { errorMessage, parseTags } from '../lib/api';
import {
  ITEM_TYPES,
  TYPE_LABELS,
  VAULTS,
  WEBAPP_CATEGORIES,
  type ItemDraft,
  type ItemMeta,
  type ItemType,
} from '../types';

const inputClass =
  'w-full bg-surface-dark border border-primary/20 rounded-sm p-2.5 text-white text-sm focus:border-primary focus:outline-none transition-colors';

const Label = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
    {children}
    {hint && <span className="block normal-case tracking-normal text-[10px] text-slate-600 mt-0.5">{hint}</span>}
  </label>
);

const CATEGORY_LABELS: Record<ItemType, string> = {
  webapp: 'Categoría / Departamento',
  prompt: 'IA Recomendada',
  link: 'Ubicación',
  note: 'Carpeta / Tema',
  person: 'Área / Equipo',
};

type Props = {
  initial: ItemDraft;
  /** null cuando es creación; el id cuando es edición. */
  editingId: number | null;
  onClose: () => void;
  onSave: (draft: ItemDraft) => Promise<void>;
};

export default function ItemFormModal({ initial, editingId, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<ItemDraft>(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(', '));
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

  const submit = async () => {
    if (!draft.title.trim()) {
      setError('El título es obligatorio.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({ ...draft, tags: parseTags(tagsText) });
    } catch (e) {
      setError(errorMessage(e, 'No se pudo guardar.'));
      setSaving(false);
    }
  };

  const isEditing = editingId !== null;
  const type = draft.type;

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">{isEditing ? 'edit' : 'add_circle'}</span>
          {isEditing ? 'Editar aporte' : 'Nuevo aporte'}
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
      <div className="space-y-5">
        <div>
          <Label>¿Qué es?</Label>
          <div className="grid grid-cols-5 gap-1 bg-surface-dark p-1 border border-primary/10 rounded-sm">
            {ITEM_TYPES.map(option => (
              <button
                key={option}
                className={`font-medium py-1.5 rounded-sm text-[11px] transition-all ${
                  type === option ? 'bg-surface border border-primary/20 text-primary' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => patch({ type: option })}
              >
                {TYPE_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>{type === 'person' ? 'Nombre completo' : 'Título / Nombre'}</Label>
          <input
            type="text"
            value={draft.title}
            onChange={e => patch({ title: e.target.value })}
            className={inputClass}
            placeholder={type === 'person' ? 'Ej. Ana Gutiérrez' : 'Ej. Yield Manager 3D'}
            autoFocus
          />
        </div>

        <div>
          <Label>{CATEGORY_LABELS[type]}</Label>
          {type === 'webapp' ? (
            <select
              value={draft.category}
              onChange={e => patch({ category: e.target.value })}
              className={`${inputClass} appearance-none`}
            >
              <option value="">— Selecciona —</option>
              {WEBAPP_CATEGORIES.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={draft.category}
              onChange={e => patch({ category: e.target.value })}
              className={inputClass}
              placeholder={
                type === 'prompt'
                  ? 'Ej. Claude / Antigravity'
                  : type === 'note'
                    ? 'Ej. Juntas, Ideas, Procesos'
                    : type === 'person'
                      ? 'Ej. Diseño Industrial'
                      : 'Ej. SharePoint / Marketing'
              }
            />
          )}
        </div>

        {(type === 'webapp' || type === 'link') && (
          <div>
            <Label>URL</Label>
            <input
              type="text"
              value={draft.url}
              onChange={e => patch({ url: e.target.value })}
              className={`${inputClass} font-mono`}
              placeholder="https://"
            />
          </div>
        )}

        {(type === 'webapp' || type === 'prompt' || type === 'link') && (
          <div>
            <Label>{type === 'prompt' ? '¿Qué hace este prompt?' : 'Descripción corta'}</Label>
            <textarea
              value={draft.description}
              onChange={e => patch({ description: e.target.value })}
              className={`${inputClass} h-20 resize-none`}
              placeholder="Escribe aquí de qué trata…"
            />
          </div>
        )}

        {type === 'prompt' && (
          <div>
            <Label>Contenido del prompt</Label>
            <textarea
              value={draft.content}
              onChange={e => patch({ content: e.target.value })}
              className={`${inputClass} h-32 resize-none font-mono`}
              placeholder="Actúa como un experto…"
            />
          </div>
        )}

        {type === 'note' && (
          <>
            <div>
              <Label>Contenido</Label>
              <textarea
                value={draft.content}
                onChange={e => patch({ content: e.target.value })}
                className={`${inputClass} h-48 resize-y`}
                placeholder="Escribe tu nota…"
              />
            </div>
            <div>
              <Label hint="Opcional: de dónde salió esto (link, junta, persona).">Fuente</Label>
              <input
                type="text"
                value={draft.meta.source ?? ''}
                onChange={e => patchMeta({ source: e.target.value })}
                className={inputClass}
                placeholder="https://… o 'Junta de planeación 3 ago'"
              />
            </div>
          </>
        )}

        {type === 'webapp' && (
          <div className="border border-primary/10 rounded-sm p-4 bg-surface-dark/50 space-y-4">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-base mt-0.5">key</span>
              <div>
                <p className="text-xs text-primary uppercase tracking-wider font-bold">Cómo se accede</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Registra con qué cuenta se entra y dónde está guardada la contraseña. No escribas la contraseña aquí:
                  cualquiera que abra el hub podría leerla.
                </p>
              </div>
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
              <Label hint="Link directo al item dentro del gestor, si lo tienes.">Link al gestor</Label>
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
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Puesto</Label>
                <input
                  type="text"
                  value={draft.meta.role ?? ''}
                  onChange={e => patchMeta({ role: e.target.value })}
                  className={inputClass}
                  placeholder="Ej. Diseñador Senior"
                />
              </div>
              <div>
                <Label>Ubicación</Label>
                <input
                  type="text"
                  value={draft.meta.location ?? ''}
                  onChange={e => patchMeta({ location: e.target.value })}
                  className={inputClass}
                  placeholder="Ej. Cancún"
                />
              </div>
            </div>

            <div>
              <Label hint="El año es opcional. Sin año, el hub solo te avisa del día.">Cumpleaños</Label>
              <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-2">
                <select
                  value={bMonth}
                  onChange={e => setBirthdayPart(Number(e.target.value), bDay, bYear)}
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
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={bYear ?? ''}
                  onChange={e => setBirthdayPart(bMonth, bDay, e.target.value ? Number(e.target.value) : null)}
                  className={inputClass}
                  placeholder="Año"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Correo</Label>
                <input
                  type="text"
                  value={draft.meta.email ?? ''}
                  onChange={e => patchMeta({ email: e.target.value })}
                  className={inputClass}
                  placeholder="nombre@thepalacecompany.com"
                />
              </div>
              <div>
                <Label>Teléfono / Extensión</Label>
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
              <Label>Notas</Label>
              <textarea
                value={draft.content}
                onChange={e => patch({ content: e.target.value })}
                className={`${inputClass} h-24 resize-none`}
                placeholder="Fortalezas, temas pendientes, objetivos…"
              />
            </div>
          </>
        )}

        <div>
          <Label hint="Separados por coma. Sirven para buscar y filtrar.">Tags</Label>
          <input
            type="text"
            value={tagsText}
            onChange={e => setTagsText(e.target.value)}
            className={inputClass}
            placeholder="3d, produccion, urgente"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={draft.pinned}
            onChange={e => patch({ pinned: e.target.checked })}
            className="accent-primary w-4 h-4"
          />
          <span className="text-xs text-slate-400">Fijar arriba en su sección</span>
        </label>
      </div>
    </Modal>
  );
}
