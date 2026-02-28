import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { issues, testRuns } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Find the issue
  const issue = await db.query.issues.findFirst({
    where: eq(issues.id, id),
  });

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  if (issue.dismissed) {
    return NextResponse.json({ already: true });
  }

  // Dismiss the issue
  await db
    .update(issues)
    .set({ dismissed: true })
    .where(eq(issues.id, id));

  // Decrement test run issue count
  await db
    .update(testRuns)
    .set({
      issueCount: sql`GREATEST(${testRuns.issueCount} - 1, 0)`,
    })
    .where(eq(testRuns.id, issue.testRunId));

  return NextResponse.json({ dismissed: true });
}
