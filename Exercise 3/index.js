import 'dotenv/config';
import readline from 'readline/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { generateConversationScript } from './src/lib/scriptGenerator.js';
import { generateSpeech } from './src/lib/ttsGenerator.js';
import { writeFile, slugify } from './src/lib/fileUtils.js';
import { buildPlayerHtml } from './src/lib/player.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

async function getTopic() {
  const argTopic = process.argv.slice(2).join(' ').trim();
  if (argTopic) return argTopic;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const topic = await rl.question('Enter a scenario for the conversation (e.g. "two friends planning a surprise party"): ');
  rl.close();
  return topic.trim();
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not set. Add it to a .env file (see .env.example) and try again.');
    process.exit(1);
  }

  const topic = await getTopic();
  if (!topic) {
    console.error('A scenario is required.');
    process.exit(1);
  }

  console.log(`\nWriting a multi-voice script for: "${topic}"...`);
  const turns = await generateConversationScript(topic);

  if (turns.length === 0) {
    console.error('No conversation turns were generated.');
    process.exit(1);
  }

  const slug = slugify(topic);
  const timestamp = Date.now();

  console.log(`\nGenerating ${turns.length} audio clips...\n`);

  const settled = await Promise.allSettled(turns.map((turn) => generateSpeech(turn)));

  const clips = [];
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const outcome = settled[i];
    const label = `${i + 1}. ${turn.speaker} (${turn.voice}, ${turn.emotion})`;

    if (outcome.status === 'rejected') {
      console.warn(`✗ ${label} failed: ${outcome.reason.message}`);
      continue;
    }

    const filename = `${String(i + 1).padStart(2, '0')}-${slugify(turn.speaker)}-${slugify(turn.emotion)}-${timestamp}.mp3`;
    await writeFile(outcome.value, path.join(OUTPUT_DIR, filename));
    clips.push({ ...turn, filename });
    console.log(`✓ ${label}`);
  }

  if (clips.length === 0) {
    console.error('\nNo audio clips were generated.');
    process.exit(1);
  }

  const transcript = { topic, generatedAt: new Date().toISOString(), clips };
  await writeFile(
    Buffer.from(JSON.stringify(transcript, null, 2)),
    path.join(OUTPUT_DIR, `transcript-${slug}-${timestamp}.json`)
  );

  const html = buildPlayerHtml({ topic, clips });
  const playerFilename = `player-${slug}-${timestamp}.html`;
  await writeFile(Buffer.from(html), path.join(OUTPUT_DIR, playerFilename));

  console.log(`\nDone! Open output/${playerFilename} in your browser to play the conversation.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
