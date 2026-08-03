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
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
