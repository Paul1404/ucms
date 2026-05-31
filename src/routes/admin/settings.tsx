import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.settings.get.queryOptions()),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery(orpc.settings.get.queryOptions());

  const mutation = useMutation(
    orpc.settings.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.settings.key() });
        toast.success("Settings saved");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const form = useForm({
    defaultValues: {
      siteName: settings.siteName,
      tagline: settings.tagline ?? "",
      description: settings.description ?? "",
      footerText: settings.footerText ?? "",
      contactEmail: settings.contactEmail ?? "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        siteName: value.siteName,
        tagline: value.tagline || null,
        description: value.description || null,
        footerText: value.footerText || null,
        contactEmail: value.contactEmail || null,
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          These appear across your public site.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field name="siteName">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="siteName">Site name</Label>
              <Input
                id="siteName"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </div>
          )}
        </form.Field>

        <form.Field name="tagline">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="contactEmail">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="footerText">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer text</Label>
              <Input
                id="footerText"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Defaults to © year and site name"
              />
            </div>
          )}
        </form.Field>

        <Button type="submit" disabled={mutation.isPending}>
          <Save /> {mutation.isPending ? "Saving..." : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
