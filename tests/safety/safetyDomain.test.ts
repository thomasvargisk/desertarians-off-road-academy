import { describe, it, expect } from "vitest";
import {
  isValidWaiverTransition,
  transitionWaiverVersion,
  isWaiverVersionImmutable,
  type WaiverVersion,
} from "../../lib/safety/waiverVersion";
import {
  createWaiverAcceptance,
  isWaiverEligible,
} from "../../lib/safety/waiverAcceptance";
import {
  isValidIncidentTransition,
  transitionIncident,
  getIncidentAuditTrail,
  type Incident,
} from "../../lib/safety/incident";
import {
  evaluateRetention,
  isRestrictedCategory,
  type SensitiveCategory,
  type RetentionPolicy,
} from "../../lib/safety/sensitiveData";

describe("Safety Domain", () => {
  describe("Waiver Version", () => {
    const draft: WaiverVersion = {
      id: "v1",
      versionNumber: "1.0",
      state: "DRAFT",
      text: "text",
      createdAt: "2026-01-01T00:00:00Z",
    };

    it("allows DRAFT -> PUBLISHED", () => {
      expect(isValidWaiverTransition("DRAFT", "PUBLISHED")).toBe(true);
    });

    it("allows DRAFT -> RETIRED", () => {
      expect(isValidWaiverTransition("DRAFT", "RETIRED")).toBe(true);
    });

    it("disallows DRAFT -> SUPERSEDED", () => {
      expect(isValidWaiverTransition("DRAFT", "SUPERSEDED")).toBe(false);
    });

    it("allows PUBLISHED -> SUPERSEDED", () => {
      expect(isValidWaiverTransition("PUBLISHED", "SUPERSEDED")).toBe(true);
    });

    it("allows PUBLISHED -> RETIRED", () => {
      expect(isValidWaiverTransition("PUBLISHED", "RETIRED")).toBe(true);
    });

    it("disallows SUPERSEDED -> PUBLISHED", () => {
      expect(isValidWaiverTransition("SUPERSEDED", "PUBLISHED")).toBe(false);
    });

    it("disallows same state transition", () => {
      expect(isValidWaiverTransition("DRAFT", "DRAFT")).toBe(false);
    });

    it("transition fails closed on invalid transition", () => {
      expect(() => transitionWaiverVersion(draft, "SUPERSEDED", "2026-01-02T00:00:00Z")).toThrow();
    });

    it("publishing without an explicit publishedAt fails closed (no Date.now fallback)", () => {
      expect(() => transitionWaiverVersion(draft, "PUBLISHED")).toThrow();
      expect(() => transitionWaiverVersion(draft, "PUBLISHED", "")).toThrow();
      expect(() => transitionWaiverVersion(draft, "PUBLISHED", "   ")).toThrow();
    });

    it("transition preserves id, versionNumber, text, and createdAt exactly", () => {
      const published = transitionWaiverVersion(draft, "PUBLISHED", "2026-01-02T00:00:00Z");
      expect(published.id).toBe(draft.id);
      expect(published.versionNumber).toBe(draft.versionNumber);
      expect(published.text).toBe(draft.text);
      expect(published.createdAt).toBe(draft.createdAt);
      expect(published.state).toBe("PUBLISHED");
      expect(published.publishedAt).toBe("2026-01-02T00:00:00Z");
    });

    it("immutability helper reports published text as immutable", () => {
      const published = transitionWaiverVersion(draft, "PUBLISHED", "2026-01-02T00:00:00Z");
      expect(isWaiverVersionImmutable(published, "different")).toBe(false);
      expect(isWaiverVersionImmutable(published, "text")).toBe(true);
    });

    it("runtime-freezes PUBLISHED, SUPERSEDED, and RETIRED versions; mutation cannot change protected fields", () => {
      const published = transitionWaiverVersion(draft, "PUBLISHED", "2026-01-02T00:00:00Z");
      expect(Object.isFrozen(published)).toBe(true);
      expect(() => {
        (published as { text: string }).text = "tampered";
      }).toThrow();
      expect(published.text).toBe("text");

      const superseded = transitionWaiverVersion(published, "SUPERSEDED");
      expect(Object.isFrozen(superseded)).toBe(true);
      expect(() => {
        (superseded as { state: string }).state = "PUBLISHED";
      }).toThrow();
      expect(superseded.state).toBe("SUPERSEDED");

      const retired = transitionWaiverVersion(superseded, "RETIRED");
      expect(Object.isFrozen(retired)).toBe(true);
      expect(() => {
        (retired as { id: string }).id = "tampered-id";
      }).toThrow();
      expect(retired.id).toBe(draft.id);
    });

    it("hostile unknown waiver states fail closed rather than succeeding", () => {
      const hostileStates = ["constructor", "__proto__", "toString", "hasOwnProperty", "NOT_A_STATE", ""];
      for (const hostile of hostileStates) {
        expect(isValidWaiverTransition(draft.state, hostile as unknown)).toBe(false);
        expect(isValidWaiverTransition(hostile as unknown, "PUBLISHED")).toBe(false);
        expect(() => transitionWaiverVersion(draft, hostile as unknown, "2026-01-02T00:00:00Z")).toThrow();
      }
      expect(isValidWaiverTransition(undefined, "PUBLISHED")).toBe(false);
      expect(isValidWaiverTransition("DRAFT", undefined)).toBe(false);
      expect(isValidWaiverTransition(null, null)).toBe(false);
    });
  });

  describe("Waiver Acceptance", () => {
    it("creates a valid acceptance and freezes it", () => {
      const acc = createWaiverAcceptance({
        id: "a1",
        subjectId: "u1",
        subjectType: "member",
        waiverVersionId: "v1",
        acceptedAt: "2026-01-03T00:00:00Z",
        evidenceRef: "ref1",
      });
      expect(acc.waiverVersionId).toBe("v1");
      expect(acc.subjectType).toBe("member");
      expect(Object.isFrozen(acc)).toBe(true);
    });

    it("fails without evidenceRef", () => {
      expect(() =>
        createWaiverAcceptance({
          id: "a2",
          subjectId: "u1",
          subjectType: "guardian",
          waiverVersionId: "v1",
          acceptedAt: "2026-01-03T00:00:00Z",
          evidenceRef: "",
        })
      ).toThrow();
    });

    it("fails without id, subjectId, waiverVersionId, or acceptedAt", () => {
      const valid = {
        id: "a",
        subjectId: "u1",
        subjectType: "member" as const,
        waiverVersionId: "v1",
        acceptedAt: "2026-01-03T00:00:00Z",
        evidenceRef: "ref",
      };
      expect(() => createWaiverAcceptance({ ...valid, id: "" })).toThrow();
      expect(() => createWaiverAcceptance({ ...valid, subjectId: "" })).toThrow();
      expect(() => createWaiverAcceptance({ ...valid, waiverVersionId: "" })).toThrow();
      expect(() => createWaiverAcceptance({ ...valid, acceptedAt: "" })).toThrow();
      expect(() => createWaiverAcceptance({ ...valid, id: undefined })).toThrow();
    });

    it("fails closed for a hostile subjectType cast through unknown", () => {
      const valid = {
        id: "a",
        subjectId: "u1",
        waiverVersionId: "v1",
        acceptedAt: "2026-01-03T00:00:00Z",
        evidenceRef: "ref",
      };
      const hostileTypes = ["MEMBER", "admin", "constructor", "__proto__", "", 42, null, undefined];
      for (const hostile of hostileTypes) {
        expect(() => createWaiverAcceptance({ ...valid, subjectType: hostile as unknown })).toThrow();
      }
    });

    it("eligibility requires exact version, complete valid acceptance, and exactly PUBLISHED state", () => {
      const acc = createWaiverAcceptance({
        id: "a3",
        subjectId: "u1",
        subjectType: "member",
        waiverVersionId: "v1",
        acceptedAt: "2026-01-03T00:00:00Z",
        evidenceRef: "ref",
      });
      expect(isWaiverEligible(acc, "v1", "PUBLISHED")).toBe(true);
      expect(isWaiverEligible(acc, "v2", "PUBLISHED")).toBe(false);
      expect(isWaiverEligible(acc, "v1", "DRAFT")).toBe(false);
    });

    it("guardian subject distinction respected", () => {
      const acc = createWaiverAcceptance({
        id: "a4",
        subjectId: "g1",
        subjectType: "guardian",
        waiverVersionId: "v1",
        acceptedAt: "2026-01-03T00:00:00Z",
        evidenceRef: "ref",
      });
      expect(acc.subjectType).toBe("guardian");
      expect(isWaiverEligible(acc, "v1", "PUBLISHED")).toBe(true);
    });

    it("eligibility fails closed for hostile unknown version state and missing acceptance", () => {
      const acc = createWaiverAcceptance({
        id: "a5",
        subjectId: "u1",
        subjectType: "member",
        waiverVersionId: "v1",
        acceptedAt: "2026-01-03T00:00:00Z",
        evidenceRef: "ref",
      });
      expect(isWaiverEligible(acc, "v1", "constructor")).toBe(false);
      expect(isWaiverEligible(acc, "v1", "__proto__")).toBe(false);
      expect(isWaiverEligible(acc, "v1", "NOT_A_STATE")).toBe(false);
      expect(isWaiverEligible(acc, "v1", 42 as unknown)).toBe(false);
      expect(isWaiverEligible(null, "v1", "PUBLISHED")).toBe(false);
      expect(isWaiverEligible(undefined, "v1", "PUBLISHED")).toBe(false);
    });
  });

  describe("Incident Workflow", () => {
    const base: Incident = {
      id: "i1",
      state: "OPEN",
      openedAt: "2026-01-01T00:00:00Z",
      transitions: [],
    };

    it("allows OPEN -> TRIAGED", () => {
      expect(isValidIncidentTransition("OPEN", "TRIAGED")).toBe(true);
    });

    it("allows TRIAGED -> ACTIONED", () => {
      expect(isValidIncidentTransition("TRIAGED", "ACTIONED")).toBe(true);
    });

    it("allows ACTIONED -> CLOSED", () => {
      expect(isValidIncidentTransition("ACTIONED", "CLOSED")).toBe(true);
    });

    it("disallows OPEN -> ACTIONED", () => {
      expect(isValidIncidentTransition("OPEN", "ACTIONED")).toBe(false);
    });

    it("disallows CLOSED -> OPEN", () => {
      expect(isValidIncidentTransition("CLOSED", "OPEN")).toBe(false);
    });

    it("transition records a complete, append-only audit trail", () => {
      const after = transitionIncident(base, "TRIAGED", "actor1", "2026-01-02T00:00:00Z", "triage note");
      expect(after.state).toBe("TRIAGED");
      const trail = getIncidentAuditTrail(after);
      expect(trail).toHaveLength(1);
      expect(trail[0].actorId).toBe("actor1");
      expect(trail[0].fromState).toBe("OPEN");
      expect(trail[0].toState).toBe("TRIAGED");
      expect(trail[0].at).toBe("2026-01-02T00:00:00Z");
      // Original incident is untouched -- append-only, never mutated in place.
      expect(base.transitions).toHaveLength(0);

      const closed = transitionIncident(
        transitionIncident(after, "ACTIONED", "actor2", "2026-01-03T00:00:00Z"),
        "CLOSED",
        "actor3",
        "2026-01-04T00:00:00Z"
      );
      const fullTrail = getIncidentAuditTrail(closed);
      expect(fullTrail).toHaveLength(3);
      expect(fullTrail.map((t) => t.actorId)).toEqual(["actor1", "actor2", "actor3"]);
    });

    it("returned incident and transition records are runtime-frozen", () => {
      const after = transitionIncident(base, "TRIAGED", "actor1", "2026-01-02T00:00:00Z");
      expect(Object.isFrozen(after)).toBe(true);
      expect(Object.isFrozen(after.transitions)).toBe(true);
      expect(Object.isFrozen(after.transitions[0])).toBe(true);
      expect(() => {
        (after as { state: string }).state = "CLOSED";
      }).toThrow();
      expect(() => {
        (after.transitions[0] as { actorId: string }).actorId = "tampered";
      }).toThrow();
    });

    it("fails closed on invalid transition", () => {
      expect(() => transitionIncident(base, "CLOSED", "actor1", "2026-01-02T00:00:00Z")).toThrow();
    });

    it("fails closed without a non-empty actorId", () => {
      expect(() => transitionIncident(base, "TRIAGED", "", "2026-01-02T00:00:00Z")).toThrow();
      expect(() => transitionIncident(base, "TRIAGED", undefined, "2026-01-02T00:00:00Z")).toThrow();
    });

    it("fails closed without a non-empty transition timestamp", () => {
      expect(() => transitionIncident(base, "TRIAGED", "actor1", "")).toThrow();
      expect(() => transitionIncident(base, "TRIAGED", "actor1", undefined)).toThrow();
    });

    it("hostile unknown incident states fail closed rather than succeeding", () => {
      const hostileStates = ["constructor", "__proto__", "toString", "hasOwnProperty", "NOT_A_STATE", ""];
      for (const hostile of hostileStates) {
        expect(isValidIncidentTransition(base.state, hostile as unknown)).toBe(false);
        expect(isValidIncidentTransition(hostile as unknown, "TRIAGED")).toBe(false);
        expect(() => transitionIncident(base, hostile as unknown, "actor1", "2026-01-02T00:00:00Z")).toThrow();
      }
    });
  });

  describe("Sensitive Data Boundary", () => {
    it("identifies restricted categories", () => {
      const cats: SensitiveCategory[] = ["EMERGENCY_MEDICAL", "SAFEGUARDING", "WAIVER_EVIDENCE", "INCIDENT_EVIDENCE"];
      cats.forEach((c) => expect(isRestrictedCategory(c)).toBe(true));
      expect(isRestrictedCategory("NOT_A_CATEGORY")).toBe(false);
    });

    it("pending retention never becomes eligible and never authorizes deletion", () => {
      const policy: RetentionPolicy = {
        category: "EMERGENCY_MEDICAL",
        status: "PENDING_LEGAL_AND_INSURANCE_ADVICE",
      };
      const result = evaluateRetention("EMERGENCY_MEDICAL", policy, "2020-01-01T00:00:00Z", "2026-01-01T00:00:00Z");
      expect(result.ownerReviewEligible).toBe(false);
      expect(result.automaticDeletionAllowed).toBe(false);
    });

    it("owner-configured policy becomes eligible for owner review only once the duration has actually elapsed", () => {
      const policy: RetentionPolicy = {
        category: "WAIVER_EVIDENCE",
        status: "OWNER_CONFIGURED",
        ownerConfiguredDurationDays: 365,
      };
      const elapsed = evaluateRetention(
        "WAIVER_EVIDENCE",
        policy,
        "2020-01-01T00:00:00Z",
        "2026-01-01T00:00:00Z"
      );
      expect(elapsed.ownerReviewEligible).toBe(true);
      expect(elapsed.automaticDeletionAllowed).toBe(false);

      const notYetElapsed = evaluateRetention(
        "WAIVER_EVIDENCE",
        policy,
        "2025-12-01T00:00:00Z",
        "2026-01-01T00:00:00Z"
      );
      expect(notYetElapsed.ownerReviewEligible).toBe(false);
      expect(notYetElapsed.automaticDeletionAllowed).toBe(false);
    });

    it("merely configuring a duration is never sufficient by itself -- eligibility requires elapsed real time", () => {
      const policy: RetentionPolicy = {
        category: "INCIDENT_EVIDENCE",
        status: "OWNER_CONFIGURED",
        ownerConfiguredDurationDays: 30,
      };
      // asOf === retainedAt: zero elapsed time, must not be eligible even though a duration exists.
      const zeroElapsed = evaluateRetention(
        "INCIDENT_EVIDENCE",
        policy,
        "2026-01-01T00:00:00Z",
        "2026-01-01T00:00:00Z"
      );
      expect(zeroElapsed.ownerReviewEligible).toBe(false);
      expect(zeroElapsed.automaticDeletionAllowed).toBe(false);
    });

    it("owner-configured without a positive duration fails closed", () => {
      const missing: RetentionPolicy = {
        category: "INCIDENT_EVIDENCE",
        status: "OWNER_CONFIGURED",
      };
      expect(
        evaluateRetention("INCIDENT_EVIDENCE", missing, "2020-01-01T00:00:00Z", "2026-01-01T00:00:00Z")
          .ownerReviewEligible
      ).toBe(false);

      const zero: RetentionPolicy = {
        category: "INCIDENT_EVIDENCE",
        status: "OWNER_CONFIGURED",
        ownerConfiguredDurationDays: 0,
      };
      expect(
        evaluateRetention("INCIDENT_EVIDENCE", zero, "2020-01-01T00:00:00Z", "2026-01-01T00:00:00Z")
          .ownerReviewEligible
      ).toBe(false);

      const negative: RetentionPolicy = {
        category: "INCIDENT_EVIDENCE",
        status: "OWNER_CONFIGURED",
        ownerConfiguredDurationDays: -5,
      };
      expect(
        evaluateRetention("INCIDENT_EVIDENCE", negative, "2020-01-01T00:00:00Z", "2026-01-01T00:00:00Z")
          .ownerReviewEligible
      ).toBe(false);
    });

    it("fails closed on category mismatch, without throwing", () => {
      const policy: RetentionPolicy = {
        category: "EMERGENCY_MEDICAL",
        status: "OWNER_CONFIGURED",
        ownerConfiguredDurationDays: 10,
      };
      const result = evaluateRetention("SAFEGUARDING", policy, "2020-01-01T00:00:00Z", "2026-01-01T00:00:00Z");
      expect(result.ownerReviewEligible).toBe(false);
      expect(result.automaticDeletionAllowed).toBe(false);
    });

    it("fails closed on invalid or hostile timestamps", () => {
      const policy: RetentionPolicy = {
        category: "SAFEGUARDING",
        status: "OWNER_CONFIGURED",
        ownerConfiguredDurationDays: 10,
      };
      expect(evaluateRetention("SAFEGUARDING", policy, "not-a-date", "2026-01-01T00:00:00Z").ownerReviewEligible).toBe(
        false
      );
      expect(evaluateRetention("SAFEGUARDING", policy, "2026-01-01T00:00:00Z", "").ownerReviewEligible).toBe(false);
      expect(
        evaluateRetention("SAFEGUARDING", policy, "2026-01-10T00:00:00Z", "2026-01-01T00:00:00Z").ownerReviewEligible
      ).toBe(false); // asOf before retainedAt
    });

    it("fails closed for a hostile category cast through unknown", () => {
      const policy: RetentionPolicy = {
        category: "SAFEGUARDING",
        status: "OWNER_CONFIGURED",
        ownerConfiguredDurationDays: 10,
      };
      const result = evaluateRetention(
        "constructor" as unknown,
        policy,
        "2020-01-01T00:00:00Z",
        "2026-01-01T00:00:00Z"
      );
      expect(result.ownerReviewEligible).toBe(false);
      expect(result.automaticDeletionAllowed).toBe(false);
    });

    it("never returns automaticDeletionAllowed: true for any input", () => {
      const inputs: Array<[unknown, RetentionPolicy, string, string]> = [
        [
          "WAIVER_EVIDENCE",
          { category: "WAIVER_EVIDENCE", status: "OWNER_CONFIGURED", ownerConfiguredDurationDays: 1 },
          "2000-01-01T00:00:00Z",
          "2026-01-01T00:00:00Z",
        ],
        [
          "EMERGENCY_MEDICAL",
          { category: "EMERGENCY_MEDICAL", status: "PENDING_LEGAL_AND_INSURANCE_ADVICE" },
          "2000-01-01T00:00:00Z",
          "2026-01-01T00:00:00Z",
        ],
      ];
      for (const [category, policy, retainedAt, asOf] of inputs) {
        expect(evaluateRetention(category, policy, retainedAt, asOf).automaticDeletionAllowed).toBe(false);
      }
    });
  });
});
