import { generateOpenAIImage } from '../services/openaiService.js';
import { generateReplicateImage } from '../services/replicateService.js';
import { generateFalImage } from '../services/falService.js';

const generators = {
  openai: generateOpenAIImage,
  replicate: generateReplicateImage,
  fal: generateFalImage
};

const variationModifiers = [
  'in a different artistic style',
  'from a different perspective, with more dramatic lighting'
];

export async function generateVariations(bestResult, theme) {
  const generate = generators[bestResult.service];
  const variations = [];

  for (const modifier of variationModifiers) {
    try {
      const result = await generate(`${theme}, ${modifier}`);
      variations.push(result);
    } catch (err) {
      console.warn(`Variation generation failed: ${err.message}`);
    }
  }

  return variations;
}
