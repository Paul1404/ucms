import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orpc } from "@/lib/orpc";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/posts/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.posts.list.queryOptions()),
  component: PostsList,
});

function PostsList() {
  const { data: posts } = useSuspenseQuery(orpc.posts.list.queryOptions());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">News</h1>
        <Button asChild>
          <Link to="/admin/posts/new">
            <Plus /> New post
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          No posts yet. Write your first announcement.
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--color-border)]">
          {posts.map((post) => (
            <Link
              key={post.id}
              to="/admin/posts/$id"
              params={{ id: post.id }}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-[var(--color-accent)]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{post.title}</p>
                <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </p>
              </div>
              {post.published ? (
                <Badge variant="success">Published</Badge>
              ) : (
                <Badge variant="secondary">Draft</Badge>
              )}
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
