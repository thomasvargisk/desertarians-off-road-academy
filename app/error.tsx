"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg flex items-center justify-center">
      <div className="text-center p-6">
        <h1 className="font-display font-bold text-4xl mb-4">Something went wrong</h1>
        <p className="text-desert-muted mb-6">Please try again.</p>
        <button
          onClick={() => reset()}
          className="rounded-md bg-desert-accent text-desert-dark px-5 py-2 font-medium"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
