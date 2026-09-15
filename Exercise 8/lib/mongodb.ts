import { MongoClient, Db } from 'mongodb';

let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI!);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB_NAME);
}
