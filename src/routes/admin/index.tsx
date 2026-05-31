import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { ExternalLink, LogOut, Rocket, Save, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BlockCanvas } from "@/components/editor/block-canvas";
import { BlockInspector } from "@/components/editor/block-inspector";
import { Palette } from "@/components/editor/palette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "@/lib/auth-client";
import { type Block, type BlockType, createBlock } from "@/lib/blocks";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.site.getDraft.queryOptions()),
  component: Editor,
});

function Editor() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(orpc.site.getDraft.queryOptions());

  const [name, setName] = useState(data.name);
  const [themeColor, setThemeColor] = useState(data.themeColor);
  const [blocks, setBlocks] = useState<Block[]>(data.blocks);
  const [selectedId, setSelectedId] = useState<string | null>(data.blocks[0]?.id ?? null);
  const [dirty, setDirty] = useState(false);

  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const update = (next: Block[]) => {
    setBlocks(next);
    setDirty(true);
  };

  function addBlock(type: BlockType) {
    const block = createBlock(type);
    update([...blocks, block]);
    setSelectedId(block.id);
  }

  function updateBlock(updated: Block) {
    update(blocks.map((b) => (b.id === updated.id ? updated : b)));
  }

  function duplicateBlock(id: string) {
    const index = blocks.findIndex((b) => b.id === id);
    const original = blocks[index];
    if (!original) return;
    const copy = { ...original, id: crypto.randomUUID() } as Block;
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    update(next);
    setSelectedId(copy.id);
  }

  function deleteBlock(id: string) {
    update(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const payload = () => ({ name, themeColor, blocks });

  const save = useMutation(
    orpc.site.save.mutationOptions({
      onSuccess: () => {
        setDirty(false);
        toast.success("Draft saved");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const publish = useMutation(
    orpc.site.publish.mutationOptions({
      onSuccess: async () => {
        setDirty(false);
        await queryClient.invalidateQueries({ queryKey: orpc.site.get.key() });
        toast.success("Site published");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  // Warn before navigating away (in-app and on tab close) with unsaved changes.
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: () => dirty,
    withResolver: true,
  });

  return (
    <div className="flex h-screen flex-col bg-[var(--color-muted)]">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4">
        <span className="font-semibold">ucms</span>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
          className="h-8 max-w-56"
          aria-label="Site name"
        />
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
          <span className="hidden sm:inline">Theme</span>
          <input
            type="color"
            value={themeColor}
            onChange={(e) => {
              setThemeColor(e.target.value);
              setDirty(true);
            }}
            className="h-7 w-9 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
            aria-label="Theme color"
          />
        </label>
        <div className="ml-auto flex items-center gap-2">
          {dirty ? (
            <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline">
              Unsaved changes
            </span>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink /> <span className="hidden sm:inline">View</span>
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={save.isPending}
            onClick={() => save.mutate(payload())}
          >
            <Save /> Save
          </Button>
          <Button size="sm" disabled={publish.isPending} onClick={() => publish.mutate(payload())}>
            <Rocket /> Publish
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Palette */}
        <aside className="shrink-0 overflow-y-auto border-b border-[var(--color-border)] bg-[var(--color-background)] p-3 lg:w-56 lg:border-b-0 lg:border-r">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Add section
          </p>
          <Palette onAdd={addBlock} />
        </aside>

        {/* Canvas */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-3xl">
            {blocks.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] p-10 text-center text-[var(--color-muted-foreground)]">
                <p className="font-medium text-[var(--color-foreground)]">Start building</p>
                <p className="text-sm">Add a section from the left to begin.</p>
              </div>
            ) : (
              <BlockCanvas
                blocks={blocks}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onChange={updateBlock}
                onReorder={update}
                onDuplicate={duplicateBlock}
                onDelete={deleteBlock}
              />
            )}
          </div>
        </main>

        {/* Inspector */}
        <aside className="shrink-0 overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-background)] p-4 lg:w-80 lg:border-l lg:border-t-0">
          {selected ? (
            <BlockInspector block={selected} onChange={updateBlock} />
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Select a section to edit its content.
            </p>
          )}
        </aside>
      </div>

      {blocker.status === "blocked" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-xl">
            <div className="flex items-center gap-2 text-[var(--color-foreground)]">
              <TriangleAlert className="size-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Unsaved changes</h2>
            </div>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              You have changes that have not been saved. What would you like to do?
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                onClick={async () => {
                  await save.mutateAsync(payload());
                  blocker.proceed();
                }}
                disabled={save.isPending}
              >
                <Save /> Save and leave
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => blocker.reset()}>
                  Stay
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => blocker.proceed()}>
                  Leave without saving
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
