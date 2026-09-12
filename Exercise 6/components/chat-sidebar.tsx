'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Plus } from 'lucide-react';
import type { getUserConversations } from '@/lib/chat-store';

type Conversation = Awaited<ReturnType<typeof getUserConversations>>[number];

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  children: React.ReactNode;
}

export default function ChatSidebar({ conversations, activeConversationId, children }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-white border-b border-rose-100 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Open conversation history"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium text-gray-900">Conversations</span>
        <div className="w-9" />
      </div>

      {/* Mobile drawer backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: static column on desktop, slide-in drawer on mobile */}
      <aside
        role="navigation"
        aria-label="Conversation history"
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-gray-50 border-r border-rose-100 transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-rose-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(false)}
              aria-label="Close conversation history"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-3">
            <Link href="/chat/new" onClick={() => setIsOpen(false)}>
              <Button className="w-full justify-start bg-rose-500 hover:bg-rose-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-gray-500 px-2 py-4 text-center">No conversations yet</p>
            ) : (
              conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <Link
                    key={conversation.id}
                    href={`/chat/${conversation.id}`}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm truncate transition-colors ${
                      isActive ? 'bg-rose-100 text-rose-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {conversation.title}
                  </Link>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-rose-100">
            <Link href="/chat" onClick={() => setIsOpen(false)} className="text-xs text-rose-600 hover:underline">
              View all conversations
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 pt-14 md:pt-0">{children}</div>
    </div>
  );
}
