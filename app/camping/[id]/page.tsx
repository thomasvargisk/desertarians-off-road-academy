import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTrip, hasUserRsvped, rsvpToTrip } from "@/lib/camping/actions";
import { createComment, deleteComment } from "@/lib/comments/actions";
import { uploadMedia, deleteMedia } from "@/lib/media/actions";
import { CommentSection } from "@/components/comment-section";
import { MediaGallery } from "@/components/media-gallery";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();

  const user = await getCurrentUser();
  const alreadyRsvped = user ? await hasUserRsvped(user.id, id) : false;
  const full = trip.rsvp_count >= trip.capacity;

  async function rsvpAction() {
    "use server";
    if (!user) return;
    await rsvpToTrip(user.id, id);
  }

  async function addCommentAction(formData: FormData) {
    "use server";
    if (!user) return;
    await createComment(user.id, "camping", id, formData, `/camping/${id}`);
  }

  function deleteCommentAction(commentId: string) {
    return async () => {
      "use server";
      if (!user) return;
      await deleteComment(user.id, user.isAdmin, commentId, `/camping/${id}`);
    };
  }

  async function uploadMediaAction(formData: FormData) {
    "use server";
    if (!user) return;
    await uploadMedia(user.id, "camping", id, formData, `/camping/${id}`);
  }

  function deleteMediaAction(mediaId: string) {
    return async () => {
      "use server";
      if (!user) return;
      await deleteMedia(user.id, user.isAdmin, mediaId, `/camping/${id}`);
    };
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-desert-card border border-desert-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-2xl">{trip.title}</h2>
            <span className="text-xs uppercase tracking-wide text-desert-accent">{trip.tier}</span>
          </div>
          <p className="text-desert-fg mb-4">{trip.description}</p>
          <dl className="text-sm text-desert-muted space-y-1 mb-6">
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

          {!user && (
            <p className="text-center text-desert-muted">
              <a href="/login" className="text-desert-accent hover:underline">
                Log in
              </a>{" "}
              to RSVP.
            </p>
          )}
          {user && alreadyRsvped && (
            <p className="text-center text-desert-accent font-medium">You&apos;re confirmed for this trip.</p>
          )}
          {user && !alreadyRsvped && !full && (
            <form action={rsvpAction}>
              <button
                type="submit"
                className="w-full font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-6 py-3"
              >
                RSVP for this trip
              </button>
            </form>
          )}
          {user && !alreadyRsvped && full && (
            <p className="text-center text-desert-muted">This trip is at capacity.</p>
          )}
        </div>

        <CommentSection
          entityType="camping"
          entityId={id}
          user={user}
          addAction={addCommentAction}
          deleteAction={deleteCommentAction}
        />

        <MediaGallery
          entityType="camping"
          entityId={id}
          user={user}
          uploadAction={uploadMediaAction}
          deleteAction={deleteMediaAction}
        />
      </main>
    </section>
  );
}
