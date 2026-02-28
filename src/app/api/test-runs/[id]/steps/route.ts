import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { aiSteps } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const includeScreenshots = url.searchParams.get("screenshots") === "true";

  const columns: Record<string, boolean> = {
    id: true,
    runNumber: true,
    stepNumber: true,
    action: true,
    description: true,
    selector: true,
    aiReasoning: true,
    status: true,
    createdAt: true,
  };

  if (includeScreenshots) {
    columns.screenshotBase64 = true;
  }

  const steps = await db.query.aiSteps.findMany({
    where: eq(aiSteps.testRunId, id),
    orderBy: [asc(aiSteps.runNumber), asc(aiSteps.stepNumber)],
    columns,
  });

  return NextResponse.json(steps);
}
