import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-semibold text-[var(--color-muted-foreground)]">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <div className="text-[var(--color-muted-foreground)]">
        {children ?? <p>The page you are looking for does not exist or has been moved.</p>}
      </div>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
