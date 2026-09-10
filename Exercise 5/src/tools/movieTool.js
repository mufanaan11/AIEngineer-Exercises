import { tool } from 'ai';
import { z } from 'zod';
import { getDb } from '../db/mongo.js';

const OMDB_URL = 'https://www.omdbapi.com/';

async function recordUsage(db, name) {
  await db.collection('tool_usage').updateOne(
    { tool: name },
    { $inc: { count: 1 }, $set: { lastUsedAt: new Date() } },
    { upsert: true }
  );
}

async function fetchJsonWithRetry(url, attempts = 2) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export const searchMoviesTool = tool({
  description: 'Search for movies by (partial) title, optionally filtered by year. Returns a short list of candidates with title, year, and poster.',
  parameters: z.object({
    title: z.string().describe('Full or partial movie title'),
    year: z.string().optional()
  }),
  execute: async ({ title, year }) => {
    const db = await getDb();
    await recordUsage(db, 'searchMovies');

    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) return { error: 'OMDB_API_KEY is not set in .env' };

    const params = new URLSearchParams({ s: title, apikey: apiKey });
    if (year) params.set('y', year);

    try {
      const data = await fetchJsonWithRetry(`${OMDB_URL}?${params.toString()}`);
      if (data.Response === 'False') return { error: data.Error || 'Movie not found' };
      return {
        results: (data.Search || []).slice(0, 8).map((m) => ({
          title: m.Title,
          year: m.Year,
          imdbID: m.imdbID,
          poster: m.Poster !== 'N/A' ? m.Poster : null
        }))
      };
    } catch (err) {
      return { error: `OMDb search failed: ${err.message}` };
    }
  }
});

export const getMovieDetailsTool = tool({
  description: 'Fetch full movie details (plot, cast, director, ratings, runtime, poster) by exact title and optional year. Results are cached in the database.',
  parameters: z.object({
    title: z.string(),
    year: z.string().optional()
  }),
  execute: async ({ title, year }) => {
    const db = await getDb();
    await recordUsage(db, 'getMovieDetails');

    const cacheKey = `${title.toLowerCase()}::${year || ''}`;
    const cached = await db.collection('movie_cache').findOne({ key: cacheKey });

    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
      if (cached) return { ...cached.data, source: 'cache' };
      return { error: 'OMDB_API_KEY is not set in .env' };
    }

    const params = new URLSearchParams({ t: title, plot: 'full', apikey: apiKey });
    if (year) params.set('y', year);

    try {
      const data = await fetchJsonWithRetry(`${OMDB_URL}?${params.toString()}`);
      if (data.Response === 'False') {
        if (cached) return { ...cached.data, source: 'cache (stale, API said not found)' };
        return { error: data.Error || 'Movie not found' };
      }

      const details = {
        title: data.Title,
        year: data.Year,
        genre: data.Genre,
        director: data.Director,
        actors: data.Actors,
        plot: data.Plot,
        poster: data.Poster !== 'N/A' ? data.Poster : null,
        runtime: data.Runtime,
        imdbRating: data.imdbRating
      };

      await db.collection('movie_cache').updateOne(
        { key: cacheKey },
        { $set: { key: cacheKey, data: details, cachedAt: new Date() } },
        { upsert: true }
      );

      return { ...details, source: 'api' };
    } catch (err) {
      if (cached) return { ...cached.data, source: 'cache (API unreachable)' };
      return { error: `OMDb lookup failed: ${err.message}` };
    }
  }
});

export const recommendMoviesTool = tool({
  description: 'Recommend movies from the local database by genre, optionally excluding a title, sorted by rating.',
  parameters: z.object({
    genre: z.string().describe('Genre to recommend from, e.g. "Sci-Fi"'),
    excludeTitle: z.string().optional()
  }),
  execute: async ({ genre, excludeTitle }) => {
    const db = await getDb();
    await recordUsage(db, 'recommendMovies');

    const filter = { genre: { $regex: `^${genre}$`, $options: 'i' } };
    if (excludeTitle) filter.title = { $ne: excludeTitle };

    const results = await db.collection('movies').find(filter).sort({ rating: -1 }).limit(5).toArray();
    return { genre, results };
  }
});
