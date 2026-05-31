import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { orpc } from "@/lib/orpc";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_public/news/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(orpc.posts.published.queryOptions({ input: {} })),
  head: () => ({ meta: [{ title: "News" }] }),
  component: NewsList,
});

function NewsList() {
  const { data: posts } = useSuspenseQuery(orpc.posts.published.queryOptions({ input: {} }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">News</h1>
      {posts.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)]">No news yet.</p>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {posts.map((post) => (
            <article key={post.id} className="py-6 first:pt-0">
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {formatDate(post.publishedAt ?? post.createdAt)}
              </p>
              <Link
                to="/news/$slug"
                params={{ slug: post.slug }}
                className="mt-1 block text-xl font-semibold hover:text-[var(--color-primary)]"
              >
                {post.title}
              </Link>
              {post.excerpt ? (
                <p className="mt-2 text-[var(--color-muted-foreground)]">{post.excerpt}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
