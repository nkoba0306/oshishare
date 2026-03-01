"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveVtuberRequest, rejectVtuberRequest } from "@/app/(main)/actions";

interface VtuberRequestCardProps {
  request: {
    id: string;
    name: string;
    channel_url: string | null;
    reason: string | null;
    status: string;
    approvals_count: number;
    approvals_required: number;
    created_at: string;
    user: { display_name: string; avatar_url: string | null } | null;
    has_voted?: boolean;
  };
}

export function VtuberRequestCard({ request }: VtuberRequestCardProps) {
  const [actionDone, setActionDone] = useState<"approve" | "reject" | null>(null);
  const [count, setCount] = useState(request.approvals_count);
  const [loading, setLoading] = useState(false);

  const isPending = request.status === "pending" && !actionDone;

  const handleApprove = async () => {
    setLoading(true);
    const result = await approveVtuberRequest(request.id);
    if (!result.error) {
      setActionDone("approve");
      setCount((c) => c + 1);
    }
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    const result = await rejectVtuberRequest(request.id);
    if (!result.error) {
      setActionDone("reject");
    }
    setLoading(false);
  };

  const statusBadge = () => {
    if (request.status === "approved") {
      return <Badge className="bg-green-500/20 text-green-400">承認済み</Badge>;
    }
    if (request.status === "rejected") {
      return <Badge variant="destructive">却下</Badge>;
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        承認待ち ({count}/{request.approvals_required})
      </Badge>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{request.name}</h3>
            {statusBadge()}
          </div>
          {request.channel_url && (
            <a
              href={request.channel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {request.channel_url}
            </a>
          )}
          {request.reason && (
            <p className="text-sm text-muted-foreground">{request.reason}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>{request.user?.display_name ?? "不明"}</span>
        </div>
        <span>{new Date(request.created_at).toLocaleDateString("ja-JP")}</span>
      </div>

      {isPending && !request.has_voted && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            承認する
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={loading}
            className="flex-1 gap-1 text-destructive hover:text-destructive"
          >
            <XCircle className="h-4 w-4" />
            却下
          </Button>
        </div>
      )}

      {actionDone === "approve" && (
        <p className="text-sm text-green-400 font-medium">承認しました</p>
      )}
      {actionDone === "reject" && (
        <p className="text-sm text-destructive font-medium">却下しました</p>
      )}
      {request.has_voted && !actionDone && (
        <p className="text-sm text-muted-foreground">投票済み</p>
      )}
    </div>
  );
}
