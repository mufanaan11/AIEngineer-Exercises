import OpenAI from 'openai';

export async function getPromptSuggestions(theme) {
  if (!process.env.OPENAI_API_KEY) return [];

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You write short, vivid, detailed prompts for AI image generation. Given a theme, propose 3 distinct enhanced prompts, each on its own line, with no numbering and no extra commentary.'
      },
      { role: 'user', content: theme }
    ],
    max_tokens: 200,
    temperature: 0.8
  });

  const text = response.choices[0].message.content.trim();
  return text
    .split('\n')
    .map((line) => line.replace(/^[-\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}
