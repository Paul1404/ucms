import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { orpc } from "@/lib/orpc";

export function SiteFooter() {
  const { data: settings } = useQuery(orpc.settings.get.queryOptions());
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-[var(--color-muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
        <p>{settings?.footerText ?? `© ${year} ${settings?.siteName ?? "ucms"}`}</p>
        <div className="flex items-center gap-4">
          {settings?.contactEmail ? (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="hover:text-[var(--color-foreground)]"
            >
              {settings.contactEmail}
            </a>
          ) : null}
          <Link to="/admin" className="hover:text-[var(--color-foreground)]">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
