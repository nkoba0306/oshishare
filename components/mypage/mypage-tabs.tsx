"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "posts", label: "自分の投稿" },
  { key: "liked", label: "いいね" },
  { key: "bookmarked", label: "ブックマーク" },
  { key: "favorites", label: "お気に入りVTuber" },
];

export function MyPageTabs({ currentTab }: { currentTab: string }) {
  const router = useRouter();

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => router.push(`/mypage?tab=${tab.key}`)}
          className={cn(
            "whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
            currentTab === tab.key
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
