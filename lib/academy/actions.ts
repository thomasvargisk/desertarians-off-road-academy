import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";

export interface AcademyCourse {
  id: string;
  title: string;
  description: string;
  level: string;
  capacity: number;
  enrolled_count: number;
}

export function listCourses(): AcademyCourse[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT academy_courses.*,
              (SELECT COUNT(*) FROM academy_enrollments WHERE academy_enrollments.course_id = academy_courses.id) as enrolled_count
       FROM academy_courses`
    )
    .all() as unknown as AcademyCourse[];
}

export function getCourse(courseId: string): AcademyCourse | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT academy_courses.*,
              (SELECT COUNT(*) FROM academy_enrollments WHERE academy_enrollments.course_id = academy_courses.id) as enrolled_count
       FROM academy_courses WHERE academy_courses.id = ?`
    )
    .get(courseId) as unknown as AcademyCourse | undefined;
  return row ?? null;
}

export function hasUserEnrolled(userId: string, courseId: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT id FROM academy_enrollments WHERE course_id = ? AND user_id = ?")
    .get(courseId, userId);
  return Boolean(row);
}

export async function enrollInCourse(userId: string, courseId: string): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = getDb();
  const course = getCourse(courseId);
  if (!course) return { ok: false, error: "Course not found." };
  if (hasUserEnrolled(userId, courseId)) return { ok: false, error: "You are already enrolled." };
  if (course.enrolled_count >= course.capacity) return { ok: false, error: "This course is full." };

  db.prepare("INSERT INTO academy_enrollments (id, course_id, user_id, created_at) VALUES (?, ?, ?, ?)").run(
    randomUUID(),
    courseId,
    userId,
    new Date().toISOString()
  );
  revalidatePath(`/academy/${courseId}`);
  revalidatePath("/academy");
  return { ok: true };
}
