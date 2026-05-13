export async function onRequest(context) {
  try {
    const { request } = context;
    const url = new URL(request.url).searchParams.get('url');
    
    if (!url || !url.includes('flowmusic.app')) {
      return new Response('Invalid URL', { status: 400 });
    }

    const res = await fetch(url);
    const html = await res.text();

    const titleMatch = html.match(/"title":"([^"]+)"/);
    const audioMatch = html.match(/"audio_url":"([^"]+)"/);
    const imageMatch = html.match(/"image_url":"([^"]+)"/);

    if (!audioMatch) {
      return new Response('Audio not found', { status: 404 });
    }

    return new Response(JSON.stringify({
      title: titleMatch ? titleMatch[1] : 'Track Desconocido',
      url: audioMatch[1],
      image: imageMatch ? imageMatch[1] : ''
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
