import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPost, updatePost } from "@/lib/forum/actions";

export default async function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = getPost(postId);
  if (!post) notFound();

  const user = await getCurrentUser();
  if (!user || (user.id !== post.authorId && !user.isAdmin)) {
    redirect(`/community/${postId}`);
  }

  async function updatePostAction(formData: FormData) {
    "use server";
    if (!user) return;
    await updatePost(user.id, postId, formData);
    redirect(`/community/${postId}`);
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <h2 className="font-display font-bold text-3xl mb-6">Edit discussion</h2>
        <form action={updatePostAction} className="space-y-3 bg-desert-card border border-desert-border rounded-lg p-6">
          <input
            name="title"
            defaultValue={post.title}
            required
            className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
          />
          <textarea
            name="body"
            defaultValue={post.body}
            required
            rows={6}
            className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
          />
          <button
            type="submit"
            className="font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-5 py-2"
          >
            Save changes
          </button>
        </form>
      </main>
    </section>
  );
}
