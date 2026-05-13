export async function onRequest(context) {
  try {
    const { request } = context;
    const url = new URL(request.url).searchParams.get('url');
    
    if (!url) {
      return new Response('Invalid URL', { status: 400 });
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
       const ytRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
       if (!ytRes.ok) return new Response('YouTube track not found', { status: 404 });
       const ytData = await ytRes.json();
       return new Response(JSON.stringify({
          title: ytData.title || 'YouTube Track',
          url: url,
          image: ytData.thumbnail_url || ''
       }), { headers: { 'Content-Type': 'application/json' }});
    }

    if (url.includes('flowmusic.app')) {
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
    }

    // Direct audio links fallback
    if (url.endsWith('.mp3') || url.endsWith('.m4a') || url.endsWith('.wav')) {
      return new Response(JSON.stringify({
        title: url.split('/').pop() || 'Archivo Directo',
        url: url,
        image: ''
      }), { headers: { 'Content-Type': 'application/json' }});
    }

    return new Response('Plataforma no soportada', { status: 400 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
