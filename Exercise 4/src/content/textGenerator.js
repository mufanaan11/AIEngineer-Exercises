import OpenAI from 'openai';
import { withFallback } from '../lib/retry.js';

const TEXT_MODEL_FALLBACK_ORDER = ['gpt-4o', 'gpt-4o-mini'];

async function chatComplete(model, messages, options = {}) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({ model, messages, ...options });
  return {
    text: response.choices[0].message.content.trim(),
    usage: response.usage,
    model
  };
}

export async function generateArticle(topic) {
  return withFallback(TEXT_MODEL_FALLBACK_ORDER, (model) =>
    chatComplete(model, [
      {
        role: 'system',
        content: 'You are a professional content writer. Write a well-structured, engaging article of 500-700 words using Markdown headings (# and ##).'
      },
      { role: 'user', content: `Write an article about: ${topic}` }
    ], { max_tokens: 1200 })
  );
}

export async function generateSummary(articleText) {
  return withFallback(TEXT_MODEL_FALLBACK_ORDER, (model) =>
    chatComplete(model, [
      { role: 'user', content: `Summarize this article in 2-3 sentences:\n\n${articleText}` }
    ], { max_tokens: 150 })
  );
}

export async function generateSocialPosts(topic, articleText) {
  const result = await withFallback(TEXT_MODEL_FALLBACK_ORDER, (model) =>
    chatComplete(model, [
      {
        role: 'system',
        content: 'You repurpose articles into social media posts. Respond with strict JSON: {"twitter": string, "linkedin": string, "instagram": string}. Match each platform\'s typical tone and length.'
      },
      { role: 'user', content: `Topic: ${topic}\n\nArticle:\n${articleText}` }
    ], { max_tokens: 400, response_format: { type: 'json_object' } })
  );

  return { ...result, posts: JSON.parse(result.text) };
}
