import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getListing, deleteListing } from "@/lib/marketplace/actions";
import { uploadMedia, deleteMedia } from "@/lib/media/actions";
import { MediaGallery } from "@/components/media-gallery";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing || listing.status !== "active") notFound();

  const user = await getCurrentUser();
  const canManage = Boolean(user) && (user!.id === listing.sellerId || user!.isAdmin);

  async function deleteAction() {
    "use server";
    if (!user) return;
    await deleteListing(user.id, user.isAdmin, id);
    redirect("/marketplace");
  }

  async function uploadMediaAction(formData: FormData) {
    "use server";
    if (!user) return;
    await uploadMedia(user.id, "marketplace", id, formData, `/marketplace/${id}`);
  }

  function deleteMediaAction(mediaId: string) {
    return async () => {
      "use server";
      if (!user) return;
      await deleteMedia(user.id, user.isAdmin, mediaId, `/marketplace/${id}`);
    };
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-desert-card border border-desert-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-3">
            <h2 className="font-display font-bold text-2xl">{listing.title}</h2>
            <span className="text-lg font-bold text-desert-accent shrink-0">AED {listing.price_aed}</span>
          </div>
          <p className="text-desert-fg mb-4 whitespace-pre-wrap">{listing.description}</p>
          <p className="text-sm text-desert-muted mb-6">Category: {listing.category}</p>
          <p className="text-sm text-desert-muted mb-4">
            Seller:{" "}
            <Link href={`/members/${listing.sellerId}`} className="text-desert-accent hover:underline">
              {listing.sellerName}
            </Link>
            . Contact via the forum or a club drive to arrange purchase.
          </p>

          {canManage && (
            <form action={deleteAction}>
              <button type="submit" className="text-sm rounded-md border border-red-800 text-red-400 px-3 py-2">
                Remove listing
              </button>
            </form>
          )}
        </div>

        <MediaGallery
          entityType="marketplace"
          entityId={id}
          user={user}
          uploadAction={uploadMediaAction}
          deleteAction={deleteMediaAction}
        />
      </main>
    </section>
  );
}
