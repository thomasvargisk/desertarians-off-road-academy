import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDrive, hasUserRsvped, rsvpToDrive } from "@/lib/drives/actions";
import { createComment, deleteComment } from "@/lib/comments/actions";
import { CommentSection } from "@/components/comment-section";

export default async function DriveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const drive = await getDrive(id);
  if (!drive) notFound();

  const user = await getCurrentUser();
  const alreadyRsvped = user ? await hasUserRsvped(user.id, id) : false;
  const full = drive.rsvp_count >= drive.capacity;

  async function rsvpAction() {
    "use server";
    if (!user) return;
    await rsvpToDrive(user.id, id);
  }

  async function addCommentAction(formData: FormData) {
    "use server";
    if (!user) return;
    await createComment(user.id, "drive", id, formData, `/drives/${id}`);
  }

  function deleteCommentAction(commentId: string) {
    return async () => {
      "use server";
      if (!user) return;
      await deleteComment(user.id, user.isAdmin, commentId, `/drives/${id}`);
    };
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-desert-card border border-desert-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-2xl">{drive.title}</h2>
            <span className="text-xs uppercase tracking-wide text-desert-accent">{drive.difficulty}</span>
          </div>
          <p className="text-desert-fg mb-4">{drive.description}</p>
          <dl className="text-sm text-desert-muted space-y-1 mb-6">
            <div className="flex justify-between">
              <dt>Date</dt>
              <dd>{drive.drive_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Public area</dt>
              <dd>{drive.public_area}</dd>
            </div>
            <div className="flex justify-between">
              <dt>RSVPs</dt>
              <dd>
                {drive.rsvp_count} / {drive.capacity}
              </dd>
            </div>
          </dl>

          {!user && (
            <p className="text-center text-desert-muted">
              <a href="/login" className="text-desert-accent hover:underline">
                Log in
              </a>{" "}
              to RSVP. Exact meeting point is released to confirmed participants only.
            </p>
          )}
          {user && alreadyRsvped && (
            <p className="text-center text-desert-accent font-medium">
              You&apos;re confirmed for this drive. The exact meeting point will be shared with you directly.
            </p>
          )}
          {user && !alreadyRsvped && !full && (
            <form action={rsvpAction}>
              <button
                type="submit"
                className="w-full font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-6 py-3"
              >
                RSVP for this drive
              </button>
            </form>
          )}
          {user && !alreadyRsvped && full && (
            <p className="text-center text-desert-muted">This drive is at capacity.</p>
          )}
        </div>

        <CommentSection
          entityType="drive"
          entityId={id}
          user={user}
          addAction={addCommentAction}
          deleteAction={deleteCommentAction}
        />
      </main>
    </section>
  );
}
