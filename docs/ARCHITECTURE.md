# Desertarians architecture proposal

- Status: Proposed
- Date: 2026-09-27
- Product: Desertarians Off Road Academy

## 1. Product boundary

Desertarians is a safety-led academy, off-road club, and camping-group operations platform with a
community layer. Its primary job is to move a member safely through this lifecycle:

```text
Discover -> Join -> Register vehicle -> Complete prerequisites -> Book drive
         -> Check in -> Participate -> Receive assessment -> Progress
         -> Support others -> Qualify for leadership
```

Members may also join the camping group and participate in campouts. Camping uses the shared
event, registration, safety, media, and notification capabilities, while retaining camping-specific
planning such as campsite details, equipment, overnight attendance, and fire/cooking rules.

The platform supports four principal actors:

- **Member:** learns, registers vehicles, books drives, completes briefings, and tracks progress.
- **Instructor or marshal:** plans drives, checks eligibility, assigns convoy roles, assesses
  members, and records safety observations.
- **Community moderator:** manages discussions, knowledge, media, marketplace, and conduct.
- **Administrator:** controls memberships, policies, payments, permissions, and audit review.

## 2. Architecture decision

Start with a **modular monolith** consisting of one web application, one transactional database,
one job/notification worker, and object storage. Keep module contracts explicit so high-load or
specialized capabilities can be extracted later without paying distributed-system costs early.

The client product is simultaneously a browser platform and an installable app: one responsive
Next.js application must support all core journeys in standards-based browsers and expose PWA
installation/app-like behavior where the operating system supports it. Neither channel is a
secondary projection of the other; they share the same application, contracts, permissions, and
data. A separate native iOS or Android codebase is not required for the initial platform and may
be considered later only if evidence shows the PWA cannot satisfy an approved requirement. See
ADR 0003.

```text
 Web/PWA clients
       |
 Edge/CDN/WAF
       |
 Application API + server-rendered web
       |
 +---------------------------------------------------------------+
 | Identity | Membership | Academy | Vehicles | Drives  | Safety |
 | Convoys  | Camping    | Community | Media | Commerce | Admin |
 | Notifications                                                  |
 +---------------------------------------------------------------+
       |                    |                    |
 PostgreSQL            Object storage       Job queue
       |                    |                    |
 Audit/outbox -------- integrations -------- notifications
```

## 3. Proposed technology stack

### Application

- **Browser and installable app:** one Next.js application with TypeScript, React, server
  rendering, responsive layouts, a web app manifest, installable PWA behavior on supported
  devices, and deliberately scoped offline behavior. Every core journey remains available in a
  normal browser without requiring installation.
- **API:** typed route handlers/server services inside the modular monolith; OpenAPI emitted for
  future mobile or partner clients.
- **Database:** PostgreSQL with PostGIS for geospatial filtering and restricted route geometry.
- **Data access:** Drizzle ORM or Prisma, with SQL migrations committed to the repository.
- **Jobs:** a durable queue for email, push, WhatsApp, reminders, media processing, and outbox
  delivery. The business transaction commits before external delivery begins.
- **Media:** S3-compatible object storage with signed uploads, malware scanning, metadata removal,
  image derivatives, and CDN delivery.
- **Search:** PostgreSQL full-text search initially; move to a dedicated search engine only when
  corpus size or relevance needs justify it.
- **Maps:** provider-neutral map abstraction with server-controlled access to sensitive route data.
- **Observability:** structured logs, tracing, error reporting, audit events, and service-level
  dashboards.

### Deployment

- Containerized application and worker.
- Managed PostgreSQL with encrypted backups and point-in-time recovery.
- CDN/WAF in front of all public traffic.
- Separate development, staging, and production environments.
- Infrastructure expressed as code after the hosting target is selected.

No cloud provider is selected by this proposal. That decision should account for UAE data,
payments, messaging, support, and operational costs.

## 4. Bounded modules

### Identity and access

Owns accounts, sessions, MFA, verified contact methods, roles, permissions, consent, and account
recovery. Authorization is server-side and scoped by club/academy role.

### Membership and subscriptions

Owns plans, subscription state, joining prerequisites, membership status, freezes, cancellations,
and payment-provider references. It never stores card data.

### Member profile

Owns public biography, language, experience, achievements, visibility settings, and private
emergency-contact references. Public and operational profile projections are deliberately
separate.

### Vehicle garage

Owns vehicles, tyres, modifications, recovery points, equipment, inspections, limitations, and
readiness declarations. A member may own multiple vehicles but selects one vehicle per drive.

Vehicle readiness has two deliberately separate records: a **member readiness attestation**
(self-declared, versioned, and expiring, owned by this module) and a **marshal event-day
verification** (an independent in-person check against the event's equipment policy, recorded per
drive by a qualified marshal before departure). Self-attestation alone never satisfies an event's
readiness requirement.

### Academy

Owns curriculum, learning modules, skills, prerequisites, completion evidence, assessments,
instructor comments, and the member skills passport. It also owns the instructor/marshal
qualification lifecycle: role, certification level, issue and expiry dates, renewal requirements,
background-check status, and availability. A `QUALIFIED -> CURRENT -> EXPIRING -> SUSPENDED/EXPIRED`
state machine governs who may instruct, verify vehicles, or marshal an event; the platform may
surface impending expiries but a qualified human approves grant, renewal, and suspension.

### Progression

Owns rank definitions, rank requirements, promotion candidates, evidence bundles, and promotion
decisions. The system may calculate eligibility; a qualified human approves safety-relevant
promotion.

### Drives and events

Owns event publication, terrain/difficulty, approximate public area, restricted meeting point and
route, capacity, eligibility policy, RSVP, waitlist, cancellation, attendance, and post-drive
closure.

### Convoy operations

Owns participant order, roles, radio channel, briefing pack, check-in state, late withdrawal, and
organizer notes. Convoy changes remain auditable.

### Camping groups and campouts

Owns camping-group membership, campout planning, campsite information, overnight attendance,
participant and household/tent groupings, equipment checklists, shared-equipment assignments,
camping guidance, and site-specific fire, cooking, waste, and quiet-time rules. A campout may be
linked to a drive but remains a distinct activity so camping-only events do not require a convoy or
academy eligibility model. Exact campsite coordinates follow the same restricted-access rules as
drive meeting points. Campout organizers do not declare equipment, weather, terrain, or a site
safe automatically; accountable humans approve plans and go/no-go decisions.

### Safety and incidents

Owns acknowledgements, waivers, emergency readiness, incident reports, restricted evidence,
follow-up actions, and safeguarding records and escalation (including guardian/consent handling
for minors). It does not publish sensitive safety records to the community layer.

Waivers are **versioned legal documents**: each published `WaiverVersion` is immutable, and each
`WaiverAcceptance` binds a member (or guardian) to a specific immutable version with timestamp and
evidence. Changing waiver wording creates a new version and triggers re-acceptance; existing
acceptances never silently carry over.

Incident, waiver, and safeguarding retention is a **configurable duration per information class,
set by the owner pending UAE legal and insurance advice**. No fixed retention period is asserted
by this proposal; the default disposition before advice is obtained is retain, never auto-delete.

### Community and knowledge

Owns forums, topics, replies, reactions, follows, reports, academy articles, tags, and moderation.
Policy and academy knowledge are distinguished from member opinion.

### Media

Owns albums, uploads, consent/visibility, derivatives, and moderation. It must support members who
opt out of public event photography.

### Marketplace

Owns member listings, categories, location, price, status, reports, and moderation. Payments and
delivery remain between members in the initial release.

### Notifications

Owns notification preferences, templates, delivery attempts, and provider adapters for email,
web push, and approved WhatsApp messaging. Domain modules emit events rather than calling
providers directly.

### Administration and audit

Owns policy configuration, moderation queues, exports, operational dashboards, and the append-only
audit trail. Administrative actions require reasons where they affect access, rank, safety, or
money.

## 5. Core domain model

```text
User 1---1 MemberProfile
User 1---* Membership
User 1---* Vehicle

AcademyLevel 1---* SkillRequirement
User 1---* SkillEvidence
User 1---* Assessment
User 1---* PromotionDecision

DriveEvent 1---* Registration
Registration *---1 User
Registration *---1 Vehicle
DriveEvent 1---1 ConvoyPlan
ConvoyPlan 1---* ConvoyAssignment
DriveEvent 1---* Attendance
DriveEvent 1---* SafetyAcknowledgement
DriveEvent 1---* Incident
WaiverVersion 1---* WaiverAcceptance
WaiverAcceptance *---1 User

CampingGroup 1---* CampingMembership
CampingGroup 1---* Campout
Campout 1---* CampoutRegistration
Campout 1---* EquipmentRequirement
Campout 1---* SharedEquipmentAssignment
Campout 0..1---1 DriveEvent

Forum 1---* Topic 1---* Reply
User 1---* MediaAsset
User 1---* MarketplaceListing
```

Important state machines:

- Membership: `PENDING -> ACTIVE -> FROZEN/CANCELLED/EXPIRED`
- Registration: `REQUESTED -> ELIGIBLE -> CONFIRMED -> WAITLISTED/WITHDRAWN -> ATTENDED/NO_SHOW`
- Drive: `DRAFT -> PUBLISHED -> LOCKED -> IN_PROGRESS -> COMPLETED/CANCELLED`
- Assessment: `DRAFT -> SUBMITTED -> REVIEWED -> ACCEPTED/RETURNED`
- Promotion: `NOT_ELIGIBLE -> ELIGIBLE -> NOMINATED -> APPROVED/DECLINED`
- Incident: `OPEN -> TRIAGED -> ACTIONED -> CLOSED`
- Campout: `DRAFT -> PUBLISHED -> LOCKED -> IN_PROGRESS -> COMPLETED/CANCELLED`
- Waiver: `DRAFT -> PUBLISHED -> SUPERSEDED/RETIRED`; Acceptance: `PENDING -> ACCEPTED -> SUPERSEDED`
- Instructor/marshal qualification: `CANDIDATE -> QUALIFIED -> CURRENT -> EXPIRING -> SUSPENDED/EXPIRED`
- Campout registration: `REQUESTED -> CONFIRMED -> WAITLISTED/WITHDRAWN -> ATTENDED/NO_SHOW`

Transitions are performed by domain services, not arbitrary database updates.

## 6. Event-driven integration

Persist domain events in a transactional outbox. Examples:

- `MemberJoined`
- `SubscriptionActivated`
- `VehicleReadinessChanged`
- `DrivePublished`
- `RegistrationWaitlisted`
- `WaitlistPlaceOffered`
- `DriveLocked`
- `CampoutPublished`
- `CampoutRegistrationConfirmed`
- `CampoutPlanLocked`
- `AttendanceRecorded`
- `AssessmentAccepted`
- `PromotionApproved`
- `IncidentOpened`

Consumers update read models and send notifications idempotently. External provider failures do
not roll back academy or drive records.

## 7. Security, privacy, and safety

- Exact meeting points and route geometry are restricted to eligible confirmed participants and
  authorized organizers, with time-aware release where needed.
- Exact campsite coordinates and access instructions are restricted to confirmed participants and
  authorized organizers; public discovery uses only a generalized area.
- Emergency contacts, licences, waivers, assessments, and incidents are private operational data.
- Authentication supports MFA for organizers and administrators.
- Every privileged action is authorized server-side and audit logged.
- Uploads use signed URLs, content/type limits, malware scanning, and image metadata stripping.
- Rate limits, bot protection, abuse reports, marketplace controls, and moderator tooling are
  first-release requirements, not later polish.
- Payment card data remains with a compliant payment provider.
- Backups are encrypted and restoration is tested.
- Retention/deletion schedules are defined per information class.
- No AI-generated recommendation may promote a member, declare a vehicle safe, classify an
  incident, or replace a marshal's judgment.

## 8. Public versus restricted geospatial data

Use three distinct representations:

1. **Public area:** emirate/general destination used for discovery and SEO.
2. **Participant meeting point:** released only to confirmed eligible participants.
3. **Operational route:** restricted to organizers or released under explicit event policy.

Never derive the public view by merely hiding map controls around an exact coordinate. Generate a
separate generalized public geometry on the server.

## 9. User experience architecture

### Public

- Academy proposition and safety approach
- Upcoming drives with safe approximate locations
- Curriculum and progression explanation
- Community knowledge and selected media
- Membership plans and onboarding

### Member workspace

- Next eligible drives
- Readiness blockers
- Vehicle status
- Learning and skills passport
- Registrations and waitlists
- Camping-group membership, upcoming campouts, and equipment/readiness checklists
- Notifications and community activity

### Organizer workspace

- Drive creation and eligibility preview
- Participant/waitlist management
- Convoy builder
- Briefing and check-in
- Attendance and assessments
- Incident and post-drive closure
- Campout planning, participant groups, shared equipment, attendance, and site briefing

### Administration

- Membership and payments
- Roles and permissions
- Academy/rank policy
- Moderation queues
- Safety cases
- Audit and operational analytics

## 10. API and contract principles

- Stable external identifiers use UUID/ULID values; database sequence keys remain internal.
- Every mutation has an idempotency strategy where retry is plausible.
- Time is stored in UTC with the event's IANA timezone retained for display.
- Money uses integer minor units plus ISO currency.
- Measurements carry explicit units.
- Optimistic concurrency protects organizer-edited plans and promotions.
- APIs return typed problem details and never expose private fields through generic serialization.
- Contract tests protect payment, messaging, map, and identity provider adapters.

## 11. Scalability path

The modular monolith is expected to support the first several communities comfortably. Extract a
service only when measurements justify it. Likely future candidates are:

- media processing;
- search indexing;
- high-volume notifications;
- live event tracking, if explicitly introduced; and
- multi-tenant analytics.

Identity, membership, academy progression, and drive eligibility should remain transactionally
close until a proven scale constraint demands separation.

## 12. Quality strategy

- Unit tests for state machines and eligibility policies.
- Integration tests against PostgreSQL and the transactional outbox.
- Contract tests for external providers.
- Authorization matrix tests for sensitive resources.
- End-to-end tests for join, subscribe, register, waitlist, check-in, assess, and promote flows.
- Accessibility testing to WCAG 2.2 AA.
- Performance budgets for mobile pages and media.
- Restore, incident-response, and provider-failure exercises before launch.

## 13. Open owner decisions

Implementation should not start by inventing these choices:

1. Single academy only, or a future multi-club commercial platform?
2. English-only first release or English/Arabic from day one?
3. UAE payment provider and subscription/refund policy.
4. WhatsApp Business provider and approved message categories.
5. Hosting/data-residency preference.
6. Whether marketplace is in the MVP or the following release.
7. Whether exact routes are ever shared with members after a drive.
8. Required legal review for waivers, incidents, minors, media consent, and emergency information.
   **UAE Federal Decree-Law No. 45 of 2021 (PDPL)** is named as the data-protection framework that
   review must address — including its sensitive-data and cross-border-transfer provisions, given
   this platform holds precise location, emergency-contact, health-adjacent, and photographic data
   — together with incident/waiver retention durations. This proposal names the review subject
   only; it draws no legal conclusions and is not legal advice.
9. Whether camping is included in the base membership or has separate membership/fees.
10. Whether family members and minors may attend campouts, and under which consent and
    safeguarding policy.
