import { nanoid } from 'nanoid';
import { inngest } from '@/inngest/client';
import { getDb } from '@/lib/mongodb';
import type { Ticket } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (typeof text !== 'string' || !text.trim()) {
      return new Response('Ticket text is required', { status: 400 });
    }

    const ticketId = nanoid();
    const db = await getDb();

    await db.collection<Ticket>('tickets').insertOne({
      _id: ticketId,
      text: text.trim(),
      status: 'processing',
      createdAt: new Date().toISOString(),
    });

    await inngest.send({ name: 'ticket/submitted', data: { ticketId, text: text.trim() } });

    return Response.json({ ticketId });
  } catch (error) {
    console.error('Ticket submission error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
