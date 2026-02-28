"use client";

import { useState, useEffect, useRef } from "react";
import {
  MousePointerClick,
  Type,
  Globe,
  ArrowDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Loader2,
} from "lucide-react";

interface Step {
  id: string;
  runNumber: number;
  stepNumber: number;
  action: string;
  description: string;
  status: string;
}

const actionIcons: Record<string, React.ElementType> = {
  click: MousePointerClick,
  type: Type,
  navigate: Globe,
  scroll: ArrowDown,
  assert_error: AlertTriangle,
  thinking: Brain,
  done: CheckCircle,
  error: XCircle,
};

export function LiveStepFeed({
  testRunId,
  isRunning,
}: {
  testRunId: string;
  isRunning: boolean;
}) {
  const [steps, setSteps] = useState<Step[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const res = await fetch(`/api/test-runs/${testRunId}/steps`);
        if (res.ok) {
          const data = await res.json();
          setSteps(data);
        }
      } catch {
        // Silently ignore fetch errors
      }
    };

    fetchSteps();

    if (isRunning) {
      const interval = setInterval(fetchSteps, 2000);
      return () => clearInterval(interval);
    }
  }, [testRunId, isRunning]);

  // Auto-scroll to bottom when new steps arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps.length]);

  if (steps.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="mt-4 max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-background/50 p-3"
    >
      {steps.map((step) => {
        const Icon = actionIcons[step.action] || Brain;
        const isError =
          step.status === "failed" || step.action === "assert_error";
        const isActive = step.status === "executing";

        return (
          <div
            key={step.id}
            className={`flex items-start gap-2 rounded px-2 py-1.5 text-sm ${
              isError
                ? "bg-destructive/5 text-destructive"
                : isActive
                  ? "bg-primary/5 text-primary"
                  : "text-muted-foreground"
            }`}
          >
            <span className="mt-0.5 shrink-0 text-xs opacity-50">
              {step.runNumber}.{step.stepNumber}
            </span>
            {isActive ? (
              <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span className="min-w-0 break-words">{step.description}</span>
          </div>
        );
      })}
    </div>
  );
}
