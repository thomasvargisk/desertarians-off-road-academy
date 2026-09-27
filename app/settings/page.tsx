import { ThemeSettings } from "../../components/theme-settings";

export default function SettingsPage() {
  return (
    <section className="mx-auto max-w-4xl py-8">
      <h1 className="mb-3 text-3xl font-semibold">Settings</h1>
      <p className="mb-8 text-desert-muted">
        Personalize how Desertarians looks on this browser.
      </p>
      <div className="rounded-lg border border-desert-border bg-desert-card p-6">
        <ThemeSettings />
      </div>
    </section>
  );
}
