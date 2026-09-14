import crypto from 'crypto';
import { extractText, UnsupportedFileTypeError } from '@/lib/fileParser';
import { chunkText } from '@/lib/chunker';
import { embedTexts } from '@/lib/embeddings';
import { upsertChunks } from '@/lib/pinecone';
import { appendToManifest } from '@/lib/manifest';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return new Response('No file provided', { status: 400 });
    }

    let text: string;
    try {
      text = await extractText(file);
    } catch (error) {
      if (error instanceof UnsupportedFileTypeError) {
        return new Response(error.message, { status: 400 });
      }
      throw error;
    }

    if (!text.trim()) {
      return new Response('No extractable text found in that file', { status: 400 });
    }

    const pieces = chunkText(text);
    const embeddings = await embedTexts(pieces);

    const chunks = pieces.map((pieceText, i) => ({
      id: crypto.createHash('sha1').update(`${file.name}-${i}-${Date.now()}`).digest('hex'),
      text: pieceText,
      source: file.name,
      embedding: embeddings[i],
    }));

    await upsertChunks(chunks);
    await appendToManifest({
      filename: file.name,
      chunkCount: chunks.length,
      uploadedAt: new Date().toISOString(),
    });

    return Response.json({ filename: file.name, chunkCount: chunks.length });
  } catch (error) {
    console.error('Upload API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
