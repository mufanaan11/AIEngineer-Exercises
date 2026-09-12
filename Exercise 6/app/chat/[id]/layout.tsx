import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserConversations } from '@/lib/chat-store';
import ChatSidebar from '@/components/chat-sidebar';

interface ChatIdLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ChatIdLayout({ children, params }: ChatIdLayoutProps) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const conversations = await getUserConversations(session.user.id);

  return (
    <ChatSidebar conversations={conversations} activeConversationId={id}>
      {children}
    </ChatSidebar>
  );
}
