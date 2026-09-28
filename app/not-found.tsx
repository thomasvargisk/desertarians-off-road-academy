import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg flex items-center justify-center">
      <div className="text-center p-6">
        <h1 className="font-display font-bold text-4xl mb-4">Lost in the dunes</h1>
        <p className="text-desert-muted mb-6">This page doesn&apos;t exist.</p>
        <Link href="/" className="text-desert-accent hover:underline">
          Back to home
        </Link>
      </div>
    </section>
  );
}
