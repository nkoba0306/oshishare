"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  PlusCircle,
  Heart,
  User,
  ListVideo,
  Settings,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/explore", icon: Compass, label: "探す" },
  { href: "/post/new", icon: PlusCircle, label: "投稿する" },
  { href: "/playlist", icon: ListVideo, label: "再生リスト" },
  { href: "/vtuber/requests", icon: UserPlus, label: "VTuber申請" },
  { href: "/mypage", icon: Heart, label: "推し" },
  { href: "/mypage", icon: User, label: "マイページ" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-14 hidden h-[calc(100vh-3.5rem)] w-60 border-r border-border bg-sidebar lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
