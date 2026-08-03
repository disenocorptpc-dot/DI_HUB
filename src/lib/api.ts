import type { Item, ItemDraft, ItemMeta, ItemType } from '../types';
import { ITEM_TYPES } from '../types';

/** Fila cruda como la devuelve D1: tags es CSV, meta es JSON, pinned es 0/1. */
type ItemRow = {
  id: number;
  type: string;
  title: string | null;
  category: string | null;
  url: string | null;
  description: string | null;
  content: string | null;
  tags: string | null;
  meta: string | null;
  pinned: number | null;
  owner_email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const parseMeta = (raw: string | null): ItemMeta => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    // Una fila con meta corrupta no debe tumbar el dashboard entero.
    return {};
  }
};

export const parseTags = (raw: string | null): string[] =>
  (raw ?? '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

const hydrate = (row: ItemRow): Item => ({
  id: row.id,
  type: (ITEM_TYPES as string[]).includes(row.type) ? (row.type as ItemType) : 'link',
  title: row.title ?? '',
  category: row.category ?? '',
  url: row.url ?? '',
  description: row.description ?? '',
  content: row.content ?? '',
  tags: parseTags(row.tags),
  meta: parseMeta(row.meta),
  pinned: Boolean(row.pinned),
  owner_email: row.owner_email ?? '',
  created_at: row.created_at ?? '',
  updated_at: row.updated_at ?? row.created_at ?? '',
});

const serialize = (draft: ItemDraft) => ({
  type: draft.type,
  title: draft.title.trim(),
  category: draft.category.trim(),
  url: draft.url.trim(),
  description: draft.description.trim(),
  content: draft.content,
  tags: draft.tags.map(t => t.trim()).filter(Boolean).join(','),
  meta: JSON.stringify(draft.meta ?? {}),
  pinned: draft.pinned ? 1 : 0,
});

export const errorMessage = (e: unknown, fallback = 'Algo salió mal'): string => {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === 'string' && e) return e;
  return fallback;
};

const failure = async (res: Response) => {
  const body = await res.text().catch(() => '');
  return new Error(body || `${res.status} ${res.statusText}`);
};

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch('/api/items');
  if (!res.ok) throw await failure(res);
  const rows: ItemRow[] = await res.json();
  return rows.map(hydrate);
}

export async function createItem(draft: ItemDraft): Promise<number> {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serialize(draft)),
  });
  if (!res.ok) throw await failure(res);
  const data = await res.json();
  return data.id;
}

export async function updateItem(id: number, draft: ItemDraft): Promise<void> {
  const res = await fetch(`/api/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serialize(draft)),
  });
  if (!res.ok) throw await failure(res);
}

export async function deleteItem(id: number): Promise<void> {
  const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw await failure(res);
}

/**
 * Solo permitimos esquemas de navegación. Evita que un `javascript:` guardado en
 * la base se ejecute al hacer clic, ya que cualquiera puede escribir en el API.
 */
export function safeHref(url: string): string | null {
  const value = (url ?? '').trim();
  if (!value || value === '#') return null;

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}
