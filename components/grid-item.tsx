export const GridItem = ({ title, desc }: { title: string; desc: string }) => (
  <div className="group bg-desert-card border border-desert-border rounded-lg p-6 hover:border-desert-accent transition-colors">
    <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
    <p className="text-desert-muted text-sm line-height-relax">{desc}</p>
  </div>
);