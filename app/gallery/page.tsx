import Image from "next/image";
import Link from "next/link";
import { listRecentMedia } from "@/lib/media/actions";

const ENTITY_PATH: Record<string, string> = {
  drive: "/drives",
  camping: "/camping",
  academy: "/academy",
  marketplace: "/marketplace",
};

const ENTITY_LABEL: Record<string, string> = {
  drive: "Club drive",
  camping: "Camping trip",
  academy: "Academy course",
  marketplace: "Marketplace listing",
};

export default async function GalleryPage() {
  const media = await listRecentMedia(40);

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-6">Gallery</h2>
        <p className="text-desert-muted text-center max-w-2xl mx-auto mb-8">
          Recent photos shared by members from drives, camping trips, academy courses, and the marketplace.
        </p>

        {media.length === 0 ? (
          <p className="text-center text-desert-muted">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {media.map((item) => {
              const path = ENTITY_PATH[item.entityType] ?? "/";
              return (
                <Link
                  key={item.id}
                  href={`${path}/${item.entityId}`}
                  className="block bg-desert-card border border-desert-border rounded-lg overflow-hidden hover:border-desert-accent transition-colors"
                >
                  <Image
                    src={item.url}
                    alt={`Photo uploaded by ${item.uploaderName}`}
                    width={300}
                    height={225}
                    unoptimized
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2">
                    <p className="text-xs text-desert-fg font-medium">{item.uploaderName}</p>
                    <p className="text-xs text-desert-muted">{ENTITY_LABEL[item.entityType] ?? item.entityType}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </section>
  );
}
