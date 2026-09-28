const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface AttemptRecord {
  count: number;
  windowStart: number;
}

const attempts = new Map<string, AttemptRecord>();

/** Returns false if the key has exceeded MAX_ATTEMPTS within the current window. */
export function isRateLimited(key: string): boolean {
  const record = attempts.get(key);
  if (!record) return false;
  if (Date.now() - record.windowStart > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const record = attempts.get(key);
  const now = Date.now();
  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return;
  }
  record.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}
