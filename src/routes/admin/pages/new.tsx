import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ContentEditor, type ContentValues } from "@/components/content-editor";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/pages/new")({
  component: NewPage,
});

const empty: ContentValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  published: false,
  showInNav: true,
  navOrder: 0,
};

function NewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.pages.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.pages.key() });
        toast.success("Page created");
        await router.navigate({ to: "/admin/pages" });
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  function handleSubmit(values: ContentValues) {
    mutation.mutate({
      slug: values.slug,
      title: values.title,
      content: values.content,
      excerpt: values.excerpt || null,
      published: values.published,
      showInNav: values.showInNav,
      navOrder: values.navOrder,
    });
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/pages"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="size-4" /> Pages
      </Link>
      <h1 className="text-2xl font-semibold">New page</h1>
      <ContentEditor
        kind="page"
        defaultValues={empty}
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
