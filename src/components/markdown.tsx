import { marked } from "marked";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

marked.setOptions({ gfm: true, breaks: true });

/**
 * Renders markdown content authored in the admin. Content is written by
 * trusted, authenticated editors, so it is rendered as-is.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => marked.parse(content ?? "", { async: false }) as string, [content]);
  return (
    <div
      className={cn("prose-content", className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered markdown from trusted editors
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
