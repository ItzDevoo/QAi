import { db } from "@/db";
import { users, credits, testRuns, issues } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getOrCreateUser(
  clerkId: string,
  email: string,
  name?: string | null
) {
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (existing) return existing;

  const [user] = await db
    .insert(users)
    .values({ clerkId, email, name: name ?? null })
    .returning();

  // Give new users 3 free credits
  await db.insert(credits).values({ userId: user.id, balance: 3 });

  return user;
}

export async function getUserCredits(userId: string) {
  const row = await db.query.credits.findFirst({
    where: eq(credits.userId, userId),
  });
  return row?.balance ?? 0;
}

export async function deductCredits(userId: string, amount: number) {
  const result = await db
    .update(credits)
    .set({
      balance: sql`${credits.balance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(
      sql`${credits.userId} = ${userId} AND ${credits.balance} >= ${amount}`
    )
    .returning();

  return result.length > 0;
}

export async function refundCredits(userId: string, amount: number) {
  await db
    .update(credits)
    .set({
      balance: sql`${credits.balance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(credits.userId, userId));
}

export async function getTestRunsForUser(userId: string, limit = 10) {
  return db.query.testRuns.findMany({
    where: eq(testRuns.userId, userId),
    orderBy: [desc(testRuns.createdAt)],
    limit,
  });
}

export async function getTestRunWithIssues(testRunId: string) {
  const testRun = await db.query.testRuns.findFirst({
    where: eq(testRuns.id, testRunId),
  });

  if (!testRun) return null;

  const testIssues = await db.query.issues.findMany({
    where: eq(issues.testRunId, testRunId),
    orderBy: [desc(issues.severity)],
  });

  return { ...testRun, issues: testIssues };
}

export async function getUserStats(userId: string) {
  const runs = await db.query.testRuns.findMany({
    where: eq(testRuns.userId, userId),
  });

  const totalRuns = runs.length;
  const totalIssues = runs.reduce((sum, r) => sum + (r.issueCount ?? 0), 0);
  const completedRuns = runs.filter((r) => r.durationMs);
  const avgDuration =
    completedRuns.length > 0
      ? Math.round(
          completedRuns.reduce((sum, r) => sum + (r.durationMs ?? 0), 0) /
            completedRuns.length /
            1000
        )
      : 0;

  return { totalRuns, totalIssues, avgDuration };
}
