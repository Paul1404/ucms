import { Link, useRouter } from "@tanstack/react-router";
import { FileText, LayoutDashboard, LogOut, Newspaper, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/session";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/pages", label: "Pages", icon: FileText, exact: false },
  { to: "/admin/posts", label: "News", icon: Newspaper, exact: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AdminShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    await router.navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)] md:flex-row">
      <aside className="flex flex-col gap-2 border-b border-[var(--color-border)] bg-[var(--color-background)] p-4 md:w-64 md:border-r md:border-b-0">
        <Link to="/admin" className="px-2 py-1 text-lg font-semibold">
          ucms
        </Link>
        <nav className="flex flex-1 flex-row gap-1 overflow-x-auto md:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
              activeProps={{
                className: "bg-[var(--color-accent)] text-[var(--color-foreground)]",
              }}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden flex-col gap-2 border-t border-[var(--color-border)] pt-3 md:flex">
          <div className="px-2 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="truncate text-xs text-[var(--color-muted-foreground)]">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleSignOut}>
              <LogOut /> Sign out
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
