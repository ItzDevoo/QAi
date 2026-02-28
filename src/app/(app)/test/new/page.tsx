"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Zap, Smartphone, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function NewTestPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRunTest() {
    setError(null);
    setSubmitting(true);

    try {
      // Ensure URL has a protocol
      let testUrl = url;
      if (!/^https?:\/\//i.test(testUrl)) {
        testUrl = `https://${testUrl}`;
      }

      const res = await fetch("/api/test-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: testUrl,
          mode: fastMode ? "fast" : "standard",
          mobileViewport,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setError("No credits remaining. Upgrade to continue testing.");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      router.push(`/test/${data.testRunId}`);
    } catch {
      setError("Failed to start test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center pt-20">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Test Your App</h1>
        <p className="mt-2 text-muted-foreground">
          Paste a URL and let AI find the bugs
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://your-app.vercel.app"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && url && !submitting) handleRunTest();
                }}
                className="pl-10"
              />
            </div>
            <Button
              disabled={!url || submitting}
              onClick={handleRunTest}
              className="px-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Run Test"
              )}
            </Button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showAdvanced && "rotate-180"
              )}
            />
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setFastMode(!fastMode)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                  fastMode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Zap className="h-4 w-4" />
                Fast Mode
                {fastMode && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    1 credit
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setMobileViewport(!mobileViewport)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors",
                  mobileViewport
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Smartphone className="h-4 w-4" />
                Mobile Viewport
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Standard mode costs 2 credits. Fast mode costs 1 credit.
      </p>
    </div>
  );
}
