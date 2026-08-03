import { badRequest, notFound, parseId, readDraft, serverError, type PagesContext } from '../_shared';

export const onRequestPut = async (context: PagesContext) => {
  try {
    const id = parseId(context.params.id);
    if (id === null) return badRequest('ID inválido');

    const draft = await readDraft(context.request);
    if ('error' in draft) return badRequest(draft.error);

    const result = await context.env.DB.prepare(
      `UPDATE items
          SET type = ?, title = ?, category = ?, url = ?, description = ?,
              content = ?, tags = ?, meta = ?, pinned = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
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
        id,
      )
      .run();

    if (result.meta.changes === 0) return notFound('Ese aporte ya no existe');

    return Response.json({ success: true });
  } catch (e) {
    return serverError(e);
  }
};

export const onRequestDelete = async (context: PagesContext) => {
  try {
    const id = parseId(context.params.id);
    if (id === null) return badRequest('ID inválido');

    const result = await context.env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) return notFound('Ese aporte ya no existe');

    return Response.json({ success: true });
  } catch (e) {
    return serverError(e);
  }
};
