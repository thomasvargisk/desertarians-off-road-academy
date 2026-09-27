export type WaiverVersionState = "DRAFT" | "PUBLISHED" | "SUPERSEDED" | "RETIRED";

export interface WaiverVersion {
  readonly id: string;
  readonly versionNumber: string;
  readonly state: WaiverVersionState;
  readonly text: string;
  readonly createdAt: string;
  readonly publishedAt?: string;
}

const KNOWN_WAIVER_STATES: ReadonlySet<string> = new Set<WaiverVersionState>([
  "DRAFT",
  "PUBLISHED",
  "SUPERSEDED",
  "RETIRED",
]);

const FROZEN_WAIVER_STATES: ReadonlySet<WaiverVersionState> = new Set<WaiverVersionState>([
  "PUBLISHED",
  "SUPERSEDED",
  "RETIRED",
]);

// Map, not a plain object literal: bracket/property lookup on a plain object is reachable
// through inherited Object.prototype members (e.g. "constructor", "__proto__", "toString"),
// so a hostile state string cast through `unknown` could resolve to an inherited function
// instead of `undefined` and crash instead of failing closed. Map.get never does this.
const VALID_TRANSITIONS: ReadonlyMap<WaiverVersionState, ReadonlySet<WaiverVersionState>> = new Map([
  ["DRAFT", new Set<WaiverVersionState>(["PUBLISHED", "RETIRED"])],
  ["PUBLISHED", new Set<WaiverVersionState>(["SUPERSEDED", "RETIRED"])],
  ["SUPERSEDED", new Set<WaiverVersionState>(["RETIRED"])],
  ["RETIRED", new Set<WaiverVersionState>([])],
]);

export function isKnownWaiverVersionState(value: unknown): value is WaiverVersionState {
  return typeof value === "string" && KNOWN_WAIVER_STATES.has(value);
}

export function isValidWaiverTransition(current: unknown, next: unknown): boolean {
  if (!isKnownWaiverVersionState(current) || !isKnownWaiverVersionState(next)) {
    return false;
  }
  if (current === next) return false;
  const allowed = VALID_TRANSITIONS.get(current);
  return allowed ? allowed.has(next) : false;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Transitions a waiver version. Publishing (entering PUBLISHED) requires an explicit,
 * non-empty `publishedAt` supplied by the caller -- there is no `new Date()` fallback,
 * because a legal document's effective date must never depend on when this function
 * happened to run.
 *
 * The returned object always has id, versionNumber, text, and createdAt copied exactly
 * from the input, never re-derived, and is runtime-frozen whenever the resulting state
 * is PUBLISHED, SUPERSEDED, or RETIRED.
 */
export function transitionWaiverVersion(
  version: WaiverVersion,
  nextState: unknown,
  publishedAt?: unknown
): WaiverVersion {
  if (!isKnownWaiverVersionState(version.state)) {
    throw new Error(`Waiver version has an unknown current state: ${String(version.state)}`);
  }
  if (!isValidWaiverTransition(version.state, nextState)) {
    throw new Error(`Invalid waiver version transition from ${version.state} to ${String(nextState)}`);
  }
  const resolvedNextState = nextState as WaiverVersionState;

  let resolvedPublishedAt = version.publishedAt;
  if (resolvedNextState === "PUBLISHED") {
    if (!isNonEmptyString(publishedAt)) {
      throw new Error(
        "Publishing a waiver version requires an explicit, non-empty publishedAt timestamp; none was supplied"
      );
    }
    resolvedPublishedAt = publishedAt;
  }

  const next: WaiverVersion = {
    id: version.id,
    versionNumber: version.versionNumber,
    text: version.text,
    createdAt: version.createdAt,
    state: resolvedNextState,
    publishedAt: resolvedPublishedAt,
  };

  if (FROZEN_WAIVER_STATES.has(resolvedNextState)) {
    return Object.freeze(next);
  }
  return next;
}

/**
 * True if `proposedText` (when supplied) would be a no-op change for a version that is
 * no longer DRAFT. This is a documentation/intent-check helper; the actual enforcement is
 * the runtime `Object.freeze` applied in `transitionWaiverVersion`.
 */
export function isWaiverVersionImmutable(version: WaiverVersion, proposedText?: string): boolean {
  if (FROZEN_WAIVER_STATES.has(version.state)) {
    if (proposedText !== undefined && proposedText !== version.text) {
      return false;
    }
  }
  return true;
}
