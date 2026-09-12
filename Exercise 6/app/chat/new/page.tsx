import { createConversation } from '@/lib/chat-store';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function NewChatPage() {
  // Get the authenticated session
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    // session not found, redirect to login
    redirect('/login');
  }

  // Create a new conversation and redirect to it
  const conversationId = await createConversation(session.user.id);
  redirect(`/chat/${conversationId}`);
}
