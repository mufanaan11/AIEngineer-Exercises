import OpenAI from 'openai';
import { withFallback } from '../lib/retry.js';

const EMOTION_INSTRUCTIONS = {
  neutral: 'Speak in a clear, neutral, professional narration voice.',
  excited: 'Speak with enthusiasm and energy, as if sharing exciting news.',
  calm: 'Speak in a slow, calm, soothing, reassuring tone.',
  serious: 'Speak in a serious, authoritative, measured tone.'
};

export async function generateNarration(text, { voice = 'onyx', emotion = 'neutral' } = {}) {
  return withFallback(
    [
      { model: 'gpt-4o-mini-tts', supportsInstructions: true },
      { model: 'tts-1', supportsInstructions: false }
    ],
    async (cfg) => {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const request = { model: cfg.model, voice, input: text };
      if (cfg.supportsInstructions) {
        request.instructions = EMOTION_INSTRUCTIONS[emotion] || EMOTION_INSTRUCTIONS.neutral;
      }

      const response = await openai.audio.speech.create(request);
      return {
        buffer: Buffer.from(await response.arrayBuffer()),
        modelUsed: cfg.model,
        voice,
        emotion
      };
    }
  );
}
