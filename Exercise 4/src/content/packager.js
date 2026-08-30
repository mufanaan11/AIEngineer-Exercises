function renderArticleHtml(markdown) {
  return markdown
    .split('\n')
    .map((line) => {
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
      if (line.trim() === '') return '';
      return `<p>${line}</p>`;
    })
    .join('\n');
}

export function buildManifest({ topic, files, costs, performance, fallbacks, errors }) {
  return {
    topic,
    generatedAt: new Date().toISOString(),
    files,
    estimatedCostUSD: {
      text: Number(costs.text.toFixed(4)),
      image: Number(costs.image.toFixed(4)),
      audio: Number(costs.audio.toFixed(4)),
      total: Number((costs.text + costs.image + costs.audio).toFixed(4))
    },
    performanceMs: performance,
    fallbacksUsed: fallbacks,
    errors
  };
}

export function buildPackageHtml({ topic, article, summary, socialPosts, files, manifest }) {
  const socialCards = socialPosts
    ? Object.entries(socialPosts)
        .map(([platform, text]) => `<div class="card">
        <h3>${platform}</h3>
        <p>${text}</p>
      </div>`)
        .join('\n      ')
    : '<p class="missing">Social posts unavailable for this run.</p>';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Content Suite — ${topic}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #111; color: #eee; margin: 0; padding: 0 0 3rem; max-width: 860px; margin-inline: auto; }
  .banner { width: 100%; display: block; max-height: 360px; object-fit: cover; }
  main { padding: 0 2rem; }
  h1 { margin-top: 2rem; }
  article p { line-height: 1.6; color: #ddd; }
  .summary { background: #1c1c1c; border-radius: 12px; padding: 1rem 1.25rem; font-style: italic; color: #ccc; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
  .card { background: #1c1c1c; border-radius: 12px; padding: 1rem 1.25rem; }
  .card h3 { margin-top: 0; text-transform: capitalize; color: #9ad; }
  .thumb { width: 200px; border-radius: 12px; display: block; margin: 1rem 0; }
  audio { width: 100%; }
  .meta { color: #888; font-size: 0.85rem; margin-top: 3rem; border-top: 1px solid #333; padding-top: 1rem; }
  .missing { color: #888; }
</style>
</head>
<body>
  ${files.header ? `<img class="banner" src="${files.header}" alt="Header for ${topic}">` : ''}
  <main>
    <h1>${topic}</h1>

    ${summary ? `<p class="summary">${summary.text}</p>` : ''}

    ${files.narration ? `<audio controls src="${files.narration}"></audio>` : ''}

    ${article ? `<article>${renderArticleHtml(article.text)}</article>` : '<p class="missing">Article unavailable for this run.</p>'}

    ${files.thumbnail ? `<img class="thumb" src="${files.thumbnail}" alt="Thumbnail for ${topic}">` : ''}

    <h2>Social Posts</h2>
    <div class="grid">
      ${socialCards}
    </div>

    <div class="meta">
      Estimated cost: $${manifest.estimatedCostUSD.total.toFixed(3)}
      (text $${manifest.estimatedCostUSD.text.toFixed(3)}, image $${manifest.estimatedCostUSD.image.toFixed(3)}, audio $${manifest.estimatedCostUSD.audio.toFixed(3)})
      · Generated in ${(manifest.performanceMs.totalMs / 1000).toFixed(1)}s
      ${manifest.fallbacksUsed.length ? `<br>Fallbacks used: ${manifest.fallbacksUsed.join('; ')}` : ''}
      ${manifest.errors.length ? `<br>Issues: ${manifest.errors.map((e) => `${e.stage}: ${e.message}`).join('; ')}` : ''}
    </div>
  </main>
</body>
</html>`;
}
