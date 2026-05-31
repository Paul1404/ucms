import type { CSSProperties, ReactNode } from "react";
import type { Footer, Header } from "@/lib/chrome";

function chromeStyle(bg: string, color: string): CSSProperties {
  const style: CSSProperties = {};
  if (bg) style.backgroundColor = bg;
  if (color) style.color = color;
  return style;
}

// Public-site header. Logo (text or image) on the left, nav links on the right.
export function SiteHeader({ header }: { header: Header }) {
  if (!header.enabled) return null;
  return (
    <header
      className={`z-30 border-b border-[var(--color-border)] bg-[var(--color-background)] ${header.sticky ? "sticky top-0" : ""}`}
      style={chromeStyle(header.bg, header.color)}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2 font-semibold">
          {header.logoUrl ? (
            <img src={header.logoUrl} alt={header.logoText || "Logo"} className="h-8 w-auto" />
          ) : (
            <span className="text-lg">{header.logoText}</span>
          )}
        </a>
        {header.links.length > 0 ? (
          <nav className="flex items-center gap-5 text-sm">
            {header.links.map((link, i) => (
              <a
                // biome-ignore lint/suspicious/noArrayIndexKey: nav links have no stable id
                key={i}
                href={link.url || "#"}
                className="opacity-80 transition-opacity hover:opacity-100"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}

// Public-site footer. Free text on the left, optional links on the right.
export function SiteFooter({ footer }: { footer: Footer }) {
  if (!footer.enabled) return null;
  return (
    <footer
      className="border-t border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-muted-foreground)]"
      style={chromeStyle(footer.bg, footer.color)}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
        <p className="whitespace-pre-wrap">{footer.text}</p>
        {footer.links.length > 0 ? (
          <nav className="flex flex-wrap items-center gap-4">
            {footer.links.map((link, i) => (
              <a
                // biome-ignore lint/suspicious/noArrayIndexKey: footer links have no stable id
                key={i}
                href={link.url || "#"}
                className="hover:text-[var(--color-foreground)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}

// Wraps page content with the configured header and footer.
export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: Header;
  footer: Footer;
  children: ReactNode;
}) {
  return (
    <div id="top" className="flex min-h-screen flex-col">
      <SiteHeader header={header} />
      <div className="flex-1">{children}</div>
      <SiteFooter footer={footer} />
    </div>
  );
}
