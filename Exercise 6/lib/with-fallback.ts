export async function withFallback<T, C>(candidates: readonly C[], fn: (candidate: C) => T | Promise<T>): Promise<T> {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return await fn(candidate);
    } catch (error) {
      lastError = error;
      console.error(`Model fallback: "${String(candidate)}" failed, trying next option`, error);
    }
  }

  throw lastError;
}
