import { createAgent, openai } from '@inngest/agent-kit';
import { setClassification, searchKnowledgeBase, saveTicket } from './tools';
import type { TriageState } from './state';

const model = openai({ model: 'gpt-5-mini' });

export const classifierAgent = createAgent<TriageState>({
  name: 'classifier',
  description: "Classifies a support ticket's category and urgency.",
  system: ({ network }) => `You are a support ticket classifier.
Read the ticket below and call "set_classification" exactly once with its category (billing, technical, or general) and urgency (low, medium, or high).

Ticket:
"""
${network?.state.data.ticketText}
"""`,
  model,
  tools: [setClassification],
});

export const knowledgeAgent = createAgent<TriageState>({
  name: 'knowledge',
  description: 'Finds knowledge base articles relevant to a support ticket.',
  system: ({ network }) => `You are a knowledge base researcher.
The ticket below was classified as "${network?.state.data.category}" (urgency: ${network?.state.data.urgency}).
Call "search_knowledge_base" exactly once with a short search query capturing the ticket's main issue.

Ticket:
"""
${network?.state.data.ticketText}
"""`,
  model,
  tools: [searchKnowledgeBase],
});

export const responseAgent = createAgent<TriageState>({
  name: 'response',
  description: 'Drafts a reply to the customer grounded in the knowledge base.',
  system: ({ network }) => {
    const articles = network?.state.data.articles ?? [];
    const articleText = articles
      .map((a, i) => `[${i + 1}] ${a.title}\n${a.content}`)
      .join('\n\n');

    return `You are a support agent replying to a customer.
Write a short, friendly, helpful reply to the ticket below, grounded ONLY in the knowledge base articles provided. If the articles don't cover the issue, say a human will follow up.
Then call "save_ticket" exactly once with your reply text.

Ticket:
"""
${network?.state.data.ticketText}
"""

Knowledge base articles:
${articleText || '(none found)'}`;
  },
  model,
  tools: [saveTicket],
});
