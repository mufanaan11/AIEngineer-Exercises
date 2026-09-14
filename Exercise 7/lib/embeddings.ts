import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

export const EMBEDDING_DIMENSION = 1536;

const embeddingModel = openai.textEmbeddingModel('text-embedding-3-small');

export async function embedTexts(values: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({ model: embeddingModel, values });
  return embeddings;
}

export async function embedQuery(value: string): Promise<number[]> {
  const { embedding } = await embed({ model: embeddingModel, value });
  return embedding;
}
