import OpenAI from 'openai';

export async function generateImage({ model, prompt, size, style, quality }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const request = { model, prompt, size, n: 1, quality };

  if (model === 'dall-e-3') {
    request.style = style;
    request.response_format = 'b64_json';
  }

  const response = await openai.images.generate(request);
  const buffer = Buffer.from(response.data[0].b64_json, 'base64');
  const revisedPrompt = response.data[0].revised_prompt || prompt;

  return { buffer, revisedPrompt };
}
