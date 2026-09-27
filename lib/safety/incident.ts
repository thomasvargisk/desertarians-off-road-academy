export type IncidentState = "OPEN" | "TRIAGED" | "ACTIONED" | "CLOSED";

const KNOWN_INCIDENT_STATES: ReadonlySet<string> = new Set<IncidentState>([
  "OPEN",
  "TRIAGED",
  "ACTIONED",
  "CLOSED",
]);

// Map, not a plain object literal -- see the identical comment in waiverVersion.ts. A hostile
// state string cast through `unknown` must resolve to `undefined`, never an inherited
// Object.prototype member, so that a lookup can never accidentally resolve to something truthy.
const VALID_TRANSITIONS: ReadonlyMap<IncidentState, ReadonlySet<IncidentState>> = new Map([
  ["OPEN", new Set<IncidentState>(["TRIAGED"])],
  ["TRIAGED", new Set<IncidentState>(["ACTIONED"])],
  ["ACTIONED", new Set<IncidentState>(["CLOSED"])],
  ["CLOSED", new Set<IncidentState>([])],
]);

export interface IncidentTransitionRecord {
  readonly actorId: string;
  readonly fromState: IncidentState;
  readonly toState: IncidentState;
  readonly at: string;
  readonly note?: string;
}

export interface Incident {
  readonly id: string;
  readonly state: IncidentState;
  readonly openedAt: string;
  readonly transitions: ReadonlyArray<IncidentTransitionRecord>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isKnownIncidentState(value: unknown): value is IncidentState {
  return typeof value === "string" && KNOWN_INCIDENT_STATES.has(value);
}

export function isValidIncidentTransition(current: unknown, next: unknown): boolean {
  if (!isKnownIncidentState(current) || !isKnownIncidentState(next)) {
    return false;
  }
  if (current === next) return false;
  const allowed = VALID_TRANSITIONS.get(current);
  return allowed ? allowed.has(next) : false;
}

/**
 * Records an incident state transition. `actorId` and `at` (the transition timestamp) are
 * both mandatory and validated as non-empty strings -- this domain never infers or fabricates
 * who performed a transition or when. The transition history is append-only: the previous
 * transitions array and every prior record are never mutated, and the returned incident,
 * its transitions array, and the new record are all runtime-frozen.
 */
export function transitionIncident(
  incident: Incident,
  nextState: unknown,
  actorId: unknown,
  at: unknown,
  note?: string
): Incident {
  if (!isNonEmptyString(actorId)) {
    throw new Error("Incident transition requires a non-empty actorId");
  }
  if (!isNonEmptyString(at)) {
    throw new Error("Incident transition requires a non-empty transition timestamp");
  }
  if (!isKnownIncidentState(incident.state)) {
    throw new Error(`Incident has an unknown current state: ${String(incident.state)}`);
  }
  if (!isValidIncidentTransition(incident.state, nextState)) {
    throw new Error(`Invalid incident transition from ${incident.state} to ${String(nextState)}`);
  }

  const record: IncidentTransitionRecord = Object.freeze({
    actorId,
    fromState: incident.state,
    toState: nextState as IncidentState,
    at,
    note,
  });

  return Object.freeze({
    id: incident.id,
    openedAt: incident.openedAt,
    state: nextState as IncidentState,
    transitions: Object.freeze([...incident.transitions, record]),
  });
}

/** Returns the complete, unmodified append-only transition history. */
export function getIncidentAuditTrail(incident: Incident): ReadonlyArray<IncidentTransitionRecord> {
  return incident.transitions;
}
