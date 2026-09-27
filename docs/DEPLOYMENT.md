# Public club-review deployment

This repository currently deploys as a public static Next.js export so Desertarians club members
can review the proposed website. It is not the operational membership platform.

## Cloudflare Pages settings

- Production branch: `main`
- Framework preset: Next.js (Static HTML Export), or no preset with the values below
- Build command: `npm run build`
- Build output directory: `out`
- Environment variables: none

Do not define `NEXT_PUBLIC_SUBSCRIPTION_PAYMENT_URL`. Joining, subscriptions, and payments are
unconditionally disabled in the review build.

The public preview discourages search indexing through `robots.txt` and `X-Robots-Tag`. Those
directives do not make the site private; anyone with the preview URL can open it.

## Promotion boundary

This build contains public-facing review pages and tested safety-domain code. It does not contain
production authentication, persistence, payments, or operational member workflows. Do not treat
successful publication as approval to operate live drives, campouts, subscriptions, or member
data through the application.
