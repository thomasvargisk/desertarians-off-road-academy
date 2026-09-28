import Image from "next/image";
import Link from "next/link";
import { getCommunityStats } from "@/lib/stats/actions";

const drives = [
  { day: "FR", date: "02", title: "Newbie Desert Drive", level: "Newbie", area: "Dubai desert area", time: "6:00 AM" },
  { day: "SA", date: "03", title: "Fewbie Skills Drive", level: "Fewbie", area: "Northern Emirates", time: "6:00 AM" },
  { day: "SU", date: "04", title: "Intermediate Dune Practice", level: "Intermediate", area: "Sharjah desert area", time: "5:45 AM" },
];

const discussions = [
  { title: "What should every first-time desert driver carry?", category: "Off-road advice", replies: 18, time: "2 hours ago" },
  { title: "Choosing the right tyre pressure for changing sand", category: "Academy classroom", replies: 11, time: "Yesterday" },
  { title: "Share your favourite camp breakfast", category: "Camping group", replies: 24, time: "Yesterday" },
  { title: "Member vehicle setup: recovery points and essentials", category: "Vehicle garage", replies: 9, time: "2 days ago" },
];

const academyLevels = ["Newbie", "Fewbie", "Fewbie Plus", "Intermediate", "Advanced", "Marshal"];

export default async function HomePage() {
  const stats = await getCommunityStats();
  return <div>
    <section className="border-b border-desert-border bg-[#061a3c] text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 md:grid-cols-[1fr_420px] md:py-14">
        <div><p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-amber-400">UAE off-road community</p><h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Explore. Learn.<br />Drive together.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 md:text-lg">Learn desert driving with a community built around responsible adventure, practical skills, experienced leadership and unforgettable days in the dunes.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/drives" className="rounded-md bg-red-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-red-800">Explore club drives</Link><Link href="/academy" className="rounded-md border border-white/60 px-5 py-3 font-bold text-white hover:bg-white/10">Discover the academy</Link></div></div>
        <Image src="/brand/dora-logo-transparent.png" alt="Desertarians Off Road Academy" width={1254} height={1254} className="mx-auto h-auto w-full max-w-[420px] drop-shadow-2xl" priority />
      </div>
    </section>
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-950">Club member review preview — schedules, discussions and member content shown below are illustrative. Joining and payments are disabled.</div>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-10">
        <section><div className="mb-5 flex items-end justify-between gap-4"><div><p className="section-kicker">Plan your weekend</p><h2 className="section-title">Upcoming club drives</h2></div><Link href="/drives" className="text-sm font-bold">View drive calendar →</Link></div><div className="grid gap-4 md:grid-cols-3">{drives.map((drive) => <article key={drive.title} className="community-card overflow-hidden"><div className="flex items-center gap-4 border-b border-desert-border bg-[#082b59] p-4 text-white"><div className="w-12 text-center"><div className="text-xs font-bold text-amber-300">{drive.day}</div><div className="text-3xl font-bold">{drive.date}</div></div><div><span className="rounded bg-amber-400 px-2 py-1 text-xs font-bold text-slate-950">{drive.level}</span><p className="mt-2 text-xs text-blue-100">{drive.time}</p></div></div><div className="p-4"><h3 className="font-bold leading-snug">{drive.title}</h3><p className="mt-2 text-sm text-desert-muted">{drive.area} · Exact meeting point is restricted.</p><Link href="/drives" className="mt-4 inline-block text-sm font-bold">Drive details →</Link></div></article>)}</div></section>
        <section><div className="mb-5 flex items-end justify-between gap-4"><div><p className="section-kicker">From the community</p><h2 className="section-title">Latest discussions</h2></div><a href="#discussions" className="text-sm font-bold">All discussions →</a></div><div id="discussions" className="community-card divide-y divide-desert-border">{discussions.map((item, index) => <article key={item.title} className="flex gap-4 p-5 hover:bg-black/[0.025]"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#082b59] font-bold text-white">{index + 1}</div><div className="min-w-0 flex-1"><a href="#discussions" className="font-bold leading-snug">{item.title}</a><p className="mt-1 text-sm text-desert-muted">{item.category} · {item.time}</p></div><div className="hidden text-right text-sm text-desert-muted sm:block"><strong className="block text-lg text-desert-fg">{item.replies}</strong>replies</div></article>)}</div></section>
        <section><div className="mb-5"><p className="section-kicker">A clear path forward</p><h2 className="section-title">Your off-road academy journey</h2></div><div className="community-card p-6"><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{academyLevels.map((level, index) => <div key={level} className="rounded-md border border-desert-border p-3 text-center"><div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-slate-950">{index + 1}</div><p className="text-sm font-bold">{level}</p></div>)}</div><p className="mt-5 text-sm leading-6 text-desert-muted">Build confidence step by step through classroom learning, practical drives, feedback and human-approved progression.</p></div></section>
      </div>
      <aside className="space-y-6">
        <section className="community-card"><div className="card-heading">Club announcements</div><div className="space-y-4 p-5"><article><a href="#review" className="font-bold">Welcome to the Desertarians website review</a><p className="mt-1 text-sm text-desert-muted">Help us shape the club’s new digital home.</p></article><article><Link href="/academy" className="font-bold">Academy safety charter</Link><p className="mt-1 text-sm text-desert-muted">How we prepare, communicate and look after one another.</p></article></div></section>
        <section className="community-card"><div className="card-heading">Member spotlight</div><div className="p-5 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#082b59] to-amber-500 text-2xl font-bold text-white">D</div><h3 className="mt-4 font-bold">The Desertarians community</h3><p className="mt-2 text-sm leading-6 text-desert-muted">Different vehicles, backgrounds and experience levels—one shared respect for the desert.</p></div></section>
        <section className="community-card"><div className="card-heading">Community at a glance</div><dl className="grid grid-cols-2 gap-px bg-desert-border"><div className="bg-desert-card p-4 text-center"><dt className="text-xs text-desert-muted">Total members</dt><dd className="mt-1 text-2xl font-bold">{stats.totalMembers}</dd></div><div className="bg-desert-card p-4 text-center"><dt className="text-xs text-desert-muted">Club drives</dt><dd className="mt-1 text-2xl font-bold">{stats.totalDrives}</dd></div><div className="bg-desert-card p-4 text-center"><dt className="text-xs text-desert-muted">Forum posts</dt><dd className="mt-1 text-2xl font-bold">{stats.totalForumPosts}</dd></div><div className="bg-desert-card p-4 text-center"><dt className="text-xs text-desert-muted">Marketplace listings</dt><dd className="mt-1 text-2xl font-bold">{stats.totalMarketplaceListings}</dd></div></dl></section>
      </aside>
    </div>
    <section className="bg-[#082b59] px-5 py-12 text-white"><div className="mx-auto max-w-7xl"><p className="section-kicker text-amber-300">More than a drive</p><h2 className="text-3xl font-bold">Learn together. Camp together. Explore responsibly.</h2><div className="mt-7 grid gap-4 md:grid-cols-3"><Link href="/academy" className="feature-link"><strong>Off-road academy</strong><span>Skills, progression and guidance →</span></Link><Link href="/camping" className="feature-link"><strong>Camping group</strong><span>Campouts, equipment and community →</span></Link><Link href="/drives" className="feature-link"><strong>Club drives</strong><span>Upcoming experiences and levels →</span></Link></div></div></section>
  </div>;
}
