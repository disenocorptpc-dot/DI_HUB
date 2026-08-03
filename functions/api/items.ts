import { badRequest, columns, readDraft, serverError, type PagesContext } from './_shared';

export const onRequestGet = async (context: PagesContext) => {
  try {
    const { results } = await context.env.DB
      .prepare(`SELECT ${columns} FROM items ORDER BY pinned DESC, id DESC`)
      .all();
    return Response.json(results);
  } catch (e) {
    return serverError(e);
  }
};

export const onRequestPost = async (context: PagesContext) => {
  try {
    const draft = await readDraft(context.request);
    if ('error' in draft) return badRequest(draft.error);

    const result = await context.env.DB.prepare(
      `INSERT INTO items (type, title, category, url, description, content, tags, meta, pinned, owner_email, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
      .bind(
        draft.type,
        draft.title,
        draft.category,
        draft.url,
        draft.description,
        draft.content,
        draft.tags,
        draft.meta,
        draft.pinned,
        // Lo pone Cloudflare Access cuando esté configurado; cadena vacía si no.
        context.request.headers.get('Cf-Access-Authenticated-User-Email') ?? '',
      )
      .run();

    return Response.json({ success: true, id: result.meta.last_row_id });
  } catch (e) {
    return serverError(e);
  }
};
