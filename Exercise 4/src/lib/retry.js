export async function withFallback(candidates, fn) {
  let lastError;

  for (const candidate of candidates) {
    try {
      return await fn(candidate);
    } catch (err) {
      lastError = err;
      const label = typeof candidate === 'string' ? candidate : candidate.model;
      console.warn(`  fallback: ${label} failed (${err.message}), trying next option`);
    }
  }

  throw lastError;
}
