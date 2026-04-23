export const onRequestDelete = async (context: any) => {
  try {
    const id = context.params.id;
    await context.env.DB.prepare("DELETE FROM items WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};
