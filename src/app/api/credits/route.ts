import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUser, getUserCredits } from "@/lib/queries";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const user = await getOrCreateUser(
    clerkId,
    clerkUser?.emailAddresses[0]?.emailAddress ?? "unknown",
    clerkUser?.firstName
  );

  const balance = await getUserCredits(user.id);
  return NextResponse.json({ balance });
}
