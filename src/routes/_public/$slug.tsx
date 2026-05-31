import { isDefinedError } from "@orpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Markdown } from "@/components/markdown";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_public/$slug")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(
        orpc.pages.bySlug.queryOptions({ input: { slug: params.slug } }),
      );
    } catch (error) {
      if (isDefinedError(error) || (error as { code?: string })?.code === "NOT_FOUND") {
        throw notFound();
      }
      throw error;
    }
  },
  head: ({ params }) => ({ meta: [{ title: params.slug }] }),
  component: PageView,
});

function PageView() {
  const { slug } = Route.useParams();
  const { data: page } = useSuspenseQuery(orpc.pages.bySlug.queryOptions({ input: { slug } }));

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        {page.excerpt ? (
          <p className="text-lg text-[var(--color-muted-foreground)]">{page.excerpt}</p>
        ) : null}
      </header>
      <Markdown content={page.content} />
    </article>
  );
}
