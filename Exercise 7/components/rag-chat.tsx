'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, AlertCircle } from 'lucide-react';

export default function RagChat() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
            <Bot className="mb-3 h-8 w-8 text-indigo-400" />
            <p className="text-sm">Upload a document, then ask a question about it.</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-lg items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  {message.role === 'user' ? (
                    <User className="h-3.5 w-3.5 text-indigo-600" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-indigo-600" />
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    message.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.parts.map((part, i) =>
                    part.type === 'text' ? <span key={i}>{part.text}</span> : null
                  )}
                </div>
              </div>
            </div>
          ))}

          {(status === 'submitted' || status === 'streaming') && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-500">
                {status === 'submitted' ? 'Thinking...' : 'Responding...'}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Something went wrong. Please try again.
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (text && status === 'ready') {
            sendMessage({ text });
            setInput('');
          }
        }}
        className="flex gap-2 border-t border-gray-200 p-3"
      >
        <input
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          value={input}
          placeholder="Ask about your documents..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== 'ready'}
        />
        <button
          type="submit"
          disabled={status !== 'ready' || !input.trim()}
          className="flex items-center justify-center rounded-lg bg-indigo-500 px-3 py-2 text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
