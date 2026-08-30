export function createTimer() {
  const marks = {};
  const start = Date.now();

  return {
    async time(label, fn) {
      const stepStart = Date.now();
      try {
        return await fn();
      } finally {
        marks[label] = Date.now() - stepStart;
      }
    },
    summary() {
      return { ...marks, totalMs: Date.now() - start };
    }
  };
}
