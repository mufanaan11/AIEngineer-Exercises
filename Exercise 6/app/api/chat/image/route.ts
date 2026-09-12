import { openai } from '@ai-sdk/openai';
import { experimental_generateImage as generateImage, UIMessage } from 'ai';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import { getConversation, saveChat } from '@/lib/chat-store';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { id: conversationId, prompt } = body;

    if (!conversationId) {
      return new Response('Conversation ID is required', { status: 400 });
    }

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return new Response('A prompt is required', { status: 400 });
    }

    // Validate conversation ownership (same check used by the text chat route)
    const conversation = await getConversation(conversationId, session.user.id);
    if (!conversation) {
      return new Response('Conversation not found', { status: 404 });
    }

    let result;
    try {
      result = await generateImage({
        model: openai.image('gpt-image-1'),
        prompt,
        size: '1024x1024',
      });
    } catch (error) {
      console.error('Image generation failed:', error);
      return new Response('Image generation failed', { status: 502 });
    }

    const dataUrl = `data:${result.image.mediaType};base64,${result.image.base64}`;

    const userMessage: UIMessage = {
      id: nanoid(),
      role: 'user',
      parts: [{ type: 'text', text: `Generate an image: ${prompt}` }],
    };

    const assistantMessage: UIMessage = {
      id: nanoid(),
      role: 'assistant',
      parts: [{ type: 'text', text: dataUrl }],
    };

    await saveChat({ chatId: conversationId, messages: [userMessage, assistantMessage] });

    return Response.json({ userMessage, assistantMessage });
  } catch (error) {
    console.error('Image API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
