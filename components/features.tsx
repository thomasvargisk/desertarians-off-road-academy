import { GridItem } from "@/components/grid-item";

export const FeaturesGrid = () => (
  <section className="max-w-7xl mx-auto pb-12">
    <div className="mb-8">
      <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight">
        Why Desertarians over forum-first products
      </h2>
      <p className="mt-3 text-desert-muted text-sm">
        Structured progression, verified leaders, and safety-first operations — built for
        off-road accountability, not just discussion.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <GridItem
        title="Structured Progression"
        desc="A skills passport and curriculum that guides members from beginner to leader,
        with assessed promotions and evidence-based rank requirements."
      />

      <GridItem
        title="Verified Leaders"
        desc="Instructor and marshal certifications with background checks, renewal cycles,
        and capacity scheduling — not anonymous forum advice."
      />

      <GridItem
        title="Safety Records"
        desc="Versioned waivers, incident workflow, and emergency details that are auditable
        and retained per PDPL requirements — not buried in thread comments."
      />

      <GridItem
        title="Vehicle Readiness"
        desc="Garage with inspections, modifications, recovery points, and per-drive readiness
        declarations — marshal-verified before convoy departure."
      />

      <GridItem
        title="Private Locations"
        desc="Meeting points and routes restricted to confirmed participants, with three-tier
        geospatial data (public/participant/operational) — exact coordinates never exposed."
      />

      <GridItem
        title="Integrated Camping"
        desc="Campout planning with equipment checklists, site briefings, and go/no-go decisions
        by accountable humans — not a separate forum-driven process."
      />
    </div>
  </section>
);