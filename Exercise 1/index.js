import 'dotenv/config';
import readline from 'readline/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { generateOpenAIImage } from './src/services/openaiService.js';
import { generateReplicateImage } from './src/services/replicateService.js';
import { generateFalImage } from './src/services/falService.js';
import { writeFile, slugify } from './src/lib/fileUtils.js';
import { pickBestImage } from './src/lib/compareImages.js';
import { generateVariations } from './src/lib/variations.js';
import { buildGalleryHtml } from './src/lib/gallery.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

async function getTheme() {
  const argTheme = process.argv.slice(2).join(' ').trim();
  if (argTheme) return argTheme;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const theme = await rl.question('Enter a theme for your AI art gallery (e.g. "space exploration"): ');
  rl.close();
  return theme.trim();
}

async function main() {
  const theme = await getTheme();
  if (!theme) {
    console.error('A theme is required.');
    process.exit(1);
  }

  const slug = slugify(theme);
  const timestamp = Date.now();

  console.log(`\nGenerating images for theme: "${theme}"...\n`);

  const generators = [
    { name: 'openai', fn: generateOpenAIImage },
    { name: 'replicate', fn: generateReplicateImage },
    { name: 'fal', fn: generateFalImage }
  ];

  const settled = await Promise.allSettled(generators.map((g) => g.fn(theme)));

  const results = [];
  settled.forEach((outcome, i) => {
    const name = generators[i].name;
    if (outcome.status === 'fulfilled') {
      results.push(outcome.value);
      console.log(`✓ ${name} generated an image`);
    } else {
      console.warn(`✗ ${name} skipped: ${outcome.reason.message}`);
    }
  });

  if (results.length === 0) {
    console.error('\nNo images were generated. Add API keys to a .env file (see .env.example) and try again.');
    process.exit(1);
  }

  for (const r of results) {
    r.filename = `${slug}-${r.service}-${timestamp}.png`;
    await writeFile(r.buffer, path.join(OUTPUT_DIR, r.filename));
  }

  console.log('\nPicking the best result...');
  const best = await pickBestImage(results, theme);
  console.log(`Best: ${best.service}${best.score != null ? ` (score: ${best.score})` : ''}`);

  console.log('\nGenerating variations of the best result...');
  const variations = await generateVariations(best, theme);
  variations.forEach((v, i) => {
    v.filename = `${slug}-${best.service}-variation-${i + 1}-${timestamp}.png`;
  });
  for (const v of variations) {
    await writeFile(v.buffer, path.join(OUTPUT_DIR, v.filename));
  }

  console.log('\nBuilding gallery page...');
  const html = buildGalleryHtml({ theme, results, best, variations });
  const galleryFilename = `gallery-${slug}-${timestamp}.html`;
  await writeFile(Buffer.from(html), path.join(OUTPUT_DIR, galleryFilename));

  console.log(`\nDone! Open output/${galleryFilename} in your browser.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
