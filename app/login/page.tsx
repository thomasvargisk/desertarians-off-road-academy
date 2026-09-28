import { logInFormAction } from "@/lib/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-md mx-auto p-4 md:p-6">
        <h2 className="font-display font-bold text-3xl text-center mb-6">Log in</h2>

        {error && (
          <p className="mb-4 rounded-md bg-red-950/40 border border-red-800 text-red-200 text-sm px-4 py-3">
            {error}
          </p>
        )}

        <form action={logInFormAction} className="space-y-4 bg-desert-card border border-desert-border rounded-lg p-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg focus-visible:outline-2 focus-visible:outline-desert-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg focus-visible:outline-2 focus-visible:outline-desert-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-6 py-3"
          >
            Log in
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-desert-muted">
          New here?{" "}
          <a href="/signup" className="text-desert-accent hover:underline">
            Create an account
          </a>
        </p>
        <p className="mt-2 text-center text-sm text-desert-muted">
          <a href="/forgot-password" className="text-desert-accent hover:underline">
            Forgot your password?
          </a>
        </p>
      </main>
    </section>
  );
}
