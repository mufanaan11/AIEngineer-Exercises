import { tool } from 'ai';
import { z } from 'zod';
import { getDb } from '../db/mongo.js';

const LOCAL_FALLBACK = {
  dad: [
    "I'm afraid for the calendar. Its days are numbered.",
    "Why don't skeletons fight each other? They don't have the guts."
  ],
  programming: [
    'Why do programmers prefer dark mode? Because light attracts bugs.',
    "There are 10 types of people: those who understand binary and those who don't."
  ],
  general: [
    "I told my computer I needed a break, and it said no problem, it'll go to sleep.",
    'Why did the scarecrow win an award? Because he was outstanding in his field.'
  ]
};

function pickLocal(category, search) {
  const list = LOCAL_FALLBACK[category] || LOCAL_FALLBACK.general;
  if (search) {
    const match = list.find((j) => j.toLowerCase().includes(search.toLowerCase()));
    if (match) return match;
  }
  return list[Math.floor(Math.random() * list.length)];
}

async function fetchDadJoke(search) {
  const url = search
    ? `https://icanhazdadjoke.com/search?term=${encodeURIComponent(search)}`
    : 'https://icanhazdadjoke.com/';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`icanhazdadjoke responded ${res.status}`);
  const data = await res.json();
  if (search) {
    const first = data.results?.[0];
    if (!first) throw new Error('No matching joke found');
    return first.joke;
  }
  return data.joke;
}

export const dadJokeTool = tool({
  description:
    'Get a joke to tell the user. category "dad" is fetched live from icanhazdadjoke.com; "programming" and "general" come from a local collection. Optionally search by keyword.',
  parameters: z.object({
    category: z.enum(['dad', 'programming', 'general']).optional().default('dad'),
    search: z.string().optional().describe('Keyword to search for in jokes')
  }),
  execute: async ({ category, search }) => {
    const db = await getDb();
    await db.collection('tool_usage').updateOne(
      { tool: 'dadJoke' },
      { $inc: { count: 1 }, $set: { lastUsedAt: new Date() } },
      { upsert: true }
    );

    let text;
    let source;

    if (category === 'dad') {
      try {
        text = await fetchDadJoke(search);
        source = 'api';
      } catch {
        text = pickLocal(category, search);
        source = 'local-fallback';
      }
    } else {
      text = pickLocal(category, search);
      source = 'local';
    }

    const doc = { text, category, source, upvotes: 0, downvotes: 0, createdAt: new Date() };
    const { insertedId } = await db.collection('jokes').insertOne(doc);
    return { id: insertedId.toString(), ...doc };
  }
});
