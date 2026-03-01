"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, Loader2, Link as LinkIcon, X, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { postSchema, type PostFormValues } from "@/lib/validations/post";
import { createPost } from "./actions";
import Link from "next/link";

interface Metadata {
  type: "youtube" | "x";
  contentType: string;
  videoId?: string;
  tweetId?: string;
  title: string;
  thumbnailUrl?: string;
  channelTitle?: string;
  duration?: string;
  publishedAt?: string;
  authorName?: string;
  matchedVTuber?: { id: string; name: string; avatar_url: string } | null;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  stream: "本配信",
  clip: "切り抜き",
  x_clip: "Xクリップ",
};

export default function NewPostPage() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [contentType, setContentType] = useState("stream");
  const [vtuberQuery, setVtuberQuery] = useState("");
  const [vtuberResults, setVtuberResults] = useState<{ id: string; name: string; avatar_url: string | null }[]>([]);
  const [selectedVtuber, setSelectedVtuber] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  const [searchingVtuber, setSearchingVtuber] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      sourceUrl: "",
      vtuber_id: "",
      comment: "",
      rating: 3,
      tags: [],
    },
  });

  const rating = form.watch("rating");

  const fetchMetadata = useCallback(async () => {
    if (!urlInput.trim()) return;
    setFetchingMeta(true);
    setFetchError("");
    setMetadata(null);

    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error);
        return;
      }

      setMetadata(data);
      setContentType(data.contentType);
      form.setValue("sourceUrl", urlInput.trim());
      if (data.matchedVTuber) {
        form.setValue("vtuber_id", data.matchedVTuber.id);
        setSelectedVtuber(data.matchedVTuber);
      }
    } catch {
      setFetchError("メタデータの取得に失敗しました");
    } finally {
      setFetchingMeta(false);
    }
  }, [urlInput, form]);

  const searchVtuber = async (query: string) => {
    setVtuberQuery(query);
    if (query.length < 1) {
      setVtuberResults([]);
      return;
    }
    setSearchingVtuber(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("vtubers")
      .select("id, name, avatar_url")
      .ilike("name", `%${query}%`)
      .order("favorites_count", { ascending: false })
      .limit(8);
    setVtuberResults(data ?? []);
    setSearchingVtuber(false);
  };

  const selectVtuber = (v: { id: string; name: string; avatar_url: string | null }) => {
    setSelectedVtuber(v);
    form.setValue("vtuber_id", v.id);
    setVtuberQuery("");
    setVtuberResults([]);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      const newTags = [...tags, tag];
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  const onSubmit = async (values: PostFormValues) => {
    if (!metadata) return;
    setSubmitting(true);
    setSubmitError("");

    const result = await createPost({
      sourceUrl: values.sourceUrl,
      vtuber_id: values.vtuber_id,
      comment: values.comment,
      rating: values.rating,
      tags: values.tags,
      contentType,
      videoId: metadata.videoId,
      tweetId: metadata.tweetId,
      videoTitle: metadata.title,
      videoThumbnailUrl: metadata.thumbnailUrl,
      videoPublishedAt: metadata.publishedAt,
      videoDuration: metadata.duration,
    });

    if (result.error) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">おすすめ投稿</h1>

      {/* URL入力 */}
      <div className="space-y-2">
        <Label>動画・クリップURL</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="YouTubeやXのURLを貼り付け"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), fetchMetadata())}
              className="pl-9"
            />
          </div>
          <Button onClick={fetchMetadata} disabled={fetchingMeta || !urlInput.trim()}>
            {fetchingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : "取得"}
          </Button>
        </div>
        {fetchError && <p className="text-sm text-destructive">{fetchError}</p>}
      </div>

      {/* プレビュー */}
      {metadata && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex gap-4">
            {metadata.thumbnailUrl && (
              <img
                src={metadata.thumbnailUrl}
                alt=""
                className="h-24 w-40 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 space-y-1">
              <Badge variant="secondary">
                {CONTENT_TYPE_LABELS[contentType]}
              </Badge>
              <p className="font-medium leading-snug">{metadata.title}</p>
              <p className="text-sm text-muted-foreground">
                {metadata.channelTitle || metadata.authorName}
              </p>
            </div>
          </div>
          {metadata.matchedVTuber && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
              <span className="text-primary">VTuber自動マッチ:</span>
              <span className="font-medium">{metadata.matchedVTuber.name}</span>
            </div>
          )}
        </div>
      )}

      {/* 投稿フォーム */}
      {metadata && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* コンテンツ種別 */}
          <div className="space-y-2">
            <Label>コンテンツ種別</Label>
            <div className="flex gap-2">
              {(["stream", "clip", "x_clip"] as const).map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setContentType(ct)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    contentType === ct
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {CONTENT_TYPE_LABELS[ct]}
                </button>
              ))}
            </div>
          </div>

          {/* VTuber選択 */}
          <div className="space-y-2">
            <Label>VTuber</Label>
            {selectedVtuber ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedVtuber.avatar_url ?? ""} />
                  <AvatarFallback className="text-xs">{selectedVtuber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 font-medium">{selectedVtuber.name}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedVtuber(null); form.setValue("vtuber_id", ""); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="VTuber名で検索..."
                  value={vtuberQuery}
                  onChange={(e) => searchVtuber(e.target.value)}
                  className="pl-10"
                />
                {searchingVtuber && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {vtuberResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                    {vtuberResults.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVtuber(v)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={v.avatar_url ?? ""} />
                          <AvatarFallback className="text-[10px]">{v.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{v.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {vtuberQuery.length >= 1 && !searchingVtuber && vtuberResults.length === 0 && (
                  <div className="mt-2 rounded-lg border border-dashed border-border p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      「{vtuberQuery}」に一致するVTuberが見つかりません
                    </p>
                    <Button variant="outline" size="sm" className="gap-1" asChild>
                      <Link href={`/vtuber/new?name=${encodeURIComponent(vtuberQuery)}`}>
                        <Plus className="h-3 w-3" />
                        VTuber登録を申請する
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
            {form.formState.errors.vtuber_id && !selectedVtuber && (
              <p className="text-sm text-destructive">
                {form.formState.errors.vtuber_id.message}
              </p>
            )}
          </div>

          {/* おすすめコメント */}
          <div className="space-y-2">
            <Label>おすすめコメント</Label>
            <Textarea
              placeholder="この配信のどこが良かったか教えてください（1〜500文字）"
              rows={4}
              {...form.register("comment")}
            />
            {form.formState.errors.comment && (
              <p className="text-sm text-destructive">
                {form.formState.errors.comment.message}
              </p>
            )}
          </div>

          {/* おすすめ度 */}
          <div className="space-y-2">
            <Label>おすすめ度</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => form.setValue("rating", star)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* タグ */}
          <div className="space-y-2">
            <Label>タグ（最大5つ）</Label>
            <div className="flex gap-2">
              <Input
                placeholder="タグを入力"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                追加
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-primary to-accent text-white"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            投稿する
          </Button>
        </form>
      )}
    </div>
  );
}
