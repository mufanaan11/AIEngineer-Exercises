import 'dotenv/config';
import readline from 'readline/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { runPipeline } from './src/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

async function getTopics() {
  const argTopics = process.argv.slice(2).join(' ').trim();
  if (argTopics) {
    return argTopics.split(',').map((t) => t.trim()).filter(Boolean);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const input = await rl.question(
    'Enter one or more topics, separated by commas (e.g. "The future of solar energy, Best home coffee brewing methods"): '
  );
  rl.close();
  return input.split(',').map((t) => t.trim()).filter(Boolean);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set. Add it to a .env file (see .env.example) and try again.');
    process.exit(1);
  }

  const topics = await getTopics();
  if (topics.length === 0) {
    console.error('At least one topic is required.');
    process.exit(1);
  }

  console.log(`\nAI Content Studio: producing ${topics.length} content package(s)...`);

  const results = [];
  for (const [i, topic] of topics.entries()) {
    console.log(`\n[${i + 1}/${topics.length}] ${topic}`);
    const result = await runPipeline(topic, OUTPUT_DIR);
    results.push(result);
    const status = result.errors.length ? `${result.errors.length} issue(s)` : 'complete';
    console.log(`  ${status} in ${(result.performance.totalMs / 1000).toFixed(1)}s — est. cost $${result.totalCost.toFixed(3)}`);
  }

  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
  const totalMs = results.reduce((sum, r) => sum + r.performance.totalMs, 0);

  console.log('\n=== Batch summary ===');
  for (const r of results) {
    const status = r.errors.length === 0 ? 'complete' : `${r.errors.length} issue(s)`;
    console.log(`- ${r.topic}: ${status} — $${r.totalCost.toFixed(3)} — ${r.outputDir}`);
  }
  console.log(`\nTotal estimated cost: $${totalCost.toFixed(3)}`);
  console.log(`Total time: ${(totalMs / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
