import Link from "next/link";
import { Plus, FlaskConical, Bug, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TestRunCard } from "@/components/test-run-card";

const mockRuns = [
  {
    url: "https://example.com",
    status: "completed" as const,
    issueCount: 0,
    createdAt: "2 minutes ago",
  },
  {
    url: "https://myapp.vercel.app",
    status: "failed" as const,
    issueCount: 3,
    createdAt: "1 hour ago",
  },
  {
    url: "https://portfolio.dev",
    status: "running" as const,
    issueCount: 0,
    createdAt: "Just now",
  },
];

const stats = [
  { label: "Tests Run", value: "12", icon: FlaskConical },
  { label: "Issues Found", value: "7", icon: Bug },
  { label: "Avg. Time", value: "45s", icon: Clock },
];

export default function DashboardPage() {
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
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Tests</h2>
        {mockRuns.map((run) => (
          <TestRunCard key={run.url + run.createdAt} {...run} />
        ))}
      </div>
    </div>
  );
}
