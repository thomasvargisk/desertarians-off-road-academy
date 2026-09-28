import Link from "next/link";
import { listDrives } from "@/lib/drives/actions";

export default async function DrivesPage() {
  const drives = await listDrives();

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-6">
            Upcoming Drives
          </h2>
          <p className="text-desert-muted text-center">
            Public desert areas available for confirmed RSVP participants. Exact
            meeting points are released upon confirmation for safety and coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drives.map((drive) => (
            <article
              key={drive.id}
              className="group bg-desert-card border border-desert-border rounded-lg p-6 hover:border-desert-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-semibold text-lg">{drive.title}</h3>
                <span className="text-xs uppercase tracking-wide text-desert-accent">{drive.difficulty}</span>
              </div>
              <p className="text-desert-muted text-sm mb-3">{drive.description}</p>
              <dl className="text-sm text-desert-muted space-y-1 mb-4">
                <div className="flex justify-between">
                  <dt>Date</dt>
                  <dd>{drive.drive_date}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Public area</dt>
                  <dd>{drive.public_area}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>RSVPs</dt>
                  <dd>
                    {drive.rsvp_count} / {drive.capacity}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-desert-muted mb-3">
                Exact meeting point released to confirmed RSVP participants only.
              </p>
              <Link
                href={`/drives/${drive.id}`}
                className="inline-block text-sm font-medium text-desert-accent hover:underline"
              >
                View details &amp; RSVP &rarr;
              </Link>
            </article>
          ))}
        </div>
      </main>
    </section>
  );
}
