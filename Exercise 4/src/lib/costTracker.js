const TEXT_COST_USD_PER_1M_TOKENS = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 }
};

const IMAGE_COST_USD_PER_IMAGE = {
  'gpt-image-1': {
    low: { '1024x1024': 0.011, '1536x1024': 0.016, '1024x1536': 0.016 },
    medium: { '1024x1024': 0.042, '1536x1024': 0.063, '1024x1536': 0.063 },
    high: { '1024x1024': 0.167, '1536x1024': 0.25, '1024x1536': 0.25 }
  },
  'dall-e-3': {
    standard: { '1024x1024': 0.04, '1792x1024': 0.08, '1024x1792': 0.08 },
    hd: { '1024x1024': 0.08, '1792x1024': 0.12, '1024x1792': 0.12 }
  }
};

const AUDIO_COST_USD_PER_1K_CHARACTERS = {
  'gpt-4o-mini-tts': 0.015,
  'tts-1': 0.015
};

export function textCost(model, usage) {
  const rates = TEXT_COST_USD_PER_1M_TOKENS[model];
  if (!rates || !usage) return 0;
  return (usage.prompt_tokens / 1e6) * rates.input + (usage.completion_tokens / 1e6) * rates.output;
}

export function imageCost(model, size, quality) {
  return IMAGE_COST_USD_PER_IMAGE[model]?.[quality]?.[size] ?? 0;
}

export function audioCost(model, characterCount) {
  const rate = AUDIO_COST_USD_PER_1K_CHARACTERS[model] ?? 0;
  return (characterCount / 1000) * rate;
}
