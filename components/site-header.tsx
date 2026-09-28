import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logOutFormAction } from "@/lib/auth/actions";

const links = [
  ["Club Drives", "/drives"],
  ["Academy", "/academy"],
  ["Camping", "/camping"],
  ["Community", "/community"],
  ["Marketplace", "/marketplace"],
  ["Gallery", "/gallery"],
  ["Membership", "/membership"],
] as const;

function AccountLinks({ user }: { user: { id: string; displayName: string } | null }) {
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href={`/members/${user.id}`} className="text-sm font-bold text-slate-700 hover:text-desert-accent">
          Hi, {user.displayName}
        </Link>
        <form action={logOutFormAction}>
          <button type="submit" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold">
            Log out
          </button>
        </form>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold">
        Log in
      </Link>
      <Link href="/signup" className="rounded-md bg-desert-accent px-3 py-2 text-sm font-bold text-desert-dark">
        Sign up
      </Link>
    </div>
  );
}

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-950 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-5 px-4">
        <Link href="/" aria-label="Desertarians home" className="shrink-0">
          <Image
            src="/brand/dora-logo-transparent.png"
            alt="Desertarians Off Road Academy"
            width={1254}
            height={1254}
            className="h-16 w-auto"
            priority
          />
        </Link>
        <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-bold">
              {label}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link href="/admin" className="text-sm font-bold text-desert-accent">
              Admin
            </Link>
          )}
          <Link href="/settings" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold">
            Display settings
          </Link>
          <AccountLinks user={user} />
        </nav>
        <details className="group relative ml-auto md:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-slate-300 px-4 py-2 font-bold">
            Menu
          </summary>
          <nav className="absolute right-0 top-12 w-64 rounded-md border border-slate-200 bg-white p-3 shadow-xl" aria-label="Mobile navigation">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="block border-b border-slate-100 px-3 py-3 font-bold">
                {label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link href="/admin" className="block border-b border-slate-100 px-3 py-3 font-bold text-desert-accent">
                Admin
              </Link>
            )}
            <Link href="/settings" className="block border-b border-slate-100 px-3 py-3 font-bold">
              Display settings
            </Link>
            <div className="px-3 py-3">
              <AccountLinks user={user} />
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
