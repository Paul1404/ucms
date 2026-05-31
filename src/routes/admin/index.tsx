import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ExternalLink, LogOut, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.site.listMine.queryOptions()),
  component: Dashboard,
});

function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = Route.useRouteContext();
  const isAdmin = user.role === "admin";
  const { data: sites } = useSuspenseQuery(orpc.site.listMine.queryOptions());
  const [creating, setCreating] = useState(false);

  const remove = useMutation(
    orpc.site.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.site.listMine.key() });
        toast.success("Seite gelöscht");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[var(--color-muted)]">
      <header className="flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4">
        <span className="font-semibold">ucms</span>
        <span className="text-sm text-[var(--color-muted-foreground)]">Verwaltung</span>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin ? (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/users">
                <Users /> Benutzer
              </Link>
            </Button>
          ) : null}
          <span className="hidden text-sm text-[var(--color-muted-foreground)] sm:inline">
            {user.name}
          </span>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Abmelden">
            <LogOut />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Deine Seiten</h1>
          {isAdmin ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus /> Neue Seite
            </Button>
          ) : null}
        </div>

        {sites.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-background)] p-10 text-center">
            <p className="text-[var(--color-muted-foreground)]">
              {isAdmin
                ? "Noch keine Seiten. Lege deine erste Seite an."
                : "Dir wurde noch keine Seite zugewiesen."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sites.map((site) => (
              <div
                key={site.id}
                className="flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: site.themeColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{site.name}</p>
                    <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                      /{site.slug}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      site.isPublished
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                    }`}
                  >
                    {site.isPublished ? "Veröffentlicht" : "Entwurf"}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" asChild>
                    <Link to="/admin/sites/$siteId" params={{ siteId: site.id }}>
                      <Pencil /> Bearbeiten
                    </Link>
                  </Button>
                  {site.isPublished ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/${site.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink /> Ansehen
                      </a>
                    </Button>
                  ) : null}
                  {site.isOwner || isAdmin ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto"
                      aria-label="Seite löschen"
                      onClick={() => {
                        if (confirm(`„${site.name}" wirklich löschen?`))
                          remove.mutate({ id: site.id });
                      }}
                    >
                      <Trash2 className="text-[var(--color-muted-foreground)]" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {creating ? (
        <CreateSiteDialog
          onClose={() => setCreating(false)}
          onCreated={async (id) => {
            await queryClient.invalidateQueries({ queryKey: orpc.site.listMine.key() });
            await router.navigate({ to: "/admin/sites/$siteId", params: { siteId: id } });
          }}
        />
      ) : null}
    </div>
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function CreateSiteDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touchedSlug, setTouchedSlug] = useState(false);

  const create = useMutation(
    orpc.site.create.mutationOptions({
      onSuccess: (res) => onCreated(res.id),
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-xl">
        <h2 className="mb-4 font-semibold">Neue Seite</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ name, slug: slug || slugify(name) });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="site-name">Name</Label>
            <Input
              id="site-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!touchedSlug) setSlug(slugify(e.target.value));
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-slug">Adresszusatz</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-[var(--color-muted-foreground)]">/</span>
              <Input
                id="site-slug"
                value={slug}
                onChange={(e) => {
                  setTouchedSlug(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="meine-seite"
                required
              />
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Die Seite wird unter dieser Adresse veröffentlicht.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Erstellen
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
