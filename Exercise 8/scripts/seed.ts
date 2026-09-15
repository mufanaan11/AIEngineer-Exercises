import 'dotenv/config';
import { getDb } from '../lib/mongodb';
import type { Article } from '../lib/types';

const articles: Article[] = [
  {
    category: 'billing',
    title: 'How to update your payment method',
    content:
      'Go to Account Settings > Billing > Payment Methods. Click "Add payment method", enter your card details, and set it as default. Old payment methods can be removed once a new default is set.',
  },
  {
    category: 'billing',
    title: 'Requesting a refund',
    content:
      'Refunds can be requested within 30 days of purchase from Account Settings > Billing > Order History by clicking "Request refund" next to the order. Refunds are processed within 5-7 business days.',
  },
  {
    category: 'billing',
    title: 'Understanding your invoice',
    content:
      'Invoices are generated on the same day each month as your original signup date. Each line item shows the plan name, billing period, and any prorated charges from plan changes.',
  },
  {
    category: 'technical',
    title: 'Resetting your password',
    content:
      'Click "Forgot password" on the login page and enter your email. A reset link is valid for 1 hour. If you don\'t receive the email, check your spam folder or contact support to verify your email is correct.',
  },
  {
    category: 'technical',
    title: 'Two-factor authentication setup',
    content:
      'Enable 2FA under Account Settings > Security > Two-Factor Authentication. Scan the QR code with an authenticator app (Google Authenticator, Authy) and enter the 6-digit code to confirm.',
  },
  {
    category: 'technical',
    title: 'API rate limits',
    content:
      'The API allows 100 requests per minute per API key on the free plan, and 1000 requests per minute on paid plans. Rate limit headers (X-RateLimit-Remaining) are included in every response.',
  },
  {
    category: 'general',
    title: 'Contacting support',
    content:
      'Support is available via chat and email 24/7. Average first response time is under 2 hours for paid plans and under 24 hours for free plans.',
  },
  {
    category: 'general',
    title: 'Exporting your data',
    content:
      'You can export all your data as a CSV or JSON file from Account Settings > Data > Export. Exports are emailed to your account email within 15 minutes.',
  },
];

async function seed() {
  const db = await getDb();
  const collection = db.collection<Article>('articles');

  await collection.deleteMany({});
  await collection.insertMany(articles);

  console.log(`Seeded ${articles.length} knowledge base articles.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
