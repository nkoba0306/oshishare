import { createClient } from "@/lib/supabase/server";
import { VtuberRequestCard } from "@/components/vtuber/vtuber-request-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = {
  title: "VTuber登録申請一覧 | 推しシェア",
};

export default async function VtuberRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: requests } = await supabase
    .from("vtuber_requests")
    .select(
      `
      id, name, channel_url, reason, status,
      approvals_count, approvals_required, created_at,
      user:profiles!vtuber_requests_user_id_fkey(display_name, avatar_url)
    `
    )
    .order("created_at", { ascending: false });

  // ユーザーの投票状況
  let votedRequestIds = new Set<string>();
  if (user) {
    const { data: votes } = await supabase
      .from("vtuber_request_approvals")
      .select("request_id")
      .eq("user_id", user.id);
    votedRequestIds = new Set(votes?.map((v) => v.request_id) ?? []);
  }

  const pendingRequests = (requests ?? []).filter((r) => r.status === "pending");
  const resolvedRequests = (requests ?? []).filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">VTuber登録申請</h1>
        <Button asChild size="sm" className="gap-1">
          <Link href="/vtuber/new">
            <Plus className="h-4 w-4" />
            新規申請
          </Link>
        </Button>
      </div>

      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">承認待ち</h2>
          <div className="grid gap-3">
            {pendingRequests.map((req) => (
              <VtuberRequestCard
                key={req.id}
                request={{
                  ...req,
                  user: Array.isArray(req.user) ? req.user[0] : req.user,
                  has_voted: votedRequestIds.has(req.id),
                }}
              />
            ))}
          </div>
        </div>
      )}

      {pendingRequests.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          <p>承認待ちの申請はありません</p>
        </div>
      )}

      {resolvedRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">処理済み</h2>
          <div className="grid gap-3">
            {resolvedRequests.map((req) => (
              <VtuberRequestCard
                key={req.id}
                request={{
                  ...req,
                  user: Array.isArray(req.user) ? req.user[0] : req.user,
                  has_voted: votedRequestIds.has(req.id),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
