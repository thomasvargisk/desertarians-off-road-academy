import { isCurrentlyQualified, qualificationStateAt, type MarshalQualification } from "./qualification";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  return Number.isFinite(Date.parse(value));
}

/**
 * A member's self-declared vehicle-readiness attestation. Versioned (`versionNumber`) and
 * expiring (`expiresAt`) -- an attestation is never open-ended. `confirmedItemIds` is the set of
 * caller-supplied checklist item ids the member confirmed; this module does not define what the
 * real checklist items are or how many are required, since that is a real-world
 * inspection/certification decision this bounded domain does not invent.
 */
export interface VehicleReadinessAttestation {
  readonly id: string;
  readonly memberId: string;
  readonly vehicleId: string;
  readonly versionNumber: string;
  readonly confirmedItemIds: ReadonlyArray<string>;
  readonly declaredAt: string;
  readonly expiresAt: string;
}

export interface CreateVehicleReadinessAttestationInput {
  id: unknown;
  memberId: unknown;
  vehicleId: unknown;
  versionNumber: unknown;
  confirmedItemIds: unknown;
  declaredAt: unknown;
  expiresAt: unknown;
}

export function createVehicleReadinessAttestation(
  params: CreateVehicleReadinessAttestationInput
): VehicleReadinessAttestation {
  if (!isNonEmptyString(params.id)) {
    throw new Error("Vehicle readiness attestation requires a non-empty id");
  }
  if (!isNonEmptyString(params.memberId)) {
    throw new Error("Vehicle readiness attestation requires a non-empty memberId");
  }
  if (!isNonEmptyString(params.vehicleId)) {
    throw new Error("Vehicle readiness attestation requires a non-empty vehicleId");
  }
  if (!isNonEmptyString(params.versionNumber)) {
    throw new Error("Vehicle readiness attestation requires a non-empty versionNumber");
  }
  if (!Array.isArray(params.confirmedItemIds) || !params.confirmedItemIds.every((v) => isNonEmptyString(v))) {
    throw new Error("Vehicle readiness attestation requires confirmedItemIds to be an array of non-empty strings");
  }
  if (!isValidTimestamp(params.declaredAt)) {
    throw new Error("Vehicle readiness attestation requires a valid, non-empty declaredAt timestamp");
  }
  if (!isValidTimestamp(params.expiresAt)) {
    throw new Error("Vehicle readiness attestation requires a valid, non-empty expiresAt timestamp");
  }
  if (Date.parse(params.expiresAt) <= Date.parse(params.declaredAt)) {
    throw new Error("Vehicle readiness attestation expiresAt must be after declaredAt");
  }

  return Object.freeze({
    id: params.id,
    memberId: params.memberId,
    vehicleId: params.vehicleId,
    versionNumber: params.versionNumber,
    confirmedItemIds: Object.freeze([...(params.confirmedItemIds as string[])]),
    declaredAt: params.declaredAt,
    expiresAt: params.expiresAt,
  });
}

/**
 * True only when `asOf` is a valid timestamp on or after the attestation's `declaredAt` and
 * strictly before its `expiresAt`. An attestation dated in the future relative to `asOf` is not
 * yet in effect and is never considered valid, even if `asOf` is also before `expiresAt`.
 */
export function isAttestationCurrentlyValid(attestation: VehicleReadinessAttestation, asOf: unknown): boolean {
  if (!isValidTimestamp(asOf)) return false;
  const asOfMs = Date.parse(asOf);
  return asOfMs >= Date.parse(attestation.declaredAt) && asOfMs < Date.parse(attestation.expiresAt);
}

/**
 * An independent, marshal-performed, event-day vehicle verification. This is a genuinely
 * separate record type from `VehicleReadinessAttestation` -- it is never derived from or merged
 * with a member's self-attestation. `marshalId`, `verifiedAt`, and `expiresAt` are all mandatory
 * and never defaulted; this module never infers who performed a verification, when, or for how
 * long it remains valid.
 *
 * `expiresAt` exists because the brief requires a *non-expired* verification, and this module
 * must not invent that duration -- exactly like `VehicleReadinessAttestation.expiresAt`, the
 * caller supplies the actual boundary (which should ultimately come from an owner-approved
 * event-day validity policy); this module only enforces whatever boundary it's given.
 */
export interface MarshalVehicleVerification {
  readonly id: string;
  readonly vehicleId: string;
  readonly eventId: string;
  readonly marshalId: string;
  readonly verifiedAt: string;
  readonly expiresAt: string;
  readonly passed: boolean;
  readonly notes?: string;
}

export interface CreateMarshalVehicleVerificationInput {
  id: unknown;
  vehicleId: unknown;
  eventId: unknown;
  marshalId: unknown;
  verifiedAt: unknown;
  expiresAt: unknown;
  passed: unknown;
  notes?: unknown;
}

export function createMarshalVehicleVerification(
  params: CreateMarshalVehicleVerificationInput
): MarshalVehicleVerification {
  if (!isNonEmptyString(params.id)) {
    throw new Error("Marshal vehicle verification requires a non-empty id");
  }
  if (!isNonEmptyString(params.vehicleId)) {
    throw new Error("Marshal vehicle verification requires a non-empty vehicleId");
  }
  if (!isNonEmptyString(params.eventId)) {
    throw new Error("Marshal vehicle verification requires a non-empty eventId");
  }
  if (!isNonEmptyString(params.marshalId)) {
    throw new Error("Marshal vehicle verification requires a non-empty marshalId");
  }
  if (!isValidTimestamp(params.verifiedAt)) {
    throw new Error("Marshal vehicle verification requires a valid, non-empty verifiedAt timestamp");
  }
  if (!isValidTimestamp(params.expiresAt)) {
    throw new Error("Marshal vehicle verification requires a valid, non-empty expiresAt timestamp");
  }
  if (Date.parse(params.expiresAt) <= Date.parse(params.verifiedAt)) {
    throw new Error("Marshal vehicle verification expiresAt must be after verifiedAt");
  }
  if (typeof params.passed !== "boolean") {
    throw new Error("Marshal vehicle verification requires an explicit boolean passed result");
  }
  if (params.notes !== undefined && typeof params.notes !== "string") {
    throw new Error("notes, when supplied, must be a string");
  }

  return Object.freeze({
    id: params.id,
    vehicleId: params.vehicleId,
    eventId: params.eventId,
    marshalId: params.marshalId,
    verifiedAt: params.verifiedAt,
    expiresAt: params.expiresAt,
    passed: params.passed,
    notes: params.notes as string | undefined,
  });
}

export interface EventVehicleReadinessInput {
  vehicleId: unknown;
  eventId: unknown;
  attestation?: VehicleReadinessAttestation | null;
  verification?: MarshalVehicleVerification | null;
  /**
   * The real qualification record of the marshal who performed `verification`. This is
   * deliberately a full record, not a bare state string -- readiness must be able to prove the
   * verification and the qualification belong to the *same* marshal, not just that some marshal
   * somewhere happens to be qualified.
   */
  marshalQualification?: MarshalQualification | null;
  asOf: unknown;
}

/**
 * Determines whether an event's vehicle-readiness requirement is satisfied. A member's
 * self-attestation is never sufficient by itself, even when it is present, complete, and
 * unexpired -- readiness requires a `MarshalVehicleVerification` that:
 * - matches the given vehicle and event;
 * - explicitly `passed`;
 * - was not recorded after `asOf`, and has not itself expired as of `asOf`
 *   (`verifiedAt <= asOf < expiresAt`) -- a verification dated in the future, or one whose own
 *   caller-supplied validity window has lapsed, can never authorize readiness;
 * - was recorded by the *same* marshal named in `marshalQualification`
 *   (`verification.marshalId === marshalQualification.personId`) -- a bare qualification-state
 *   string is deliberately not accepted here (see `EventVehicleReadinessInput`), because that
 *   would let a caller pair one marshal's verification with an unrelated marshal's status;
 * - and, critically, that marshal's *reconstructed historical state at `verifiedAt`* (via
 *   `qualificationStateAt`, not the record's current/latest `state`) was exactly `"CURRENT"`.
 *   A qualification granted, renewed, or restored only *after* `verifiedAt` must not
 *   retroactively authorize a verification performed before that happened, and a suspension that
 *   came later must not retroactively invalidate a verification that was genuinely valid when
 *   performed -- both directions require the real historical state, not the current one.
 *
 * If an attestation is also supplied, it must be currently valid as of `asOf` (not before its
 * `declaredAt`, not at/after its `expiresAt`) -- but its absence does not by itself satisfy or
 * block readiness; only the verification does that.
 */
export function isEventVehicleReadinessSatisfied(input: EventVehicleReadinessInput): boolean {
  if (!isValidTimestamp(input.asOf)) return false;
  if (!isNonEmptyString(input.vehicleId) || !isNonEmptyString(input.eventId)) return false;
  const asOfMs = Date.parse(input.asOf as string);

  if (input.attestation) {
    if (input.attestation.vehicleId !== input.vehicleId) return false;
    if (!isAttestationCurrentlyValid(input.attestation, input.asOf)) return false;
  }

  const verification = input.verification;
  if (!verification) return false; // self-attestation alone -- with no verification -- is never sufficient.
  if (verification.vehicleId !== input.vehicleId) return false;
  if (verification.eventId !== input.eventId) return false;
  if (verification.passed !== true) return false;
  if (!isValidTimestamp(verification.verifiedAt) || !isValidTimestamp(verification.expiresAt)) return false;
  const verifiedAtMs = Date.parse(verification.verifiedAt);
  if (verifiedAtMs > asOfMs) return false; // not from the future.
  if (Date.parse(verification.expiresAt) <= asOfMs) return false; // verification itself has expired.

  const qualification = input.marshalQualification;
  if (!qualification) return false;
  if (qualification.personId !== verification.marshalId) return false; // must be the same marshal.
  const stateAtVerification = qualificationStateAt(qualification, verification.verifiedAt);
  if (!isCurrentlyQualified(stateAtVerification)) return false; // must have been CURRENT at that instant, not just now.

  return true;
}
