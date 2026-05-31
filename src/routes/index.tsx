import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { BlockView } from "@/components/blocks/block-view";
import { orpc } from "@/lib/orpc";
import { fontStack } from "@/lib/theme";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.site.get.queryOptions()),
  head: ({ loaderData }) => {
    const site = loaderData as { name: string; description?: string; ogImage?: string } | undefined;
    const title = site?.name ?? "Home";
    const description = site?.description || undefined;
    const image = site?.ogImage || undefined;
    return {
      meta: [
        { title },
        ...(description ? [{ name: "description", content: description }] : []),
        { property: "og:title", content: title },
        ...(description ? [{ property: "og:description", content: description }] : []),
        ...(image ? [{ property: "og:image", content: image }] : []),
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
      ],
    };
  },
  component: PublicSite,
});

function PublicSite() {
  const { data: site } = useSuspenseQuery(orpc.site.get.queryOptions());

  const themeStyle = {
    "--color-primary": site.themeColor,
    "--color-primary-foreground": "#ffffff",
    fontFamily: fontStack(site.font),
  } as CSSProperties;

  return (
    <div style={themeStyle}>
      {site.blocks.length === 0 ? (
        <EmptyState name={site.name} />
      ) : (
        <main>
          {site.blocks.map((block) => (
            <BlockView key={block.id} block={block} />
          ))}
        </main>
      )}
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        <p>
          {site.name}
          <span className="mx-2">·</span>
          <Link to="/admin" className="hover:text-[var(--color-foreground)]">
            Edit site
          </Link>
        </p>
      </footer>
    </div>
  );
}

function EmptyState({ name }: { name: string }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">{name}</h1>
      <p className="max-w-md text-[var(--color-muted-foreground)]">
        This site has not been published yet.
      </p>
      <Link
        to="/admin"
        className="inline-flex h-10 items-center rounded-md bg-[var(--color-primary)] px-6 text-sm font-medium text-[var(--color-primary-foreground)]"
      >
        Open the editor
      </Link>
    </div>
  );
}
