import OpenAI from 'openai';

export async function generateSpeech({ voice, instructions, text }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice,
    input: text,
    instructions
  });

  return Buffer.from(await response.arrayBuffer());
}
