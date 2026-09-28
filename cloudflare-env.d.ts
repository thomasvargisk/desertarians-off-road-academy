declare global {
  interface CloudflareEnv {
    DB: D1Database;
    AVATARS: R2Bucket;
  }
}

export {};
