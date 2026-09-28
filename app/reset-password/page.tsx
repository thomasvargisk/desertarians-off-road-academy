import { redirect } from "next/navigation";
import { resetPassword } from "@/lib/auth/passwordReset";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token) {
    return (
      <section className="min-h-screen bg-desert-bg text-desert-fg">
        <main className="max-w-md mx-auto p-4 md:p-6 text-center">
          <p className="text-desert-muted">Missing reset token.</p>
        </main>
      </section>
    );
  }

  async function resetAction(formData: FormData) {
    "use server";
    const newPassword = String(formData.get("newPassword") ?? "");
    const result = resetPassword(token!, newPassword);
    if (!result.ok) {
      redirect(`/reset-password?token=${token}&error=${encodeURIComponent(result.error ?? "Reset failed.")}`);
    }
    redirect("/login?error=" + encodeURIComponent("Password updated. Please log in."));
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-md mx-auto p-4 md:p-6">
        <h2 className="font-display font-bold text-3xl text-center mb-6">Choose a new password</h2>

        {error && (
          <p className="mb-4 rounded-md bg-red-950/40 border border-red-800 text-red-200 text-sm px-4 py-3">
            {error}
          </p>
        )}

        <form action={resetAction} className="space-y-4 bg-desert-card border border-desert-border rounded-lg p-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
              New password (min. 8 characters)
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
          </div>
          <button
            type="submit"
            className="w-full font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-6 py-3"
          >
            Update password
          </button>
        </form>
      </main>
    </section>
  );
}
