import Link from "next/link";
import { listCourses } from "@/lib/academy/actions";

export default async function AcademyPage() {
  const courses = await listCourses();

  return (
    <section className="min-h-screen bg-desert-bg text-desert-fg">
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-6">Academy</h2>
          <p className="text-desert-muted text-center max-w-2xl mx-auto">
            Structured progression for off-road excellence. From beginner fundamentals to advanced
            convoy leadership, our curriculum guides members through assessed skills development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <article
              key={course.id}
              className="bg-desert-card border border-desert-border rounded-lg p-6 hover:border-desert-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-semibold text-lg">{course.title}</h3>
                <span className="text-xs uppercase tracking-wide text-desert-accent">{course.level}</span>
              </div>
              <p className="text-desert-muted text-sm mb-4">{course.description}</p>
              <p className="text-sm text-desert-muted mb-3">
                Enrolled: {course.enrolled_count} / {course.capacity}
              </p>
              <Link
                href={`/academy/${course.id}`}
                className="inline-block text-sm font-medium text-desert-accent hover:underline"
              >
                View details &amp; enroll &rarr;
              </Link>
            </article>
          ))}
        </div>
      </main>
    </section>
  );
}
