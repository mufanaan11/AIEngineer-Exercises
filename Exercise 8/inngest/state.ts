import type { Category, MatchedArticle, Urgency } from '../lib/types';

export interface TriageState extends Record<string, unknown> {
  ticketId: string;
  ticketText: string;
  category?: Category;
  urgency?: Urgency;
  articles?: MatchedArticle[];
  reply?: string;
}
