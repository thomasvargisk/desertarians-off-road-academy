import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourse, hasUserEnrolled, enrollInCourse } from "@/lib/academy/actions";
import { createComment, deleteComment } from "@/lib/comments/actions";
import { CommentSection } from "@/components/comment-section";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = getCourse(id);
  if (!course) notFound();

  const user = await getCurrentUser();
  const alreadyEnrolled = user ? hasUserEnrolled(user.id, id) : false;
  const full = course.enrolled_count >= course.capacity;

  async function enrollAction() {
    "use server";
    if (!user) return;
    await enrollInCourse(user.id, id);
  }

  async function addCommentAction(formData: FormData) {
    "use server";
    if (!user) return;
    await createComment(user.id, "academy", id, formData, `/academy/${id}`);
  }

  function deleteCommentAction(commentId: string) {
    return async () => {
      "use server";
      if (!user) return;
      await deleteComment(user.id, user.isAdmin, commentId, `/academy/${id}`);
    };
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-desert-card border border-desert-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-2xl">{course.title}</h2>
            <span className="text-xs uppercase tracking-wide text-desert-accent">{course.level}</span>
          </div>
          <p className="text-desert-fg mb-4">{course.description}</p>
          <p className="text-sm text-desert-muted mb-6">
            Enrolled: {course.enrolled_count} / {course.capacity}
          </p>

          {!user && (
            <p className="text-center text-desert-muted">
              <a href="/login" className="text-desert-accent hover:underline">
                Log in
              </a>{" "}
              to enroll.
            </p>
          )}
          {user && alreadyEnrolled && (
            <p className="text-center text-desert-accent font-medium">You&apos;re enrolled in this course.</p>
          )}
          {user && !alreadyEnrolled && !full && (
            <form action={enrollAction}>
              <button
                type="submit"
                className="w-full font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-6 py-3"
              >
                Enroll
              </button>
            </form>
          )}
          {user && !alreadyEnrolled && full && (
            <p className="text-center text-desert-muted">This course is full.</p>
          )}
        </div>

        <CommentSection
          entityType="academy"
          entityId={id}
          user={user}
          addAction={addCommentAction}
          deleteAction={deleteCommentAction}
        />
      </main>
    </section>
  );
}
