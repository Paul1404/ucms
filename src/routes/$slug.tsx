import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { CanvasView } from "@/components/blocks/canvas-view";
import { SiteChrome } from "@/components/blocks/site-chrome";
import { DEFAULT_CANVAS_HEIGHT } from "@/lib/blocks";
import { defaultFooter, defaultHeader } from "@/lib/chrome";
import { orpc } from "@/lib/orpc";
import { fontStack } from "@/lib/theme";

export const Route = createFileRoute("/$slug")({
  loader: async ({ context, params }) => {
    const site = await context.queryClient.ensureQueryData(
      orpc.site.getPublished.queryOptions({ input: { slug: params.slug } }),
    );
    if (!site) throw notFound();
    return site;
  },
  head: ({ loaderData }) => {
    const site = loaderData as
      | { name?: string; description?: string; ogImage?: string }
      | undefined;
    const title = site?.name ?? "Seite";
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
  const { slug } = Route.useParams();
  const { data: site } = useSuspenseQuery(orpc.site.getPublished.queryOptions({ input: { slug } }));

  if (!site) return null;

  const themeStyle = {
    "--color-primary": site.themeColor,
    "--color-primary-foreground": "#ffffff",
    fontFamily: fontStack(site.font),
  } as CSSProperties;

  const header = site.header ?? defaultHeader(site.name);
  const footer = site.footer ?? defaultFooter(site.name);
  const height = site.canvasHeight ?? DEFAULT_CANVAS_HEIGHT;

  return (
    <div style={themeStyle}>
      <SiteChrome header={header} footer={footer}>
        {site.blocks.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
            <h1 className="text-3xl font-semibold">{site.name}</h1>
          </div>
        ) : (
          <CanvasView blocks={site.blocks} height={height} />
        )}
      </SiteChrome>
    </div>
  );
}
