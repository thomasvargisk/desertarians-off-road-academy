# Delivery roadmap

## Phase 0 — decisions and foundation

- Confirm product ownership, target audience, languages, and commercial model.
- Approve privacy, safety, waiver, media-consent, and incident policies.
- Select hosting, identity, payments, maps, messaging, and analytics providers.
- Establish design system, threat model, environments, CI, and observability.
- Establish the responsive browser shell and installable PWA foundation from the same application,
  including manifest, icons, installation behavior, and an explicit offline-support boundary.

Exit: accepted architecture decisions and deployable application skeleton.

## Phase 1 — academy and drive MVP

- Public marketing and academy curriculum.
- Browser-complete responsive journeys with supported-device PWA installation; installation must
  never be required to join, learn, register, book, or administer through a browser.
- Authentication, member profile, membership, and subscriptions.
- **Safety foundations (prerequisite to any live drive or campout):** versioned waivers with
  per-version member acceptance and re-acceptance on change, emergency contact and medical
  details, safeguarding policy and escalation, and the incident report/triage/follow-up workflow
  with owner-configured retention pending UAE legal and insurance advice.
- *Bounded safety-domain foundation implemented as pure TypeScript domain module with unit tests; no UI, persistence, or live workflow yet.*
- Vehicle garage and member readiness attestation, with marshal event-day verification.
- Instructor/marshal qualification lifecycle and event authorization.
- Drive calendar, eligibility, RSVP, capacity, and waitlist.
- Camping group, basic campout calendar/registration, restricted campsite details, participant
  equipment checklist, and organizer site briefing.
- Organizer dashboard, convoy plan, briefing, and attendance.
- Skills passport, assessments, and human-approved promotions.
- Email/web notifications and baseline administration.

Exit: one academy has its waiver, emergency-details, safeguarding, and incident foundations live
and accepted by members, and can therefore operate real drives and basic group campouts safely —
no live drive or campout runs before those safety foundations are in place — without spreadsheets
or forum-only workflows.

## Phase 2 — community and content

- Forums, academy knowledge, reactions, following, and moderation.
- Galleries, media consent, and post-drive albums.
- Unified search and activity feed.
- Contributor recognition and member spotlights.
- Approved WhatsApp notifications.
- Expanded camping knowledge, trip reports, camp recipes, equipment discussions, and campout
  galleries.

Exit: community participation and academy operations share one identity and trustworthy data model.

## Phase 3 — operational advantage

- Map-first drive discovery.
- Mobile/PWA check-in and offline briefing pack.
- Advanced convoy builder and readiness alerts.
- Incident follow-up and safety analytics.
- Bilingual English/Arabic experience if not delivered earlier.
- Organizer capacity and academy progression analytics.

Exit: Desertarians is operationally stronger than forum-centric alternatives.

## Phase 4 — expansion

- Marketplace, merchandise, and partner offers.
- Additional academies/clubs if multi-tenancy is approved.
- Native mobile applications only if PWA evidence justifies them.
- Partner and public APIs.

## Initial backlog order

1. Identity and authorization.
2. Membership and subscription state.
3. Safety: versioned waivers/acceptances, emergency details, safeguarding, and incident workflow.
4. Member/vehicle readiness attestation and marshal event-day verification.
5. Instructor/marshal qualification lifecycle and authorization.
6. Academy levels and requirements.
7. Drive lifecycle and eligibility.
8. RSVP/waitlist concurrency and notifications.
9. Convoy operations and restricted geospatial data.
10. Camping group, campout lifecycle, campsite privacy, and equipment readiness.
11. Attendance, assessment, and promotion.
12. Community, knowledge, and media.
