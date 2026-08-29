import OpenAI from 'openai';

const VOICE_POOL = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export async function generateConversationScript(topic) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You write short multi-speaker conversation scripts for a text-to-speech demo. Given a topic, produce 4 to 6 turns between 2 to 3 distinct speakers, with each turn showing a different emotional tone. Respond with strict JSON: {"turns": [{"speaker": string, "emotion": string, "instructions": string, "text": string}]}. "instructions" is a short voice-direction sentence describing tone, pacing, and delivery for that emotion, written for a TTS engine. "text" is a single natural spoken line, under 30 words.'
      },
      { role: 'user', content: `Topic: ${topic}` }
    ],
    temperature: 0.9,
    max_tokens: 800
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  const rawTurns = Array.isArray(parsed.turns) ? parsed.turns : [];

  const voiceBySpeaker = new Map();
  let nextVoiceIndex = 0;

  return rawTurns
    .filter((t) => t && t.speaker && t.text)
    .map((t) => {
      if (!voiceBySpeaker.has(t.speaker)) {
        voiceBySpeaker.set(t.speaker, VOICE_POOL[nextVoiceIndex % VOICE_POOL.length]);
        nextVoiceIndex += 1;
      }

      const emotion = t.emotion || 'neutral';
      return {
        speaker: t.speaker,
        voice: voiceBySpeaker.get(t.speaker),
        emotion,
        instructions: t.instructions || `Speak in a ${emotion} tone.`,
        text: t.text
      };
    });
}
