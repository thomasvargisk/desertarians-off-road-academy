export type WaiverSubjectType = "member" | "guardian";

const KNOWN_SUBJECT_TYPES: ReadonlySet<string> = new Set<WaiverSubjectType>(["member", "guardian"]);

const KNOWN_ELIGIBILITY_STATES: ReadonlySet<string> = new Set(["DRAFT", "PUBLISHED", "SUPERSEDED", "RETIRED"]);

export interface WaiverAcceptance {
  readonly id: string;
  readonly subjectId: string;
  readonly subjectType: WaiverSubjectType;
  readonly waiverVersionId: string;
  readonly acceptedAt: string;
  readonly evidenceRef: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isKnownWaiverSubjectType(value: unknown): value is WaiverSubjectType {
  return typeof value === "string" && KNOWN_SUBJECT_TYPES.has(value);
}

export interface CreateWaiverAcceptanceInput {
  id: unknown;
  subjectId: unknown;
  subjectType: unknown;
  waiverVersionId: unknown;
  acceptedAt: unknown;
  evidenceRef: unknown;
}

/**
 * Creates a waiver acceptance record. Every field is validated at runtime, not only by the
 * TypeScript type -- a caller passing values cast through `unknown` (e.g. from an external
 * boundary) cannot bypass this. All six fields are mandatory: id, subjectId, an exact
 * "member" | "guardian" subjectType, waiverVersionId, a non-empty acceptedAt timestamp, and
 * a non-empty evidenceRef. The returned record is runtime-frozen.
 */
export function createWaiverAcceptance(params: CreateWaiverAcceptanceInput): WaiverAcceptance {
  if (!isNonEmptyString(params.id)) {
    throw new Error("Waiver acceptance requires a non-empty id");
  }
  if (!isNonEmptyString(params.subjectId)) {
    throw new Error("Waiver acceptance requires a non-empty subjectId");
  }
  if (!isKnownWaiverSubjectType(params.subjectType)) {
    throw new Error('Waiver acceptance requires subjectType to be exactly "member" or "guardian"');
  }
  if (!isNonEmptyString(params.waiverVersionId)) {
    throw new Error("Waiver acceptance requires a non-empty waiverVersionId");
  }
  if (!isNonEmptyString(params.acceptedAt)) {
    throw new Error("Waiver acceptance requires a non-empty acceptedAt timestamp");
  }
  if (!isNonEmptyString(params.evidenceRef)) {
    throw new Error("Waiver acceptance requires a non-empty evidenceRef");
  }

  return Object.freeze({
    id: params.id,
    subjectId: params.subjectId,
    subjectType: params.subjectType,
    waiverVersionId: params.waiverVersionId,
    acceptedAt: params.acceptedAt,
    evidenceRef: params.evidenceRef,
  });
}

/**
 * True only when the acceptance is itself well-formed, matches the current version id
 * exactly, and the current version state is exactly "PUBLISHED". Any hostile or unknown
 * `currentVersionState` cast through `unknown` fails closed: it is checked against the
 * known waiver-version state set before the exact "PUBLISHED" comparison, so an unrecognized
 * string can never be mistaken for a valid state elsewhere in the domain.
 */
export function isWaiverEligible(
  acceptance: WaiverAcceptance | null | undefined,
  currentVersionId: unknown,
  currentVersionState: unknown
): boolean {
  if (
    !acceptance ||
    !isNonEmptyString(acceptance.id) ||
    !isNonEmptyString(acceptance.subjectId) ||
    !isKnownWaiverSubjectType(acceptance.subjectType) ||
    !isNonEmptyString(acceptance.waiverVersionId) ||
    !isNonEmptyString(acceptance.acceptedAt) ||
    !isNonEmptyString(acceptance.evidenceRef)
  ) {
    return false;
  }
  if (!isNonEmptyString(currentVersionId) || acceptance.waiverVersionId !== currentVersionId) {
    return false;
  }
  if (typeof currentVersionState !== "string" || !KNOWN_ELIGIBILITY_STATES.has(currentVersionState)) {
    return false;
  }
  return currentVersionState === "PUBLISHED";
}
