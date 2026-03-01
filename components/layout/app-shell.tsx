import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pb-20 lg:ml-60 lg:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
