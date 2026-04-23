export const onRequestGet = async (context: any) => {
  try {
    const { results } = await context.env.DB.prepare("SELECT * FROM items ORDER BY id DESC").all();
    return Response.json(results);
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};

export const onRequestPost = async (context: any) => {
  try {
    const data = await context.request.json();
    const { type, title, category, url, description, content } = data;
    
    const result = await context.env.DB.prepare(
      "INSERT INTO items (type, title, category, url, description, content) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(type, title, category || '', url || '', description || '', content || '').run();
    
    return Response.json({ success: true, id: result.meta.last_row_id });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};
