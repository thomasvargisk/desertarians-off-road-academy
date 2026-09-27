export type QualificationState = "CANDIDATE" | "QUALIFIED" | "CURRENT" | "EXPIRING" | "SUSPENDED" | "EXPIRED";

const KNOWN_QUALIFICATION_STATES: ReadonlySet<string> = new Set<QualificationState>([
  "CANDIDATE",
  "QUALIFIED",
  "CURRENT",
  "EXPIRING",
  "SUSPENDED",
  "EXPIRED",
]);

/**
 * Modelling decision (recorded here, not invented silently): the lifecycle is
 * CANDIDATE -> QUALIFIED -> CURRENT -> EXPIRING -> SUSPENDED/EXPIRED, with exactly two
 * additional human-approved recovery transitions: EXPIRING -> CURRENT ("renewal") and
 * SUSPENDED -> CURRENT ("restoration"). EXPIRED has no outgoing transition in this module --
 * whether an expired qualification can be renewed directly or must restart from CANDIDATE is a
 * real certification-policy question this module deliberately does not decide (see
 * REPORT-SAFETY-OPERATIONS.md "Open owner/legal decisions").
 */
const VALID_TRANSITIONS: ReadonlyMap<QualificationState, ReadonlySet<QualificationState>> = new Map([
  ["CANDIDATE", new Set<QualificationState>(["QUALIFIED"])],
  ["QUALIFIED", new Set<QualificationState>(["CURRENT"])],
  ["CURRENT", new Set<QualificationState>(["EXPIRING", "SUSPENDED"])],
  ["EXPIRING", new Set<QualificationState>(["SUSPENDED", "EXPIRED", "CURRENT"])],
  ["SUSPENDED", new Set<QualificationState>(["CURRENT"])],
  ["EXPIRED", new Set<QualificationState>([])],
]);

/**
 * Transitions that represent an explicit human decision (grant, activation-following-grant,
 * suspension, renewal, restoration) and therefore require a non-empty `approverId`. The two
 * transitions absent from this set (CURRENT -> EXPIRING, EXPIRING -> EXPIRED) are time-observed
 * facts, not human decisions, and do not require an approver -- there is no one to sensibly
 * "approve" a clock crossing a threshold.
 */
const APPROVAL_REQUIRED_TRANSITIONS: ReadonlySet<string> = new Set([
  "CANDIDATE->QUALIFIED",
  "QUALIFIED->CURRENT",
  "CURRENT->SUSPENDED",
  "EXPIRING->SUSPENDED",
  "EXPIRING->CURRENT",
  "SUSPENDED->CURRENT",
]);

export interface QualificationTransitionRecord {
  readonly actorId: string;
  readonly fromState: QualificationState;
  readonly toState: QualificationState;
  readonly at: string;
  readonly approverId?: string;
  readonly note?: string;
}

export interface MarshalQualification {
  readonly id: string;
  readonly personId: string;
  readonly state: QualificationState;
  readonly grantedAt?: string;
  readonly transitions: ReadonlyArray<QualificationTransitionRecord>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  return Number.isFinite(Date.parse(value));
}

export function isKnownQualificationState(value: unknown): value is QualificationState {
  return typeof value === "string" && KNOWN_QUALIFICATION_STATES.has(value);
}

export function isValidQualificationTransition(current: unknown, next: unknown): boolean {
  if (!isKnownQualificationState(current) || !isKnownQualificationState(next)) {
    return false;
  }
  if (current === next) return false;
  const allowed = VALID_TRANSITIONS.get(current);
  return allowed ? allowed.has(next) : false;
}

function requiresApproval(from: QualificationState, to: QualificationState): boolean {
  return APPROVAL_REQUIRED_TRANSITIONS.has(`${from}->${to}`);
}

export interface CreateCandidateQualificationInput {
  id: unknown;
  personId: unknown;
}

/** Creates a new qualification record in the initial CANDIDATE state. */
export function createCandidateQualification(params: CreateCandidateQualificationInput): MarshalQualification {
  if (!isNonEmptyString(params.id)) {
    throw new Error("Qualification requires a non-empty id");
  }
  if (!isNonEmptyString(params.personId)) {
    throw new Error("Qualification requires a non-empty personId");
  }
  return Object.freeze({
    id: params.id,
    personId: params.personId,
    state: "CANDIDATE" as const,
    transitions: Object.freeze([]),
  });
}

/**
 * Transitions a qualification. `actorId` (who recorded the transition) and `at` (an explicit
 * timestamp) are always mandatory and never defaulted. For a human-decision transition (grant,
 * activation, suspension, renewal, restoration -- see `APPROVAL_REQUIRED_TRANSITIONS`),
 * `approverId` is additionally mandatory: this module never infers or fabricates who approved a
 * qualification decision. Unknown or invalid transitions -- including a hostile state string
 * cast through `unknown` -- fail closed by throwing. `at` must be a genuinely parseable timestamp
 * and must be strictly after the most recent existing transition's `at` (if any) -- a caller
 * cannot backdate a new transition earlier than, or equal to, one that already exists, which
 * would otherwise let the public API construct an incoherent history. The history is
 * append-only and every returned structure is runtime-frozen.
 */
export function transitionQualification(
  qualification: MarshalQualification,
  nextState: unknown,
  actorId: unknown,
  at: unknown,
  approverId?: unknown,
  note?: string
): MarshalQualification {
  if (!isNonEmptyString(actorId)) {
    throw new Error("Qualification transition requires a non-empty actorId");
  }
  if (!isValidTimestamp(at)) {
    throw new Error("Qualification transition requires a valid, non-empty timestamp");
  }
  const priorTransitions = qualification.transitions;
  if (priorTransitions.length > 0) {
    const lastAt = priorTransitions[priorTransitions.length - 1].at;
    if (!isValidTimestamp(lastAt) || Date.parse(at) <= Date.parse(lastAt)) {
      throw new Error(
        `Qualification transition timestamp ${at} must be strictly after the previous transition's timestamp ${String(lastAt)}`
      );
    }
  }
  if (!isKnownQualificationState(qualification.state)) {
    throw new Error(`Qualification has an unknown current state: ${String(qualification.state)}`);
  }
  if (!isValidQualificationTransition(qualification.state, nextState)) {
    throw new Error(`Invalid qualification transition from ${qualification.state} to ${String(nextState)}`);
  }
  const from = qualification.state;
  const to = nextState as QualificationState;

  if (requiresApproval(from, to) && !isNonEmptyString(approverId)) {
    throw new Error(
      `Qualification transition from ${from} to ${to} requires an explicit, non-empty approverId; none was supplied`
    );
  }

  const record: QualificationTransitionRecord = Object.freeze({
    actorId,
    fromState: from,
    toState: to,
    at,
    approverId: isNonEmptyString(approverId) ? approverId : undefined,
    note,
  });

  return Object.freeze({
    id: qualification.id,
    personId: qualification.personId,
    grantedAt: to === "QUALIFIED" ? at : qualification.grantedAt,
    state: to,
    transitions: Object.freeze([...qualification.transitions, record]),
  });
}

/** True only when the qualification's current state is exactly CURRENT. */
export function isCurrentlyQualified(state: unknown): boolean {
  return state === "CURRENT";
}

/**
 * Reconstructs what state a qualification was actually in at a given instant, from its real
 * transition history -- not its current/latest state. This exists because "is this marshal
 * qualified right now" is a different question from "was this marshal qualified at the moment
 * they performed a specific past action" (e.g. an event-day verification); a qualification
 * granted or restored *after* that instant must not retroactively authorize it, and a transition
 * dated after `at` must be ignored even if it happens to be the record's most recent entry.
 *
 * Returns `null` (fails closed) for an invalid/empty `at`, and also fails closed -- returns
 * `null` for the entire query, not just the offending entry -- if the history itself is not
 * genuinely trustworthy. This function does not assume `transitionQualification` was the only
 * way the record was built (a caller could hand it a corrupted or directly-constructed record),
 * so it fully replays and validates the chain itself rather than trusting any single field:
 * - **temporal coherence**: every transition's `at` must parse and be strictly after the one
 *   before it;
 * - **lifecycle continuity**: every transition's `fromState` must equal the state the replay has
 *   actually reached so far -- a transition cannot claim to start from a state the history never
 *   actually passed through (a "disconnected" entry);
 * - **legality**: every `fromState -> toState` pair must itself be a legal transition per
 *   `isValidQualificationTransition` -- this specifically rejects a forbidden shortcut like
 *   `CANDIDATE -> CURRENT` even if it is otherwise temporally and referentially tidy;
 * - **required data**: every transition must carry a non-empty `actorId`, and a non-empty
 *   `approverId` whenever that transition is one of the human-decision transitions
 *   (`APPROVAL_REQUIRED_TRANSITIONS`);
 * - **top-level consistency**: after replaying the entire history, the record's own declared
 *   `state` field must equal what the replay actually produced -- a record whose `state` doesn't
 *   match its own transition history is untrustworthy even if the history itself is internally
 *   coherent.
 *
 * `transitionQualification` already prevents the public API from ever constructing a history
 * that would fail any of these checks; this function re-verifies all of them anyway rather than
 * relying on that being the only way a record was ever built.
 */
export function qualificationStateAt(qualification: MarshalQualification, at: unknown): QualificationState | null {
  if (typeof at !== "string" || at.trim().length === 0) return null;
  const atMs = Date.parse(at);
  if (!Number.isFinite(atMs)) return null;
  if (!qualification || typeof qualification !== "object" || !Array.isArray(qualification.transitions)) return null;

  let replayedState: QualificationState = "CANDIDATE"; // every qualification begins here.
  let stateAtQuery: QualificationState = "CANDIDATE";
  let previousMs = -Infinity;

  for (const transition of qualification.transitions) {
    if (!transition || typeof transition !== "object") return null;
    const transitionMs = Date.parse(transition.at);
    if (!Number.isFinite(transitionMs)) return null; // a malformed entry makes the whole history untrustworthy.
    if (transitionMs <= previousMs) return null; // non-monotonic/incoherent history -- untrustworthy.
    previousMs = transitionMs;

    if (transition.fromState !== replayedState) return null; // disconnected from the chain replayed so far.
    if (!isValidQualificationTransition(transition.fromState, transition.toState)) return null; // illegal move.
    if (!isNonEmptyString(transition.actorId)) return null;
    if (requiresApproval(transition.fromState, transition.toState) && !isNonEmptyString(transition.approverId)) {
      return null;
    }

    replayedState = transition.toState;
    if (transitionMs <= atMs) {
      stateAtQuery = replayedState;
    }
  }

  if (qualification.state !== replayedState) return null; // the record's own state disagrees with its history.

  return stateAtQuery;
}

/** Returns the complete, unmodified append-only qualification transition history. */
export function getQualificationHistory(
  qualification: MarshalQualification
): ReadonlyArray<QualificationTransitionRecord> {
  return qualification.transitions;
}
