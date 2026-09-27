import Link from "next/link";

export default function CampingPage() {
  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <nav className="border-b border-border bg-desert-card py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display font-medium text-acenter text-2xl tracking-wider"
          >
            Desertarians
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/academy"
              className="text-desert-fg hover:text-desert-accent transition-colors"
            >
              Academy
            </Link>
            <Link
              href="/drives"
              className="text-desert-fg hover:text-desert-accent transition-colors"
            >
              Drives
            </Link>
            <Link
              href="/camping"
              className="text-desert-fg hover:text-desert-accent transition-colors"
            >
              Camping
            </Link>
            <Link
              href="/membership"
              className="text-desert-fg hover:text-desert-accent transition-colors"
            >
              Membership
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/thomasvargisk/desertarians-off-road-academy"
              target="_blank"
              rel="noopener"
              className="text-desert-muted hover:text-desert-accent transition-colors text-sm"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-6">
            Camping
          </h2>
          <p className="text-desert-muted text-center">
            Generalized desert camping areas for confirmed participants. Exact site
            locations are shared upon RSVP confirmation to protect the environment
            and ensure privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-desert-card border border-desert-border rounded-lg p-6">
            <h3 className="font-display font-semibold text-lg mb-2">Overnight Basic</h3>
            <p className="text-desert-muted text-sm">
              Designated camping areas with basic amenities for overnight stays.
              Site assignments released upon confirmation.
            </p>
          </div>

          <div className="bg-desert-card border-desert-border rounded-lg p-6">
            <h3 className="font-display font-semibold text-lg mb-2">Advanced Site</h3>
            <p className="text-desert-muted text-sm">
              More remote camping locations for experienced participants with
              proper equipment and preparation.
            </p>
          </div>

          <div className="bg-desert-card border-desert-border rounded-lg p-6">
            <h3 className="font-display font-semibold text-lg mb-2">Group Campouts</h3>
            <p className="text-desert-muted text-sm">
              Organized group campouts with briefings and go/no-go decisions by
              accountable marshals.
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-8 border-t border-border bg-desert-card py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
            <div className="col-span-1 md:col-span-2">
              <h4 className="font-display font-medium text-2xl mb-3">
                Desertarians
              </h4>
              <p className="text-desert-muted text-sm">
                Learn safely. Drive confidently. Explore together.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-sm mb-3">Navigation</h5>
              <ul className="text-desert-muted text-sm space-y-1">
                <li>
                  <Link href="/" className="hover:text-desert-accent transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <a href="/academy" className="hover:text-desert-accent transition-colors">
                    Academy
                  </a>
                </li>
                <li>
                  <a href="/drives" className="hover:text-desert-accent transition-colors">
                    Drives
                  </a>
                </li>
                <li>
                  <a href="/camping" className="hover:text-desert-accent transition-colors">
                    Camping
                  </a>
                </li>
                <li>
                  <a href="/membership" className="hover:text-desert-accent transition-colors">
                    Membership
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-sm mb-3">Company</h5>
              <ul className="text-desert-muted text-sm space-y-1">
                <li>
                  <a href="/membership" className="hover:text-desert-accent transition-colors">
                    Membership
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-sm mb-3">Connect</h5>
              <ul className="text-desert-muted text-sm space-y-1">
                <li>
                  <a
                    href="https://t.me/desertarians"
                    target="_blank"
                    rel="noopener"
                    className="hover:text-desert-accent transition-colors"
                  >
                    Telegram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center text-desert-muted text-xs">
            &copy; {new Date().getFullYear()} Desertarians Off Road Academy. All rights reserved.
          </div>
        </div>
      </footer>
    </section>
  );
}
