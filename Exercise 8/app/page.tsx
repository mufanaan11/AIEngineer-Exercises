'use client';

import { useEffect, useRef, useState } from 'react';
import type { Ticket } from '@/lib/types';

export default function Home() {
  const [text, setText] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function pollTicket(ticketId: string) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) return;

      const data: Ticket = await res.json();
      setTicket(data);

      if (data.status !== 'processing' && pollRef.current) {
        clearInterval(pollRef.current);
      }
    }, 1500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    setTicket(null);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(await res.text());

      const { ticketId } = await res.json();
      setTicket({ _id: ticketId, text, status: 'processing', createdAt: new Date().toISOString() });
      pollTicket(ticketId);
    } catch {
      setError('Could not submit the ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900">Support Ticket Triage</h1>
        <p className="mt-1 text-sm text-gray-500">
          Three agents work the ticket in sequence: classify it, look up relevant help articles, then draft a reply.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <textarea
            className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            rows={4}
            placeholder="Describe the customer's issue..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit ticket'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {ticket && (
          <div className="mt-8 space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            <Stage label="1. Classification" done={!!ticket.category}>
              {ticket.category && (
                <p className="text-sm text-gray-700">
                  Category: <span className="font-medium">{ticket.category}</span> &middot; Urgency:{' '}
                  <span className="font-medium">{ticket.urgency}</span>
                </p>
              )}
            </Stage>

            <Stage label="2. Knowledge base lookup" done={!!ticket.articles}>
              {ticket.articles && ticket.articles.length > 0 && (
                <ul className="space-y-1 text-sm text-gray-700">
                  {ticket.articles.map((a, i) => (
                    <li key={i}>&bull; {a.title}</li>
                  ))}
                </ul>
              )}
            </Stage>

            <Stage label="3. Drafted reply" done={!!ticket.reply}>
              {ticket.reply && <p className="text-sm whitespace-pre-wrap text-gray-700">{ticket.reply}</p>}
            </Stage>

            {ticket.status === 'error' && (
              <p className="text-sm text-red-600">Something went wrong: {ticket.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stage({ label, done, children }: { label: string; done: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${done ? 'bg-green-500' : 'bg-gray-300 animate-pulse'}`} />
        <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
      </div>
      <div className="mt-1 pl-4">{children}</div>
    </div>
  );
}
