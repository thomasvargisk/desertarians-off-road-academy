import { revalidatePath } from "next/cache";
import { getDb, getAvatarBucket } from "@/lib/db/client";

export interface MediaItem {
  id: string;
  url: string;
  uploaderId: string;
  uploaderName: string;
  createdAt: string;
}

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function listMedia(entityType: string, entityId: string): Promise<MediaItem[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT media.id as id, media.r2_key as r2_key, media.uploader_id as uploaderId,
              users.display_name as uploaderName, media.created_at as createdAt
       FROM media JOIN users ON users.id = media.uploader_id
       WHERE media.entity_type = ? AND media.entity_id = ?
       ORDER BY media.created_at DESC`
    )
    .bind(entityType, entityId)
    .all<{ id: string; r2_key: string; uploaderId: string; uploaderName: string; createdAt: string }>();
  return results.map((row) => ({
    id: row.id,
    url: `/api/media/${row.r2_key}`,
    uploaderId: row.uploaderId,
    uploaderName: row.uploaderName,
    createdAt: row.createdAt,
  }));
}

export async function listRecentMedia(limit = 20): Promise<(MediaItem & { entityType: string; entityId: string })[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT media.id as id, media.r2_key as r2_key, media.uploader_id as uploaderId,
              users.display_name as uploaderName, media.created_at as createdAt,
              media.entity_type as entityType, media.entity_id as entityId
       FROM media JOIN users ON users.id = media.uploader_id
       ORDER BY media.created_at DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<{
      id: string;
      r2_key: string;
      uploaderId: string;
      uploaderName: string;
      createdAt: string;
      entityType: string;
      entityId: string;
    }>();
  return results.map((row) => ({
    id: row.id,
    url: `/api/media/${row.r2_key}`,
    uploaderId: row.uploaderId,
    uploaderName: row.uploaderName,
    createdAt: row.createdAt,
    entityType: row.entityType,
    entityId: row.entityId,
  }));
}

export async function uploadMedia(
  userId: string,
  entityType: string,
  entityId: string,
  formData: FormData,
  revalidatePathValue: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "Only PNG, JPEG, or WEBP images are allowed." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be smaller than 5MB." };
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const mediaId = crypto.randomUUID();
  const key = `media/${entityType}/${entityId}/${mediaId}.${extension}`;

  const bucket = await getAvatarBucket();
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  const db = await getDb();
  await db
    .prepare("INSERT INTO media (id, entity_type, entity_id, r2_key, uploader_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(mediaId, entityType, entityId, key, userId, new Date().toISOString())
    .run();

  revalidatePath(revalidatePathValue);
  return { ok: true };
}

export async function deleteMedia(
  userId: string,
  isAdmin: boolean,
  mediaId: string,
  revalidatePathValue: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = await getDb();
  const media = await db
    .prepare("SELECT uploader_id as uploaderId, r2_key as r2Key FROM media WHERE id = ?")
    .bind(mediaId)
    .first<{ uploaderId: string; r2Key: string }>();
  if (!media) return { ok: false, error: "Not found." };
  if (media.uploaderId !== userId && !isAdmin) return { ok: false, error: "Not authorized." };

  const bucket = await getAvatarBucket();
  await bucket.delete(media.r2Key);
  await db.prepare("DELETE FROM media WHERE id = ?").bind(mediaId).run();
  revalidatePath(revalidatePathValue);
  return { ok: true };
}
