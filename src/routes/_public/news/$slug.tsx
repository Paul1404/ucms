import { isDefinedError } from "@orpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { orpc } from "@/lib/orpc";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_public/news/$slug")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(
        orpc.posts.bySlug.queryOptions({ input: { slug: params.slug } }),
      );
    } catch (error) {
      if (isDefinedError(error) || (error as { code?: string })?.code === "NOT_FOUND") {
        throw notFound();
      }
      throw error;
    }
  },
  head: ({ params }) => ({ meta: [{ title: params.slug }] }),
  component: PostView,
});

function PostView() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(orpc.posts.bySlug.queryOptions({ input: { slug } }));

  return (
    <article className="space-y-6">
      <Link
        to="/news"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="size-4" /> All news
      </Link>
      <header className="space-y-2">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {formatDate(post.publishedAt ?? post.createdAt)}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
      </header>
      <Markdown content={post.content} />
    </article>
  );
}
