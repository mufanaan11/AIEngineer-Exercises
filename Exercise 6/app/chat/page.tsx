import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserConversations } from '@/lib/chat-store';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MessageSquare, Plus } from 'lucide-react';

function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default async function ChatHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const conversations = await getUserConversations(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Conversations</h1>
            <p className="text-gray-600">Pick up where you left off, or start something new.</p>
          </div>
          <Link href="/chat/new">
            <Button className="bg-rose-500 hover:bg-rose-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </Link>
        </div>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-rose-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-500 mb-6">Start your first conversation with the AI assistant.</p>
              <Link href="/chat/new">
                <Button className="bg-rose-500 hover:bg-rose-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Chatting
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <Link key={conversation.id} href={`/chat/${conversation.id}`}>
                <Card className="hover:border-rose-300 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">{conversation.title}</CardTitle>
                    <CardDescription>Updated {formatDateTime(conversation.updatedAt)}</CardDescription>
                    <CardAction>
                      <MessageSquare className="h-5 w-5 text-rose-400" />
                    </CardAction>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
