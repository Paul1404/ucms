import { useForm } from "@tanstack/react-form";
import { Eye, Pencil, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";

export interface ContentValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  showInNav: boolean;
  navOrder: number;
}

interface ContentEditorProps {
  kind: "page" | "post";
  defaultValues: ContentValues;
  submitting?: boolean;
  onSubmit: (values: ContentValues) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

export function ContentEditor({
  kind,
  defaultValues,
  submitting,
  onSubmit,
  onDelete,
}: ContentEditorProps) {
  const [preview, setPreview] = useState(false);
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field name="title">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => {
                const next = e.target.value;
                field.handleChange(next);
                // Keep slug in sync until the user edits it manually.
                const current = form.getFieldValue("slug");
                if (!current || current === slugify(field.state.value)) {
                  form.setFieldValue("slug", slugify(next));
                }
              }}
              required
            />
          </div>
        )}
      </form.Field>

      <form.Field name="slug">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              required
            />
            <p className="text-xs text-[var(--color-muted-foreground)]">
              URL: /{kind === "post" ? "news/" : ""}
              {field.state.value || "..."}
            </p>
          </div>
        )}
      </form.Field>

      <form.Field name="excerpt">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              rows={2}
              placeholder="Short summary shown in listings (optional)"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="content">
        {(field) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPreview((p) => !p)}>
                {preview ? <Pencil /> : <Eye />}
                {preview ? "Edit" : "Preview"}
              </Button>
            </div>
            {preview ? (
              <div className="min-h-64 rounded-md border border-[var(--color-input)] p-4">
                <Markdown content={field.state.value} />
              </div>
            ) : (
              <Textarea
                id="content"
                className="min-h-64 font-mono text-sm"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          </div>
        )}
      </form.Field>

      {kind === "page" ? (
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="showInNav">
            {(field) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />
                Show in navigation
              </label>
            )}
          </form.Field>
          <form.Field name="navOrder">
            {(field) => (
              <div className="flex items-center gap-2">
                <Label htmlFor="navOrder" className="text-sm">
                  Nav order
                </Label>
                <Input
                  id="navOrder"
                  type="number"
                  className="w-24"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
                />
              </div>
            )}
          </form.Field>
        </div>
      ) : null}

      <form.Field name="published">
        {(field) => (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            />
            Published
          </label>
        )}
      </form.Field>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <Button type="submit" disabled={submitting}>
          <Save /> {submitting ? "Saving..." : "Save"}
        </Button>
        {onDelete ? (
          <Button type="button" variant="destructive" onClick={onDelete}>
            <Trash2 /> Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
