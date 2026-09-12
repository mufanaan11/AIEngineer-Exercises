import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages, createIdGenerator, validateUIMessages } from 'ai';
import { auth } from '@/lib/auth';
import { loadChat, saveChat, getConversation } from '@/lib/chat-store';
import { withFallback } from '@/lib/with-fallback';

// Try the primary model first; fall back to a cheaper/more available model
// if the provider call itself fails to initialize (e.g. bad model id, key issue).
const MODEL_FALLBACK_ORDER = ['gpt-4o', 'gpt-4o-mini'] as const;

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Following AI SDK best practices: expect either full messages or single message
    const body = await req.json();
    const { messages, message: singleMessage, id: conversationId } = body;

    if (!conversationId) {
      return new Response('Conversation ID is required', { status: 400 });
    }

    // Validate conversation ownership
    const conversation = await getConversation(conversationId, session.user.id);
    if (!conversation) {
      return new Response('Conversation not found', { status: 404 });
    }

    let allMessages: UIMessage[];

    if (singleMessage) {
      // Following Vercel guide: load previous messages and append new one
      const previousMessages = await loadChat(conversationId);
      allMessages = [...previousMessages, singleMessage];
    } else if (messages) {
      // Fallback: use all messages (less efficient)
      allMessages = messages;
    } else {
      return new Response('No messages provided', { status: 400 });
    }

    // Validate messages following Vercel guide
    let validatedMessages: UIMessage[];
    try {
      validatedMessages = await validateUIMessages({
        messages: allMessages,
        // Add tools, metadataSchema, dataPartsSchema here if needed
      });
    } catch (error) {
      console.error('Message validation failed:', error);
      return new Response('Invalid message format', { status: 400 });
    }

    // Stream the AI response with proper persistence following Vercel guide.
    // Falls back to a secondary model if the primary one fails to initialize.
    const result = await withFallback(MODEL_FALLBACK_ORDER, (model) =>
      streamText({
        model: openai(model),
        system: 'You are a helpful AI assistant. Be concise and helpful in your responses.',
        messages: convertToModelMessages(validatedMessages),
        onError: ({ error }) => {
          console.error(`streamText error (model: ${model}):`, error);
        },
      })
    );

    // Use consumeStream to handle client disconnects (Vercel guide recommendation)
    // Note: consumeStream() is called without await to not block the response
    result.consumeStream();

    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      // Generate consistent server-side IDs for persistence
      generateMessageId: createIdGenerator({
        prefix: 'msg',
        size: 16,
      }),
      onError: (error) => {
        console.error('Stream response error:', error);
        return 'An error occurred while generating a response.';
      },
      onFinish: async ({ messages }) => {
        // Following Vercel guide: save all messages including the new assistant response
        try {
          await saveChat({ chatId: conversationId, messages });
        } catch (error) {
          console.error('Error saving messages in onFinish:', error);
        }
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
