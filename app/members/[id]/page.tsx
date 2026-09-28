import Image from "next/image";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/members/actions";
import { getUserReputationScore } from "@/lib/reputation/actions";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();
  const reputationScore = await getUserReputationScore(id);

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-desert-card border border-desert-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {profile.avatarPath ? (
              <Image
                src={profile.avatarPath}
                alt={profile.displayName}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full object-cover border border-desert-border"
              />
            ) : (
              <div className="h-[72px] w-[72px] flex items-center justify-center rounded-full bg-desert-accent text-desert-dark text-2xl font-bold">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-2xl">{profile.displayName}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-desert-accent text-desert-dark font-bold">
                  {reputationScore} pts
                </span>
              </div>
              <p className="text-xs text-desert-muted">
                Member since {new Date(profile.memberSince).toLocaleDateString()}
              </p>
            </div>
          </div>
          {profile.bio && <p className="text-desert-fg mb-4">{profile.bio}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-desert-bg border border-desert-border rounded-lg p-3">
              <div className="text-2xl font-bold text-desert-accent">{profile.drivesAttended}</div>
              <div className="text-xs text-desert-muted">Drives</div>
            </div>
            <div className="bg-desert-bg border border-desert-border rounded-lg p-3">
              <div className="text-2xl font-bold text-desert-accent">{profile.campingTripsAttended}</div>
              <div className="text-xs text-desert-muted">Camping trips</div>
            </div>
            <div className="bg-desert-bg border border-desert-border rounded-lg p-3">
              <div className="text-2xl font-bold text-desert-accent">{profile.coursesEnrolled}</div>
              <div className="text-xs text-desert-muted">Courses</div>
            </div>
            <div className="bg-desert-bg border border-desert-border rounded-lg p-3">
              <div className="text-2xl font-bold text-desert-accent">{profile.forumPostCount}</div>
              <div className="text-xs text-desert-muted">Posts</div>
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}
