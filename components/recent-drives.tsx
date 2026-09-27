export const RecentDrives = () => (
  <section className="max-w-7xl mb-12">
    <h2 className="font-display font-bold text-4xl md:text-5xl mb-6 tracking-title">
      Upcoming Drives
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <article className="group bg-desert-card border border-desert-border rounded-lg p-6 hover:border-desert-accent transition-colors">
        <h3 className="font-display font-semibold text-lg mb-2">Wadi Exploration</h3>
        <p className="text-desert-muted text-sm">
          Representative public area — exact meeting point released to confirmed RSVP.
        </p>
      </article>
      <article className="group bg-desert-card border border-desert-border rounded-lg p-6 hover:border-desert-accent transition-colors">
        <h3 className="font-display font-semibold text-lg mb-2">Dune Challenge</h3>
        <p className="text-desert-muted text-sm">
          Representative public area — exact meeting point released to confirmed RSVP.
        </p>
      </article>
      <article className="group bg-desert-card border border-desert-border rounded-lg p-6 hover:border-desert-accent transition-colors">
        <h3 className="font-display font-semibold text-lg mb-2">Mountain Trail</h3>
        <p className="text-desert-muted text-sm">
          Representative public area — exact meeting point released to confirmed RSVP.
        </p>
      </article>
    </div>
  </section>
);