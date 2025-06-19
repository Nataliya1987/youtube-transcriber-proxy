import fetch from 'node-fetch';

export default async function handler(req, res) {
  const videoId = req.query.id;

  if (!videoId) {
    return res.status(400).json({ error: 'Не указан videoId' });
  }

  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8',
    },
  });

  const html = await pageRes.text();

  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
  if (!match) {
    return res.status(500).json({ error: 'Не удалось найти ytInitialPlayerResponse' });
  }

  const data = JSON.parse(match[1]);
  const track = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.find(
    t => t.languageCode === 'ru' && t.kind === 'asr'
  );

  if (!track) {
    return res.status(404).json({ error: 'Субтитры не найдены' });
  }

  const subtitleRes = await fetch(track.baseUrl + '&fmt=json3');
  const subtitleJson = await subtitleRes.json();

  const result = subtitleJson.events
    .map(e => e.segs?.map(s => s.utf8).join(''))
    .filter(Boolean)
    .join(' ');

  res.status(200).json({ text: result });
}
