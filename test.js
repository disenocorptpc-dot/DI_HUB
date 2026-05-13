fetch('https://www.flowmusic.app/song/db717406-b9f7-44fe-8db6-f7517ea2a28d')
  .then(res => res.text())
  .then(html => { 
      const audioMatch = html.match(/"audio_url":"([^"]+)"/); 
      console.log(audioMatch ? audioMatch[1] : 'No audio found'); 
  })
  .catch(console.error);
