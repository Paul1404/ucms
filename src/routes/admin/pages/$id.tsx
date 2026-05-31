import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ContentEditor, type ContentValues } from "@/components/content-editor";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/pages/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(orpc.pages.byId.queryOptions({ input: { id: params.id } })),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: page } = useSuspenseQuery(orpc.pages.byId.queryOptions({ input: { id } }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: orpc.pages.key() });

  const update = useMutation(
    orpc.pages.update.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Page saved");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const remove = useMutation(
    orpc.pages.remove.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Page deleted");
        await router.navigate({ to: "/admin/pages" });
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  function handleSubmit(values: ContentValues) {
    update.mutate({
      id,
      data: {
        slug: values.slug,
        title: values.title,
        content: values.content,
        excerpt: values.excerpt || null,
        published: values.published,
        showInNav: values.showInNav,
        navOrder: values.navOrder,
      },
    });
  }

  function handleDelete() {
    if (confirm("Delete this page? This cannot be undone.")) {
      remove.mutate({ id });
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/pages"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="size-4" /> Pages
      </Link>
      <h1 className="text-2xl font-semibold">Edit page</h1>
      <ContentEditor
        kind="page"
        defaultValues={{
          title: page.title,
          slug: page.slug,
          excerpt: page.excerpt ?? "",
          content: page.content,
          published: page.published,
          showInNav: page.showInNav,
          navOrder: page.navOrder,
        }}
        submitting={update.isPending}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
