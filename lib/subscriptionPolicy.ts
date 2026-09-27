export type UserRole = "MARSHAL" | "LEAD" | "SUPPORT_TEAM" | "MEMBER";

export type BillingState = "PAID" | "COMPLIMENTARY" | "UNPAID";

export interface Assignment {
  role: UserRole;
  verified: boolean;
  active: boolean;
}

export interface Subscription {
  billingState: BillingState;
  paymentConfirmation?: boolean;
}

export function isPaidAccessActive(subscription: Subscription): boolean {
  return subscription.paymentConfirmation === true;
}

export function isComplimentaryEligible(assignment: Assignment): boolean {
  const eligibleRoles: ReadonlySet<UserRole> = new Set([
    "MARSHAL",
    "LEAD",
    "SUPPORT_TEAM",
  ]);
  return assignment.verified === true && assignment.active === true && eligibleRoles.has(assignment.role);
}

export function getRoleFromAssignment(assignment: Assignment): UserRole | null {
  const eligibleRoles: ReadonlySet<UserRole> = new Set([
    "MARSHAL",
    "LEAD",
    "SUPPORT_TEAM",
  ]);
  return eligibleRoles.has(assignment.role) ? assignment.role : null;
}

export function getBillingStateFromSubscription(subscription: Subscription): BillingState {
  return subscription.billingState;
}

export function isRoleEligibleForComplimentary(role: UserRole): boolean {
  const eligibleRoles: ReadonlySet<UserRole> = new Set([
    "MARSHAL",
    "LEAD",
    "SUPPORT_TEAM",
  ]);
  return eligibleRoles.has(role);
}