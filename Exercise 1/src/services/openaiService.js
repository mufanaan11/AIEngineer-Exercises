import OpenAI from 'openai';

export async function generateOpenAIImage(theme) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: `A stunning, high-quality artwork depicting: ${theme}`,
    size: '1024x1024',
    n: 1
  });

  const buffer = Buffer.from(response.data[0].b64_json, 'base64');
  return { service: 'openai', buffer };
}
