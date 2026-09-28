import Link from "next/link";
import { listTrips } from "@/lib/camping/actions";

export default function CampingPage() {
  const trips = listTrips();

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-6">Camping</h2>
          <p className="text-desert-muted text-center">
            Generalized desert camping areas for confirmed participants. Exact site locations are
            shared upon RSVP confirmation to protect the environment and ensure privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="bg-desert-card border border-desert-border rounded-lg p-6 hover:border-desert-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-semibold text-lg">{trip.title}</h3>
                <span className="text-xs uppercase tracking-wide text-desert-accent">{trip.tier}</span>
              </div>
              <p className="text-desert-muted text-sm mb-3">{trip.description}</p>
              <dl className="text-sm text-desert-muted space-y-1 mb-4">
                <div className="flex justify-between">
                  <dt>Date</dt>
                  <dd>{trip.trip_date}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Public area</dt>
                  <dd>{trip.public_area}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>RSVPs</dt>
                  <dd>
                    {trip.rsvp_count} / {trip.capacity}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/camping/${trip.id}`}
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
