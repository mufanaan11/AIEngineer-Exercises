import 'dotenv/config';
import readline from 'readline/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { generateImage } from './src/lib/imageGenerator.js';
import { getPromptSuggestions } from './src/lib/promptEnhancer.js';
import { estimateCost } from './src/lib/costEstimator.js';
import { writeFile, slugify } from './src/lib/fileUtils.js';
import { buildGalleryHtml } from './src/lib/gallery.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

const SIZE_LABELS = {
  '1024x1024': 'square',
  '1536x1024': 'landscape',
  '1024x1536': 'portrait',
  '1792x1024': 'landscape',
  '1024x1792': 'portrait'
};

async function getTheme(rl) {
  const argTheme = process.argv.slice(2).join(' ').trim();
  if (argTheme) return argTheme;

  const theme = await rl.question('Enter a theme for your images (e.g. "cyberpunk cityscape"): ');
  return theme.trim();
}

async function chooseFinalPrompt(theme, rl) {
  let suggestions = [];
  try {
    suggestions = await getPromptSuggestions(theme);
  } catch (err) {
    console.warn(`Prompt enhancement skipped: ${err.message}`);
  }

  if (suggestions.length === 0) return theme;

  console.log('\nEnhanced prompt suggestions:');
  suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  console.log('  0. Use original theme as-is');

  const choice = (await rl.question(`\nChoose a prompt to use (0-${suggestions.length}, Enter for original): `)).trim();
  const index = parseInt(choice, 10);
  if (Number.isInteger(index) && index >= 1 && index <= suggestions.length) {
    return suggestions[index - 1];
  }
  return theme;
}

function buildJobs() {
  const gptImageJobs = ['1024x1024', '1536x1024', '1024x1536'].map((size) => ({
    model: 'gpt-image-1',
    size,
    style: null,
    quality: 'medium'
  }));

  const dalleJobs = ['1024x1024', '1792x1024', '1024x1792'].flatMap((size) =>
    ['vivid', 'natural'].map((style) => ({
      model: 'dall-e-3',
      size,
      style,
      quality: 'standard'
    }))
  );

  return [...gptImageJobs, ...dalleJobs];
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set. Add it to a .env file (see .env.example) and try again.');
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const theme = await getTheme(rl);
  if (!theme) {
    rl.close();
    console.error('A theme is required.');
    process.exit(1);
  }

  const finalPrompt = await chooseFinalPrompt(theme, rl);
  rl.close();

  const slug = slugify(theme);
  const timestamp = Date.now();
  const jobs = buildJobs();

  console.log(`\nGenerating ${jobs.length} images for theme: "${theme}"...\n`);

  const settled = await Promise.allSettled(
    jobs.map((job) => generateImage({ ...job, prompt: finalPrompt }))
  );

  const images = [];
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const outcome = settled[i];
    const label = `${job.model} / ${SIZE_LABELS[job.size]} (${job.size})${job.style ? ` / ${job.style}` : ''}`;

    if (outcome.status === 'rejected') {
      console.warn(`✗ ${label} failed: ${outcome.reason.message}`);
      continue;
    }

    const { buffer, revisedPrompt } = outcome.value;
    const filename = `${slug}-${job.model}-${SIZE_LABELS[job.size]}${job.style ? `-${job.style}` : ''}-${timestamp}.png`;
    await writeFile(buffer, path.join(OUTPUT_DIR, filename));

    const estimatedCostUSD = estimateCost(job.model, job.size, job.quality);
    images.push({
      ...job,
      sizeLabel: SIZE_LABELS[job.size],
      filename,
      promptUsed: finalPrompt,
      revisedPrompt,
      estimatedCostUSD,
      generatedAt: new Date().toISOString()
    });

    console.log(`✓ ${label} — $${estimatedCostUSD.toFixed(3)}`);
  }

  if (images.length === 0) {
    console.error('\nNo images were generated.');
    process.exit(1);
  }

  const totalCost = images.reduce((sum, img) => sum + img.estimatedCostUSD, 0);

  const metadata = {
    theme,
    finalPrompt,
    generatedAt: new Date().toISOString(),
    totalEstimatedCostUSD: Number(totalCost.toFixed(3)),
    images
  };
  await writeFile(
    Buffer.from(JSON.stringify(metadata, null, 2)),
    path.join(OUTPUT_DIR, `metadata-${slug}-${timestamp}.json`)
  );

  const html = buildGalleryHtml({ theme, finalPrompt, images, totalCost });
  const galleryFilename = `gallery-${slug}-${timestamp}.html`;
  await writeFile(Buffer.from(html), path.join(OUTPUT_DIR, galleryFilename));

  console.log(`\nTotal estimated cost: $${totalCost.toFixed(3)}`);
  console.log(`Done! Open output/${galleryFilename} in your browser.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
