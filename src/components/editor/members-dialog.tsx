import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/lib/orpc";

// Manage which users may edit a site. Owners and admins add existing users by
// email; users must already have an account (invited under Benutzer).
export function MembersDialog({ siteId, onClose }: { siteId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const { data: members } = useSuspenseQuery(
    orpc.site.listMembers.queryOptions({ input: { siteId } }),
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: orpc.site.listMembers.key({ input: { siteId } }) });

  const add = useMutation(
    orpc.site.addMember.mutationOptions({
      onSuccess: async () => {
        setEmail("");
        await invalidate();
        toast.success("Mitglied hinzugefügt");
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const remove = useMutation(
    orpc.site.removeMember.mutationOptions({
      onSuccess: invalidate,
      onError: (e) => toast.error(e.message),
    }),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <h2 className="font-semibold">Bearbeiter</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add.mutate({ siteId, email });
            }}
            className="space-y-2"
          >
            <Label htmlFor="member-email">Benutzer per E-Mail hinzufügen</Label>
            <div className="flex gap-2">
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@beispiel.de"
                required
              />
              <Button type="submit" disabled={add.isPending}>
                Hinzufügen
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Noch keine zusätzlichen Bearbeiter.
              </p>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md border border-[var(--color-border)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                      {m.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Bearbeiter entfernen"
                    onClick={() => remove.mutate({ siteId, memberId: m.id })}
                    className="rounded p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
