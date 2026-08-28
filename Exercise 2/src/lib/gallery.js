function groupByModel(images) {
  const map = new Map();
  for (const img of images) {
    if (!map.has(img.model)) map.set(img.model, []);
    map.get(img.model).push(img);
  }
  return map;
}

function imageCard(img) {
  return `<figure class="bg-neutral-800 rounded-xl overflow-hidden">
          <img class="w-full block" src="${img.filename}" alt="${img.model} ${img.sizeLabel}" loading="lazy">
          <figcaption class="p-3 text-center text-sm text-neutral-300">
            <span class="font-semibold text-neutral-100">${img.sizeLabel}</span> (${img.size})${img.style ? ` · ${img.style}` : ''}<br>
            $${img.estimatedCostUSD.toFixed(3)}
          </figcaption>
        </figure>`;
}

export function buildGalleryHtml({ theme, finalPrompt, images, totalCost }) {
  const byModel = groupByModel(images);

  const sections = [...byModel.entries()]
    .map(([model, imgs]) => `<section class="mb-12">
      <h2 class="text-xl font-semibold mb-4">${model}</h2>
      <div class="grid gap-6" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
        ${imgs.map(imageCard).join('\n        ')}
      </div>
    </section>`)
    .join('\n  ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Image Mastery Gallery — ${theme}</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-neutral-900 text-neutral-100 min-h-screen p-8 font-sans">
  <h1 class="text-3xl font-bold text-center mb-2">Image Mastery Gallery: ${theme}</h1>
  <p class="text-center text-neutral-400 mb-8">Prompt used: "${finalPrompt}"<br>Total estimated cost: $${totalCost.toFixed(3)}</p>
  ${sections}
</body>
</html>`;
}
