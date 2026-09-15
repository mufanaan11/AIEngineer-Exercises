import { getDb } from '@/lib/mongodb';
import type { Ticket } from '@/lib/types';

export async function GET(_req: Request, ctx: RouteContext<'/api/tickets/[id]'>) {
  const { id } = await ctx.params;

  const db = await getDb();
  const ticket = await db.collection<Ticket>('tickets').findOne({ _id: id });

  if (!ticket) {
    return new Response('Ticket not found', { status: 404 });
  }

  return Response.json(ticket);
}
