import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useBlocker } from "@tanstack/react-router";
import {
  ArrowLeft,
  ExternalLink,
  Monitor,
  PanelTop,
  Redo2,
  Rocket,
  Save,
  Settings,
  Smartphone,
  Tablet,
  TriangleAlert,
  Undo2,
  Users,
  Wand2,
} from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { toast } from "sonner";
import { BlockInspector } from "@/components/editor/block-inspector";
import { ChromeDialog } from "@/components/editor/chrome-dialog";
import { FreeCanvas } from "@/components/editor/free-canvas";
import { MembersDialog } from "@/components/editor/members-dialog";
import { Palette } from "@/components/editor/palette";
import { SiteSettingsDialog } from "@/components/editor/site-settings-dialog";
import { useHistory } from "@/components/editor/use-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type Block,
  type BlockType,
  BREAKPOINTS,
  createBlock,
  type Device,
  type Frame,
  GRID,
  getFrame,
  placeNewBlock,
  reflowFrame,
  setFrame as setDeviceFrame,
} from "@/lib/blocks";
import type { Footer, Header } from "@/lib/chrome";
import { orpc } from "@/lib/orpc";
import { type FontChoice, fontStack } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/sites/$siteId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      orpc.site.getDraft.queryOptions({ input: { id: params.siteId } }),
    ),
  component: Editor,
});

interface EditorState {
  name: string;
  description: string;
  ogImage: string;
  font: FontChoice;
  themeColor: string;
  blocks: Block[];
  header: Header;
  footer: Footer;
  canvasHeight: number;
  canvasHeightTablet: number;
  canvasHeightMobile: number;
}

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
  const { siteId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(orpc.site.getDraft.queryOptions({ input: { id: siteId } }));

  const initial: EditorState = {
    name: data.name,
    description: data.description,
    ogImage: data.ogImage,
    font: data.font as FontChoice,
    themeColor: data.themeColor,
    blocks: data.blocks,
    header: data.header,
    footer: data.footer,
    canvasHeight: data.canvasHeight,
    canvasHeightTablet: data.canvasHeightTablet ?? BREAKPOINTS.tablet.height,
    canvasHeightMobile: data.canvasHeightMobile ?? BREAKPOINTS.mobile.height,
  };

  const { state, set, undo, redo, canUndo, canRedo } = useHistory<EditorState>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(data.blocks[0]?.id ?? null);
  const [device, setDevice] = useState<Device>("desktop");
  const [dialog, setDialog] = useState<"settings" | "chrome" | "members" | null>(null);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));

  const heightKey =
    device === "tablet"
      ? "canvasHeightTablet"
      : device === "mobile"
        ? "canvasHeightMobile"
        : "canvasHeight";
  const currentHeight = state[heightKey];
  const setCurrentHeight = (h: number) => set({ ...state, [heightKey]: Math.max(400, h) });

  const currentJson = JSON.stringify(state);
  const dirty = currentJson !== savedJson;
  const selected = state.blocks.find((b) => b.id === selectedId) ?? null;

  const setBlocks = (blocks: Block[]) => set({ ...state, blocks });

  function addBlock(type: BlockType) {
    const block = { ...createBlock(type), frame: placeNewBlock(type, state.blocks) } as Block;
    setBlocks([...state.blocks, block]);
    setSelectedId(block.id);
  }

  function updateBlock(updated: Block) {
    setBlocks(state.blocks.map((b) => (b.id === updated.id ? updated : b)));
  }

  function duplicateBlock(id: string) {
    const original = state.blocks.find((b) => b.id === id);
    if (!original) return;
    const shift = (f: Frame | undefined) =>
      f ? { ...f, x: f.x + GRID * 2, y: f.y + GRID * 2 } : undefined;
    const copy = {
      ...original,
      id: crypto.randomUUID(),
      frame: shift(original.frame),
      frameTablet: shift(original.frameTablet),
      frameMobile: shift(original.frameMobile),
    } as Block;
    setBlocks([...state.blocks, copy]);
    setSelectedId(copy.id);
  }

  function deleteBlock(id: string) {
    setBlocks(state.blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  // Layering: set the selected block's z above or below all others on the
  // current breakpoint.
  function restack(id: string, where: "front" | "back") {
    const block = state.blocks.find((b) => b.id === id);
    if (!block) return;
    const zs = state.blocks.map((b) => getFrame(b, device).z ?? 1);
    const z = where === "front" ? Math.max(...zs) + 1 : Math.max(0, Math.min(...zs) - 1);
    updateBlock(setDeviceFrame(block, device, { ...getFrame(block, device), z }));
  }

  // Move the selected block by a small step on the current breakpoint.
  function nudge(id: string, dx: number, dy: number) {
    const block = state.blocks.find((b) => b.id === id);
    if (!block) return;
    const f = getFrame(block, device);
    updateBlock(
      setDeviceFrame(block, device, { ...f, x: Math.max(0, f.x + dx), y: Math.max(0, f.y + dy) }),
    );
  }

  // Auto-adapt every block's layout to the current breakpoint from its desktop
  // frame, so a smaller screen starts from a sensible reflow.
  function adaptToDevice() {
    if (device === "desktop") return;
    const toWidth = BREAKPOINTS[device].width;
    setBlocks(
      state.blocks.map((b) =>
        setDeviceFrame(
          b,
          device,
          reflowFrame(getFrame(b, "desktop"), BREAKPOINTS.desktop.width, toWidth),
        ),
      ),
    );
    toast.success(`Layout für ${BREAKPOINTS[device].label} angepasst`);
  }

  const payload = () => ({
    id: siteId,
    name: state.name,
    description: state.description,
    ogImage: state.ogImage,
    font: state.font,
    themeColor: state.themeColor,
    blocks: state.blocks,
    header: state.header,
    footer: state.footer,
    canvasHeight: state.canvasHeight,
    canvasHeightTablet: state.canvasHeightTablet,
    canvasHeightMobile: state.canvasHeightMobile,
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
        if (notify) toast.success("Entwurf gespeichert");
      },
    });
  }

  function handlePublish() {
    const json = currentJson;
    publish.mutate(payload(), {
      onSuccess: async () => {
        setSavedJson(json);
        await queryClient.invalidateQueries({ queryKey: orpc.site.getPublished.key() });
        await queryClient.invalidateQueries({ queryKey: orpc.site.listMine.key() });
        toast.success("Seite veröffentlicht");
      },
    });
  }

  // Autosave the draft a short moment after edits settle.
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
        return;
      }
      if (e.key.startsWith("Arrow") && !isTextTarget(e.target) && selectedId) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        nudge(selectedId, dx, dy);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, undo, redo, state.blocks, device]);

  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: () => dirty,
    withResolver: true,
  });

  const status =
    save.isPending || publish.isPending
      ? "Speichert…"
      : dirty
        ? "Nicht gespeichert"
        : "Gespeichert";

  const themeStyle = {
    "--color-primary": state.themeColor,
    "--color-primary-foreground": "#ffffff",
    fontFamily: fontStack(state.font),
  } as CSSProperties;

  return (
    <div className="flex h-screen flex-col bg-[var(--color-muted)]">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-background)] px-3 sm:px-4">
        <Button variant="ghost" size="icon" asChild aria-label="Zurück">
          <Link to="/admin">
            <ArrowLeft />
          </Link>
        </Button>
        <Input
          value={state.name}
          onChange={(e) => set({ ...state, name: e.target.value })}
          className="h-8 max-w-44"
          aria-label="Seitenname"
        />

        <div className="ml-1 flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            disabled={!canUndo}
            onClick={undo}
            aria-label="Rückgängig"
            title="Rückgängig"
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={!canRedo}
            onClick={redo}
            aria-label="Wiederholen"
            title="Wiederholen"
          >
            <Redo2 />
          </Button>
        </div>

        <div className="ml-2 hidden items-center gap-0.5 rounded-md border border-[var(--color-border)] p-0.5 md:flex">
          <DeviceToggle
            active={device === "desktop"}
            label="Desktop"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="size-4" />
          </DeviceToggle>
          <DeviceToggle
            active={device === "tablet"}
            label="Tablet"
            onClick={() => setDevice("tablet")}
          >
            <Tablet className="size-4" />
          </DeviceToggle>
          <DeviceToggle
            active={device === "mobile"}
            label="Mobil"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="size-4" />
          </DeviceToggle>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline">
            {status}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDialog("chrome")}
            aria-label="Kopf- und Fußzeile"
            title="Kopf- und Fußzeile"
          >
            <PanelTop />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDialog("members")}
            aria-label="Bearbeiter"
            title="Bearbeiter"
          >
            <Users />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDialog("settings")}
            aria-label="Einstellungen"
            title="Einstellungen"
          >
            <Settings />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/${data.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink /> <span className="hidden sm:inline">Ansehen</span>
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={save.isPending || !dirty}
            onClick={() => persistDraft(currentJson, true)}
          >
            <Save /> <span className="hidden sm:inline">Speichern</span>
          </Button>
          <Button size="sm" disabled={publish.isPending} onClick={handlePublish}>
            <Rocket /> Veröffentlichen
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="shrink-0 overflow-y-auto border-b border-[var(--color-border)] bg-[var(--color-background)] p-3 lg:w-56 lg:border-b-0 lg:border-r">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Abschnitt hinzufügen
          </p>
          <Palette onAdd={addBlock} />
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <div style={themeStyle} className="mx-auto max-w-5xl">
            <FreeCanvas
              blocks={state.blocks}
              device={device}
              height={currentHeight}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={updateBlock}
              onDuplicate={duplicateBlock}
              onDelete={deleteBlock}
            />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--color-muted-foreground)]">
              <span>
                {BREAKPOINTS[device].label} · {BREAKPOINTS[device].width}px breit
              </span>
              <span className="flex items-center gap-2">
                <label htmlFor="canvas-height">Höhe</label>
                <input
                  id="canvas-height"
                  type="number"
                  min={400}
                  step={40}
                  value={currentHeight}
                  onChange={(e) => setCurrentHeight(Number(e.target.value))}
                  className="h-8 w-24 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-center"
                />
              </span>
              {device !== "desktop" ? (
                <Button type="button" variant="outline" size="sm" onClick={adaptToDevice}>
                  <Wand2 /> An {BREAKPOINTS[device].label} anpassen
                </Button>
              ) : null}
            </div>
          </div>
        </main>

        <aside className="shrink-0 overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-background)] p-4 lg:w-80 lg:border-l lg:border-t-0">
          {selected ? (
            <BlockInspector
              block={selected}
              device={device}
              onChange={updateBlock}
              onBringToFront={() => restack(selected.id, "front")}
              onSendToBack={() => restack(selected.id, "back")}
            />
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Wähle ein Element aus, um es zu bearbeiten. Ziehe Elemente frei auf der Fläche und
              passe Größe, Farben und Position an. Über die Geräte-Symbole oben gestaltest du eigene
              Layouts für Tablet und Mobil.
            </p>
          )}
        </aside>
      </div>

      {dialog === "settings" ? (
        <SiteSettingsDialog
          meta={{
            description: state.description,
            ogImage: state.ogImage,
            font: state.font,
            themeColor: state.themeColor,
          }}
          onChange={(meta) => set({ ...state, ...meta })}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog === "chrome" ? (
        <ChromeDialog
          header={state.header}
          footer={state.footer}
          onChangeHeader={(header) => set({ ...state, header })}
          onChangeFooter={(footer) => set({ ...state, footer })}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog === "members" ? (
        <MembersDialog siteId={siteId} onClose={() => setDialog(null)} />
      ) : null}

      {blocker.status === "blocked" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-xl">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Nicht gespeicherte Änderungen</h2>
            </div>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              Es gibt Änderungen, die noch nicht gespeichert wurden. Was möchtest du tun?
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
                <Save /> Speichern und verlassen
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => blocker.reset()}>
                  Bleiben
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => blocker.proceed()}>
                  Ohne Speichern verlassen
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DeviceToggle({
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
