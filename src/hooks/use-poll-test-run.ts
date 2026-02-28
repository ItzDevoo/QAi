"use client";

import { useState, useEffect, useCallback } from "react";

interface Issue {
  id: string;
  category: string;
  severity: string;
  message: string;
  selector: string | null;
  context: string | null;
  confidence: string | null;
}

interface TestRunData {
  id: string;
  url: string;
  status: "queued" | "running" | "completed" | "failed";
  mode: string;
  mobileViewport: boolean;
  issueCount: number;
  durationMs: number | null;
  currentRunNumber: number | null;
  totalSteps: number | null;
  lastStepDescription: string | null;
  createdAt: string;
  completedAt: string | null;
  issues: Issue[];
}

export function usePollTestRun(testRunId: string) {
  const [data, setData] = useState<TestRunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/test-runs/${testRunId}`);
      if (!res.ok) {
        setError("Failed to fetch test run");
        setLoading(false);
        return false;
      }
      const json = await res.json();
      setData(json);
      setLoading(false);
      // Continue polling if still in progress
      return json.status === "queued" || json.status === "running";
    } catch {
      setError("Network error");
      setLoading(false);
      return false;
    }
  }, [testRunId]);

  useEffect(() => {
    let active = true;

    const startPolling = async () => {
      const shouldContinue = await poll();
      if (active && shouldContinue) {
        // Poll faster during running (AI steps), slower when queued
        const interval = 1500;
        setTimeout(startPolling, interval);
      }
    };

    startPolling();
    return () => {
      active = false;
    };
  }, [poll]);

  return { data, loading, error };
}
