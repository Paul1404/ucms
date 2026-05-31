import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ContentEditor, type ContentValues } from "@/components/content-editor";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/posts/new")({
  component: NewPost,
});

const empty: ContentValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  published: false,
  showInNav: false,
  navOrder: 0,
};

function NewPost() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation(
    orpc.posts.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.posts.key() });
        toast.success("Post created");
        await router.navigate({ to: "/admin/posts" });
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
    });
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/posts"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="size-4" /> News
      </Link>
      <h1 className="text-2xl font-semibold">New post</h1>
      <ContentEditor
        kind="post"
        defaultValues={empty}
        submitting={mutation.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
