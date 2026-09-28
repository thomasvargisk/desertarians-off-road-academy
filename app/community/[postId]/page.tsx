import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPost, listReplies, createReply, deletePost, deleteReply, incrementViewCount } from "@/lib/forum/actions";

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = await getPost(postId);
  if (!post) notFound();
  await incrementViewCount(postId);

  const user = await getCurrentUser();
  const replies = await listReplies(postId);
  const canManagePost = Boolean(user) && (user!.id === post.authorId || user!.isAdmin);

  async function createReplyAction(formData: FormData) {
    "use server";
    if (!user) return;
    await createReply(user.id, postId, formData);
  }

  async function deletePostAction() {
    "use server";
    if (!user) return;
    await deletePost(user.id, user.isAdmin, postId);
    redirect("/community");
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <article className="bg-desert-card border border-desert-border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-display font-bold text-2xl">{post.title}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-desert-bg border border-desert-border text-desert-muted">
                {post.category}
              </span>
            </div>
            {canManagePost && (
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/community/${postId}/edit`}
                  className="text-xs rounded-md border border-desert-border px-2 py-1 hover:border-desert-accent"
                >
                  Edit
                </Link>
                <form action={deletePostAction}>
                  <button type="submit" className="text-xs rounded-md border border-red-800 text-red-400 px-2 py-1">
                    Delete
                  </button>
                </form>
              </div>
            )}
          </div>
          <p className="text-desert-fg whitespace-pre-wrap">{post.body}</p>
          <p className="text-xs text-desert-muted mt-4">
            <Link href={`/members/${post.authorId}`} className="hover:text-desert-accent">
              {post.authorName}
            </Link>{" "}
            &middot; {new Date(post.createdAt).toLocaleDateString()} &middot; {post.viewCount}{" "}
            {post.viewCount === 1 ? "view" : "views"}
            {post.editedAt && " · edited"}
          </p>
        </article>

        <h3 className="font-display font-semibold text-lg mb-3">
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </h3>

        <div className="space-y-3 mb-6">
          {replies.map((reply) => {
            const canManageReply = Boolean(user) && (user!.id === reply.authorId || user!.isAdmin);
            async function deleteReplyAction() {
              "use server";
              if (!user) return;
              await deleteReply(user.id, user.isAdmin, reply.id);
            }
            return (
              <div key={reply.id} className="bg-desert-card border border-desert-border rounded-lg p-4">
                <p className="text-desert-fg whitespace-pre-wrap">{reply.body}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-desert-muted">
                    <Link href={`/members/${reply.authorId}`} className="hover:text-desert-accent">
                      {reply.authorName}
                    </Link>{" "}
                    &middot; {new Date(reply.createdAt).toLocaleDateString()}
                    {reply.editedAt && " · edited"}
                  </p>
                  {canManageReply && (
                    <form action={deleteReplyAction}>
                      <button type="submit" className="text-xs text-red-400">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {user ? (
          <form action={createReplyAction} className="space-y-3 bg-desert-card border border-desert-border rounded-lg p-6">
            <textarea
              name="body"
              placeholder="Write a reply..."
              required
              rows={3}
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
            <button
              type="submit"
              className="font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-5 py-2"
            >
              Reply
            </button>
          </form>
        ) : (
          <p className="text-center text-desert-muted">
            <a href="/login" className="text-desert-accent hover:underline">
              Log in
            </a>{" "}
            to reply.
          </p>
        )}
      </main>
    </section>
  );
}
