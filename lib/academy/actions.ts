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

export async function listCourses(): Promise<AcademyCourse[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(
      `SELECT academy_courses.*,
              (SELECT COUNT(*) FROM academy_enrollments WHERE academy_enrollments.course_id = academy_courses.id) as enrolled_count
       FROM academy_courses`
    )
    .all<AcademyCourse>();
  return results;
}

export async function getCourse(courseId: string): Promise<AcademyCourse | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT academy_courses.*,
              (SELECT COUNT(*) FROM academy_enrollments WHERE academy_enrollments.course_id = academy_courses.id) as enrolled_count
       FROM academy_courses WHERE academy_courses.id = ?`
    )
    .bind(courseId)
    .first<AcademyCourse>();
  return row ?? null;
}

export async function hasUserEnrolled(userId: string, courseId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db
    .prepare("SELECT id FROM academy_enrollments WHERE course_id = ? AND user_id = ?")
    .bind(courseId, userId)
    .first();
  return Boolean(row);
}

export async function enrollInCourse(userId: string, courseId: string): Promise<{ ok: boolean; error?: string }> {
  "use server";
  const db = await getDb();
  const course = await getCourse(courseId);
  if (!course) return { ok: false, error: "Course not found." };
  if (await hasUserEnrolled(userId, courseId)) return { ok: false, error: "You are already enrolled." };
  if (course.enrolled_count >= course.capacity) return { ok: false, error: "This course is full." };

  await db
    .prepare("INSERT INTO academy_enrollments (id, course_id, user_id, created_at) VALUES (?, ?, ?, ?)")
    .bind(crypto.randomUUID(), courseId, userId, new Date().toISOString())
    .run();
  revalidatePath(`/academy/${courseId}`);
  revalidatePath("/academy");
  return { ok: true };
}
