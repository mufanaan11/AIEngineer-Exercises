function clipCard(clip) {
  return `<div class="clip">
        <div class="meta"><strong>${clip.speaker}</strong> <span class="emotion">${clip.emotion}</span></div>
        <p class="text">"${clip.text}"</p>
        <audio controls src="${clip.filename}"></audio>
      </div>`;
}

export function buildPlayerHtml({ topic, clips }) {
  const cards = clips.map(clipCard).join('\n  ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TTS Conversation — ${topic}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #111; color: #eee; margin: 0; padding: 2rem; max-width: 720px; margin-inline: auto; }
  h1 { text-align: center; }
  .clip { background: #1c1c1c; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
  .meta { margin-bottom: 0.5rem; }
  .emotion { color: #9ad; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; margin-left: 0.5rem; }
  .text { color: #ccc; font-style: italic; margin: 0 0 0.75rem; }
  audio { width: 100%; }
</style>
</head>
<body>
  <h1>TTS Conversation: ${topic}</h1>
  ${cards}
</body>
</html>`;
}
