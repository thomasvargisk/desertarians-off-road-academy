import { HeroSection } from "@/components/hero";
import { FeaturesGrid } from "@/components/features";
import { RecentDrives } from "@/components/recent-drives";
import { CovenantCard } from "@/components/covenant";

export default function HomePage() {
  return (
    <section className="min-h-screen">
      <HeroSection />
      <main className="py-12">
        <FeaturesGrid />
      </main>
      <div className="py-12 bg-desert-card border-t border-border">
        <CovenantCard />
      </div>
      <RecentDrives />
    </section>
  );
}