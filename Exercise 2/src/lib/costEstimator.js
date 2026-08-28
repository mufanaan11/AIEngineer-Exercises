const ESTIMATED_COST_USD_PER_IMAGE = {
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

export function estimateCost(model, size, quality) {
  return ESTIMATED_COST_USD_PER_IMAGE[model]?.[quality]?.[size] ?? 0;
}
