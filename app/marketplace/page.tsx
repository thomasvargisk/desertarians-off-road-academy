import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listListings, createListing } from "@/lib/marketplace/actions";

export default async function MarketplacePage() {
  const user = await getCurrentUser();
  const listings = listListings();

  async function createListingAction(formData: FormData) {
    "use server";
    if (!user) return;
    await createListing(user.id, formData);
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-6">Marketplace</h2>
        <p className="text-desert-muted text-center max-w-2xl mx-auto mb-8">
          Buy, sell, and trade off-road gear, parts, and vehicles with fellow members.
        </p>

        {user ? (
          <form
            action={createListingAction}
            className="mb-8 space-y-3 bg-desert-card border border-desert-border rounded-lg p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-2">List an item</h3>
            <input
              name="title"
              placeholder="Title"
              required
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
            <textarea
              name="description"
              placeholder="Description"
              required
              rows={3}
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
            <div className="flex gap-3">
              <input
                name="category"
                placeholder="Category (e.g. Tyres, Recovery gear, Vehicle)"
                required
                className="flex-1 rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
              />
              <input
                name="price"
                type="number"
                min="0"
                step="1"
                placeholder="Price (AED)"
                required
                className="w-40 rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
              />
            </div>
            <button
              type="submit"
              className="font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-5 py-2"
            >
              Publish listing
            </button>
          </form>
        ) : (
          <p className="mb-8 text-center text-desert-muted">
            <a href="/login" className="text-desert-accent hover:underline">
              Log in
            </a>{" "}
            to list an item.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.length === 0 && (
            <p className="text-center text-desert-muted col-span-full">No listings yet.</p>
          )}
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="block bg-desert-card border border-desert-border rounded-lg p-5 hover:border-desert-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-semibold text-lg">{listing.title}</h3>
                <span className="text-sm font-bold text-desert-accent">AED {listing.price_aed}</span>
              </div>
              <p className="text-desert-muted text-sm mb-2 line-clamp-2">{listing.description}</p>
              <p className="text-xs text-desert-muted">
                {listing.category} &middot; {listing.sellerName}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </section>
  );
}
