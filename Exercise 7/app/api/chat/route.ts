import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { embedQuery } from '@/lib/embeddings';
import { queryTopK } from '@/lib/pinecone';

export const runtime = 'nodejs';
export const maxDuration = 30;

function lastUserQuestion(messages: UIMessage[]): string {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const textPart = lastUserMessage?.parts.find((p) => p.type === 'text');
  return textPart && 'text' in textPart ? textPart.text : '';
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const question = lastUserQuestion(messages).trim();

    let context = '';
    if (question) {
      const vector = await embedQuery(question);
      const matches = await queryTopK(vector, 4);
      context = matches
        .filter((m) => m.text)
        .map((m, i) => `[${i + 1}] (source: ${m.source})\n${m.text}`)
        .join('\n\n');
    }

    const systemPrompt = context
      ? `You answer questions using ONLY the provided context from the user's uploaded documents. Cite sources inline using [1], [2], etc. matching the context blocks. If the answer is not in the context, say you don't know.\n\nContext:\n\n${context}`
      : "No documents have been uploaded yet, or nothing relevant was found. Tell the user to upload a document first, or that you don't have information on that topic.";

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      onError: ({ error }) => {
        console.error('streamText error:', error);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('Stream response error:', error);
        return 'An error occurred while generating a response.';
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
