import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/pages/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.pages.list.queryOptions()),
  component: PagesList,
});

function PagesList() {
  const { data: pages } = useSuspenseQuery(orpc.pages.list.queryOptions());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pages</h1>
        <Button asChild>
          <Link to="/admin/pages/new">
            <Plus /> New page
          </Link>
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          No pages yet. Create your first one.
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--color-border)]">
          {pages.map((page) => (
            <Link
              key={page.id}
              to="/admin/pages/$id"
              params={{ id: page.id }}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-[var(--color-accent)]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{page.title}</p>
                <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                  /{page.slug}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {page.showInNav ? <Badge variant="outline">Nav</Badge> : null}
                {page.published ? (
                  <Badge variant="success">Published</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
