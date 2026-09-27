# ADR 0003: Browser and installable PWA are one platform

- Status: Accepted
- Date: 2026-09-28
- Decision owner: Thomas

## Context

Members need Desertarians to work both in a normal browser and as an app-like experience on their
devices. Maintaining separate browser, iOS, and Android products at this stage would multiply
delivery, testing, accessibility, security, and operational effort while the core platform is
still being established.

## Decision

Desertarians is one responsive browser and installable app platform.

- Every core member, marshal, organizer, moderator, and administrator journey must work in a
  standards-based browser without requiring installation.
- The same Next.js application will expose Progressive Web App installation and app-like
  presentation on supported devices.
- Browser and installed-PWA use the same application, domain rules, API contracts, identity,
  authorization, and data.
- Offline behavior is capability-specific and explicit. PWA installation does not imply that
  every workflow works offline, especially safety-sensitive mutations or operations requiring
  current authorization data.
- A separate native iOS or Android application, native wrapper, or app-store distribution is a
  later evidence-based option, not part of the initial architecture commitment.

## Consequences

- Product requirements and acceptance tests must cover responsive browser use as a first-class
  experience.
- The delivery plan includes a web app manifest, appropriate icons, install behavior, update
  handling, and accessible responsive layouts.
- PWA-only APIs require browser capability detection and a usable browser fallback.
- Native applications are considered only when a documented requirement cannot be met adequately
  by the web/PWA platform and the owner approves the additional lifecycle cost.
