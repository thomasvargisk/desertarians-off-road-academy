import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ProfileRedirectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(`/members/${user.id}`);
}
