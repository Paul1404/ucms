import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "ucms" }] }),
  component: Landing,
});

function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-muted)] px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">ucms</h1>
        <p className="max-w-md text-[var(--color-muted-foreground)]">
          Ein schlanker Website-Baukasten. Erstelle und verwalte mehrere Seiten, die unter ihrer
          eigenen Adresse veröffentlicht werden.
        </p>
      </div>
      <Button asChild>
        <Link to="/admin">
          <LayoutDashboard /> Zur Verwaltung
        </Link>
      </Button>
    </div>
  );
}
