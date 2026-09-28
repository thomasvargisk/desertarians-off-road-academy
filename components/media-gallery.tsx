import Image from "next/image";
import { listMedia, type MediaItem } from "@/lib/media/actions";
import type { SessionUser } from "@/lib/auth/session";

interface Props {
  entityType: string;
  entityId: string;
  user: SessionUser | null;
  uploadAction: (formData: FormData) => Promise<void>;
  deleteAction?: (mediaId: string) => () => Promise<void>;
}

export async function MediaGallery({ entityType, entityId, user, uploadAction, deleteAction }: Props) {
  const items: MediaItem[] = await listMedia(entityType, entityId);

  return (
    <div className="mt-8">
      <h3 className="font-display font-semibold text-lg mb-3">
        {items.length} {items.length === 1 ? "Photo" : "Photos"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-desert-muted mb-4">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {items.map((item) => {
            const canDelete = Boolean(user) && (user!.id === item.uploaderId || user!.isAdmin);
            return (
              <div key={item.id} className="bg-desert-card border border-desert-border rounded-lg p-2">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={item.url}
                    alt={`Photo uploaded by ${item.uploaderName}`}
                    width={400}
                    height={300}
                    unoptimized
                    className="w-full h-32 object-cover rounded-md"
                  />
                </a>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-desert-muted">{item.uploaderName}</p>
                  {canDelete && deleteAction && (
                    <form action={deleteAction(item.id)}>
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
      )}
      {user && (
        <form
          action={uploadAction}
          encType="multipart/form-data"
          className="space-y-2 bg-desert-card border border-desert-border rounded-lg p-4"
        >
          <input type="file" name="image" accept="image/png,image/jpeg,image/webp" className="text-sm text-desert-fg" />
          <button
            type="submit"
            className="block font-display font-medium bg-desert-accent text-desert-dark rounded-lg px-4 py-2 text-sm"
          >
            Upload photo
          </button>
        </form>
      )}
    </div>
  );
}
