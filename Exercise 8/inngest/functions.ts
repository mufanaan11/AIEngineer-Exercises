import { createState } from '@inngest/agent-kit';
import { inngest } from './client';
import { triageNetwork } from './network';
import { getDb } from '../lib/mongodb';
import type { TriageState } from './state';
import type { Ticket } from '../lib/types';

export const processTicket = inngest.createFunction(
  { id: 'process-support-ticket', triggers: { event: 'ticket/submitted' } },
  async ({ event, step }) => {
    const { ticketId, text } = event.data as { ticketId: string; text: string };

    try {
      await triageNetwork.run(text, {
        state: createState<TriageState>({ ticketId, ticketText: text }),
      });
    } catch (error) {
      await step.run('mark-ticket-error', async () => {
        const db = await getDb();
        await db.collection<Ticket>('tickets').updateOne(
          { _id: ticketId },
          {
            $set: {
              status: 'error',
              error: error instanceof Error ? error.message : String(error),
              updatedAt: new Date().toISOString(),
            },
          }
        );
      });
      throw error;
    }
  }
);
