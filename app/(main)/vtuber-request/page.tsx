"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { submitVtuberRequest } from "../actions";

export default function VtuberRequestPage() {
  return (
    <Suspense fallback={<div className="animate-pulse p-8 text-center text-muted-foreground">読み込み中...</div>}>
      <VtuberRequestForm />
    </Suspense>
  );
}

function VtuberRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillName = searchParams.get("name") ?? "";

  const [name, setName] = useState(prefillName);
  const [channelUrl, setChannelUrl] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("VTuber名を入力してください");
      return;
    }
    setSubmitting(true);
    setError("");

    const result = await submitVtuberRequest({
      name: name.trim(),
      channelUrl: channelUrl.trim() || undefined,
      reason: reason.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-8">
          <h2 className="text-xl font-bold">申請を受け付けました</h2>
          <p className="mt-2 text-muted-foreground">
            他のユーザーの承認（3名）が集まると自動的にVTuberが登録されます。
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/vtuber/requests">申請一覧を見る</Link>
          </Button>
          <Button asChild>
            <Link href="/post/new">投稿に戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">VTuber登録申請</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        登録されていないVTuberの追加を申請できます。他のユーザー3名の承認で自動登録されます。
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>VTuber名 *</Label>
          <Input
            placeholder="例: 星街すいせい"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>チャンネルURL</Label>
          <Input
            placeholder="https://www.youtube.com/@channel"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            YouTubeチャンネルURLがあると承認されやすくなります
          </p>
        </div>

        <div className="space-y-2">
          <Label>申請理由</Label>
          <Textarea
            placeholder="どんなVTuberか簡単に教えてください"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full bg-gradient-to-r from-primary to-accent text-white"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          申請する
        </Button>
      </form>
    </div>
  );
}
