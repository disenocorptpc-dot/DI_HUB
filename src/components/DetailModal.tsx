import Modal from './Modal';
import { safeHref } from '../lib/api';
import { ageOnNextBirthday, formatBirthday } from '../lib/dates';
import type { Item } from '../types';

type Props = {
  item: Item;
  onClose: () => void;
  onEdit: (item: Item) => void;
  onCopy: (text: string) => void;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">{label}</span>
    {children}
  </div>
);

const CopyRow = ({ value, onCopy }: { value: string; onCopy: (text: string) => void }) => (
  <div className="flex items-center gap-2">
    <code className="text-[13px] text-white bg-surface-dark p-2 rounded w-full border border-white/5 truncate">
      {value}
    </code>
    <button
      onClick={() => onCopy(value)}
      className="text-slate-500 hover:text-primary transition-colors bg-surface-dark p-2 rounded border border-white/5 shrink-0"
      title="Copiar"
    >
      <span className="material-symbols-outlined text-sm">content_copy</span>
    </button>
  </div>
);

const EditButton = ({ item, onEdit }: { item: Item; onEdit: (item: Item) => void }) => (
  <button
    className="text-slate-300 hover:text-white hover:bg-primary/20 bg-surface border border-primary/20 rounded px-4 py-2 flex items-center gap-2 text-xs uppercase font-bold transition-colors"
    onClick={() => onEdit(item)}
  >
    <span className="material-symbols-outlined text-base">edit</span> Editar
  </button>
);

export default function DetailModal({ item, onClose, onEdit, onCopy }: Props) {
  const href = safeHref(item.url);

  if (item.type === 'prompt') {
    return (
      <Modal
        title={item.title}
        size="xl"
        onClose={onClose}
        subtitle={
          <span className="bg-accent-antigravity/10 text-accent-antigravity border-accent-antigravity/20 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border">
            {item.category || 'IA'}
          </span>
        }
        footer={<EditButton item={item} onEdit={onEdit} />}
      >
        <div className="flex flex-col gap-6">
          {item.description && (
            <Field label="¿Qué hace este prompt?">
              <p className="text-sm text-slate-200 leading-relaxed bg-surface-dark p-3 rounded-sm border-l-2 border-primary">
                {item.description}
              </p>
            </Field>
          )}

          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">terminal</span> Prompt Maestro
              </span>
              <button
                className="text-slate-300 hover:text-white hover:bg-primary/20 bg-surface border border-primary/20 rounded px-4 py-2 flex items-center gap-2 text-xs uppercase font-bold transition-colors"
                onClick={() => onCopy(item.content)}
              >
                <span className="material-symbols-outlined text-base">content_copy</span> Copiar
              </button>
            </div>
            <div className="bg-[#04080c] p-5 rounded border border-white/5">
              <code className="text-[13px] text-[#bac8da] font-mono whitespace-pre-wrap leading-relaxed block">
                {item.content}
              </code>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  if (item.type === 'note') {
    return (
      <Modal
        title={item.title}
        size="xl"
        onClose={onClose}
        subtitle={
          <div className="flex items-center gap-2 flex-wrap">
            {item.category && (
              <span className="text-[10px] uppercase tracking-widest text-slate-400 bg-surface px-2 py-0.5 rounded-sm border border-primary/10">
                {item.category}
              </span>
            )}
            {item.tags.map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-wider text-primary/70 bg-primary/10 px-2 py-0.5 rounded-sm">
                {tag}
              </span>
            ))}
          </div>
        }
        footer={
          <>
            <button
              className="text-slate-400 hover:text-white px-4 py-2 text-sm transition-colors font-medium"
              onClick={() => onCopy(item.content)}
            >
              Copiar texto
            </button>
            <EditButton item={item} onEdit={onEdit} />
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {item.meta.source && (
            <Field label="Fuente">
              {safeHref(item.meta.source) ? (
                <a
                  href={safeHref(item.meta.source)!}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {item.meta.source}
                </a>
              ) : (
                <p className="text-sm text-slate-300">{item.meta.source}</p>
              )}
            </Field>
          )}

          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {item.content || <span className="text-slate-500 italic">Nota vacía.</span>}
          </p>

          <p className="text-[10px] text-slate-600 uppercase tracking-wider border-t border-primary/10 pt-3">
            Actualizada: {item.updated_at || item.created_at || '—'}
          </p>
        </div>
      </Modal>
    );
  }

  if (item.type === 'person') {
    const age = ageOnNextBirthday(item.meta.birthday);

    return (
      <Modal
        title={item.title}
        size="md"
        onClose={onClose}
        subtitle={<span className="text-xs text-slate-400">{item.meta.role || item.category || 'Sin puesto'}</span>}
        footer={<EditButton item={item} onEdit={onEdit} />}
      >
        <div className="grid grid-cols-1 gap-4">
          {item.meta.birthday && (
            <Field label="Cumpleaños">
              <p className="text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-400 text-base">cake</span>
                {formatBirthday(item.meta.birthday)}
                {age !== null && <span className="text-slate-500 text-xs">(cumple {age})</span>}
              </p>
            </Field>
          )}

          {item.meta.email && (
            <Field label="Correo">
              <CopyRow value={item.meta.email} onCopy={onCopy} />
            </Field>
          )}

          {item.meta.phone && (
            <Field label="Teléfono">
              <CopyRow value={item.meta.phone} onCopy={onCopy} />
            </Field>
          )}

          {item.meta.location && (
            <Field label="Ubicación">
              <p className="text-sm text-slate-200">{item.meta.location}</p>
            </Field>
          )}

          {item.content && (
            <Field label="Notas">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-surface-dark p-3 rounded-sm border-l-2 border-primary/40">
                {item.content}
              </p>
            </Field>
          )}
        </div>
      </Modal>
    );
  }

  // webapp y link comparten la vista: destino + referencia de acceso.
  const hasAccessInfo = item.meta.loginUser || item.meta.vault || item.meta.vaultUrl || item.meta.owner;
  const vaultHref = safeHref(item.meta.vaultUrl ?? '');

  return (
    <Modal
      title={item.title}
      size="md"
      onClose={onClose}
      subtitle={item.category ? <span className="text-xs text-emerald-400 uppercase tracking-wider">{item.category}</span> : undefined}
      footer={
        <>
          <EditButton item={item} onEdit={onEdit} />
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="bg-primary text-surface-dark font-bold px-6 py-2 rounded-sm text-sm hover:bg-white transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span> Abrir
            </a>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {item.description && <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>}

        <Field label="Destino">
          {href ? (
            <a href={href} target="_blank" rel="noreferrer noopener" className="text-sm text-primary hover:underline break-all font-mono">
              {item.url}
            </a>
          ) : (
            <p className="text-sm text-slate-500 italic">Sin URL configurada.</p>
          )}
        </Field>

        <div className="bg-[#04080c] border border-primary/20 p-4 rounded-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-sm">key</span>
            <span className="text-xs text-primary uppercase tracking-wider font-bold">Cómo se accede</span>
          </div>

          {hasAccessInfo ? (
            <div className="flex flex-col gap-4">
              {item.meta.loginUser && (
                <Field label="Usuario / Email">
                  <CopyRow value={item.meta.loginUser} onCopy={onCopy} />
                </Field>
              )}

              {(item.meta.vault || vaultHref) && (
                <Field label="La contraseña vive en">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-200 bg-surface-dark px-2 py-1.5 rounded border border-white/5 flex-1">
                      {item.meta.vault || 'Gestor de contraseñas'}
                    </span>
                    {vaultHref && (
                      <a
                        href={vaultHref}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary hover:text-white bg-surface-dark p-2 rounded border border-white/5 shrink-0"
                        title="Abrir en el gestor"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </a>
                    )}
                  </div>
                </Field>
              )}

              {item.meta.owner && (
                <Field label="Responsable">
                  <p className="text-sm text-slate-200">{item.meta.owner}</p>
                </Field>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed">
              Sin datos de acceso. Edita este aporte para registrar con qué usuario se entra y en qué gestor está
              guardada la contraseña.
            </p>
          )}

          <p className="text-[10px] text-slate-600 leading-relaxed mt-4 pt-3 border-t border-white/5">
            Este hub guarda <strong className="text-slate-500">referencias</strong>, no contraseñas. El secreto se queda
            en el gestor.
          </p>
        </div>
      </div>
    </Modal>
  );
}
