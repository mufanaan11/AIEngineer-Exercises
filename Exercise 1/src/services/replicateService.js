import Replicate from 'replicate';

export async function generateReplicateImage(theme) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not set');
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const output = await replicate.run('black-forest-labs/flux-schnell', {
    input: { prompt: `A stunning, high-quality artwork depicting: ${theme}` }
  });

  const url = Array.isArray(output) ? output[0] : output;
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { service: 'replicate', buffer };
}
