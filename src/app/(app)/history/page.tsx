import { auth, currentUser } from "@clerk/nextjs/server";
import { History } from "lucide-react";
import { TestRunCard } from "@/components/test-run-card";
import { getOrCreateUser, getTestRunsForUser } from "@/lib/queries";

export default async function HistoryPage() {
  const { userId: clerkId } = await auth();
  const clerkUser = await currentUser();

  const user = await getOrCreateUser(
    clerkId!,
    clerkUser?.emailAddresses[0]?.emailAddress ?? "unknown",
    clerkUser?.firstName
  );

  const runs = await getTestRunsForUser(user.id, 50);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Test History</h1>
        <p className="text-sm text-muted-foreground">
          All your previous test runs
        </p>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <History className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">
            No tests yet
          </p>
          <p className="text-sm text-muted-foreground/70">
            Run your first test to see results here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <TestRunCard
              key={run.id}
              id={run.id}
              url={run.url}
              status={run.status}
              issueCount={run.issueCount ?? 0}
              createdAt={formatTimeAgo(run.createdAt)}
            />
          ))}
        </div>
      )}
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
