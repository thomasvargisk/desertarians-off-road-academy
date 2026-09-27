# ADR 0002: Claude and Codex are co-equal engineering authorities for this repository

- Status: Proposed
- Date: 2026-09-27
- Decision owners: Thomas (owner authorization pending explicit confirmation)

## Context

Desertarians is being developed with Claude Code and Codex both doing senior engineering work
(architecture review, documentation reconciliation, dispatching and reviewing bounded external
workers), following a pattern already established and recorded for a separate, unrelated platform
(ENFITEK's ADR 0025, "Claude Code and Codex are co-equal senior engineering authorities"). That
arrangement was never recorded for this repository specifically — it was only referenced
informally in conversation. This ADR closes that gap.

ENFITEK's ADR 0025 is cited below as precedent for the shape of the arrangement. It is not
governing law over this repository: Desertarians is an independent codebase and product, and this
ADR is the actual decision for it.

## Decision

- **Co-equal engineering authority.** Claude Code and Codex are co-equal senior engineering
  authorities for this repository. Either may independently audit, design, implement, test,
  correct, and authorize repository changes. Either may do the work; neither is a required
  reviewer of the other, and neither gates the other's routine work.
- **External workers are junior, not authorities.** Approved external workers (currently: Kimi K3
  and other NVIDIA-hosted free-tier models, and OpenCode Zen's Big Pickle) may be dispatched by
  either authority for bounded work. The dispatching authority reviews every material output and
  diff, reruns the relevant gates, and remains solely responsible for acceptance. A worker's output
  is not treated as done until a senior authority accepts it.
- **Owner remains final authority.** Thomas is the final authority for commercial decisions,
  product scope, and any legal/compliance/safety judgment call this repository's documents flag as
  an open owner decision (see `docs/ARCHITECTURE.md` §13). Neither Claude nor Codex may resolve one
  of those on the owner's behalf, waive a safety-sequencing rule (see `AGENTS.md`), or assert a
  legal conclusion in place of qualified UAE legal/insurance advice.
- **Peer review.** The peer-review step for a change is satisfied by either: the other co-equal
  authority's independent review, or an accepted external-worker review that a senior authority
  has verified rather than merely relayed.

## Consequences

- Routine engineering work on this repository does not wait on both Claude and Codex being
  available at once — either may proceed, and correctness is checked by re-verification (running
  the actual gates, reading the actual diff) rather than by requiring simultaneous presence.
- `AGENTS.md` points to this ADR as the current engineering-authority statement for this
  repository.
- This ADR does not transfer any owner/business authority. It only assigns engineering authority
  between Claude and Codex, and clarifies that external workers are junior contributors.

## Alternatives considered

- **Leave the arrangement informal, inherited by reference from ENFITEK's ADR 0025.** Rejected:
  ADR 0025 governs a different, unrelated repository; treating it as binding here without a local
  record would let a future reader assume a decision was made for this project that never actually
  was.
- **Make one of Claude or Codex the sole authority.** Rejected: the audit-and-recovery pattern
  already exercised on this repository (one authority does work, the other independently
  re-verifies it) has caught real defects a single authority's own self-review did not surface;
  co-equal review is the more reliable default at this project's current size.

## Evidence

- ENFITEK `governance/adr/0025-restore-codex-co-engineering-authority.md` — precedent for the
  co-equal-authority shape, not governing law over this repository.
- This repository's own audit history: the 2026-09-27 architecture review
  (`docs/reviews/2026-09-27-claude-architecture-review.md`) and the follow-up implementation audit
  (recorded in conversation, not yet a committed file) both demonstrated the value of one authority
  independently re-verifying the other's or a worker's claimed progress before accepting it.
