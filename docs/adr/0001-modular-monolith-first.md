# ADR 0001: Start as a modular monolith

- Status: Proposed
- Date: 2026-09-27
- Decision owners: Thomas (final owner/business authority); Claude and Codex (co-equal senior
  engineering authorities — see ADR 0002)

## Context

Desertarians needs tightly coordinated transactions across memberships, vehicle readiness, drive
eligibility, registrations, waitlists, convoy plans, attendance, assessments, and promotions. The
initial team and traffic do not justify independently deployed services, while premature service
boundaries would increase delivery, testing, data-consistency, and operational cost.

## Decision

Build one deployable web/API application with explicit domain modules, one PostgreSQL database,
one asynchronous worker, object storage, and a transactional outbox.

Modules may not read or write another module's tables directly. They collaborate through typed
application interfaces and domain events. Database migrations remain coordinated in one repository.

## Consequences

- Cross-module safety and event workflows can use ordinary transactions.
- Local development, testing, deployment, and incident response remain manageable.
- Module boundaries still prepare the codebase for selective extraction later.
- The team must enforce boundaries through code structure and architecture tests rather than
  relying on network separation.
- A service is extracted only after measured scale, isolation, or ownership needs justify it.

## Alternatives considered

- **Microservices from day one.** Rejected: deployment, distributed-transaction,
  data-consistency, and operational costs are unjustified at the initial team size and traffic;
  the safety-critical workflows (eligibility, registration, waitlist, promotion) are tightly
  transactionally coupled.
- **Single-framework monolith without explicit module boundaries.** Rejected: an unstructured
  monolith makes later selective extraction expensive and obscures ownership of sensitive modules
  (Safety, Media, Payments).
- **Serverless functions per capability.** Rejected: multiplies cold-start, orchestration, and
  local-development complexity before scale justifies it; module contracts are harder to enforce
  across function boundaries.

## Evidence

- Domain analysis of the twelve bounded modules in `docs/ARCHITECTURE.md` §4 shows predominantly
  cross-module transactional reads with low independent scale pressure.
- The transactional coupling across membership, vehicle readiness, drive eligibility,
  registrations, waitlists, convoy plans, attendance, assessments, and promotions (Context above)
  favours one database and ordinary transactions.
- Scale expectations for a single UAE academy (first release, per `docs/ROADMAP.md`) do not
  approach thresholds where measured extraction candidates (media, search, notifications — see
  `docs/ARCHITECTURE.md` §11) would become load-bearing.
- Peer review of 2026-09-27 (`docs/reviews/2026-09-27-claude-architecture-review.md` §5) finds the
  modular-monolith decision fits expected scale, with no objection to the core technical direction.

