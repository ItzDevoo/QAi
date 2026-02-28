import { NextResponse } from "next/server";
import { db } from "@/db";
import { aiSteps, testRuns } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.WORKER_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    testRunId,
    runNumber,
    stepNumber,
    action,
    description,
    selector,
    inputValue,
    aiReasoning,
    status,
  } = await req.json();

  // Insert AI step record
  await db.insert(aiSteps).values({
    testRunId,
    runNumber,
    stepNumber,
    action,
    description,
    selector: selector ?? null,
    inputValue: inputValue ?? null,
    aiReasoning: aiReasoning ?? null,
    status,
  });

  // Update testRuns with latest step info for cheap polling
  await db
    .update(testRuns)
    .set({
      currentRunNumber: runNumber,
      totalSteps: stepNumber,
      lastStepDescription: description,
    })
    .where(eq(testRuns.id, testRunId));

  return NextResponse.json({ received: true });
}
