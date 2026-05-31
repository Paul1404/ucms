import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import {
  ExternalLink,
  LogOut,
  Monitor,
  Redo2,
  Rocket,
  Save,
  Settings,
  Smartphone,
  Tablet,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { toast } from "sonner";
import { BlockCanvas } from "@/components/editor/block-canvas";
import { BlockInspector } from "@/components/editor/block-inspector";
import { Palette } from "@/components/editor/palette";
import { SiteSettingsDialog } from "@/components/editor/site-settings-dialog";
import { useHistory } from "@/components/editor/use-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "@/lib/auth-client";
import { type Block, type BlockType, createBlock } from "@/lib/blocks";
import { orpc } from "@/lib/orpc";
import { TEMPLATES } from "@/lib/templates";
import { type FontChoice, fontStack } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(orpc.site.getDraft.queryOptions()),
  component: Editor,
});

interface EditorState {
  name: string;
  description: string;
  ogImage: string;
  font: FontChoice;
  themeColor: string;
  blocks: Block[];
}

type Device = "desktop" | "tablet" | "mobile";
const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "max-w-5xl",
  tablet: "max-w-2xl",
  mobile: "max-w-sm",
};

function isTextTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT"
  );
}

function Editor() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(orpc.site.getDraft.queryOptions());

  const initial: EditorState = {
    name: data.name,
    description: data.description,
    ogImage: data.ogImage,
    font: data.font as FontChoice,
    themeColor: data.themeColor,
    blocks: data.blocks,
  };

  const { state, set, undo, redo, canUndo, canRedo } = useHistory<EditorState>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(data.blocks[0]?.id ?? null);
  const [device, setDevice] = useState<Device>("desktop");
  const [showSettings, setShowSettings] = useState(false);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));

  const currentJson = JSON.stringify(state);
  const dirty = currentJson !== savedJson;

  const selected = state.blocks.find((b) => b.id === selectedId) ?? null;

  const setBlocks = (blocks: Block[]) => set({ ...state, blocks });

  function addBlock(type: BlockType) {
    const block = createBlock(type);
    const index = state.blocks.findIndex((b) => b.id === selectedId);
    const next = [...state.blocks];
    next.splice(index >= 0 ? index + 1 : next.length, 0, block);
    setBlocks(next);
    setSelectedId(block.id);
  }

  function updateBlock(updated: Block) {
    setBlocks(state.blocks.map((b) => (b.id === updated.id ? updated : b)));
  }

  function duplicateBlock(id: string) {
    const index = state.blocks.findIndex((b) => b.id === id);
    const original = state.blocks[index];
    if (!original) return;
    const copy = { ...original, id: crypto.randomUUID() } as Block;
    const next = [...state.blocks];
    next.splice(index + 1, 0, copy);
    setBlocks(next);
    setSelectedId(copy.id);
  }

  function deleteBlock(id: string) {
    setBlocks(state.blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const payload = () => ({
    name: state.name,
    description: state.description,
    ogImage: state.ogImage,
    font: state.font,
    themeColor: state.themeColor,
    blocks: state.blocks,
  });

  const save = useMutation(
    orpc.site.save.mutationOptions({ onError: (error) => toast.error(error.message) }),
  );
  const publish = useMutation(
    orpc.site.publish.mutationOptions({ onError: (error) => toast.error(error.message) }),
  );

  function persistDraft(json: string, notify = false) {
    save.mutate(payload(), {
      onSuccess: () => {
        setSavedJson(json);
        if (notify) toast.success("Draft saved");
      },
    });
  }

  function handlePublish() {
    const json = currentJson;
    publish.mutate(payload(), {
      onSuccess: async () => {
        setSavedJson(json);
        await queryClient.invalidateQueries({ queryKey: orpc.site.get.key() });
        toast.success("Site published");
      },
    });
  }

  // Autosave the draft a short moment after edits settle. Keyed on the
  // serialized state so it re-arms whenever the content changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: debounced on serialized state by design
  useEffect(() => {
    if (!dirty || save.isPending || publish.isPending) return;
    const timer = setTimeout(() => persistDraft(currentJson), 1200);
    return () => clearTimeout(timer);
  }, [currentJson, dirty]);

  // Keyboard shortcuts: undo/redo, deselect, delete selected.
  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers read latest state via closure on listed deps
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !isTextTarget(e.target)) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y" && !isTextTarget(e.target)) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Escape") {
        if (isTextTarget(e.target)) (e.target as HTMLElement).blur();
        else setSelectedId(null);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !isTextTarget(e.target) && selectedId) {
        e.preventDefault();
        deleteBlock(selectedId);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, undo, redo, state.blocks]);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: () => dirty,
    withResolver: true,
  });

  const status = save.isPending || publish.isPending ? "Saving…" : dirty ? "Unsaved" : "Saved";

  const themeStyle = {
    "--color-primary": state.themeColor,
    "--color-primary-foreground": "#ffffff",
    fontFamily: fontStack(state.font),
  } as CSSProperties;

  return (
    <div className="flex h-screen flex-col bg-[var(--color-muted)]">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-background)] px-3 sm:px-4">
        <span className="hidden font-semibold sm:inline">ucms</span>
        <Input
          value={state.name}
          onChange={(e) => set({ ...state, name: e.target.value })}
          className="h-8 max-w-44"
          aria-label="Site name"
        />

        <div className="hidden items-center gap-0.5 rounded-md border border-[var(--color-border)] p-0.5 md:flex">
          <IconToggle
            active={device === "desktop"}
            label="Desktop"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="size-4" />
          </IconToggle>
          <IconToggle
            active={device === "tablet"}
            label="Tablet"
            onClick={() => setDevice("tablet")}
          >
            <Tablet className="size-4" />
          </IconToggle>
          <IconToggle
            active={device === "mobile"}
            label="Mobile"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="size-4" />
          </IconToggle>
        </div>

        <div className="ml-1 flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            disabled={!canUndo}
            onClick={undo}
            aria-label="Undo"
            title="Undo"
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={!canRedo}
            onClick={redo}
            aria-label="Redo"
            title="Redo"
          >
            <Redo2 />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline">
            {status}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            aria-label="Site settings"
            title="Site settings"
          >
            <Settings />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink /> <span className="hidden sm:inline">View</span>
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={save.isPending || !dirty}
            onClick={() => persistDraft(currentJson, true)}
          >
            <Save /> <span className="hidden sm:inline">Save</span>
          </Button>
          <Button size="sm" disabled={publish.isPending} onClick={handlePublish}>
            <Rocket /> Publish
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="shrink-0 overflow-y-auto border-b border-[var(--color-border)] bg-[var(--color-background)] p-3 lg:w-56 lg:border-b-0 lg:border-r">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Add section
          </p>
          <Palette onAdd={addBlock} />
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          {state.blocks.length === 0 ? (
            <EmptyState
              onTemplate={(blocks, themeColor) => {
                set({ ...state, blocks, themeColor });
                setSelectedId(blocks[0]?.id ?? null);
              }}
            />
          ) : (
            <div style={themeStyle} className={cn("mx-auto transition-all", DEVICE_WIDTH[device])}>
              <BlockCanvas
                blocks={state.blocks}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onChange={updateBlock}
                onReorder={setBlocks}
                onDuplicate={duplicateBlock}
                onDelete={deleteBlock}
              />
            </div>
          )}
        </main>

        <aside className="shrink-0 overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-background)] p-4 lg:w-80 lg:border-l lg:border-t-0">
          {selected ? (
            <BlockInspector block={selected} onChange={updateBlock} />
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Select a section to edit it, or click text on the page to edit it in place.
            </p>
          )}
        </aside>
      </div>

      {showSettings ? (
        <SiteSettingsDialog
          meta={{
            description: state.description,
            ogImage: state.ogImage,
            font: state.font,
            themeColor: state.themeColor,
          }}
          onChange={(meta) => set({ ...state, ...meta })}
          onClose={() => setShowSettings(false)}
        />
      ) : null}

      {blocker.status === "blocked" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-xl">
            <div className="flex items-center gap-2">
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
                  setSavedJson(currentJson);
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

function IconToggle({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "rounded p-1.5 transition-colors",
        active
          ? "bg-[var(--color-accent)] text-[var(--color-foreground)]"
          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ onTemplate }: { onTemplate: (blocks: Block[], themeColor: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Start building</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Pick a starter layout, or add a section from the left.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTemplate(t.build(), t.themeColor)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-left transition-colors hover:border-[var(--color-primary)]"
          >
            <span
              className="mb-3 block h-1.5 w-10 rounded-full"
              style={{ backgroundColor: t.themeColor }}
            />
            <span className="block font-medium">{t.label}</span>
            <span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">
              {t.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
