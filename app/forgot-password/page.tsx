import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/lib/auth/passwordReset";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string }>;
}) {
  const { link } = await searchParams;

  async function requestResetAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const result = await requestPasswordReset(email);
    if (result.resetLink) {
      redirect(`/forgot-password?link=${encodeURIComponent(result.resetLink)}`);
    }
    redirect("/forgot-password?link=sent");
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-md mx-auto p-4 md:p-6">
        <h2 className="font-display font-bold text-3xl text-center mb-6">Reset your password</h2>

        {link && link !== "sent" && (
          <div className="mb-4 rounded-md bg-amber-950/40 border border-amber-800 text-amber-200 text-sm px-4 py-3">
            No email service is configured yet, so here is your reset link directly:
            <br />
            <a href={link} className="underline break-all">
              {link}
            </a>
          </div>
        )}
        {link === "sent" && (
          <p className="mb-4 rounded-md bg-desert-card border border-desert-border text-sm px-4 py-3">
            If that email has an account, a reset link has been generated.
          </p>
        )}

        <form
          action={requestResetAction}
          className="space-y-4 bg-desert-card border border-desert-border rounded-lg p-6"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
          </div>
          <button
            type="submit"
            className="w-full font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-6 py-3"
          >
            Send reset link
          </button>
        </form>
      </main>
    </section>
  );
}
