import { z } from 'zod';
import { createTool } from '@inngest/agent-kit';
import { getDb } from '../lib/mongodb';
import type { Article, MatchedArticle, Ticket } from '../lib/types';
import type { TriageState } from './state';

export const setClassification = createTool({
  name: 'set_classification',
  description: "Record the ticket's category and urgency.",
  parameters: z.object({
    category: z.enum(['billing', 'technical', 'general']),
    urgency: z.enum(['low', 'medium', 'high']),
  }),
  handler: async ({ category, urgency }, { network }) => {
    const state = network!.state.data as TriageState;
    state.category = category;
    state.urgency = urgency;
    return `Classified as ${category} / ${urgency} urgency.`;
  },
});

export const searchKnowledgeBase = createTool({
  name: 'search_knowledge_base',
  description: 'Search the knowledge base for articles relevant to the ticket.',
  parameters: z.object({
    query: z.string().describe('Keywords to search the knowledge base for'),
  }),
  handler: async ({ query }, { network, step }) => {
    const state = network!.state.data as TriageState;

    const run = async (): Promise<MatchedArticle[]> => {
      const db = await getDb();
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

      const articles = await db
        .collection<Article>('articles')
        .find(state.category ? { category: state.category } : {})
        .toArray();

      const scored = articles
        .map((article) => {
          const haystack = `${article.title} ${article.content}`.toLowerCase();
          const score = terms.filter((term) => haystack.includes(term)).length;
          return { article, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score);

      const matches = (scored.length > 0 ? scored.map((s) => s.article) : articles).slice(0, 3);
      return matches.map((a) => ({ title: a.title, content: a.content }));
    };

    const results = step ? await step.run('search-knowledge-base', run) : await run();

    state.articles = results;
    return results;
  },
});

export const saveTicket = createTool({
  name: 'save_ticket',
  description: "Save the final reply and mark the ticket as resolved. Call this once you've drafted your reply.",
  parameters: z.object({
    reply: z.string().describe('The final reply to send to the customer'),
  }),
  handler: async ({ reply }, { network, step }) => {
    const state = network!.state.data as TriageState;
    state.reply = reply;

    const run = async () => {
      const db = await getDb();
      await db.collection<Ticket>('tickets').updateOne(
        { _id: state.ticketId },
        {
          $set: {
            status: 'done',
            category: state.category,
            urgency: state.urgency,
            articles: state.articles,
            reply,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    };

    if (step) {
      await step.run('save-ticket', run);
    } else {
      await run();
    }

    return 'Ticket saved.';
  },
});
