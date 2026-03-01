"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface FeedFilterProps {
  agencies: { id: string; display_name: string }[];
  currentSort?: string;
  currentAgency?: string;
  currentContentType?: string;
}

const CONTENT_TYPES = [
  { value: "stream", label: "本配信" },
  { value: "clip", label: "切り抜き" },
  { value: "x_clip", label: "Xクリップ" },
];

export function FeedFilter({
  agencies,
  currentSort,
  currentAgency,
  currentContentType,
}: FeedFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      {/* ソート */}
      <div className="flex gap-2">
        <button
          onClick={() => updateParam("sort", null)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            (!currentSort || currentSort === "newest")
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          新着順
        </button>
        <button
          onClick={() => updateParam("sort", "popular")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            currentSort === "popular"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          人気順
        </button>
      </div>

      {/* コンテンツ種別フィルタ */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateParam("content_type", null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !currentContentType
              ? "bg-accent/20 text-accent"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          すべて
        </button>
        {CONTENT_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() =>
              updateParam(
                "content_type",
                currentContentType === ct.value ? null : ct.value
              )
            }
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              currentContentType === ct.value
                ? "bg-accent/20 text-accent"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* 事務所フィルタ */}
      {agencies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParam("agency", null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !currentAgency
                ? "bg-primary/20 text-primary"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            全事務所
          </button>
          {agencies.map((a) => (
            <button
              key={a.id}
              onClick={() =>
                updateParam("agency", currentAgency === a.id ? null : a.id)
              }
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                currentAgency === a.id
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {a.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
