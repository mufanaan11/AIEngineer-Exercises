export type Category = 'billing' | 'technical' | 'general';
export type Urgency = 'low' | 'medium' | 'high';

export interface Article {
  category: Category;
  title: string;
  content: string;
}

export interface MatchedArticle {
  title: string;
  content: string;
}

export interface Ticket {
  _id: string;
  text: string;
  status: 'processing' | 'done' | 'error';
  category?: Category;
  urgency?: Urgency;
  articles?: MatchedArticle[];
  reply?: string;
  error?: string;
  createdAt: string;
  updatedAt?: string;
}
