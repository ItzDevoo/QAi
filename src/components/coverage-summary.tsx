"use client";

import { useState, useEffect } from "react";
import { Globe, MousePointerClick, Type, ArrowDown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Step {
  action: string;
  description: string;
}

export function CoverageSummary({ testRunId }: { testRunId: string }) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/test-runs/${testRunId}/steps`)
      .then((res) => res.json())
      .then((data) => {
        setSteps(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [testRunId]);

  if (loading || steps.length === 0) return null;

  // Extract unique URLs from navigate actions and "Analyzing page at" descriptions
  const urls = new Set<string>();
  for (const step of steps) {
    const urlMatch = step.description.match(
      /(?:Analyzing page at|Navigate to|Navigating to)\s+(https?:\/\/[^\s.]+\S*)/i
    );
    if (urlMatch) {
      try {
        const url = new URL(urlMatch[1].replace(/\.{3}$/, ""));
        urls.add(`${url.origin}${url.pathname}`);
      } catch {
        // Skip invalid URLs
      }
    }
  }

  // Count actions
  const actionCounts = steps.reduce(
    (acc: Record<string, number>, step) => {
      acc[step.action] = (acc[step.action] || 0) + 1;
      return acc;
    },
    {}
  );

  const clicks = actionCounts["click"] || 0;
  const navigations = actionCounts["navigate"] || 0;
  const types = actionCounts["type"] || 0;
  const scrolls = actionCounts["scroll"] || 0;
  const assertions = actionCounts["assert_error"] || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Test Coverage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Action breakdown */}
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Globe className="h-3 w-3" />
            {urls.size} pages visited
          </span>
          {clicks > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MousePointerClick className="h-3 w-3" />
              {clicks} clicks
            </span>
          )}
          {types > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Type className="h-3 w-3" />
              {types} inputs
            </span>
          )}
          {scrolls > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <ArrowDown className="h-3 w-3" />
              {scrolls} scrolls
            </span>
          )}
          {assertions > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              {assertions} issues flagged
            </span>
          )}
        </div>

        {/* URLs visited */}
        {urls.size > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Pages Tested
            </p>
            <div className="max-h-32 space-y-0.5 overflow-y-auto">
              {Array.from(urls).map((url) => (
                <p
                  key={url}
                  className="truncate rounded bg-secondary/50 px-2 py-1 text-xs text-muted-foreground"
                >
                  {url}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
