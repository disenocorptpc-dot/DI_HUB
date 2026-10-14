import type { Item } from '../types';

/** Quita acentos para que "produccion" encuentre "Producción". */
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const haystack = (item: Item) =>
  normalize(
    [
      item.title,
      item.category,
      item.description,
      item.content,
      item.tags.join(' '),
      Object.values(item.meta).filter(v => typeof v === 'string').join(' '),
    ].join(' '),
  );

export function matchesQuery(item: Item, query: string): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const text = haystack(item);
  return terms.every(term => text.includes(term));
}

export function collectTags(items: Item[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) {
      const clean = tag.trim().toLowerCase();
      if (!clean) continue;
      counts.set(clean, (counts.get(clean) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function collectCategories(items: Item[], type?: Item['type']): { category: string; count: number }[] {
  if (type === 'person') return [];
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.type === 'person') continue;
    if (type && item.type !== type) continue;
    const cat = item.category.trim();
    if (!cat) continue;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

/** Extrae el host limpio de una URL para mostrar cuando no se llenó categoría. */
export function domainFromUrl(url: string): string {
  const raw = (url ?? '').trim();
  if (!raw || raw === '#') return '';
  try {
    const withProto = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw) ? raw : `https://${raw}`;
    const host = new URL(withProto).hostname.replace(/^www\./, '');
    return host;
  } catch {
    return '';
  }
}

/** Sugiere categoría e información automática a partir de una URL o texto cuando se captura rápido. */
export function inferFromUrl(url: string): { category?: string; titleHint?: string; tags?: string[] } {
  const host = domainFromUrl(url).toLowerCase();
  if (!host) return {};

  if (host.includes('sharepoint.com') || host.includes('onedrive')) {
    return { category: 'SharePoint', tags: ['sharepoint'] };
  }
  if (host.includes('pulse.thepalacecompany') || host.includes('odp-maker')) {
    return { category: 'PULSE / Taller', tags: ['pulse', 'produccion'] };
  }
  if (host.includes('drive.google') || host.includes('docs.google')) {
    return { category: 'Google Drive', tags: ['drive', 'docs'] };
  }
  if (host.includes('figma.com')) {
    return { category: 'Figma', tags: ['ui', 'diseno'] };
  }
  if (host.includes('github.com')) {
    return { category: 'Producción', tags: ['repo', 'dev'] };
  }
  if (host.includes('vercel.app') || host.includes('pages.dev')) {
    return { category: 'Producción', tags: ['webapp'] };
  }
  return {};
}

export function isUnclassified(item: Item): boolean {
  if (item.type === 'person') {
    return !item.category.trim() && !item.meta.role?.trim();
  }
  return !item.category.trim() && item.tags.length === 0;
}

