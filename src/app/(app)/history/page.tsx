import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Test History</h1>
        <p className="text-sm text-muted-foreground">
          All your previous test runs
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <History className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-lg font-medium text-muted-foreground">
          No tests yet
        </p>
        <p className="text-sm text-muted-foreground/70">
          Run your first test to see results here
        </p>
      </div>
    </div>
  );
}
