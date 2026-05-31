import { type ErrorComponentProps, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
        {error instanceof Error ? error.message : "An unexpected error occurred."}
      </p>
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
