import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { listPosts, createPost, FORUM_CATEGORIES } from "@/lib/forum/actions";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}) {
  const { q, page: pageParam, category } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const user = await getCurrentUser();
  const { posts, totalCount } = await listPosts(q, page, category);
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  async function createPostAction(formData: FormData) {
    "use server";
    if (!user) return;
    await createPost(user.id, formData);
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-3xl mx-auto p-4 md:p-6">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-6">Community</h2>

        <form action="/community" method="GET" className="mb-6 flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search discussions..."
            className="flex-1 rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
          />
          <button
            type="submit"
            className="rounded-md border border-desert-border px-4 py-2 text-sm font-bold hover:border-desert-accent"
          >
            Search
          </button>
        </form>

        <nav className="mb-6 flex flex-wrap gap-2 text-sm">
          <Link
            href="/community"
            className={`rounded-md border px-3 py-1 ${
              !category || category === "All"
                ? "border-desert-accent text-desert-accent"
                : "border-desert-border text-desert-muted"
            }`}
          >
            All
          </Link>
          {FORUM_CATEGORIES.map((c) => (
            <a
              key={c}
              href={`/community?category=${encodeURIComponent(c)}`}
              className={`rounded-md border px-3 py-1 ${
                category === c ? "border-desert-accent text-desert-accent" : "border-desert-border text-desert-muted"
              }`}
            >
              {c}
            </a>
          ))}
        </nav>

        {user ? (
          <form
            action={createPostAction}
            className="mb-8 space-y-3 bg-desert-card border border-desert-border rounded-lg p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-2">Start a discussion</h3>
            <input
              name="title"
              placeholder="Title"
              required
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
            <textarea
              name="body"
              placeholder="What's on your mind?"
              required
              rows={3}
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            />
            <select
              name="category"
              defaultValue="General Discussions"
              className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
            >
              {FORUM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-5 py-2"
            >
              Post
            </button>
          </form>
        ) : (
          <p className="mb-8 text-center text-desert-muted">
            <a href="/login" className="text-desert-accent hover:underline">
              Log in
            </a>{" "}
            or{" "}
            <a href="/signup" className="text-desert-accent hover:underline">
              sign up
            </a>{" "}
            to start a discussion.
          </p>
        )}

        <div className="space-y-4">
          {posts.length === 0 && (
            <p className="text-center text-desert-muted">
              {q ? "No discussions match your search." : "No discussions yet -- be the first to post."}
            </p>
          )}
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="block bg-desert-card border border-desert-border rounded-lg p-5 hover:border-desert-accent transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-semibold text-lg">{post.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-desert-bg border border-desert-border text-desert-muted">
                  {post.category}
                </span>
              </div>
              <p className="text-desert-muted text-sm mt-1 line-clamp-2">{post.body}</p>
              <p className="text-xs text-desert-muted mt-3">
                {post.authorName} &middot; {new Date(post.createdAt).toLocaleDateString()} &middot; {post.replyCount}{" "}
                {post.replyCount === 1 ? "reply" : "replies"} &middot; {post.viewCount}{" "}
                {post.viewCount === 1 ? "view" : "views"}
                {post.editedAt && " · edited"}
              </p>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <nav className="mt-6 flex justify-center gap-2 text-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/community?${q ? `q=${encodeURIComponent(q)}&` : ""}${
                  category ? `category=${encodeURIComponent(category)}&` : ""
                }page=${p}`}
                className={`rounded-md border px-3 py-1 ${
                  p === page ? "border-desert-accent text-desert-accent" : "border-desert-border text-desert-muted"
                }`}
              >
                {p}
              </a>
            ))}
          </nav>
        )}
      </main>
    </section>
  );
}
