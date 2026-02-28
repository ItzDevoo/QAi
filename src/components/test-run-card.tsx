import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

type TestRunStatus = "queued" | "running" | "completed" | "failed";

interface TestRunCardProps {
  url: string;
  status: TestRunStatus;
  issueCount: number;
  createdAt: string;
}

const statusConfig: Record<
  TestRunStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  queued: { label: "Queued", variant: "secondary", icon: Clock },
  running: { label: "Running", variant: "outline", icon: Loader2 },
  completed: { label: "Passed", variant: "default", icon: CheckCircle },
  failed: { label: "Issues Found", variant: "destructive", icon: AlertTriangle },
};

export function TestRunCard({ url, status, issueCount, createdAt }: TestRunCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className="transition-colors hover:bg-card/80">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{url}</p>
            <p className="text-xs text-muted-foreground">{createdAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {status === "failed" && (
            <span className="text-sm text-destructive font-medium">
              {issueCount} issue{issueCount !== 1 ? "s" : ""}
            </span>
          )}
          <Badge variant={config.variant} className="gap-1">
            <StatusIcon className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
