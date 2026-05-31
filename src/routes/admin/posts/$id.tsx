import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ContentEditor, type ContentValues } from "@/components/content-editor";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/posts/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(orpc.posts.byId.queryOptions({ input: { id: params.id } })),
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: post } = useSuspenseQuery(orpc.posts.byId.queryOptions({ input: { id } }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: orpc.posts.key() });

  const update = useMutation(
    orpc.posts.update.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Post saved");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const remove = useMutation(
    orpc.posts.remove.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Post deleted");
        await router.navigate({ to: "/admin/posts" });
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
      },
    });
  }

  function handleDelete() {
    if (confirm("Delete this post? This cannot be undone.")) {
      remove.mutate({ id });
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/posts"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="size-4" /> News
      </Link>
      <h1 className="text-2xl font-semibold">Edit post</h1>
      <ContentEditor
        kind="post"
        defaultValues={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content: post.content,
          published: post.published,
          showInNav: false,
          navOrder: 0,
        }}
        submitting={update.isPending}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
