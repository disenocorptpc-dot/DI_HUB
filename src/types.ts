export type ItemType = 'webapp' | 'prompt' | 'link' | 'note' | 'person';

export const ITEM_TYPES: ItemType[] = ['webapp', 'prompt', 'link', 'note', 'person'];

export const TYPE_LABELS: Record<ItemType, string> = {
  webapp: 'Web App',
  prompt: 'Prompt',
  link: 'Link / Doc',
  note: 'Nota',
  person: 'Persona',
};

export const TYPE_ICONS: Record<ItemType, string> = {
  webapp: 'apps',
  prompt: 'terminal',
  link: 'folder_shared',
  note: 'sticky_note_2',
  person: 'badge',
};

/**
 * Campos específicos de cada tipo. Viven en la columna `meta` como JSON, así que
 * agregar uno nuevo no requiere migración de base de datos.
 *
 * Nota deliberada: no hay campo de contraseña. Guardamos dónde vive el secreto,
 * nunca el secreto. Ver README.
 */
export type ItemMeta = {
  // webapp
  loginUser?: string;
  vault?: string;
  vaultUrl?: string;
  owner?: string;

  // person
  role?: string;
  birthday?: string;
  email?: string;
  phone?: string;

  // note
  source?: string;
};

export type Item = {
  id: number;
  type: ItemType;
  title: string;
  category: string;
  url: string;
  description: string;
  content: string;
  tags: string[];
  meta: ItemMeta;
  pinned: boolean;
  owner_email: string;
  created_at: string;
  updated_at: string;
};

/** Lo que mandamos al API al crear o editar. */
export type ItemDraft = {
  type: ItemType;
  title: string;
  category: string;
  url: string;
  description: string;
  content: string;
  tags: string[];
  meta: ItemMeta;
  pinned: boolean;
};

export const emptyDraft = (type: ItemType = 'webapp'): ItemDraft => ({
  type,
  title: '',
  category: '',
  url: '',
  description: '',
  content: '',
  tags: [],
  meta: {},
  pinned: false,
});

export const draftFromItem = (item: Item): ItemDraft => ({
  type: item.type,
  title: item.title,
  category: item.category,
  url: item.url,
  description: item.description,
  content: item.content,
  tags: item.tags,
  meta: item.meta,
  pinned: item.pinned,
});

/** Gestores de contraseñas sugeridos para el campo `vault`. */
export const VAULTS = ['1Password', 'Bitwarden', 'Keeper', 'LastPass', 'Azure Key Vault', 'Otro'];

export const WEBAPP_CATEGORIES = ['Producción', 'Fabricación', 'Retail', 'Marketing', 'Administración', 'General'];
