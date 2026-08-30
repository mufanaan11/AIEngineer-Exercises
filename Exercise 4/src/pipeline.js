import path from 'path';
import { generateArticle, generateSummary, generateSocialPosts } from './content/textGenerator.js';
import { generateHeaderImage, generateThumbnail } from './content/imageGenerator.js';
import { generateNarration } from './content/audioGenerator.js';
import { buildManifest, buildPackageHtml } from './content/packager.js';
import { textCost, imageCost, audioCost } from './lib/costTracker.js';
import { createTimer } from './lib/performanceMonitor.js';
import { writeFile, slugify } from './lib/fileUtils.js';

export async function runPipeline(topic, outputRoot) {
  const timer = createTimer();
  const errors = [];
  const fallbacks = [];
  const costs = { text: 0, image: 0, audio: 0 };

  let article = null;
  let summary = null;
  let socialResult = null;

  try {
    article = await timer.time('article', () => generateArticle(topic));
    costs.text += textCost(article.model, article.usage);
  } catch (err) {
    errors.push({ stage: 'article', message: err.message });
  }

  if (article) {
    try {
      summary = await timer.time('summary', () => generateSummary(article.text));
      costs.text += textCost(summary.model, summary.usage);
    } catch (err) {
      errors.push({ stage: 'summary', message: err.message });
    }

    try {
      socialResult = await timer.time('socialPosts', () => generateSocialPosts(topic, article.text));
      costs.text += textCost(socialResult.model, socialResult.usage);
    } catch (err) {
      errors.push({ stage: 'socialPosts', message: err.message });
    }
  }

  let header = null;
  try {
    header = await timer.time('headerImage', () => generateHeaderImage(topic));
    if (header.modelUsed !== 'dall-e-3') fallbacks.push(`header image fell back to ${header.modelUsed}`);
    costs.image += imageCost(header.modelUsed, header.sizeUsed, header.qualityUsed);
  } catch (err) {
    errors.push({ stage: 'headerImage', message: err.message });
  }

  let thumbnail = null;
  try {
    thumbnail = await timer.time('thumbnail', () => generateThumbnail(topic));
    if (thumbnail.modelUsed !== 'gpt-image-1') fallbacks.push(`thumbnail fell back to ${thumbnail.modelUsed}`);
    costs.image += imageCost(thumbnail.modelUsed, thumbnail.sizeUsed, thumbnail.qualityUsed);
  } catch (err) {
    errors.push({ stage: 'thumbnail', message: err.message });
  }

  let narration = null;
  if (summary) {
    try {
      narration = await timer.time('narration', () => generateNarration(summary.text, { voice: 'onyx', emotion: 'excited' }));
      if (narration.modelUsed !== 'gpt-4o-mini-tts') fallbacks.push(`narration fell back to ${narration.modelUsed}`);
      costs.audio += audioCost(narration.modelUsed, summary.text.length);
    } catch (err) {
      errors.push({ stage: 'narration', message: err.message });
    }
  }

  const slug = slugify(topic);
  const timestamp = Date.now();
  const packageDir = path.join(outputRoot, `${slug}-${timestamp}`);

  const files = {};

  if (article) {
    files.article = 'article.md';
    await writeFile(Buffer.from(article.text), path.join(packageDir, files.article));
  }
  if (summary) {
    files.summary = 'summary.txt';
    await writeFile(Buffer.from(summary.text), path.join(packageDir, files.summary));
  }
  if (socialResult) {
    files.socialPosts = 'social-posts.json';
    await writeFile(Buffer.from(JSON.stringify(socialResult.posts, null, 2)), path.join(packageDir, files.socialPosts));
  }
  if (header) {
    files.header = 'header.png';
    await writeFile(header.buffer, path.join(packageDir, files.header));
  }
  if (thumbnail) {
    files.thumbnail = 'thumbnail.png';
    await writeFile(thumbnail.buffer, path.join(packageDir, files.thumbnail));
  }
  if (narration) {
    files.narration = 'narration.mp3';
    await writeFile(narration.buffer, path.join(packageDir, files.narration));
  }

  const performance = timer.summary();
  const manifest = buildManifest({ topic, files, costs, performance, fallbacks, errors });
  await writeFile(Buffer.from(JSON.stringify(manifest, null, 2)), path.join(packageDir, 'manifest.json'));

  const html = buildPackageHtml({ topic, article, summary, socialPosts: socialResult?.posts, files, manifest });
  await writeFile(Buffer.from(html), path.join(packageDir, 'index.html'));

  return {
    topic,
    outputDir: packageDir,
    totalCost: manifest.estimatedCostUSD.total,
    performance,
    fallbacks,
    errors
  };
}
