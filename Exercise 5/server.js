import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ObjectId } from 'mongodb';

import { getDb } from './src/db/mongo.js';
import { queryDatabaseTool } from './src/tools/databaseTool.js';
import { searchMoviesTool, getMovieDetailsTool, recommendMoviesTool } from './src/tools/movieTool.js';
import { dadJokeTool } from './src/tools/jokeTool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const tools = {
  queryDatabase: queryDatabaseTool,
  searchMovies: searchMoviesTool,
  getMovieDetails: getMovieDetailsTool,
  recommendMovies: recommendMoviesTool,
  dadJoke: dadJokeTool
};

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId: incomingSessionId } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A non-empty "message" string is required.' });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set on the server. Add it to .env and restart.' });
    }

    const sessionId = incomingSessionId || randomUUID();
    const db = await getDb();

    const history = await db
      .collection('conversations')
      .find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(20)
      .toArray();

    const messages = [...history.map((h) => ({ role: h.role, content: h.content })), { role: 'user', content: message }];

    await db.collection('conversations').insertOne({ sessionId, role: 'user', content: message, createdAt: new Date() });

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system:
        'You are a helpful assistant with access to a movie database, the OMDb movie API, and a joke generator. Use tools when the user asks about movies, users, reviews, or wants a joke. Keep replies brief since tool results are shown separately.',
      messages,
      tools,
      maxSteps: 5
    });

    await db.collection('conversations').insertOne({ sessionId, role: 'assistant', content: result.text, createdAt: new Date() });

    const toolResults = (result.toolResults || []).map((tr) => ({ toolName: tr.toolName, result: tr.result }));

    res.json({ sessionId, text: result.text, toolResults });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Something went wrong processing your message.' });
  }
});

app.post('/api/jokes/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body || {};
    if (!['up', 'down'].includes(vote)) {
      return res.status(400).json({ error: 'vote must be "up" or "down"' });
    }
    const db = await getDb();
    const field = vote === 'up' ? 'upvotes' : 'downvotes';
    await db.collection('jokes').updateOne({ _id: new ObjectId(id) }, { $inc: { [field]: 1 } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Rate error:', err);
    res.status(500).json({ error: 'Could not rate joke.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI SDK tools chat running at http://localhost:${PORT}`));
