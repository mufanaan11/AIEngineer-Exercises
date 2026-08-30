import OpenAI from 'openai';
import { withFallback } from '../lib/retry.js';

async function generate(cfg, prompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const request = { model: cfg.model, prompt, size: cfg.size, n: 1, quality: cfg.quality };
  if (cfg.model === 'dall-e-3') {
    request.style = cfg.style;
    request.response_format = 'b64_json';
  }

  const response = await openai.images.generate(request);
  return {
    buffer: Buffer.from(response.data[0].b64_json, 'base64'),
    modelUsed: cfg.model,
    sizeUsed: cfg.size,
    qualityUsed: cfg.quality
  };
}

export async function generateHeaderImage(topic) {
  const prompt = `A professional, eye-catching header banner image for an article about: ${topic}. Wide editorial style, no text overlay.`;

  return withFallback(
    [
      { model: 'dall-e-3', size: '1792x1024', quality: 'standard', style: 'vivid' },
      { model: 'gpt-image-1', size: '1536x1024', quality: 'medium' }
    ],
    (cfg) => generate(cfg, prompt)
  );
}

export async function generateThumbnail(topic) {
  const prompt = `A clean, eye-catching square thumbnail image representing: ${topic}. No text overlay.`;

  return withFallback(
    [
      { model: 'gpt-image-1', size: '1024x1024', quality: 'medium' },
      { model: 'dall-e-3', size: '1024x1024', quality: 'standard', style: 'natural' }
    ],
    (cfg) => generate(cfg, prompt)
  );
}
