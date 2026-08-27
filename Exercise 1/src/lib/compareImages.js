import OpenAI from 'openai';

export async function pickBestImage(results, theme) {
  if (results.length === 0) return null;
  if (results.length === 1) return { ...results[0], score: null };

  if (process.env.OPENAI_API_KEY) {
    try {
      return await scoreWithVision(results, theme);
    } catch (err) {
      console.warn(`Vision-based scoring failed, falling back to file-size heuristic: ${err.message}`);
    }
  }

  return scoreByFileSize(results);
}

async function scoreWithVision(results, theme) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const scored = [];

  for (const r of results) {
    const b64 = r.buffer.toString('base64');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Rate how well this image represents the theme "${theme}" on a scale of 1-10, considering composition, clarity, and creativity. Reply with ONLY the number.`
          },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } }
        ]
      }],
      max_tokens: 5
    });

    const score = parseFloat(response.choices[0].message.content.trim()) || 0;
    scored.push({ ...r, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

function scoreByFileSize(results) {
  const scored = results.map((r) => ({ ...r, score: r.buffer.length }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}
