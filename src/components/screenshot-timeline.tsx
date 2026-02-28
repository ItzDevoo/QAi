"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StepWithScreenshot {
  id: string;
  runNumber: number;
  stepNumber: number;
  action: string;
  description: string;
  screenshotBase64: string | null;
}

export function ScreenshotTimeline({ testRunId }: { testRunId: string }) {
  const [steps, setSteps] = useState<StepWithScreenshot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/test-runs/${testRunId}/steps?screenshots=true`)
      .then((res) => res.json())
      .then((data) => {
        // Only keep steps that have screenshots
        const withScreenshots = data.filter(
          (s: StepWithScreenshot) => s.screenshotBase64
        );
        setSteps(withScreenshots);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [testRunId]);

  if (loading || steps.length === 0) return null;

  const selected = selectedIndex !== null ? steps[selectedIndex] : null;

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Screenshots ({steps.length})
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {steps.map((step, i) => {
            const isError = step.action === "assert_error";
            return (
              <button
                key={step.id}
                onClick={() => setSelectedIndex(i)}
                className={`group relative shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  isError
                    ? "border-destructive/50 hover:border-destructive"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <img
                  src={`data:image/png;base64,${step.screenshotBase64}`}
                  alt={step.description}
                  className="h-24 w-40 object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
                  <div className="flex items-center gap-1">
                    {isError && (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    )}
                    <span className="truncate text-[10px] text-white">
                      {step.runNumber}.{step.stepNumber} — {step.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fullscreen dialog */}
      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
      >
        <DialogContent className="max-w-5xl border-border bg-background p-0">
          <DialogTitle className="sr-only">
            {selected
              ? `Step ${selected.runNumber}.${selected.stepNumber}: ${selected.description}`
              : "Screenshot"}
          </DialogTitle>
          {selected && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    Step {selected.runNumber}.{selected.stepNumber}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selected.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={selectedIndex === 0}
                    onClick={() =>
                      setSelectedIndex((i) => (i !== null ? i - 1 : null))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {(selectedIndex ?? 0) + 1} / {steps.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={selectedIndex === steps.length - 1}
                    onClick={() =>
                      setSelectedIndex((i) => (i !== null ? i + 1 : null))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Screenshot */}
              <div className="overflow-auto p-2">
                <img
                  src={`data:image/png;base64,${selected.screenshotBase64}`}
                  alt={selected.description}
                  className="w-full rounded"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
