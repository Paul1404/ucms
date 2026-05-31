import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: ({ context }) => {
    if ((context as { user?: { role?: string } }).user?.role !== "admin") {
      throw redirect({ to: "/admin" });
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.users.list.queryOptions()),
  component: UsersPage,
});

function UsersPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: users } = useSuspenseQuery(orpc.users.list.queryOptions());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: orpc.users.list.key() });

  const invite = useMutation(
    orpc.users.invite.mutationOptions({
      onSuccess: async () => {
        setName("");
        setEmail("");
        setPassword("");
        await invalidate();
        toast.success("Benutzer eingeladen");
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const remove = useMutation(
    orpc.users.remove.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Benutzer gelöscht");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <div className="min-h-screen bg-[var(--color-muted)]">
      <header className="flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4">
        <Button variant="ghost" size="icon" asChild aria-label="Zurück">
          <Link to="/admin">
            <ArrowLeft />
          </Link>
        </Button>
        <span className="font-semibold">Benutzer</span>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-5">
          <h2 className="mb-4 font-semibold">Neuen Benutzer einladen</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate({ name, email, password });
            }}
            className="space-y-3"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-name">Name</Label>
                <Input
                  id="u-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-email">E-Mail</Label>
                <Input
                  id="u-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-pass">Start-Passwort</Label>
                <Input
                  id="u-pass"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="mind. 8 Zeichen"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={invite.isPending}>
              <UserPlus /> Einladen
            </Button>
          </form>
        </section>

        <section className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {u.name}
                  {u.role === "admin" ? (
                    <span className="ml-2 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs text-[var(--color-primary)]">
                      Admin
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-[var(--color-muted-foreground)]">{u.email}</p>
              </div>
              {u.id !== user.id ? (
                <button
                  type="button"
                  aria-label="Benutzer löschen"
                  onClick={() => {
                    if (confirm(`„${u.name}" wirklich löschen?`)) remove.mutate({ id: u.id });
                  }}
                  className="rounded p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
