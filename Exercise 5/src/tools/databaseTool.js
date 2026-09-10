import { tool } from 'ai';
import { z } from 'zod';
import { getDb } from '../db/mongo.js';

const ALLOWED_FIELDS = {
  movies: ['title', 'year', 'genre', 'rating', 'director'],
  users: ['name', 'email', 'age', 'favorite_genre'],
  reviews: ['movie_id', 'user_id', 'rating', 'date']
};

const ALLOWED_OPERATORS = ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in'];

function sanitizeFilters(collection, filters = {}) {
  const allowedFields = ALLOWED_FIELDS[collection] || [];
  const clean = {};
  for (const [field, value] of Object.entries(filters)) {
    if (!allowedFields.includes(field)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const cleanOps = {};
      for (const [op, opVal] of Object.entries(value)) {
        if (ALLOWED_OPERATORS.includes(op)) cleanOps[op] = opVal;
      }
      if (Object.keys(cleanOps).length) clean[field] = cleanOps;
    } else {
      clean[field] = value;
    }
  }
  return clean;
}

async function recordUsage(db, name) {
  await db.collection('tool_usage').updateOne(
    { tool: name },
    { $inc: { count: 1 }, $set: { lastUsedAt: new Date() } },
    { upsert: true }
  );
}

export const queryDatabaseTool = tool({
  description:
    'Query the movies, users, or reviews collections in the database. Use filters to match fields (e.g. genre, rating, age), or groupBy to count records per field value (e.g. "count movies by genre").',
  parameters: z.object({
    collection: z.enum(['movies', 'users', 'reviews']).describe('Which collection to query'),
    filters: z
      .record(z.any())
      .optional()
      .describe('MongoDB-style filter, e.g. {"genre":"Sci-Fi"} or {"rating":{"$gt":8.5}} or {"age":{"$gt":25}}'),
    groupBy: z.string().optional().describe('Field to group by for counting, e.g. "genre"'),
    sort: z.record(z.number()).optional().describe('e.g. {"rating": -1} for highest rating first'),
    limit: z.number().int().min(1).max(50).optional().default(20)
  }),
  execute: async ({ collection, filters, groupBy, sort, limit }) => {
    try {
      const db = await getDb();
      await recordUsage(db, 'queryDatabase');
      const clean = sanitizeFilters(collection, filters);

      if (groupBy && ALLOWED_FIELDS[collection]?.includes(groupBy)) {
        const results = await db
          .collection(collection)
          .aggregate([
            { $match: clean },
            { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ])
          .toArray();
        return { type: 'group', collection, groupBy, results };
      }

      const cursor = db.collection(collection).find(clean).limit(limit ?? 20);
      if (sort) cursor.sort(sort);
      const results = await cursor.toArray();
      return { type: 'list', collection, count: results.length, results };
    } catch (err) {
      return { error: `Database query failed: ${err.message}` };
    }
  }
});
