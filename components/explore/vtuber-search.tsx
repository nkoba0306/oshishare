"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface VTuberResult {
  id: string;
  name: string;
  avatar_url: string | null;
  favorites_count: number;
}

export function VTuberSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VTuberResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("vtubers")
      .select("id, name, avatar_url, favorites_count")
      .ilike("name", `%${value}%`)
      .order("favorites_count", { ascending: false })
      .limit(10);

    setResults(data ?? []);
    setSearching(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="VTuber名で検索..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {searching && (
        <p className="text-sm text-muted-foreground">検索中...</p>
      )}

      {results.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {results.map((v) => (
            <a
              key={v.id}
              href={`/vtuber/${v.id}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={v.avatar_url ?? ""} />
                <AvatarFallback className="text-xs">
                  {v.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground">
                  お気に入り {v.favorites_count}人
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          「{query}」に一致するVTuberが見つかりません
        </p>
      )}
    </div>
  );
}
