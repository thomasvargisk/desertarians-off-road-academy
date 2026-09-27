export type SafeguardingState = "RAISED" | "UNDER_REVIEW" | "ESCALATED" | "CLOSED";

const KNOWN_SAFEGUARDING_STATES: ReadonlySet<string> = new Set<SafeguardingState>([
  "RAISED",
  "UNDER_REVIEW",
  "ESCALATED",
  "CLOSED",
]);

// Map, not a plain object literal -- a hostile state string such as "constructor" or
// "__proto__" cast through `unknown` must resolve to `undefined` on lookup, never an inherited
// Object.prototype member. See the identical comment in lib/safety/incident.ts.
const VALID_TRANSITIONS: ReadonlyMap<SafeguardingState, ReadonlySet<SafeguardingState>> = new Map([
  ["RAISED", new Set<SafeguardingState>(["UNDER_REVIEW", "CLOSED"])],
  ["UNDER_REVIEW", new Set<SafeguardingState>(["ESCALATED", "CLOSED"])],
  ["ESCALATED", new Set<SafeguardingState>(["CLOSED"])],
  ["CLOSED", new Set<SafeguardingState>([])],
]);

export interface SafeguardingTransitionRecord {
  readonly actorId: string;
  readonly fromState: SafeguardingState;
  readonly toState: SafeguardingState;
  readonly at: string;
  readonly note?: string;
}

export interface SafeguardingConcern {
  readonly id: string;
  readonly subjectId: string;
  readonly concern: string;
  readonly state: SafeguardingState;
  readonly raisedBy: string;
  readonly raisedAt: string;
  readonly transitions: ReadonlyArray<SafeguardingTransitionRecord>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isKnownSafeguardingState(value: unknown): value is SafeguardingState {
  return typeof value === "string" && KNOWN_SAFEGUARDING_STATES.has(value);
}

export function isValidSafeguardingTransition(current: unknown, next: unknown): boolean {
  if (!isKnownSafeguardingState(current) || !isKnownSafeguardingState(next)) {
    return false;
  }
  if (current === next) return false;
  const allowed = VALID_TRANSITIONS.get(current);
  return allowed ? allowed.has(next) : false;
}

export interface RaiseSafeguardingConcernInput {
  id: unknown;
  subjectId: unknown;
  raisedBy: unknown;
  raisedAt: unknown;
  concern: unknown;
}

/**
 * Raises a restricted safeguarding concern. `raisedBy` and `raisedAt` are both mandatory and
 * never inferred or defaulted -- this domain never fabricates who raised a concern or when.
 * The returned record starts in state RAISED with an empty, frozen transition history and is
 * itself frozen.
 */
export function raiseSafeguardingConcern(params: RaiseSafeguardingConcernInput): SafeguardingConcern {
  if (!isNonEmptyString(params.id)) {
    throw new Error("Safeguarding concern requires a non-empty id");
  }
  if (!isNonEmptyString(params.subjectId)) {
    throw new Error("Safeguarding concern requires a non-empty subjectId");
  }
  if (!isNonEmptyString(params.raisedBy)) {
    throw new Error("Safeguarding concern requires a non-empty raisedBy actor id");
  }
  if (!isNonEmptyString(params.raisedAt)) {
    throw new Error("Safeguarding concern requires a non-empty raisedAt timestamp");
  }
  if (!isNonEmptyString(params.concern)) {
    throw new Error("Safeguarding concern requires a non-empty concern description");
  }

  return Object.freeze({
    id: params.id,
    subjectId: params.subjectId,
    concern: params.concern,
    state: "RAISED" as const,
    raisedBy: params.raisedBy,
    raisedAt: params.raisedAt,
    transitions: Object.freeze([]),
  });
}

/**
 * Transitions a safeguarding concern. `actorId` and `at` are both mandatory, non-empty, and
 * never defaulted. The history is append-only: the incoming record and its transitions array
 * are never mutated; the returned concern, its transitions array, and the new transition record
 * are all runtime-frozen. Unknown or invalid transitions -- including a hostile state string
 * cast through `unknown` -- fail closed by throwing.
 */
export function transitionSafeguardingConcern(
  concern: SafeguardingConcern,
  nextState: unknown,
  actorId: unknown,
  at: unknown,
  note?: string
): SafeguardingConcern {
  if (!isNonEmptyString(actorId)) {
    throw new Error("Safeguarding transition requires a non-empty actorId");
  }
  if (!isNonEmptyString(at)) {
    throw new Error("Safeguarding transition requires a non-empty timestamp");
  }
  if (!isKnownSafeguardingState(concern.state)) {
    throw new Error(`Safeguarding concern has an unknown current state: ${String(concern.state)}`);
  }
  if (!isValidSafeguardingTransition(concern.state, nextState)) {
    throw new Error(`Invalid safeguarding transition from ${concern.state} to ${String(nextState)}`);
  }

  const record: SafeguardingTransitionRecord = Object.freeze({
    actorId,
    fromState: concern.state,
    toState: nextState as SafeguardingState,
    at,
    note,
  });

  return Object.freeze({
    id: concern.id,
    subjectId: concern.subjectId,
    concern: concern.concern,
    raisedBy: concern.raisedBy,
    raisedAt: concern.raisedAt,
    state: nextState as SafeguardingState,
    transitions: Object.freeze([...concern.transitions, record]),
  });
}

/** Returns the complete, unmodified append-only escalation history. */
export function getSafeguardingHistory(concern: SafeguardingConcern): ReadonlyArray<SafeguardingTransitionRecord> {
  return concern.transitions;
}

// No public serializer or display function exists for this restricted record, deliberately.
