import { describe, it, expect } from "vitest"
import {
  isPaidAccessActive,
  isComplimentaryEligible,
  getRoleFromAssignment,
  getBillingStateFromSubscription,
  isRoleEligibleForComplimentary,
  type UserRole,
} from "../lib/subscriptionPolicy"

describe("Subscription Policy", () => {
  describe("isPaidAccessActive", () => {
    it("returns true when paymentConfirmation is true", () => {
      expect(isPaidAccessActive({ billingState: "PAID", paymentConfirmation: true })).toBe(true)
    })

    it("returns false when paymentConfirmation is false", () => {
      expect(isPaidAccessActive({ billingState: "PAID", paymentConfirmation: false })).toBe(false)
    })

    it("returns false when paymentConfirmation is undefined", () => {
      expect(isPaidAccessActive({ billingState: "PAID" })).toBe(false)
    })
  })

  describe("isComplimentaryEligible", () => {
    it("returns true for verified MARSHAL assignment", () => {
      expect(
        isComplimentaryEligible({ role: "MARSHAL", verified: true, active: true })
      ).toBe(true)
    })

    it("returns true for verified LEAD assignment", () => {
      expect(
        isComplimentaryEligible({ role: "LEAD", verified: true, active: true })
      ).toBe(true)
    })

    it("returns true for verified SUPPORT_TEAM assignment", () => {
      expect(
        isComplimentaryEligible({ role: "SUPPORT_TEAM", verified: true, active: true })
      ).toBe(true)
    })

    it("returns false for unverified assignment", () => {
      expect(
        isComplimentaryEligible({ role: "MARSHAL", verified: false, active: true })
      ).toBe(false)
    })

    it("returns false for inactive assignment", () => {
      expect(
        isComplimentaryEligible({ role: "MARSHAL", verified: true, active: false })
      ).toBe(false)
    })

    it("returns false for non-eligible role MEMBER", () => {
      expect(
        isComplimentaryEligible({ role: "MEMBER", verified: true, active: true })
      ).toBe(false)
    })

    it("returns false for unknown role", () => {
      expect(
        isComplimentaryEligible({ role: "ADMIN" as UserRole, verified: true, active: true })
      ).toBe(false)
    })
  })

  describe("getRoleFromAssignment", () => {
    it("returns the role for eligible roles", () => {
      expect(getRoleFromAssignment({ role: "MARSHAL", verified: true, active: true })).toBe("MARSHAL")
      expect(getRoleFromAssignment({ role: "LEAD", verified: true, active: true })).toBe("LEAD")
      expect(getRoleFromAssignment({ role: "SUPPORT_TEAM", verified: true, active: true })).toBe("SUPPORT_TEAM")
    })

    it("returns null for ineligible role", () => {
      expect(getRoleFromAssignment({ role: "MEMBER", verified: true, active: true })).toBeNull()
    })
  })

  describe("getBillingStateFromSubscription", () => {
    it("returns PAID for PAID billing state", () => {
      expect(getBillingStateFromSubscription({ billingState: "PAID", paymentConfirmation: true })).toBe("PAID")
    })

    it("returns COMPLIMENTARY for COMPLIMENTARY billing state", () => {
      expect(getBillingStateFromSubscription({ billingState: "COMPLIMENTARY", paymentConfirmation: false })).toBe("COMPLIMENTARY")
    })

    it("returns UNPAID for UNPAID billing state", () => {
      expect(getBillingStateFromSubscription({ billingState: "UNPAID", paymentConfirmation: false })).toBe("UNPAID")
    })
  })

  describe("isRoleEligibleForComplimentary", () => {
    it("returns true for MARSHAL", () => {
      expect(isRoleEligibleForComplimentary("MARSHAL")).toBe(true)
    })

    it("returns true for LEAD", () => {
      expect(isRoleEligibleForComplimentary("LEAD")).toBe(true)
    })

    it("returns true for SUPPORT_TEAM", () => {
      expect(isRoleEligibleForComplimentary("SUPPORT_TEAM")).toBe(true)
    })

    it("returns false for MEMBER", () => {
      expect(isRoleEligibleForComplimentary("MEMBER")).toBe(false)
    })
  })
})