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
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BlockInspector } from "@/components/editor/block-inspector";
import { ChromeDialog } from "@/components/editor/chrome-dialog";
import { FreeCanvas } from "@/components/editor/free-canvas";
import { LayersPanel } from "@/components/editor/layers-panel";
import { MembersDialog } from "@/components/editor/members-dialog";
import { MultiInspector } from "@/components/editor/multi-inspector";
import { Palette } from "@/components/editor/palette";
import { SiteSettingsDialog } from "@/components/editor/site-settings-dialog";
import { useHistory } from "@/components/editor/use-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type AlignMode, alignFrames, type DistributeAxis, distributeFrames } from "@/lib/arrange";
import {
  applyLayerOrder,
  type Block,
  type BlockStyle,
  type BlockType,
  BREAKPOINTS,
  cloneMany,
  createBlock,
  type Device,
  type Frame,
  getFrame,
  groupIdsOf,
  placeNewBlock,
  reflowFrame,
  setFrame as setDeviceFrame,
  snap,
} from "@/lib/blocks";
import type { Footer, Header } from "@/lib/chrome";
import { readClipboard, writeClipboard } from "@/lib/clipboard";
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
  const [selectedIds, setSelectedIds] = useState<string[]>(
    data.blocks[0] ? [data.blocks[0].id] : [],
  );
  const [device, setDevice] = useState<Device>("desktop");
  const [dialog, setDialog] = useState<"settings" | "chrome" | "members" | null>(null);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  // Last cursor position over the canvas in design coordinates, so paste can
  // drop blocks under the pointer. A ref avoids re-rendering on every move.
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

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
  const selectedBlocks = state.blocks.filter((b) => selectedIds.includes(b.id));
  const selected = selectedBlocks.length === 1 ? selectedBlocks[0] : null;

  const setBlocks = (blocks: Block[]) => set({ ...state, blocks });

  // Replace several blocks at once (a drag or an arrange) as one history entry.
  function updateBlocks(updated: Block[]) {
    const map = new Map(updated.map((b) => [b.id, b]));
    setBlocks(state.blocks.map((b) => map.get(b.id) ?? b));
  }

  // Patch every selected block through `fn`, keeping unselected blocks as-is.
  function patchSelected(fn: (block: Block) => Block) {
    const ids = new Set(selectedIds);
    setBlocks(state.blocks.map((b) => (ids.has(b.id) ? fn(b) : b)));
  }

  // Selecting a block selects its whole group. Shift toggles membership.
  function selectBlock(id: string | null, additive: boolean) {
    if (id === null) {
      setSelectedIds([]);
      return;
    }
    const group = groupIdsOf(state.blocks, [id]);
    if (additive) {
      const already = selectedIds.includes(id);
      setSelectedIds(
        already
          ? selectedIds.filter((x) => !group.includes(x))
          : Array.from(new Set([...selectedIds, ...group])),
      );
    } else {
      setSelectedIds(group);
    }
  }

  function marqueeSelect(ids: string[], additive: boolean) {
    const expanded = groupIdsOf(state.blocks, ids);
    setSelectedIds(additive ? Array.from(new Set([...selectedIds, ...expanded])) : expanded);
  }

  function selectAll() {
    setSelectedIds(state.blocks.map((b) => b.id));
  }

  function addBlock(type: BlockType) {
    const block = { ...createBlock(type), frame: placeNewBlock(type, state.blocks) } as Block;
    setBlocks([...state.blocks, block]);
    setSelectedIds([block.id]);
  }

  function updateBlock(updated: Block) {
    setBlocks(state.blocks.map((b) => (b.id === updated.id ? updated : b)));
  }

  function duplicateSelected() {
    if (selectedBlocks.length === 0) return;
    const copies = cloneMany(selectedBlocks);
    setBlocks([...state.blocks, ...copies]);
    setSelectedIds(copies.map((b) => b.id));
  }

  function deleteSelected() {
    if (selectedIds.length === 0) return;
    const remove = new Set(selectedIds);
    setBlocks(state.blocks.filter((b) => !remove.has(b.id)));
    setSelectedIds([]);
  }

  function toggleHiddenSelected() {
    const first = selectedBlocks[0];
    if (!first) return;
    const hide = !first.style?.hidden;
    patchSelected((b) => ({ ...b, style: { ...(b.style ?? {}), hidden: hide } }) as Block);
  }

  // Toggle one block's visibility regardless of the current selection (used by
  // the layers panel).
  function toggleHiddenId(id: string) {
    setBlocks(
      state.blocks.map((b) =>
        b.id === id
          ? ({ ...b, style: { ...(b.style ?? {}), hidden: !b.style?.hidden } } as Block)
          : b,
      ),
    );
  }

  // Restack every block so the canvas matches an explicit top-to-bottom layer
  // order (the layers panel reorders by z on the current breakpoint).
  function reorderLayers(orderTopToBottom: string[]) {
    setBlocks(applyLayerOrder(state.blocks, orderTopToBottom, device));
  }

  // Clipboard: copy/cut put the whole selection on the editor clipboard (in
  // memory and mirrored to localStorage so it survives a reload and works
  // across sites); paste inserts fresh copies and selects them.
  function copySelected() {
    if (selectedBlocks.length === 0) return;
    writeClipboard(selectedBlocks);
    toast.success(
      selectedBlocks.length > 1 ? `${selectedBlocks.length} Elemente kopiert` : "Element kopiert",
    );
  }

  function cutSelected() {
    if (selectedBlocks.length === 0) return;
    writeClipboard(selectedBlocks);
    deleteSelected();
    toast.success("Ausgeschnitten");
  }

  function pasteClipboard() {
    const source = readClipboard();
    if (source.length === 0) return;
    // Drop the paste under the cursor when it is over the canvas, aligning the
    // selection's top-left to the pointer; otherwise nudge it off the original.
    const pos = pointerRef.current;
    let offset: { x: number; y: number } | undefined;
    if (pos) {
      const minX = Math.min(...source.map((b) => getFrame(b, device).x));
      const minY = Math.min(...source.map((b) => getFrame(b, device).y));
      offset = { x: snap(pos.x - minX), y: snap(pos.y - minY) };
    }
    const copies = cloneMany(source, offset);
    setBlocks([...state.blocks, ...copies]);
    setSelectedIds(copies.map((b) => b.id));
    toast.success(copies.length > 1 ? `${copies.length} Elemente eingefügt` : "Element eingefügt");
  }

  // Grouping is a tag on the blocks: members share a group id and select and
  // move together until ungrouped.
  function groupSelected() {
    if (selectedIds.length < 2) return;
    const gid = crypto.randomUUID();
    patchSelected((b) => ({ ...b, group: gid }) as Block);
    toast.success("Gruppiert");
  }

  function ungroupSelected() {
    if (!selectedBlocks.some((b) => b.group)) return;
    patchSelected((b) => ({ ...b, group: undefined }) as Block);
    toast.success("Gruppierung aufgehoben");
  }

  function applyStyleToSelected(patch: Partial<BlockStyle>) {
    patchSelected((b) => ({ ...b, style: { ...(b.style ?? {}), ...patch } }) as Block);
  }

  // Align or distribute the selection on the current breakpoint, committing all
  // moved frames as a single history entry.
  function arrangeSelected(fn: (frames: Frame[]) => Frame[]) {
    if (selectedBlocks.length < 2) return;
    const frames = selectedBlocks.map((b) => getFrame(b, device));
    const next = fn(frames);
    const map = new Map(selectedBlocks.map((b, i) => [b.id, next[i]] as const));
    setBlocks(
      state.blocks.map((b) => {
        const f = map.get(b.id);
        return f ? setDeviceFrame(b, device, f) : b;
      }),
    );
  }
  const alignSelected = (mode: AlignMode) => arrangeSelected((f) => alignFrames(f, mode));
  const distributeSelected = (axis: DistributeAxis) =>
    arrangeSelected((f) => distributeFrames(f, axis));

  // Layering: set the selected block's z above or below all others on the
  // current breakpoint.
  function restack(id: string, where: "front" | "back") {
    const block = state.blocks.find((b) => b.id === id);
    if (!block) return;
    const zs = state.blocks.map((b) => getFrame(b, device).z ?? 1);
    const z = where === "front" ? Math.max(...zs) + 1 : Math.max(0, Math.min(...zs) - 1);
    updateBlock(setDeviceFrame(block, device, { ...getFrame(block, device), z }));
  }

  // Move every selected block by a small step on the current breakpoint.
  function nudgeSelected(dx: number, dy: number) {
    if (selectedIds.length === 0) return;
    patchSelected((b) => {
      const f = getFrame(b, device);
      return setDeviceFrame(b, device, {
        ...f,
        x: Math.max(0, f.x + dx),
        y: Math.max(0, f.y + dy),
      });
    });
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

  // Keyboard shortcuts: undo/redo, clipboard, select all, group, arrange,
  // nudge, delete.
  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers read latest state via closure on listed deps
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const text = isTextTarget(e.target);
      const has = selectedIds.length > 0;
      const key = e.key.toLowerCase();

      if (mod && key === "z" && !text) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && key === "y" && !text) {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && key === "a" && !text) {
        e.preventDefault();
        selectAll();
        return;
      }
      if (mod && key === "c" && !text && has) {
        e.preventDefault();
        copySelected();
        return;
      }
      if (mod && key === "x" && !text && has) {
        e.preventDefault();
        cutSelected();
        return;
      }
      if (mod && key === "v" && !text) {
        e.preventDefault();
        pasteClipboard();
        return;
      }
      if (mod && key === "d" && !text && has) {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (mod && key === "g" && !text) {
        e.preventDefault();
        if (e.shiftKey) ungroupSelected();
        else groupSelected();
        return;
      }
      if (e.key === "Escape") {
        if (text) (e.target as HTMLElement).blur();
        else setSelectedIds([]);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !text && has) {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (e.key.startsWith("Arrow") && !text && has) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        nudgeSelected(dx, dy);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds, undo, redo, state.blocks, device]);

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

          <div className="mt-5">
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Ebenen
            </p>
            <LayersPanel
              blocks={state.blocks}
              device={device}
              selectedIds={selectedIds}
              onSelect={selectBlock}
              onReorder={reorderLayers}
              onToggleHidden={toggleHiddenId}
            />
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <div style={themeStyle} className="mx-auto max-w-5xl">
            <FreeCanvas
              blocks={state.blocks}
              device={device}
              height={currentHeight}
              selectedIds={selectedIds}
              onSelect={selectBlock}
              onMarquee={marqueeSelect}
              onChangeSingle={updateBlock}
              onChangeMany={updateBlocks}
              onDuplicate={duplicateSelected}
              onDelete={deleteSelected}
              onToggleHidden={toggleHiddenSelected}
              onHoverCanvas={(p) => {
                pointerRef.current = p;
              }}
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
          ) : selectedBlocks.length > 1 ? (
            <MultiInspector
              count={selectedBlocks.length}
              device={device}
              canGroup={selectedIds.length >= 2}
              canUngroup={selectedBlocks.some((b) => b.group)}
              onAlign={alignSelected}
              onDistribute={distributeSelected}
              onGroup={groupSelected}
              onUngroup={ungroupSelected}
              onApplyStyle={applyStyleToSelected}
              onDuplicate={duplicateSelected}
              onDelete={deleteSelected}
            />
          ) : (
            <div className="space-y-3 text-sm text-[var(--color-muted-foreground)]">
              <p>
                Wähle ein Element aus, um es zu bearbeiten. Ziehe Elemente frei auf der Fläche und
                passe Größe, Farben und Position an. Mit Shift-Klick wählst du mehrere Elemente, und
                ein Ziehen auf freier Fläche zieht einen Auswahlrahmen. Über die Geräte-Symbole oben
                gestaltest du eigene Layouts für Tablet und Mobil.
              </p>
              <div className="rounded-md border border-[var(--color-border)] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Tastenkürzel</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    <Shortcut keys="Shift + Klick" /> Mehrfachauswahl
                  </li>
                  <li>
                    <Shortcut keys="Strg/Cmd + A" /> Alles auswählen
                  </li>
                  <li>
                    <Shortcut keys="Strg/Cmd + G" /> Gruppieren (mit Shift: aufheben)
                  </li>
                  <li>
                    <Shortcut keys="Strg/Cmd + C / X / V" /> Kopieren / Ausschneiden / Einfügen
                  </li>
                  <li>
                    <Shortcut keys="Strg/Cmd + D" /> Duplizieren
                  </li>
                  <li>
                    <Shortcut keys="Strg/Cmd + Z" /> Rückgängig / Wiederholen
                  </li>
                  <li>
                    <Shortcut keys="Pfeiltasten" /> Verschieben (mit Shift: 10px)
                  </li>
                  <li>
                    <Shortcut keys="Entf" /> Löschen
                  </li>
                </ul>
              </div>
            </div>
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

function Shortcut({ keys }: { keys: string }) {
  return (
    <kbd className="mr-1.5 inline-block rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-foreground)]">
      {keys}
    </kbd>
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
