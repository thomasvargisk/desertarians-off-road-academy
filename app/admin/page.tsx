import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCommunityStats } from "@/lib/stats/actions";
import { listAllUsers } from "@/lib/admin/actions";
import { listPosts, deletePost } from "@/lib/forum/actions";
import { listListings, deleteListing } from "@/lib/marketplace/actions";

export default async function AdminPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || !sessionUser.isAdmin) redirect("/");
  const adminUserId = sessionUser.id;

  const [stats, users, { posts }, listings] = await Promise.all([
    getCommunityStats(),
    listAllUsers(),
    listPosts(),
    listListings(),
  ]);

  function deletePostAction(postId: string) {
    return async () => {
      "use server";
      await deletePost(adminUserId, true, postId);
    };
  }

  function deleteListingAction(listingId: string) {
    return async () => {
      "use server";
      await deleteListing(adminUserId, true, listingId);
    };
  }

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-6">Admin</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-desert-card border border-desert-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-desert-accent">{stats.totalMembers}</div>
            <div className="text-xs text-desert-muted">Members</div>
          </div>
          <div className="bg-desert-card border border-desert-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-desert-accent">{stats.totalDrives}</div>
            <div className="text-xs text-desert-muted">Drives</div>
          </div>
          <div className="bg-desert-card border border-desert-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-desert-accent">{stats.totalForumPosts}</div>
            <div className="text-xs text-desert-muted">Forum posts</div>
          </div>
          <div className="bg-desert-card border border-desert-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-desert-accent">{stats.totalMarketplaceListings}</div>
            <div className="text-xs text-desert-muted">Listings</div>
          </div>
        </div>

        <div className="bg-desert-card border border-desert-border rounded-lg p-6 mb-6">
          <h3 className="font-display font-semibold text-lg mb-4">Members ({users.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-desert-muted border-b border-desert-border">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Joined</th>
                  <th className="pb-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-desert-border last:border-0">
                    <td className="py-2 pr-4">
                      <Link href={`/members/${u.id}`} className="hover:text-desert-accent">
                        {u.displayName}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-desert-muted">{u.email}</td>
                    <td className="py-2 pr-4 text-desert-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      {u.isAdmin ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-desert-accent text-desert-dark font-bold">
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs text-desert-muted">Member</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-desert-card border border-desert-border rounded-lg p-6 mb-6">
          <h3 className="font-display font-semibold text-lg mb-4">Recent forum posts</h3>
          <div className="space-y-2">
            {posts.length === 0 && <p className="text-sm text-desert-muted">No posts yet.</p>}
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between gap-3 bg-desert-bg border border-desert-border rounded-lg p-3"
              >
                <div className="min-w-0">
                  <Link href={`/community/${post.id}`} className="font-medium hover:text-desert-accent truncate block">
                    {post.title}
                  </Link>
                  <p className="text-xs text-desert-muted">
                    {post.authorName} &middot; {post.category}
                  </p>
                </div>
                <form action={deletePostAction(post.id)}>
                  <button type="submit" className="text-xs shrink-0 rounded-md border border-red-800 text-red-400 px-2 py-1">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-desert-card border border-desert-border rounded-lg p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Marketplace listings</h3>
          <div className="space-y-2">
            {listings.length === 0 && <p className="text-sm text-desert-muted">No listings yet.</p>}
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between gap-3 bg-desert-bg border border-desert-border rounded-lg p-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/marketplace/${listing.id}`}
                    className="font-medium hover:text-desert-accent truncate block"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-xs text-desert-muted">
                    {listing.sellerName} &middot; AED {listing.price_aed}
                  </p>
                </div>
                <form action={deleteListingAction(listing.id)}>
                  <button type="submit" className="text-xs shrink-0 rounded-md border border-red-800 text-red-400 px-2 py-1">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </main>
    </section>
  );
}
