import { fal } from '@fal-ai/client';

export async function generateFalImage(theme) {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY not set');
  }

  fal.config({ credentials: process.env.FAL_KEY });

  const result = await fal.subscribe('fal-ai/flux/schnell', {
    input: { prompt: `A stunning, high-quality artwork depicting: ${theme}` }
  });

  const url = result.data.images[0].url;
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { service: 'fal', buffer };
}
