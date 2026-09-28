import { redirect } from "next/navigation";
import { ThemeSettings } from "../../components/theme-settings";
import { getCurrentUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/members/actions";
import { updateProfile, changePassword, updateAvatar } from "@/lib/account/actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ profileError?: string; passwordError?: string; avatarError?: string; saved?: string }>;
}) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");
  const userId = sessionUser.id;
  const { profileError, passwordError, avatarError, saved } = await searchParams;
  const profile = getProfile(userId);

  async function updateProfileAction(formData: FormData) {
    "use server";
    const result = await updateProfile(userId, formData);
    if (!result.ok) {
      redirect(`/settings?profileError=${encodeURIComponent(result.error ?? "Update failed.")}`);
    }
    redirect("/settings?saved=profile");
  }

  async function changePasswordAction(formData: FormData) {
    "use server";
    const result = await changePassword(userId, formData);
    if (!result.ok) {
      redirect(`/settings?passwordError=${encodeURIComponent(result.error ?? "Update failed.")}`);
    }
    redirect("/settings?saved=password");
  }

  async function updateAvatarAction(formData: FormData) {
    "use server";
    const result = await updateAvatar(userId, formData);
    if (!result.ok) {
      redirect(`/settings?avatarError=${encodeURIComponent(result.error ?? "Upload failed.")}`);
    }
    redirect("/settings?saved=avatar");
  }

  return (
    <section className="mx-auto max-w-4xl py-8 px-4">
      <h1 className="mb-3 text-3xl font-semibold">Settings</h1>
      {saved && (
        <p className="mb-6 rounded-md bg-green-950/40 border border-green-800 text-green-200 text-sm px-4 py-3">
          Saved.
        </p>
      )}

      <div className="rounded-lg border border-desert-border bg-desert-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        {profileError && (
          <p className="mb-4 rounded-md bg-red-950/40 border border-red-800 text-red-200 text-sm px-3 py-2">
            {profileError}
          </p>
        )}
        <form action={updateProfileAction} className="space-y-3">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1">
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              defaultValue={profile?.displayName}
              required
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile?.bio ?? ""}
              rows={3}
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
          </div>
          <button type="submit" className="rounded-md bg-desert-accent text-desert-dark px-4 py-2 font-medium">
            Save profile
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-desert-border bg-desert-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Avatar</h2>
        {avatarError && (
          <p className="mb-4 rounded-md bg-red-950/40 border border-red-800 text-red-200 text-sm px-3 py-2">
            {avatarError}
          </p>
        )}
        <form action={updateAvatarAction} encType="multipart/form-data" className="space-y-3">
          <input
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp"
            required
            className="w-full text-sm text-desert-fg"
          />
          <button type="submit" className="rounded-md bg-desert-accent text-desert-dark px-4 py-2 font-medium">
            Upload avatar
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-desert-border bg-desert-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Password</h2>
        {passwordError && (
          <p className="mb-4 rounded-md bg-red-950/40 border border-red-800 text-red-200 text-sm px-3 py-2">
            {passwordError}
          </p>
        )}
        <form action={changePasswordAction} className="space-y-3">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
              Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
          </div>
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
          <button type="submit" className="rounded-md bg-desert-accent text-desert-dark px-4 py-2 font-medium">
            Change password
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-desert-border bg-desert-card p-6">
        <ThemeSettings />
      </div>
    </section>
  );
}
