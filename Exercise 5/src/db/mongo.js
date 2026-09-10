import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let dbPromise;

async function connect() {
  await client.connect();
  const db = client.db('ai_sdk_exercise');
  await db.collection('movies').createIndex({ genre: 1 });
  await db.collection('movies').createIndex({ rating: -1 });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('reviews').createIndex({ movie_id: 1 });
  await db.collection('movie_cache').createIndex({ key: 1 }, { unique: true });
  return db;
}

export function getDb() {
  if (!dbPromise) dbPromise = connect();
  return dbPromise;
}
