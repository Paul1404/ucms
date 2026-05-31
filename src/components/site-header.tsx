import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme";
import { orpc } from "@/lib/orpc";

export function SiteHeader() {
  const { data: settings } = useQuery(orpc.settings.get.queryOptions());
  const { data: nav } = useQuery(orpc.pages.nav.queryOptions());

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex flex-col leading-tight">
          <span className="text-lg font-semibold">{settings?.siteName ?? "ucms"}</span>
          {settings?.tagline ? (
            <span className="text-xs text-[var(--color-muted-foreground)]">{settings.tagline}</span>
          ) : null}
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/news"
            className="rounded-md px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
            activeProps={{ className: "text-[var(--color-foreground)]" }}
          >
            News
          </Link>
          {(nav ?? []).map((item) => (
            <Link
              key={item.slug}
              to="/$slug"
              params={{ slug: item.slug }}
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
              activeProps={{ className: "text-[var(--color-foreground)]" }}
            >
              {item.title}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
