import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Desertarians Off Road Academy",
  description: "Mobile-first UAE off-road academy, camping group, and community platform for learning, organizing safe drives and campouts, managing member progression, and operating convoys.",
};

export default function RootLayout({
  children,
}: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("desertarians-color-scheme");if(t==="enfitek"||t==="dark"){document.documentElement.dataset.theme=t}else{delete document.documentElement.dataset.theme}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-desert-bg text-desert-fg antialiased">
        <nav className="border-b border-border bg-desert-card py-2">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <Link
              href="/"
              aria-label="Desertarians Off Road Academy home"
              className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-desert-accent"
            >
              <Image
                src="/brand/dora-logo-transparent.png"
                alt="Desertarians Off Road Academy"
                width={1254}
                height={1254}
                className="h-16 w-auto md:h-20"
                priority
              />
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
              <Link
                href="/settings"
                className="text-desert-fg hover:text-desert-accent transition-colors"
              >
                Settings
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
          {children}
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
      </body>
    </html>
  );
}
