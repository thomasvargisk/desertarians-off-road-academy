export type SensitiveCategory = "EMERGENCY_MEDICAL" | "SAFEGUARDING" | "WAIVER_EVIDENCE" | "INCIDENT_EVIDENCE";

export type RetentionPolicyStatus = "PENDING_LEGAL_AND_INSURANCE_ADVICE" | "OWNER_CONFIGURED";

export interface RetentionPolicy {
  readonly category: SensitiveCategory;
  readonly status: RetentionPolicyStatus;
  readonly ownerConfiguredDurationDays?: number;
}

/**
 * Result of evaluating a retention policy. `automaticDeletionAllowed` is always `false`:
 * this domain never authorizes deletion by itself, under any input. The most it can ever
 * conclude is that a record has become eligible for a human owner to review for deletion,
 * once an explicit positive duration has actually elapsed against real timestamps.
 */
export interface RetentionEvaluation {
  readonly ownerReviewEligible: boolean;
  readonly automaticDeletionAllowed: false;
  readonly reason: string;
}

const KNOWN_CATEGORIES: ReadonlySet<string> = new Set<SensitiveCategory>([
  "EMERGENCY_MEDICAL",
  "SAFEGUARDING",
  "WAIVER_EVIDENCE",
  "INCIDENT_EVIDENCE",
]);

const KNOWN_STATUSES: ReadonlySet<string> = new Set<RetentionPolicyStatus>([
  "PENDING_LEGAL_AND_INSURANCE_ADVICE",
  "OWNER_CONFIGURED",
]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isKnownSensitiveCategory(value: unknown): value is SensitiveCategory {
  return typeof value === "string" && KNOWN_CATEGORIES.has(value);
}

function isValidTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  return Number.isFinite(Date.parse(value));
}

function fail(reason: string): RetentionEvaluation {
  return { ownerReviewEligible: false, automaticDeletionAllowed: false, reason };
}

/**
 * Evaluates whether a sensitive record has become eligible for a human owner to review for
 * deletion. This function can never authorize deletion itself -- `automaticDeletionAllowed`
 * is always `false` in every returned value, regardless of any input, including a valid one.
 *
 * Merely having a configured duration is not sufficient: eligibility additionally requires
 * that `retainedAt` and `asOf` are both valid timestamps, that `asOf` is not before
 * `retainedAt`, and that the elapsed time between them is at least the configured duration.
 * A policy still pending legal/insurance advice, an invalid or non-positive duration, a
 * category mismatch, invalid timestamps, or an unelapsed period all fail closed (never
 * eligible). No duration is invented anywhere in this function.
 */
export function evaluateRetention(
  category: unknown,
  policy: RetentionPolicy,
  retainedAt: unknown,
  asOf: unknown
): RetentionEvaluation {
  if (!isKnownSensitiveCategory(category)) {
    return fail("Unknown sensitive category");
  }
  if (!policy || !isKnownSensitiveCategory(policy.category)) {
    return fail("Retention policy has an unknown or missing category");
  }
  if (policy.category !== category) {
    return fail("Retention policy category does not match the record's category");
  }
  if (typeof policy.status !== "string" || !KNOWN_STATUSES.has(policy.status)) {
    return fail("Retention policy has an unknown status");
  }
  if (policy.status === "PENDING_LEGAL_AND_INSURANCE_ADVICE") {
    return fail("Retention is pending legal and insurance advice; never eligible while pending");
  }
  // policy.status === "OWNER_CONFIGURED" from here.
  const duration = policy.ownerConfiguredDurationDays;
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
    return fail("Owner-configured retention duration is missing or not a positive number");
  }
  if (!isValidTimestamp(retainedAt) || !isValidTimestamp(asOf)) {
    return fail("Invalid retainedAt or asOf timestamp");
  }
  const retainedMs = Date.parse(retainedAt);
  const asOfMs = Date.parse(asOf);
  if (asOfMs < retainedMs) {
    return fail("asOf precedes retainedAt");
  }
  const elapsedDays = (asOfMs - retainedMs) / MS_PER_DAY;
  if (elapsedDays < duration) {
    return fail("Configured retention period has not yet elapsed");
  }
  return {
    ownerReviewEligible: true,
    automaticDeletionAllowed: false,
    reason: "Configured retention period has elapsed; eligible for owner review only",
  };
}

// No public serializer or public-view function exists for restricted operational
// categories, deliberately -- this domain never exposes sensitive payloads.
export function isRestrictedCategory(category: unknown): boolean {
  return isKnownSensitiveCategory(category);
}
