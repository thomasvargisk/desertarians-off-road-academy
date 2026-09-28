import Link from "next/link";
import { listComments, type Comment } from "@/lib/comments/actions";
import type { SessionUser } from "@/lib/auth/session";

interface Props {
  entityType: string;
  entityId: string;
  user: SessionUser | null;
  addAction: (formData: FormData) => Promise<void>;
  deleteAction?: (commentId: string) => () => Promise<void>;
}

export function CommentSection({ entityType, entityId, user, addAction, deleteAction }: Props) {
  const comments: Comment[] = listComments(entityType, entityId);

  return (
    <div className="mt-8">
      <h3 className="font-display font-semibold text-lg mb-3">
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h3>
      <div className="space-y-3 mb-4">
        {comments.map((comment) => {
          const canDelete = Boolean(user) && (user!.id === comment.authorId || user!.isAdmin);
          return (
            <div key={comment.id} className="bg-desert-card border border-desert-border rounded-lg p-4">
              <p className="text-desert-fg whitespace-pre-wrap">{comment.body}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-desert-muted">
                  <Link href={`/members/${comment.authorId}`} className="hover:text-desert-accent">
                    {comment.authorName}
                  </Link>{" "}
                  &middot; {new Date(comment.createdAt).toLocaleDateString()}
                </p>
                {canDelete && deleteAction && (
                  <form action={deleteAction(comment.id)}>
                    <button type="submit" className="text-xs text-red-400">
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {comments.length === 0 && <p className="text-sm text-desert-muted">No comments yet.</p>}
      </div>
      {user ? (
        <form action={addAction} className="space-y-2 bg-desert-card border border-desert-border rounded-lg p-4">
          <textarea
            name="body"
            placeholder="Add a comment..."
            required
            rows={2}
            className="w-full rounded-md bg-desert-bg border border-desert-border px-3 py-2 text-desert-fg"
          />
          <button
            type="submit"
            className="font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-4 py-2 text-sm"
          >
            Comment
          </button>
        </form>
      ) : (
        <p className="text-sm text-desert-muted">
          <a href="/login" className="text-desert-accent hover:underline">
            Log in
          </a>{" "}
          to comment.
        </p>
      )}
    </div>
  );
}
