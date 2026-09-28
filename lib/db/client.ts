import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Returns the D1 database binding for the current request. */
export async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

/** Returns the R2 bucket binding used for avatar uploads. */
export async function getAvatarBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return env.AVATARS;
}
