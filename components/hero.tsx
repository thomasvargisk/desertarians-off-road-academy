import { Button } from "@/components/ui/button";

export const HeroSection = () => (
  <header className="relative overflow-hidden bg-[radial-gradient(circle_at_75%_25%,rgba(245,158,11,0.32),transparent_32%),linear-gradient(145deg,#071a3d_0%,#0b3b73_52%,#8a4d08_100%)] py-20 md:py-24 lg:py-32">
    <div className="absolute inset-0 bg-black/20" aria-hidden="true" />

    <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
      <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl tracking-tight">
        Learn safely.{" "}
        <span className="text-desert-accent">. Drive confidently.{ " "}</span>
        {". Explore together."}
      </h1>

      <p className="mt-6 text-lg md:text-xl text-desert-muted max-w-2xl mx-auto">
        A mobile-first UAE off-road academy, camping group, and community platform for
        learning, organizing safe drives and campouts, managing member progression, and
        operating convoys.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          href="/membership"
          className="font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-6 py-3"
        >
          Review Membership
        </Button>

        <Button
          href="/academy"
          className="font-display font-medium border border-desert-muted text-desert-fg rounded-lg px-6 py-3"
        >
          Explore the Academy
        </Button>
      </div>
    </div>
  </header>
);
