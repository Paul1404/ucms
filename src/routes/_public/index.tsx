import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/lib/orpc";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_public/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(orpc.posts.published.queryOptions({ input: { limit: 5 } })),
  component: Home,
});

function Home() {
  const { data: settings } = useQuery(orpc.settings.get.queryOptions());
  const { data: posts } = useQuery(orpc.posts.published.queryOptions({ input: { limit: 5 } }));

  return (
    <div className="space-y-12">
      <section className="space-y-3 py-8">
        <h1 className="text-4xl font-semibold tracking-tight">{settings?.siteName ?? "Welcome"}</h1>
        {settings?.tagline ? (
          <p className="text-xl text-[var(--color-muted-foreground)]">{settings.tagline}</p>
        ) : null}
        {settings?.description ? (
          <p className="max-w-2xl text-[var(--color-muted-foreground)]">{settings.description}</p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Latest news</h2>
          <Link
            to="/news"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            All news <ArrowRight className="size-4" />
          </Link>
        </div>

        {posts && posts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.id} to="/news/$slug" params={{ slug: post.slug }}>
                <Card className="h-full transition-colors hover:border-[var(--color-primary)]">
                  <CardHeader>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </p>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                  </CardHeader>
                  {post.excerpt ? (
                    <CardContent className="text-sm text-[var(--color-muted-foreground)]">
                      {post.excerpt}
                    </CardContent>
                  ) : null}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-muted-foreground)]">No news yet. Check back soon.</p>
        )}
      </section>
    </div>
  );
}
