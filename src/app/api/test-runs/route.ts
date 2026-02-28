import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { testRuns } from "@/db/schema";
import { getOrCreateUser, deductCredits } from "@/lib/queries";

export async function POST(req: Request) {
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

  const body = await req.json();
  const { url, mode = "standard", mobileViewport = false } = body;

  // Validate URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Deduct credits
  const creditCost = mode === "fast" ? 1 : 2;
  const deducted = await deductCredits(user.id, creditCost);
  if (!deducted) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // Create test run
  const [testRun] = await db
    .insert(testRuns)
    .values({
      userId: user.id,
      url,
      mode,
      mobileViewport,
      status: "queued",
    })
    .returning();

  // Dispatch to worker (fire and forget)
  if (process.env.WORKER_URL) {
    fetch(`${process.env.WORKER_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.WORKER_API_KEY!,
      },
      body: JSON.stringify({
        testRunId: testRun.id,
        url,
        mode,
        mobileViewport,
      }),
    }).catch((err) => console.error("Failed to dispatch to worker:", err));
  }

  return NextResponse.json({ testRunId: testRun.id });
}
