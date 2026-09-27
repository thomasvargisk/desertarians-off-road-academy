# Desertarians Off Road Academy

Desertarians is a mobile-first UAE off-road academy, camping group, and community platform for
learning, organizing safe drives and campouts, managing member progression, and operating
convoys.

The product is one responsive **browser and installable app platform**. Every core journey must
work in a normal web browser, and the same web application will provide Progressive Web App
(PWA) installation and app-like presentation on supported devices. Browser access is a primary
product experience, not a fallback for the installed app.

The product is intentionally broader than a forum. Community discussion remains important, but
the core system of record is structured academy and drive operations: members, vehicles, skills,
eligibility, events, attendance, safety, assessments, and promotions.

## Product promise

**Learn safely. Drive confidently. Explore together.**

Desertarians should match the useful community capabilities of established off-road sites while
improving the operational experience for members, instructors, marshals, and administrators.

## Repository status

Architecture proposal only. No production application has been scaffolded yet.

## Documents

- [Architecture proposal](docs/ARCHITECTURE.md)
- [Delivery roadmap](docs/ROADMAP.md)
- [Public review deployment](docs/DEPLOYMENT.md)
- [ADR 0001: modular monolith first](docs/adr/0001-modular-monolith-first.md)
- [ADR 0003: browser and installable PWA](docs/adr/0003-browser-and-installable-pwa.md)

## Proposed first release

1. Public academy and membership website.
2. Member registration and profiles.
3. Vehicle garage and readiness checklist.
4. Safety briefings, waivers, emergency details, and incident workflow.
5. Drive calendar, eligibility, RSVP, capacity, and waitlist.
6. Organizer dashboard and convoy builder.
7. Attendance, assessment, skills passport, and human-approved promotion.
8. Camping group, campout calendar, campsite access, equipment checklists, and camping guidance.
9. Community discussions and academy knowledge articles.

## Non-goals for the first release

- Automated driving-skill or safety decisions.
- Public disclosure of exact off-road routes or emergency information.
- A general social network unrelated to the academy.
- Native mobile applications before the responsive web/PWA product is proven.
