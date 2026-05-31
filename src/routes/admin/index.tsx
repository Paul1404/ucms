import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, FileText, Newspaper, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.meta.stats.queryOptions()),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useSuspenseQuery(orpc.meta.stats.queryOptions());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">An overview of your site.</p>
        </div>
        <Button asChild variant="outline">
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink /> View site
          </a>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pages" value={stats.pages} />
        <StatCard label="News posts" value={stats.posts} />
        <StatCard label="Published news" value={stats.publishedPosts} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" /> Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild size="sm">
              <Link to="/admin/pages/new">
                <Plus /> New page
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/pages">Manage</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Newspaper className="size-4" /> News
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild size="sm">
              <Link to="/admin/posts/new">
                <Plus /> New post
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/posts">Manage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{value}</CardTitle>
        <p className="text-sm text-[var(--color-muted-foreground)]">{label}</p>
      </CardHeader>
    </Card>
  );
}
