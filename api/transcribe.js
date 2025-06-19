export default async function handler(req, res) {
  const { v } = req.query;
  if (!v) return res.status(400).json({ error: 'Missing video ID' });

  const url = \`https://www.youtube.com/watch?v=\${v}\`;
  const html = await fetch(url).then(r => r.text());
  const match = html.match(/\bytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;\s*var/);

  if (!match) return res.status(500).json({ error: 'No ytInitialPlayerResponse found' });

  const playerResponse = JSON.parse(match[1]);
  const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks?.length) return res.status(404).json({ error: 'No subtitles found' });

  const track = captionTracks.find(t => t.languageCode === 'ru' && t.kind === 'asr')
    || captionTracks.find(t => t.languageCode === 'ru');

  if (!track) return res.status(404).json({ error: 'No Russian subtitles found' });

  const transcript = await fetch(track.baseUrl).then(r => r.text());
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(transcript);
}
