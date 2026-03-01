"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/app/(main)/actions";

export function FavoriteButton({
  vtuberId,
  isFavorited,
  count,
}: {
  vtuberId: string;
  isFavorited: boolean;
  count: number;
}) {
  const [fav, setFav] = useState(isFavorited);
  const [favCount, setFavCount] = useState(count);

  const handleToggle = async () => {
    const next = !fav;
    setFav(next);
    setFavCount((c) => c + (next ? 1 : -1));
    await toggleFavorite(vtuberId);
  };

  return (
    <Button
      variant={fav ? "default" : "outline"}
      size="sm"
      className={cn("gap-1.5", fav && "bg-pink-500 hover:bg-pink-600")}
      onClick={handleToggle}
    >
      <Heart className={cn("h-4 w-4", fav && "fill-current")} />
      {fav ? "お気に入り" : "お気に入りに追加"}
      <span className="ml-1 text-xs opacity-75">{favCount}</span>
    </Button>
  );
}
