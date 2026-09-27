export interface EmergencyDetails {
  readonly id: string;
  readonly subjectId: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly relationship: string;
  readonly medicalNotes?: string;
  readonly recordedAt: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export interface CreateEmergencyDetailsInput {
  id: unknown;
  subjectId: unknown;
  contactName: unknown;
  contactPhone: unknown;
  relationship: unknown;
  medicalNotes?: unknown;
  recordedAt: unknown;
}

/**
 * Creates a restricted emergency-contact / medical-adjacent record. Every required field is
 * validated at runtime; `medicalNotes` is the one genuinely optional field but, when supplied,
 * must be a string. The returned record is runtime-frozen. There is no public serializer or
 * display function anywhere in this module -- this data is never exposed for general viewing.
 */
export function createEmergencyDetails(params: CreateEmergencyDetailsInput): EmergencyDetails {
  if (!isNonEmptyString(params.id)) {
    throw new Error("Emergency details require a non-empty id");
  }
  if (!isNonEmptyString(params.subjectId)) {
    throw new Error("Emergency details require a non-empty subjectId");
  }
  if (!isNonEmptyString(params.contactName)) {
    throw new Error("Emergency details require a non-empty contactName");
  }
  if (!isNonEmptyString(params.contactPhone)) {
    throw new Error("Emergency details require a non-empty contactPhone");
  }
  if (!isNonEmptyString(params.relationship)) {
    throw new Error("Emergency details require a non-empty relationship");
  }
  if (!isNonEmptyString(params.recordedAt)) {
    throw new Error("Emergency details require a non-empty recordedAt timestamp");
  }
  if (params.medicalNotes !== undefined && typeof params.medicalNotes !== "string") {
    throw new Error("medicalNotes, when supplied, must be a string");
  }

  return Object.freeze({
    id: params.id,
    subjectId: params.subjectId,
    contactName: params.contactName,
    contactPhone: params.contactPhone,
    relationship: params.relationship,
    medicalNotes: params.medicalNotes as string | undefined,
    recordedAt: params.recordedAt,
  });
}
