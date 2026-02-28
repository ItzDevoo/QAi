import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Plus, FlaskConical, Bug, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TestRunCard } from "@/components/test-run-card";
import {
  getOrCreateUser,
  getTestRunsForUser,
  getUserStats,
} from "@/lib/queries";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  const clerkUser = await currentUser();

  const user = await getOrCreateUser(
    clerkId!,
    clerkUser?.emailAddresses[0]?.emailAddress ?? "unknown",
    clerkUser?.firstName
  );

  const [recentRuns, stats] = await Promise.all([
    getTestRunsForUser(user.id, 10),
    getUserStats(user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your AI-powered testing overview
          </p>
        </div>
        <Button asChild>
          <Link href="/test/new">
            <Plus className="mr-2 h-4 w-4" />
            New Test
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalRuns}</p>
              <p className="text-xs text-muted-foreground">Tests Run</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalIssues}</p>
              <p className="text-xs text-muted-foreground">Issues Found</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.avgDuration ? `${stats.avgDuration}s` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Avg. Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Tests</h2>
        {recentRuns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="mb-4 h-10 w-10 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">
                No tests yet
              </p>
              <p className="text-sm text-muted-foreground/70">
                Run your first test to see results here
              </p>
              <Button asChild className="mt-4">
                <Link href="/test/new">Run Your First Test</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          recentRuns.map((run) => (
            <TestRunCard
              key={run.id}
              id={run.id}
              url={run.url}
              status={run.status}
              issueCount={run.issueCount ?? 0}
              createdAt={formatTimeAgo(run.createdAt)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
