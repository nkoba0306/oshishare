"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createPlaylist } from "@/app/(main)/playlist/actions";

interface PlaylistItemData {
  id: string;
  source_url: string;
  video_title: string;
  video_thumbnail_url: string;
  vtuber_name: string;
  content_type: string;
  duration: string;
  comment: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  stream: "本配信",
  clip: "切り抜き",
  x_clip: "Xクリップ",
};

export default function NewPlaylistPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [items, setItems] = useState<PlaylistItemData[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const handleAddVideo = async () => {
    if (!urlInput.trim()) return;
    setFetching(true);
    setError("");

    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setFetching(false);
        return;
      }

      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          source_url: urlInput,
          video_title: data.title ?? urlInput,
          video_thumbnail_url: data.thumbnail ?? "",
          vtuber_name: data.channelTitle ?? "",
          content_type: data.contentType ?? "stream",
          duration: data.duration ?? "",
          comment: "",
        },
      ]);
      setUrlInput("");
    } catch {
      setError("メタデータの取得に失敗しました");
    }
    setFetching(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCommentChange = (id: string, comment: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comment } : item))
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    await createPlaylist({
      title,
      description,
      visibility,
      items: items.map((item, i) => ({
        source_url: item.source_url,
        video_title: item.video_title,
        video_thumbnail_url: item.video_thumbnail_url,
        vtuber_name: item.vtuber_name,
        content_type: item.content_type,
        duration: item.duration,
        comment: item.comment,
        position: i,
      })),
    });

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          再生リスト作成
        </span>
      </h1>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">タイトル *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 初見におすすめ！入門配信まとめ"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">用件・テーマ</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="このリストのテーマや目的を書いてください"
            maxLength={500}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">公開設定</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="public">公開</option>
            <option value="unlisted">限定公開</option>
            <option value="private">非公開</option>
          </select>
        </div>
      </div>

      {/* 動画追加 */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">動画を追加</h2>
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="YouTube / X のURLを貼り付け"
            onKeyDown={(e) => e.key === "Enter" && handleAddVideo()}
          />
          <Button onClick={handleAddVideo} disabled={fetching} className="gap-1">
            <Plus className="h-4 w-4" />
            {fetching ? "取得中..." : "追加"}
          </Button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* 動画リスト */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                  <span className="ml-1 text-sm font-bold">{index + 1}</span>
                </div>

                {item.video_thumbnail_url && (
                  <img
                    src={item.video_thumbnail_url}
                    alt=""
                    className="h-16 w-28 flex-shrink-0 rounded object-cover"
                  />
                )}

                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium line-clamp-1">
                    {item.video_title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.vtuber_name && <span>{item.vtuber_name}</span>}
                    <Badge variant="outline" className="text-[10px]">
                      {CONTENT_TYPE_LABELS[item.content_type] ?? "本配信"}
                    </Badge>
                  </div>
                  <Input
                    value={item.comment}
                    onChange={(e) =>
                      handleCommentChange(item.id, e.target.value)
                    }
                    placeholder="コメント（任意）"
                    maxLength={200}
                    className="h-7 text-xs"
                  />
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !title.trim() || items.length === 0}
        className="w-full bg-gradient-to-r from-primary to-accent font-bold"
        size="lg"
      >
        {loading ? "作成中..." : "作成する"}
      </Button>
    </div>
  );
}
