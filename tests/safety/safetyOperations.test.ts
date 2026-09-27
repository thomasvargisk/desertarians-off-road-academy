import { describe, it, expect } from "vitest";
import * as emergencyDetailsModule from "../../lib/safety/emergencyDetails";
const { createEmergencyDetails } = emergencyDetailsModule;
import {
  isKnownSafeguardingState,
  isValidSafeguardingTransition,
  raiseSafeguardingConcern,
  transitionSafeguardingConcern,
  getSafeguardingHistory,
  type SafeguardingConcern,
} from "../../lib/safety/safeguarding";
import {
  isKnownQualificationState,
  isValidQualificationTransition,
  createCandidateQualification,
  transitionQualification,
  isCurrentlyQualified,
  qualificationStateAt,
  getQualificationHistory,
  type MarshalQualification,
} from "../../lib/safety/qualification";
import {
  createVehicleReadinessAttestation,
  isAttestationCurrentlyValid,
  createMarshalVehicleVerification,
  isEventVehicleReadinessSatisfied,
} from "../../lib/safety/vehicleReadiness";

const HOSTILE_STATES = ["constructor", "__proto__", "toString", "hasOwnProperty", "NOT_A_STATE", ""];

describe("Safety Operations Domain", () => {
  describe("Emergency Details", () => {
    it("creates a valid record and freezes it", () => {
      const rec = createEmergencyDetails({
        id: "e1",
        subjectId: "u1",
        contactName: "Jane Doe",
        contactPhone: "+971500000000",
        relationship: "Spouse",
        recordedAt: "2026-01-01T00:00:00Z",
      });
      expect(rec.contactName).toBe("Jane Doe");
      expect(rec.medicalNotes).toBeUndefined();
      expect(Object.isFrozen(rec)).toBe(true);
      expect(() => {
        (rec as { contactName: string }).contactName = "tampered";
      }).toThrow();
    });

    it("accepts optional medicalNotes as a string", () => {
      const rec = createEmergencyDetails({
        id: "e2",
        subjectId: "u1",
        contactName: "Jane Doe",
        contactPhone: "+971500000000",
        relationship: "Spouse",
        medicalNotes: "Penicillin allergy",
        recordedAt: "2026-01-01T00:00:00Z",
      });
      expect(rec.medicalNotes).toBe("Penicillin allergy");
    });

    it("fails closed on every missing required field", () => {
      const valid = {
        id: "e",
        subjectId: "u1",
        contactName: "Jane Doe",
        contactPhone: "+971500000000",
        relationship: "Spouse",
        recordedAt: "2026-01-01T00:00:00Z",
      };
      expect(() => createEmergencyDetails({ ...valid, id: "" })).toThrow();
      expect(() => createEmergencyDetails({ ...valid, subjectId: "" })).toThrow();
      expect(() => createEmergencyDetails({ ...valid, contactName: "" })).toThrow();
      expect(() => createEmergencyDetails({ ...valid, contactPhone: "" })).toThrow();
      expect(() => createEmergencyDetails({ ...valid, relationship: "" })).toThrow();
      expect(() => createEmergencyDetails({ ...valid, recordedAt: "" })).toThrow();
      expect(() => createEmergencyDetails({ ...valid, medicalNotes: 42 as unknown })).toThrow();
    });

    it("has no public serializer exported", () => {
      const exportNames = Object.keys(emergencyDetailsModule);
      expect(exportNames.some((n) => /serialize|toPublic|toJSON|display/i.test(n))).toBe(false);
    });
  });

  describe("Safeguarding", () => {
    it("raises a concern in RAISED state, frozen, with empty history", () => {
      const concern = raiseSafeguardingConcern({
        id: "sg1",
        subjectId: "u1",
        raisedBy: "actor1",
        raisedAt: "2026-01-01T00:00:00Z",
        concern: "Observed unsafe behaviour",
      });
      expect(concern.state).toBe("RAISED");
      expect(getSafeguardingHistory(concern)).toHaveLength(0);
      expect(Object.isFrozen(concern)).toBe(true);
      expect(Object.isFrozen(concern.transitions)).toBe(true);
    });

    it("fails closed on missing required fields", () => {
      const valid = {
        id: "sg",
        subjectId: "u1",
        raisedBy: "actor1",
        raisedAt: "2026-01-01T00:00:00Z",
        concern: "concern text",
      };
      expect(() => raiseSafeguardingConcern({ ...valid, id: "" })).toThrow();
      expect(() => raiseSafeguardingConcern({ ...valid, subjectId: "" })).toThrow();
      expect(() => raiseSafeguardingConcern({ ...valid, raisedBy: "" })).toThrow();
      expect(() => raiseSafeguardingConcern({ ...valid, raisedAt: "" })).toThrow();
      expect(() => raiseSafeguardingConcern({ ...valid, concern: "" })).toThrow();
    });

    it("escalates through a full append-only history with correct actors", () => {
      let concern: SafeguardingConcern = raiseSafeguardingConcern({
        id: "sg2",
        subjectId: "u1",
        raisedBy: "reporter1",
        raisedAt: "2026-01-01T00:00:00Z",
        concern: "concern text",
      });
      concern = transitionSafeguardingConcern(concern, "UNDER_REVIEW", "reviewer1", "2026-01-02T00:00:00Z");
      concern = transitionSafeguardingConcern(concern, "ESCALATED", "reviewer1", "2026-01-03T00:00:00Z", "escalating");
      concern = transitionSafeguardingConcern(concern, "CLOSED", "admin1", "2026-01-04T00:00:00Z");

      const history = getSafeguardingHistory(concern);
      expect(history).toHaveLength(3);
      expect(history.map((h) => h.actorId)).toEqual(["reviewer1", "reviewer1", "admin1"]);
      expect(history.map((h) => h.toState)).toEqual(["UNDER_REVIEW", "ESCALATED", "CLOSED"]);
      expect(concern.state).toBe("CLOSED");
    });

    it("returned records and history entries are runtime-frozen", () => {
      const concern = raiseSafeguardingConcern({
        id: "sg3",
        subjectId: "u1",
        raisedBy: "reporter1",
        raisedAt: "2026-01-01T00:00:00Z",
        concern: "concern text",
      });
      const under = transitionSafeguardingConcern(concern, "UNDER_REVIEW", "reviewer1", "2026-01-02T00:00:00Z");
      expect(Object.isFrozen(under)).toBe(true);
      expect(Object.isFrozen(under.transitions[0])).toBe(true);
      expect(() => {
        (under.transitions[0] as { actorId: string }).actorId = "tampered";
      }).toThrow();
      // Original concern is untouched.
      expect(concern.state).toBe("RAISED");
      expect(concern.transitions).toHaveLength(0);
    });

    it("fails closed without a non-empty actorId or timestamp", () => {
      const concern = raiseSafeguardingConcern({
        id: "sg4",
        subjectId: "u1",
        raisedBy: "reporter1",
        raisedAt: "2026-01-01T00:00:00Z",
        concern: "concern text",
      });
      expect(() => transitionSafeguardingConcern(concern, "UNDER_REVIEW", "", "2026-01-02T00:00:00Z")).toThrow();
      expect(() => transitionSafeguardingConcern(concern, "UNDER_REVIEW", "reviewer1", "")).toThrow();
    });

    it("hostile unknown safeguarding states fail closed rather than succeeding", () => {
      const concern = raiseSafeguardingConcern({
        id: "sg5",
        subjectId: "u1",
        raisedBy: "reporter1",
        raisedAt: "2026-01-01T00:00:00Z",
        concern: "concern text",
      });
      for (const hostile of HOSTILE_STATES) {
        expect(isValidSafeguardingTransition(concern.state, hostile as unknown)).toBe(false);
        expect(isValidSafeguardingTransition(hostile as unknown, "CLOSED")).toBe(false);
        expect(isKnownSafeguardingState(hostile)).toBe(hostile === "" ? false : hostile === "RAISED");
        expect(() =>
          transitionSafeguardingConcern(concern, hostile as unknown, "actor1", "2026-01-02T00:00:00Z")
        ).toThrow();
      }
    });
  });

  describe("Instructor/Marshal Qualification Lifecycle", () => {
    it("creates a CANDIDATE qualification, frozen, empty history", () => {
      const q = createCandidateQualification({ id: "q1", personId: "p1" });
      expect(q.state).toBe("CANDIDATE");
      expect(getQualificationHistory(q)).toHaveLength(0);
      expect(Object.isFrozen(q)).toBe(true);
    });

    it("moves through the full lifecycle with explicit human approval at every gated step", () => {
      let q: MarshalQualification = createCandidateQualification({ id: "q2", personId: "p1" });
      q = transitionQualification(q, "QUALIFIED", "system", "2026-01-01T00:00:00Z", "approver1");
      expect(q.state).toBe("QUALIFIED");
      q = transitionQualification(q, "CURRENT", "system", "2026-01-02T00:00:00Z", "approver1");
      expect(q.state).toBe("CURRENT");
      expect(isCurrentlyQualified(q.state)).toBe(true);

      q = transitionQualification(q, "EXPIRING", "system", "2026-06-01T00:00:00Z");
      expect(q.state).toBe("EXPIRING");
      expect(isCurrentlyQualified(q.state)).toBe(false);

      // Renewal requires explicit approval.
      q = transitionQualification(q, "CURRENT", "system", "2026-06-02T00:00:00Z", "approver2");
      expect(q.state).toBe("CURRENT");

      q = transitionQualification(q, "SUSPENDED", "system", "2026-07-01T00:00:00Z", "approver3", "conduct review");
      expect(q.state).toBe("SUSPENDED");

      // Restoration requires explicit approval.
      q = transitionQualification(q, "CURRENT", "system", "2026-07-15T00:00:00Z", "approver3");
      expect(q.state).toBe("CURRENT");

      const history = getQualificationHistory(q);
      expect(history).toHaveLength(6);
      expect(history.every((h) => h.actorId === "system")).toBe(true);
    });

    it("grant, renewal, suspension, and restoration all fail closed without an explicit approverId", () => {
      let q: MarshalQualification = createCandidateQualification({ id: "q3", personId: "p1" });
      // grant
      expect(() => transitionQualification(q, "QUALIFIED", "system", "2026-01-01T00:00:00Z")).toThrow();
      q = transitionQualification(q, "QUALIFIED", "system", "2026-01-01T00:00:00Z", "approver1");
      // activation
      expect(() => transitionQualification(q, "CURRENT", "system", "2026-01-02T00:00:00Z")).toThrow();
      q = transitionQualification(q, "CURRENT", "system", "2026-01-02T00:00:00Z", "approver1");
      // time-driven transition needs no approver
      q = transitionQualification(q, "EXPIRING", "system", "2026-06-01T00:00:00Z");
      // renewal
      expect(() => transitionQualification(q, "CURRENT", "system", "2026-06-02T00:00:00Z")).toThrow();
      // suspension (from EXPIRING)
      expect(() => transitionQualification(q, "SUSPENDED", "system", "2026-06-02T00:00:00Z")).toThrow();
    });

    it("never infers actor or approver identity -- both must be explicitly supplied and non-empty", () => {
      const q = createCandidateQualification({ id: "q4", personId: "p1" });
      expect(() => transitionQualification(q, "QUALIFIED", "", "2026-01-01T00:00:00Z", "approver1")).toThrow();
      expect(() => transitionQualification(q, "QUALIFIED", "system", "", "approver1")).toThrow();
    });

    it("hostile unknown qualification states fail closed rather than succeeding", () => {
      const q = createCandidateQualification({ id: "q5", personId: "p1" });
      for (const hostile of HOSTILE_STATES) {
        expect(isKnownQualificationState(hostile)).toBe(false);
        expect(isValidQualificationTransition(q.state, hostile as unknown)).toBe(false);
        expect(isValidQualificationTransition(hostile as unknown, "QUALIFIED")).toBe(false);
        expect(() =>
          transitionQualification(q, hostile as unknown, "system", "2026-01-01T00:00:00Z", "approver1")
        ).toThrow();
      }
    });

    it("isCurrentlyQualified fails closed for every non-CURRENT and hostile value", () => {
      expect(isCurrentlyQualified("CURRENT")).toBe(true);
      for (const other of ["CANDIDATE", "QUALIFIED", "EXPIRING", "SUSPENDED", "EXPIRED", ...HOSTILE_STATES, null, undefined, 42]) {
        expect(isCurrentlyQualified(other as unknown)).toBe(false);
      }
    });

    it("EXPIRED has no outgoing transition (documented modelling limitation)", () => {
      expect(isValidQualificationTransition("EXPIRED", "CURRENT")).toBe(false);
      expect(isValidQualificationTransition("EXPIRED", "CANDIDATE")).toBe(false);
    });

    it("rejects a transition timestamp that is not strictly after the previous one (fix for Codex review finding: backdated history)", () => {
      let q = createCandidateQualification({ id: "q-mono", personId: "p-mono" });
      q = transitionQualification(q, "QUALIFIED", "system", "2026-01-12T00:00:00Z", "approver1");
      // Reproduces Codex's exact repro: QUALIFIED dated Jan 12, then an attempt to record CURRENT
      // dated Jan 1 -- strictly earlier than the transition that already exists.
      expect(() => transitionQualification(q, "CURRENT", "system", "2026-01-01T00:00:00Z", "approver1")).toThrow();
      // Equal to the previous transition's timestamp must also be rejected -- "strictly after".
      expect(() => transitionQualification(q, "CURRENT", "system", "2026-01-12T00:00:00Z", "approver1")).toThrow();
      // Genuinely later succeeds.
      const current = transitionQualification(q, "CURRENT", "system", "2026-01-13T00:00:00Z", "approver1");
      expect(current.state).toBe("CURRENT");
    });

    it("rejects an unparseable transition timestamp outright, not just an empty one", () => {
      const q = createCandidateQualification({ id: "q-badtime", personId: "p-badtime" });
      expect(() => transitionQualification(q, "QUALIFIED", "system", "not-a-date", "approver1")).toThrow();
    });

    it("qualificationStateAt fails closed on a malformed or non-monotonic history reaching it directly, rather than silently skipping the bad entry (fix for Codex review finding: history coherence)", () => {
      // A directly-constructed record bypassing the public API entirely -- exactly the kind of
      // corrupted input this function must not trust. Reproduces Codex's second repro: a
      // suspension with an invalid timestamp must not be silently ignored, leaving an earlier
      // CURRENT state authorized.
      const backdated = {
        id: "q-hostile-2",
        personId: "marshal-hostile",
        state: "SUSPENDED",
        transitions: [
          { actorId: "system", fromState: "CANDIDATE", toState: "QUALIFIED", at: "2026-01-01T00:00:00Z", approverId: "a1" },
          { actorId: "system", fromState: "QUALIFIED", toState: "CURRENT", at: "2026-01-02T00:00:00Z", approverId: "a1" },
          { actorId: "system", fromState: "CURRENT", toState: "SUSPENDED", at: "not-a-date", approverId: "a2" },
        ],
      } as unknown as MarshalQualification;

      // Querying a moment that would, if the malformed suspension were silently skipped, still
      // resolve to the earlier CURRENT state -- must instead fail closed (null), not "CURRENT".
      expect(qualificationStateAt(backdated, "2026-01-15T00:00:00Z")).toBeNull();

      const nonMonotonic = {
        id: "q-hostile-3",
        personId: "marshal-hostile",
        state: "CURRENT",
        transitions: [
          { actorId: "system", fromState: "CANDIDATE", toState: "QUALIFIED", at: "2026-01-12T00:00:00Z", approverId: "a1" },
          { actorId: "system", fromState: "QUALIFIED", toState: "CURRENT", at: "2026-01-01T00:00:00Z", approverId: "a1" },
        ],
      } as unknown as MarshalQualification;
      // Codex's first repro, reconstructed directly against qualificationStateAt: a backdated
      // CURRENT entry must not make the marshal appear CURRENT before they were even QUALIFIED.
      expect(qualificationStateAt(nonMonotonic, "2026-01-10T00:00:00Z")).toBeNull();
    });

    it("qualificationStateAt validates lifecycle continuity, not just timestamp order (fix for Codex review finding: structural coherence)", () => {
      // Codex's first repro: the forbidden shortcut CANDIDATE -> CURRENT, skipping QUALIFIED
      // entirely. Temporally tidy (a single entry, nothing to be out of order), but illegal.
      const illegalShortcut = {
        id: "q-illegal-1",
        personId: "marshal-x",
        state: "CURRENT",
        transitions: [
          { actorId: "system", fromState: "CANDIDATE", toState: "CURRENT", at: "2026-01-01T00:00:00Z", approverId: "a1" },
        ],
      } as unknown as MarshalQualification;
      expect(qualificationStateAt(illegalShortcut, "2026-01-05T00:00:00Z")).toBeNull();

      // Codex's second repro: CANDIDATE -> QUALIFIED, then a *disconnected* SUSPENDED -> CURRENT
      // whose fromState (SUSPENDED) does not match the state the chain actually reached
      // (QUALIFIED). Also temporally tidy, but referentially fabricated.
      const disconnected = {
        id: "q-illegal-2",
        personId: "marshal-y",
        state: "CURRENT",
        transitions: [
          { actorId: "system", fromState: "CANDIDATE", toState: "QUALIFIED", at: "2026-01-01T00:00:00Z", approverId: "a1" },
          { actorId: "system", fromState: "SUSPENDED", toState: "CURRENT", at: "2026-01-02T00:00:00Z", approverId: "a1" },
        ],
      } as unknown as MarshalQualification;
      expect(qualificationStateAt(disconnected, "2026-01-05T00:00:00Z")).toBeNull();

      // A gated transition missing its required approverId, discovered only during replay, also
      // fails closed -- required-data coherence, not just structural coherence.
      const missingApprover = {
        id: "q-illegal-3",
        personId: "marshal-z",
        state: "QUALIFIED",
        transitions: [
          { actorId: "system", fromState: "CANDIDATE", toState: "QUALIFIED", at: "2026-01-01T00:00:00Z" }, // no approverId
        ],
      } as unknown as MarshalQualification;
      expect(qualificationStateAt(missingApprover, "2026-01-05T00:00:00Z")).toBeNull();

      // A record whose own top-level `state` disagrees with what its history actually replays to.
      const inconsistentTopLevel = {
        id: "q-illegal-4",
        personId: "marshal-w",
        state: "CURRENT", // history only reaches QUALIFIED
        transitions: [
          { actorId: "system", fromState: "CANDIDATE", toState: "QUALIFIED", at: "2026-01-01T00:00:00Z", approverId: "a1" },
        ],
      } as unknown as MarshalQualification;
      expect(qualificationStateAt(inconsistentTopLevel, "2026-01-05T00:00:00Z")).toBeNull();

      // Fairness check: a genuinely well-formed record (built through the real API) must still
      // resolve normally -- these new checks must not make legitimate history fail closed too.
      let genuine = createCandidateQualification({ id: "q-genuine", personId: "marshal-genuine" });
      genuine = transitionQualification(genuine, "QUALIFIED", "system", "2025-01-01T00:00:00Z", "approver1");
      genuine = transitionQualification(genuine, "CURRENT", "system", "2025-01-02T00:00:00Z", "approver1");
      expect(qualificationStateAt(genuine, "2025-06-01T00:00:00Z")).toBe("CURRENT");
    });

    it("qualificationStateAt returns null instead of throwing for malformed transition containers", () => {
      const malformedRecords = [
        null,
        { id: "q-null-history", personId: "marshal-x", state: "CURRENT", transitions: null },
        { id: "q-null-entry", personId: "marshal-x", state: "CURRENT", transitions: [null] },
        { id: "q-object-history", personId: "marshal-x", state: "CURRENT", transitions: {} },
      ];

      for (const malformed of malformedRecords) {
        expect(() =>
          qualificationStateAt(malformed as unknown as MarshalQualification, "2026-01-10T00:00:00Z")
        ).not.toThrow();
        expect(
          qualificationStateAt(malformed as unknown as MarshalQualification, "2026-01-10T00:00:00Z")
        ).toBeNull();
      }
    });
  });

  describe("Vehicle Readiness: attestation vs. marshal verification", () => {
    const validAttestation = {
      id: "att1",
      memberId: "m1",
      vehicleId: "v1",
      versionNumber: "1",
      confirmedItemIds: ["tyres", "recovery-points"],
      declaredAt: "2026-01-01T00:00:00Z",
      expiresAt: "2026-02-01T00:00:00Z",
    };

    it("creates a valid attestation, frozen, and checks validity as-of a timestamp", () => {
      const att = createVehicleReadinessAttestation(validAttestation);
      expect(Object.isFrozen(att)).toBe(true);
      expect(isAttestationCurrentlyValid(att, "2026-01-15T00:00:00Z")).toBe(true);
      expect(isAttestationCurrentlyValid(att, "2026-03-01T00:00:00Z")).toBe(false); // expired
      expect(isAttestationCurrentlyValid(att, "not-a-date")).toBe(false);
    });

    it("an attestation is not valid before its own declaredAt (fix for Codex review finding: medium)", () => {
      const att = createVehicleReadinessAttestation(validAttestation); // declaredAt: 2026-01-01
      expect(isAttestationCurrentlyValid(att, "2025-12-31T23:59:59Z")).toBe(false); // before declaredAt
      expect(isAttestationCurrentlyValid(att, "2026-01-01T00:00:00Z")).toBe(true); // exactly at declaredAt
    });

    it("fails closed on missing/invalid attestation fields", () => {
      expect(() => createVehicleReadinessAttestation({ ...validAttestation, id: "" })).toThrow();
      expect(() => createVehicleReadinessAttestation({ ...validAttestation, memberId: "" })).toThrow();
      expect(() => createVehicleReadinessAttestation({ ...validAttestation, vehicleId: "" })).toThrow();
      expect(() => createVehicleReadinessAttestation({ ...validAttestation, versionNumber: "" })).toThrow();
      expect(() =>
        createVehicleReadinessAttestation({ ...validAttestation, confirmedItemIds: "not-an-array" })
      ).toThrow();
      expect(() => createVehicleReadinessAttestation({ ...validAttestation, declaredAt: "" })).toThrow();
      expect(() => createVehicleReadinessAttestation({ ...validAttestation, expiresAt: "not-a-date" })).toThrow();
      expect(() =>
        createVehicleReadinessAttestation({ ...validAttestation, expiresAt: "2025-12-01T00:00:00Z" })
      ).toThrow(); // expires before it's declared
    });

    const validVerification = {
      id: "ver1",
      vehicleId: "v1",
      eventId: "ev1",
      marshalId: "marshal1",
      verifiedAt: "2026-01-10T00:00:00Z",
      expiresAt: "2026-01-17T00:00:00Z",
      passed: true,
    };

    /** Builds a real, fully-transitioned CURRENT qualification for the given marshal, granted at the given time. */
    function currentMarshal(personId: string, grantedAt = "2025-01-01T00:00:00Z", activatedAt = "2025-01-02T00:00:00Z"): MarshalQualification {
      let q = createCandidateQualification({ id: `q-${personId}-${grantedAt}`, personId });
      q = transitionQualification(q, "QUALIFIED", "system", grantedAt, "approverX");
      q = transitionQualification(q, "CURRENT", "system", activatedAt, "approverX");
      return q;
    }

    /** Builds a real qualification for the given marshal that was suspended at the given time. */
    function suspendedMarshal(personId: string, suspendedAt = "2025-06-01T00:00:00Z"): MarshalQualification {
      const q = currentMarshal(personId);
      return transitionQualification(q, "SUSPENDED", "system", suspendedAt, "approverY");
    }

    it("creates a valid marshal verification, frozen, as a genuinely separate record type", () => {
      const ver = createMarshalVehicleVerification(validVerification);
      expect(Object.isFrozen(ver)).toBe(true);
      expect(ver.marshalId).toBe("marshal1");
    });

    it("fails closed on missing/invalid verification fields", () => {
      expect(() => createMarshalVehicleVerification({ ...validVerification, id: "" })).toThrow();
      expect(() => createMarshalVehicleVerification({ ...validVerification, marshalId: "" })).toThrow();
      expect(() => createMarshalVehicleVerification({ ...validVerification, verifiedAt: "" })).toThrow();
      expect(() => createMarshalVehicleVerification({ ...validVerification, passed: "yes" as unknown })).toThrow();
      expect(() => createMarshalVehicleVerification({ ...validVerification, notes: 42 as unknown })).toThrow();
      // expiresAt is mandatory and must be after verifiedAt (fix for Codex review: verification expiry).
      expect(() => createMarshalVehicleVerification({ ...validVerification, expiresAt: "" })).toThrow();
      expect(() => createMarshalVehicleVerification({ ...validVerification, expiresAt: "not-a-date" })).toThrow();
      expect(() =>
        createMarshalVehicleVerification({ ...validVerification, expiresAt: "2026-01-05T00:00:00Z" })
      ).toThrow(); // expires before it was even recorded
    });

    it("an expired verification can never satisfy readiness, however old the evidence (fix for Codex review finding: verification expiry)", () => {
      const att = createVehicleReadinessAttestation(validAttestation);
      const ver = createMarshalVehicleVerification(validVerification); // expiresAt: 2026-01-17
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-01-17T00:00:00Z", // exactly at expiresAt -- must not be valid
        })
      ).toBe(false);
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-01-16T23:59:59Z", // one second before expiry -- must still be valid
        })
      ).toBe(true);
    });

    it("a marshal's CURRENT status is evaluated at verifiedAt, never at the record's current/latest state (fix for Codex review finding: high, qualification not time-bound)", () => {
      const att = createVehicleReadinessAttestation(validAttestation);
      const ver = createMarshalVehicleVerification(validVerification); // verifiedAt: 2026-01-10

      // Case A: qualification is granted and activated only AFTER verifiedAt -- at verifiedAt the
      // marshal was still CANDIDATE. Must fail even though the record's current state is CURRENT.
      const qualifiedOnlyAfterVerification = currentMarshal("marshal1", "2026-01-11T00:00:00Z", "2026-01-12T00:00:00Z");
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: qualifiedOnlyAfterVerification,
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(false);

      // Case B: marshal was CURRENT well before verifiedAt, then suspended, then restored -- but
      // the restoration happened AFTER verifiedAt. At verifiedAt itself the marshal was SUSPENDED.
      // Must fail even though the record's current/latest state is CURRENT again.
      let restoredAfterVerification = suspendedMarshal("marshal1", "2026-01-05T00:00:00Z"); // suspended before verifiedAt
      restoredAfterVerification = transitionQualification(
        restoredAfterVerification,
        "CURRENT",
        "system",
        "2026-01-12T00:00:00Z", // restored AFTER verifiedAt (2026-01-10)
        "approverZ"
      );
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: restoredAfterVerification,
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(false);

      // Case C (fairness check): a marshal genuinely CURRENT at verifiedAt, who is only suspended
      // AFTER verifiedAt, must still pass -- a later suspension does not retroactively invalidate
      // a verification that was genuinely valid when it was actually performed.
      let suspendedAfterVerification = currentMarshal("marshal1"); // CURRENT well before verifiedAt
      suspendedAfterVerification = transitionQualification(
        suspendedAfterVerification,
        "SUSPENDED",
        "system",
        "2026-01-12T00:00:00Z", // suspended AFTER verifiedAt (2026-01-10)
        "approverZ"
      );
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: suspendedAfterVerification,
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(true);
    });

    it("self-attestation alone -- even fully valid and unexpired -- never satisfies event readiness", () => {
      const att = createVehicleReadinessAttestation(validAttestation);
      const satisfied = isEventVehicleReadinessSatisfied({
        vehicleId: "v1",
        eventId: "ev1",
        attestation: att,
        verification: null,
        marshalQualification: currentMarshal("marshal1"),
        asOf: "2026-01-15T00:00:00Z",
      });
      expect(satisfied).toBe(false);
    });

    it("readiness requires a passed verification by the same currently-qualified marshal", () => {
      const att = createVehicleReadinessAttestation(validAttestation);
      const ver = createMarshalVehicleVerification(validVerification); // marshalId: "marshal1"

      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(true);

      // Verification exists but that same marshal is not CURRENT (suspended).
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: suspendedMarshal("marshal1"),
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(false);

      // Verification did not pass.
      const failedVer = createMarshalVehicleVerification({ ...validVerification, id: "ver2", passed: false });
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: failedVer,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(false);

      // Verification for the wrong vehicle/event.
      const wrongVehicleVer = createMarshalVehicleVerification({ ...validVerification, id: "ver3", vehicleId: "v2" });
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: wrongVehicleVer,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(false);

      // Hostile/corrupted qualification-state value on the real record fails closed.
      const hostileQualification = {
        id: "q-hostile",
        personId: "marshal1",
        state: "constructor",
        transitions: [],
      } as unknown as MarshalQualification;
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: hostileQualification,
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(false);

      // No qualification record at all fails closed.
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: null,
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(false);

      // Invalid asOf timestamp fails closed.
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "not-a-date",
        })
      ).toBe(false);
    });

    it("readiness fails closed instead of throwing for malformed qualification transition containers", () => {
      const att = createVehicleReadinessAttestation(validAttestation);
      const ver = createMarshalVehicleVerification(validVerification);
      const malformedQualifications = [
        { id: "q-null-history", personId: "marshal1", state: "CURRENT", transitions: null },
        { id: "q-null-entry", personId: "marshal1", state: "CURRENT", transitions: [null] },
      ];

      for (const qualification of malformedQualifications) {
        const evaluate = () =>
          isEventVehicleReadinessSatisfied({
            vehicleId: "v1",
            eventId: "ev1",
            attestation: att,
            verification: ver,
            marshalQualification: qualification as unknown as MarshalQualification,
            asOf: "2026-01-15T00:00:00Z",
          });
        expect(evaluate).not.toThrow();
        expect(evaluate()).toBe(false);
      }
    });

    it("a verification recorded by one marshal cannot be paired with a different marshal's qualification (fix for Codex review finding: high)", () => {
      const att = createVehicleReadinessAttestation(validAttestation);
      const ver = createMarshalVehicleVerification(validVerification); // marshalId: "marshal1"
      // "marshal2" is genuinely CURRENT, but is not the marshal who performed this verification.
      const wrongMarshalQualification = currentMarshal("marshal2");

      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: wrongMarshalQualification,
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(false);
    });

    it("a verification dated after asOf can never authorize an earlier moment's readiness (fix for Codex review finding: high)", () => {
      const att = createVehicleReadinessAttestation(validAttestation);
      const futureVer = createMarshalVehicleVerification({
        ...validVerification,
        id: "ver-future",
        verifiedAt: "2026-01-20T00:00:00Z",
        expiresAt: "2026-01-27T00:00:00Z",
      });

      // asOf is before the verification was even recorded -- must fail.
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: futureVer,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(false);

      // The same verification is fine once asOf has actually reached/passed verifiedAt.
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: futureVer,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-01-20T00:00:00Z",
        })
      ).toBe(true);
    });

    it("readiness can still be satisfied with a passed verification even if no attestation is supplied at all", () => {
      const ver = createMarshalVehicleVerification(validVerification);
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: null,
          verification: ver,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-01-15T00:00:00Z",
        })
      ).toBe(true);
    });

    it("an expired attestation, if supplied, blocks readiness even with a valid verification", () => {
      const att = createVehicleReadinessAttestation(validAttestation);
      const ver = createMarshalVehicleVerification(validVerification);
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: att,
          verification: ver,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-03-01T00:00:00Z", // after the attestation's expiresAt
        })
      ).toBe(false);
    });

    it("an attestation dated before its own declaredAt (relative to asOf) blocks readiness (fix for Codex review finding: medium)", () => {
      const futureAtt = createVehicleReadinessAttestation({
        ...validAttestation,
        id: "att-future",
        declaredAt: "2026-01-20T00:00:00Z",
        expiresAt: "2026-02-20T00:00:00Z",
      });
      const ver = createMarshalVehicleVerification(validVerification);
      expect(
        isEventVehicleReadinessSatisfied({
          vehicleId: "v1",
          eventId: "ev1",
          attestation: futureAtt,
          verification: ver,
          marshalQualification: currentMarshal("marshal1"),
          asOf: "2026-01-15T00:00:00Z", // before the attestation's own declaredAt
        })
      ).toBe(false);
    });
  });
});
