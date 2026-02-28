import { NextResponse } from "next/server";
import { db } from "@/db";
import { testRuns, issues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { refundCredits } from "@/lib/queries";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.WORKER_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { testRunId, status, issues: issueList, durationMs } = await req.json();

  // Fetch the test run to get userId and mode for potential refund
  const testRun = await db.query.testRuns.findFirst({
    where: eq(testRuns.id, testRunId),
  });

  if (!testRun) {
    return NextResponse.json({ error: "Test run not found" }, { status: 404 });
  }

  // Update test run
  await db
    .update(testRuns)
    .set({
      status,
      issueCount: issueList?.length ?? 0,
      durationMs,
      completedAt: new Date(),
    })
    .where(eq(testRuns.id, testRunId));

  // Insert issues
  if (issueList && issueList.length > 0) {
    await db.insert(issues).values(
      issueList.map(
        (issue: {
          category: string;
          severity: string;
          message: string;
          selector?: string;
          context?: string;
        }) => ({
          testRunId,
          category: issue.category as
            | "broken_link"
            | "console_error"
            | "broken_image"
            | "accessibility"
            | "performance",
          severity: issue.severity as "error" | "warning" | "info",
          message: issue.message,
          selector: issue.selector ?? null,
          context: issue.context ?? null,
        })
      )
    );
  }

  // Refund credits if the test failed
  if (status === "failed") {
    const refundAmount = testRun.mode === "fast" ? 1 : 2;
    await refundCredits(testRun.userId, refundAmount);
  }

  return NextResponse.json({ received: true });
}
