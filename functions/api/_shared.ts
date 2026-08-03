const ITEM_TYPES = ['webapp', 'prompt', 'link', 'note', 'person'];

/** Columnas explícitas en lugar de SELECT *, para no filtrar nada que agreguemos después. */
export const columns =
  'id, type, title, category, url, description, content, tags, meta, pinned, owner_email, created_at, updated_at';

const MAX_TEXT = 20000;

/**
 * Forma mínima de D1 y del contexto de Pages Functions. Suficiente para lo que
 * usamos aquí y evita depender de @cloudflare/workers-types.
 */
type D1RunResult = { meta: { last_row_id: number; changes: number } };
type D1AllResult = { results: unknown[] };

type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  run: () => Promise<D1RunResult>;
  all: () => Promise<D1AllResult>;
};

export type PagesContext = {
  request: Request;
  env: { DB: { prepare: (query: string) => D1Statement } };
  params: Record<string, string | string[] | undefined>;
};

export const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'Error interno';

type Draft = {
  type: string;
  title: string;
  category: string;
  url: string;
  description: string;
  content: string;
  tags: string;
  meta: string;
  pinned: number;
};

const asText = (value: unknown, limit = 500): string =>
  typeof value === 'string' ? value.slice(0, limit) : '';

/**
 * Valida el cuerpo de un POST/PUT. Devuelve `{ error }` en lugar de lanzar para
 * que el llamador responda 400 y no 500.
 */
export async function readDraft(request: Request): Promise<Draft | { error: string }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: 'Cuerpo JSON inválido' };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Cuerpo JSON inválido' };
  }

  const fields = body as Record<string, unknown>;

  const type = asText(fields.type, 20);
  if (!ITEM_TYPES.includes(type)) {
    return { error: `Tipo inválido. Esperaba uno de: ${ITEM_TYPES.join(', ')}` };
  }

  const title = asText(fields.title, 200).trim();
  if (!title) return { error: 'El título es obligatorio' };

  // meta llega ya serializado desde el cliente; verificamos que sea JSON de objeto.
  let meta = '{}';
  if (typeof fields.meta === 'string' && fields.meta.length <= MAX_TEXT) {
    try {
      const parsed: unknown = JSON.parse(fields.meta);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) meta = fields.meta;
    } catch {
      return { error: 'El campo meta no es JSON válido' };
    }
  }

  return {
    type,
    title,
    category: asText(fields.category, 120),
    url: asText(fields.url, 2000),
    description: asText(fields.description, 2000),
    content: asText(fields.content, MAX_TEXT),
    tags: asText(fields.tags, 500),
    meta,
    pinned: fields.pinned ? 1 : 0,
  };
}

export const badRequest = (message: string) =>
  Response.json({ success: false, error: message }, { status: 400 });

export const notFound = (message = 'No encontrado') =>
  Response.json({ success: false, error: message }, { status: 404 });

export const serverError = (e: unknown) => {
  console.error('DI HUB API error:', e);
  return Response.json({ success: false, error: errorMessage(e) }, { status: 500 });
};

export const parseId = (raw: unknown): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};
