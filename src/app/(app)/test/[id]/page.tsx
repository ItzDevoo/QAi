"use client";

import { use } from "react";
import Link from "next/link";
import {
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Link2,
  Terminal,
  ImageOff,
  Accessibility,
  Gauge,
  Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePollTestRun } from "@/hooks/use-poll-test-run";
import { LiveStepFeed } from "@/components/live-step-feed";

const categoryIcons: Record<string, React.ElementType> = {
  broken_link: Link2,
  console_error: Terminal,
  broken_image: ImageOff,
  accessibility: Accessibility,
  performance: Gauge,
  ai_detected: Bot,
};

const categoryLabels: Record<string, string> = {
  broken_link: "Broken Links",
  console_error: "Console Errors",
  broken_image: "Broken Images",
  accessibility: "Accessibility",
  performance: "Performance",
  ai_detected: "AI Detected",
};

const severityColors: Record<string, string> = {
  error: "destructive",
  warning: "secondary",
  info: "outline",
};

const confidenceColors: Record<string, string> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export default function TestReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error } = usePollTestRun(id);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center pt-32">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading test run...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center pt-32">
        <XCircle className="mb-4 h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{error || "Test run not found"}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isRunning = data.status === "queued" || data.status === "running";
  const isFailed = data.status === "failed";
  const isComplete = data.status === "completed";

  // Group issues by category
  const issuesByCategory = data.issues.reduce(
    (acc: Record<string, typeof data.issues>, issue) => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Test Report</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="truncate">{data.url}</span>
          </div>
        </div>
        {isRunning && (
          <Badge variant="outline" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {data.status === "queued" ? "Queued" : "Running"}
          </Badge>
        )}
      </div>

      {/* Running state — Live Test View */}
      {isRunning && (
        <Card>
          <CardContent className="py-8">
            {/* Progress header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="font-medium">
                    {data.currentRunNumber
                      ? `AI Run ${data.currentRunNumber} of ${data.mode === "fast" ? 1 : 3}`
                      : "Running deterministic checks..."}
                  </p>
                  {data.lastStepDescription && (
                    <p className="text-sm text-muted-foreground">
                      {data.lastStepDescription}
                    </p>
                  )}
                </div>
              </div>
              {data.totalSteps ? (
                <span className="text-sm text-muted-foreground">
                  {data.totalSteps} steps
                </span>
              ) : null}
            </div>

            {/* Checking description */}
            <p className="text-sm text-muted-foreground">
              Checking 404s, console errors, broken images, accessibility,
              performance, and running AI behavioral tests
            </p>

            {/* Live step feed */}
            <LiveStepFeed testRunId={id} isRunning={true} />
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {isFailed && (
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <XCircle className="mb-4 h-10 w-10 text-destructive" />
            <p className="text-lg font-medium">Test Failed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Something went wrong while testing this URL. Credits have been
              refunded.
            </p>
            <Button asChild className="mt-4">
              <Link href="/test/new">Try Again</Link>
            </Button>

            {/* Show step history even on failure */}
            <div className="mt-6 w-full">
              <LiveStepFeed testRunId={id} isRunning={false} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed state */}
      {isComplete && (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    data.issueCount > 0 ? "bg-destructive/10" : "bg-green-500/10"
                  }`}
                >
                  {data.issueCount > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.issueCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.issueCount === 1 ? "Issue" : "Issues"} Found
                  </p>
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
                    {data.durationMs
                      ? `${(data.durationMs / 1000).toFixed(1)}s`
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Gauge className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Object.keys(issuesByCategory).length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Categories Flagged
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* No issues */}
          {data.issueCount === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-10 w-10 text-green-500" />
                <p className="text-lg font-medium">All Checks Passed</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No issues found during deterministic and AI checks
                </p>
              </CardContent>
            </Card>
          )}

          {/* Issues by category */}
          {Object.entries(issuesByCategory).map(([category, categoryIssues]) => {
            const Icon = categoryIcons[category] ?? AlertTriangle;
            const label = categoryLabels[category] ?? category;

            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4" />
                    {label}
                    <Badge variant="secondary" className="ml-auto">
                      {categoryIssues.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoryIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3"
                    >
                      <Badge
                        variant={
                          severityColors[issue.severity] as
                            | "destructive"
                            | "secondary"
                            | "outline"
                        }
                        className="mt-0.5 shrink-0 text-xs"
                      >
                        {issue.severity}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{issue.message}</p>
                        {issue.context && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {issue.context}
                          </p>
                        )}
                      </div>
                      {issue.confidence && (
                        <Badge
                          variant={
                            confidenceColors[issue.confidence] as
                              | "destructive"
                              | "secondary"
                              | "outline"
                          }
                          className="shrink-0 text-xs"
                        >
                          {issue.confidence}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {/* AI step history (collapsed) */}
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Bot className="h-4 w-4" />
              View AI test steps
            </summary>
            <div className="mt-2">
              <LiveStepFeed testRunId={id} isRunning={false} />
            </div>
          </details>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground">
            QAi tests UI, links, images, accessibility, performance, and
            behavioral flows. It does not test auth logic, databases, or payment
            flows.
          </p>
        </>
      )}
    </div>
  );
}
