import { Pinecone } from '@pinecone-database/pinecone';
import { EMBEDDING_DIMENSION } from './embeddings';

export interface ChunkMetadata extends Record<string, string> {
  text: string;
  source: string;
}

let client: Pinecone | null = null;

function getClient(): Pinecone {
  if (!client) {
    client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return client;
}

export async function ensureIndex() {
  const pc = getClient();
  const indexName = process.env.PINECONE_INDEX_NAME!;

  const { indexes } = await pc.indexes.list();
  const exists = indexes?.some((index) => index.name === indexName);

  if (!exists) {
    await pc.indexes.create({
      name: indexName,
      dimension: EMBEDDING_DIMENSION,
      metric: 'cosine',
      spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
      waitUntilReady: true,
    });
  }

  return pc.index<ChunkMetadata>({ name: indexName });
}

export async function upsertChunks(
  chunks: { id: string; embedding: number[]; text: string; source: string }[]
) {
  const index = await ensureIndex();

  await index.upsert({
    records: chunks.map((chunk) => ({
      id: chunk.id,
      values: chunk.embedding,
      metadata: { text: chunk.text, source: chunk.source },
    })),
  });
}

export interface RetrievedChunk {
  score: number;
  text: string;
  source: string;
}

export async function queryTopK(vector: number[], topK = 4): Promise<RetrievedChunk[]> {
  const index = await ensureIndex();

  const result = await index.query({ vector, topK, includeMetadata: true });

  return result.matches.map((match) => ({
    score: match.score ?? 0,
    text: match.metadata?.text ?? '',
    source: match.metadata?.source ?? 'unknown',
  }));
}
