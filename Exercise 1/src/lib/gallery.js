function cardInner(r) {
  const scoreLabel = r.score != null
    ? ` — score: ${typeof r.score === 'number' ? r.score.toFixed(1) : r.score}`
    : '';
  return `<img src="${r.filename}" alt="${r.service}" loading="lazy"><figcaption>${r.service}${scoreLabel}</figcaption>`;
}

export function buildGalleryHtml({ theme, results, best, variations }) {
  const resultCards = results
    .map((r) => `<figure class="${best && r.filename === best.filename ? 'best' : ''}">${cardInner(r)}</figure>`)
    .join('\n      ');

  const variationCards = variations
    .map((v) => `<figure>${cardInner(v)}</figure>`)
    .join('\n      ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AI Art Gallery — ${theme}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #111; color: #eee; margin: 0; padding: 2rem; }
  h1 { text-align: center; }
  section { margin-bottom: 3rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
  figure { margin: 0; background: #1c1c1c; border-radius: 12px; overflow: hidden; }
  figure.best { outline: 3px solid gold; }
  img { width: 100%; display: block; }
  figcaption { padding: 0.75rem; text-align: center; }
</style>
</head>
<body>
  <h1>AI Art Gallery: ${theme}</h1>

  <section>
    <h2>Generated Images</h2>
    <div class="grid">
      ${resultCards}
    </div>
  </section>

  ${variations.length ? `<section>
    <h2>Variations of Best Result (${best.service})</h2>
    <div class="grid">
      ${variationCards}
    </div>
  </section>` : ''}
</body>
</html>`;
}
