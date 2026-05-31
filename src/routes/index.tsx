import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { BlockView } from "@/components/blocks/block-view";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.site.get.queryOptions()),
  head: () => ({ meta: [{ title: "Home" }] }),
  component: PublicSite,
});

function PublicSite() {
  const { data: site } = useSuspenseQuery(orpc.site.get.queryOptions());

  const themeStyle = {
    "--color-primary": site.themeColor,
    "--color-primary-foreground": "#ffffff",
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
