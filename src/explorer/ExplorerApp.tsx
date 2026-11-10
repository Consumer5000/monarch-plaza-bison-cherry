import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bookmark,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cylinder,
  Download,
  Eye,
  EyeOff,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  Orbit,
  Search,
  SlidersHorizontal,
  Star,
  Upload,
  Waypoints,
  Wind,
  X,
} from "lucide-react";
import { setHeld } from "./input";
import {
  directoryPermission,
  enrichTakenDates,
  filesFromDataTransfer,
  filesFromDirectory,
  libraryNameFromFiles,
  photosFromFiles,
  pickDirectory,
  readFolderMarks,
  rememberDirectory,
  rememberDirectoryPersistent,
  storedDirectory,
  supportsDirectoryPicker,
  writeFolderMarks,
} from "./load";
import {
  fetchLocalDates,
  fetchLocalManifest,
  fetchLocalMarks,
  openLocalFolder,
  photoFromLocal,
  probeLocal,
  saveLocalMarks,
} from "./local";
import { isSaved, readSaved } from "./persist";
import { allTags, formatBytes, formatWhen, visiblePhotos } from "./query";
import { useExplorer } from "./store";
import { MODE_LABEL, MODE_ORDER, emptyMark, type Mode, type Photo } from "./types";

const MODE_ICON: Record<Mode, typeof LayoutGrid> = {
  grid: LayoutGrid,
  gallery: Building2,
  float: Wind,
  tunnel: Cylinder,
  spiral: Orbit,
  maze: Waypoints,
};

function librarySummary(count: number, capped: boolean, skippedHeic: number) {
  const parts = [`${count} photos`];
  if (capped) parts.push("stopped at 2,000");
  if (skippedHeic) parts.push(`skipped ${skippedHeic} HEIC`);
  return parts.join(" · ");
}

async function ingestFiles(files: File[], folderName: string, writable: boolean) {
  useExplorer.getState().patch({
    busy: "Opening photos…",
    booting: useExplorer.getState().photos.length === 0,
  });
  try {
    const { photos, files: used, skippedHeic, capped } = await photosFromFiles(files, (message) => {
      useExplorer.getState().patch({ busy: message });
    });
    if (!photos.length) {
      useExplorer.getState().patch({ busy: "", booting: false, pendingDates: false });
      useExplorer.getState().toastMessage(
        skippedHeic
          ? "Those look like HEIC files. Export JPEG, PNG, or WebP — this browser cannot show HEIC."
          : "No JPEG, PNG, WebP, GIF, or AVIF images were found.",
      );
      return null;
    }
    useExplorer.getState().replaceLibrary(photos, folderName, "folder", writable);
    const epoch = useExplorer.getState().libraryEpoch;
    useExplorer.getState().patch({ pendingDates: true });
    void enrichTakenDates(photos, used)
      .then((updates) => {
        if (useExplorer.getState().libraryEpoch !== epoch) return;
        if (updates) {
          useExplorer.getState().applyTaken(epoch, updates);
          useExplorer.getState().toastMessage("Camera dates are in, so the rooms shifted to match.");
        } else {
          useExplorer.getState().patch({ pendingDates: false });
        }
      })
      .catch(() => {
        if (useExplorer.getState().libraryEpoch === epoch) useExplorer.getState().patch({ pendingDates: false });
      });
    return librarySummary(photos.length, capped, skippedHeic);
  } catch {
    useExplorer.getState().patch({ busy: "", booting: false, pendingDates: false });
    useExplorer.getState().toastMessage("Could not read those photos.");
    return null;
  }
}

async function loadLocalLibrary() {
  useExplorer.getState().patch({
    busy: "Reading the folder…",
    booting: useExplorer.getState().photos.length === 0,
  });
  const manifest = await fetchLocalManifest();
  const marks = await fetchLocalMarks();
  if (marks) useExplorer.getState().mergeSaved(marks);
  const photos = manifest.photos.map(photoFromLocal);
  if (!photos.length) {
    useExplorer.getState().patch({ busy: "", booting: false, pendingDates: false, localFolder: manifest.folder });
    useExplorer.getState().toastMessage(
      manifest.skippedHeic
        ? "Those look like HEIC files. Export JPEG, PNG, or WebP and try again."
        : "No JPEG, PNG, WebP, GIF, or AVIF images were found in that folder.",
    );
    return null;
  }
  useExplorer.getState().replaceLibrary(photos, manifest.name || "Folder", "folder", manifest.writable);
  const epoch = useExplorer.getState().libraryEpoch;
  useExplorer.getState().patch({ pendingDates: true, localFolder: manifest.folder, runtime: "local" });
  void fetchLocalDates()
    .then((updates) => {
      if (useExplorer.getState().libraryEpoch !== epoch) return;
      const current = new Map(useExplorer.getState().photos.map((photo) => [photo.id, photo.taken]));
      const map: Record<string, number> = {};
      let shifted = false;
      for (const item of updates) {
        const prev = current.get(item.id);
        if (prev == null) continue;
        map[item.id] = item.taken;
        if (Math.abs(prev - item.taken) > 60_000) shifted = true;
      }
      useExplorer.getState().applyTaken(epoch, map);
      if (shifted) useExplorer.getState().toastMessage("Camera dates are in, so the rooms shifted to match.");
    })
    .catch(() => {
      if (useExplorer.getState().libraryEpoch === epoch) useExplorer.getState().patch({ pendingDates: false });
    });
  const message = librarySummary(photos.length, manifest.capped, manifest.skippedHeic);
  return marks ? `${message} · loaded DriftHall/marks.json` : message;
}

async function loadDirectory(dir: FileSystemDirectoryHandle) {
  useExplorer.getState().patch({
    busy: "Listing folder…",
    booting: useExplorer.getState().photos.length === 0,
  });
  const writable = await directoryPermission(dir, "readwrite", false);
  const saved = await readFolderMarks(dir);
  if (saved) useExplorer.getState().mergeSaved(saved);
  const files = await filesFromDirectory(dir);
  const message = await ingestFiles(files, dir.name || "Folder", writable);
  if (message && saved) return `${message} · loaded DriftHall/marks.json`;
  return message;
}

export function ExplorerApp() {
  const state = useExplorer();
  const visible = visiblePhotos(state);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [resume, setResume] = useState<FileSystemDirectoryHandle | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [albumDraft, setAlbumDraft] = useState("");
  const [pathDraft, setPathDraft] = useState("");
  const pathInput = useRef<HTMLInputElement>(null);
  const folderSeen = useRef("");
  const dragDepth = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: { dispose: () => void } | null = null;
    let cancel = false;
    void import("./world").then((mod) => {
      if (cancel) return;
      handle = mod.mountWorld(canvas);
    });
    return () => {
      cancel = true;
      handle?.dispose();
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const saved = await readSaved();
      if (cancel) return;
      if (saved) useExplorer.getState().mergeSaved(saved);
      const status = await probeLocal();
      if (cancel) return;
      if (status?.local) {
        folderSeen.current = status.folder ?? "";
        useExplorer.getState().patch({ runtime: "local", localFolder: status.folder ?? "" });
        if (status.folder) {
          setPathDraft(status.folder);
          try {
            const message = await loadLocalLibrary();
            if (cancel) return;
            if (message) useExplorer.getState().toastMessage(message);
            else useExplorer.getState().patch({ booting: false, busy: "" });
          } catch {
            if (!cancel) {
              useExplorer.getState().patch({ booting: false, busy: "", pendingDates: false });
              useExplorer.getState().toastMessage("Could not read the saved folder.");
            }
          }
          return;
        }
        if (!cancel) useExplorer.getState().patch({ booting: false, busy: "" });
        return;
      }
      const dir = await storedDirectory();
      if (cancel) return;
      if (dir && (await directoryPermission(dir, "read", false))) {
        rememberDirectory(dir);
        try {
          const message = await loadDirectory(dir);
          if (cancel) return;
          if (message) useExplorer.getState().toastMessage(message);
          else useExplorer.getState().patch({ booting: false, busy: "" });
          return;
        } catch {
          if (!cancel) useExplorer.getState().patch({ booting: false, busy: "" });
        }
      } else if (dir && !cancel) {
        setResume(dir);
      }
      if (!cancel) useExplorer.getState().patch({ booting: false, busy: "" });
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (state.runtime !== "local") return;
    const timer = window.setInterval(() => {
      void probeLocal().then((status) => {
        const next = status?.folder ?? "";
        if (!next || next === folderSeen.current) return;
        folderSeen.current = next;
        setPathDraft(next);
        void loadLocalLibrary()
          .then((message) => {
            if (message) useExplorer.getState().toastMessage(message);
          })
          .catch(() => {
            useExplorer.getState().patch({ busy: "", booting: false, pendingDates: false });
          });
      });
    }, 2500);
    return () => window.clearInterval(timer);
  }, [state.runtime]);

  useEffect(() => {
    const hasFiles = (event: DragEvent) => [...(event.dataTransfer?.types ?? [])].includes("Files");
    const onEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setDragOver(true);
    };
    const onOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
    };
    const onLeave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragOver(false);
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragOver(false);
      const transfer = event.dataTransfer;
      if (!transfer) return;
      void (async () => {
        try {
          rememberDirectory(null);
          const files = await filesFromDataTransfer(transfer);
          const message = await ingestFiles(files, libraryNameFromFiles(files), false);
          if (message) useExplorer.getState().toastMessage(`${message} · marks stay in this browser`);
        } catch {
          useExplorer.getState().patch({ busy: "", booting: false });
          useExplorer.getState().toastMessage("Could not read that drop");
        }
      })();
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  async function openFolder() {
    if (useExplorer.getState().runtime === "local") {
      try {
        useExplorer.getState().patch({ busy: "Choose a folder…" });
        const status = await openLocalFolder({ pick: true });
        if (status.error || !status.folder) {
          useExplorer.getState().patch({ busy: "", drawerOpen: true });
          useExplorer.getState().toastMessage(status.error || "Choose a folder to fill the hall.");
          window.setTimeout(() => pathInput.current?.focus(), 40);
          return;
        }
        folderSeen.current = status.folder;
        setPathDraft(status.folder);
        const message = await loadLocalLibrary();
        if (message) useExplorer.getState().toastMessage(message);
      } catch (error) {
        useExplorer.getState().patch({ busy: "", booting: false, pendingDates: false });
        useExplorer.getState().toastMessage(error instanceof Error ? error.message : "Could not open that folder.");
      }
      return;
    }
    if (!supportsDirectoryPicker()) {
      folderInput.current?.click();
      return;
    }
    try {
      const dir = await pickDirectory();
      if (!dir) return;
      await rememberDirectoryPersistent(dir);
      setResume(null);
      const message = await loadDirectory(dir);
      if (message) useExplorer.getState().toastMessage(message);
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") return;
      useExplorer.getState().patch({ busy: "", booting: false });
      useExplorer.getState().toastMessage("Could not open that folder.");
    }
  }

  async function resumeFolder() {
    if (!resume) return;
    const granted = await directoryPermission(resume, "read", true);
    if (!granted) {
      state.toastMessage("Permission to read that folder was denied.");
      return;
    }
    rememberDirectory(resume);
    setResume(null);
    try {
      const message = await loadDirectory(resume);
      if (message) state.toastMessage(message);
    } catch {
      state.patch({ busy: "", booting: false });
      state.toastMessage("Could not reopen that folder.");
    }
  }

  function onClassicFolder(files: FileList | null) {
    const list = [...(files ?? [])];
    if (folderInput.current) folderInput.current.value = "";
    if (!list.length) return;
    rememberDirectory(null);
    void ingestFiles(list, libraryNameFromFiles(list), false).then((message) => {
      if (message) useExplorer.getState().toastMessage(`${message} · marks stay in this browser`);
    });
  }

  function step(delta: number) {
    if (!visible.length) return;
    const current = state.selectedId ?? state.aimId;
    let index = visible.findIndex((photo) => photo.id === current);
    if (index < 0) index = 0;
    else index = (index + delta + visible.length) % visible.length;
    state.requestFocus(visible[index]!.id);
  }

  function exportMarks() {
    const payload = { version: 1 as const, marks: state.marks, albums: state.albums };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drift-hall-marks.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importMarks(file: File | undefined) {
    if (!file) return;
    void file.text().then((text) => {
      try {
        const parsed: unknown = JSON.parse(text);
        if (!isSaved(parsed)) {
          state.toastMessage("That file is not a Drift Hall marks export.");
          return;
        }
        state.mergeSaved(parsed);
        state.toastMessage("Imported marks into this browser.");
      } catch {
        state.toastMessage("Could not read that file.");
      }
    });
  }

  async function saveIntoFolder() {
    const payload = { version: 1 as const, marks: state.marks, albums: state.albums };
    try {
      if (state.runtime === "local") await saveLocalMarks(payload);
      else await writeFolderMarks(payload);
      state.toastMessage("Wrote DriftHall/marks.json. The photos themselves were not modified.");
    } catch (error) {
      state.toastMessage(error instanceof Error ? error.message : "Could not write marks.");
    }
  }

  async function usePastedPath(event: FormEvent) {
    event.preventDefault();
    const path = pathDraft.trim();
    if (!path) return;
    try {
      useExplorer.getState().patch({ busy: "Opening that folder…" });
      const status = await openLocalFolder({ path });
      if (!status.folder) {
        useExplorer.getState().patch({ busy: "" });
        useExplorer.getState().toastMessage(status.error || "That folder could not be opened.");
        return;
      }
      folderSeen.current = status.folder;
      setPathDraft(status.folder);
      const message = await loadLocalLibrary();
      if (message) useExplorer.getState().toastMessage(message);
    } catch (error) {
      useExplorer.getState().patch({ busy: "", booting: false, pendingDates: false });
      useExplorer.getState().toastMessage(error instanceof Error ? error.message : "Could not open that folder.");
    }
  }

  const selected = state.photos.find((photo) => photo.id === state.selectedId) ?? null;
  const aimed = state.photos.find((photo) => photo.id === state.aimId) ?? null;
  const tags = allTags(state.marks);
  const cursor = Math.max(0, visible.findIndex((photo) => photo.id === (state.selectedId ?? state.aimId)));
  const stripStart = Math.max(0, Math.min(cursor - 6, Math.max(visible.length - 16, 0)));
  const strip = visible.slice(stripStart, stripStart + 16);
  const walking = state.mode === "gallery" || state.mode === "maze";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <LoadMeter />
      <canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full" aria-label="Photo space" />
      <input
        ref={(node) => {
          folderInput.current = node;
          node?.setAttribute("webkitdirectory", "");
          node?.setAttribute("directory", "");
        }}
        className="hidden"
        type="file"
        multiple
        onChange={(event) => onClassicFolder(event.target.files)}
      />
      <input
        ref={importInput}
        className="hidden"
        type="file"
        accept="application/json"
        onChange={(event) => {
          importMarks(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <header className="absolute inset-x-0 top-0 z-30 flex flex-col gap-2 px-3 pt-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <p className="font-display text-xl leading-none tracking-tight">Drift Hall</p>
            <p className="truncate text-xs text-muted">
              {state.busy
                ? state.busy
                : state.pendingDates
                  ? "Matching camera dates"
                  : state.photos.length === 0
                  ? state.runtime === "local"
                    ? "Opening your photos"
                    : "Opening the demo library"
                  : state.source === "demo"
                    ? state.runtime === "local"
                      ? "Sample library · choose a folder on this computer"
                      : "Sample library · open a folder for your own"
                    : state.folderName || "Library"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {resume ? (
              <button type="button" className={btn} onClick={() => void resumeFolder()}>
                Resume
              </button>
            ) : null}
            <button type="button" className={btn} onClick={() => void openFolder()}>
              <FolderOpen className="size-4" aria-hidden />
              <span className="hidden sm:inline">Open folder</span>
              <span className="sm:hidden">Open</span>
            </button>
            <button
              type="button"
              className={btn}
              aria-pressed={state.drawerOpen}
              onClick={() => state.patch({ drawerOpen: !state.drawerOpen })}
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              <span className="hidden md:inline">Library</span>
            </button>
            <button
              type="button"
              className={btn}
              aria-pressed={state.helpOpen}
              onClick={() => state.patch({ helpOpen: !state.helpOpen })}
            >
              <CircleHelp className="size-4" aria-hidden />
              <span className="sr-only">Help</span>
            </button>
          </div>
        </div>
        <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-1">
          {MODE_ORDER.map((mode, index) => {
            const Icon = MODE_ICON[mode];
            const on = state.mode === mode && state.surface === "space";
            return (
              <button
                key={mode}
                type="button"
                title={`${MODE_LABEL[mode]} (${index + 1})`}
                aria-pressed={on}
                className={`${btn} shrink-0 ${on ? onBtn : ""}`}
                onClick={() => state.setMode(mode)}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden md:inline">{MODE_LABEL[mode]}</span>
              </button>
            );
          })}
          <button
            type="button"
            className={`${btn} shrink-0 ${state.surface === "index" ? onBtn : ""}`}
            aria-pressed={state.surface === "index"}
            onClick={() => state.setSurface(state.surface === "index" ? "space" : "index")}
          >
            <ImageIcon className="size-4" aria-hidden />
            <span className="hidden md:inline">Index</span>
          </button>
          <span className="ml-auto hidden shrink-0 items-center px-2 text-xs tracking-[0.18em] text-brass sm:flex">
            {state.heading}
          </span>
        </div>
      </header>

      {state.surface === "space" && !state.helpOpen ? (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="relative size-8">
            <span className="absolute top-0 left-1/2 h-2.5 w-px -translate-x-1/2 bg-tide shadow-[0_0_8px_var(--color-tide)]" />
            <span className="absolute bottom-0 left-1/2 h-2.5 w-px -translate-x-1/2 bg-tide shadow-[0_0_8px_var(--color-tide)]" />
            <span className="absolute top-1/2 left-0 h-px w-2.5 -translate-y-1/2 bg-tide shadow-[0_0_8px_var(--color-tide)]" />
            <span className="absolute top-1/2 right-0 h-px w-2.5 -translate-y-1/2 bg-tide shadow-[0_0_8px_var(--color-tide)]" />
            <span className="absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tide" />
          </div>
          {aimed ? (
            <p className="mt-2 max-w-56 truncate text-center text-xs text-fg/90">{aimed.caption || aimed.name}</p>
          ) : null}
        </div>
      ) : null}

      {state.surface === "index" ? (
        <section className="absolute inset-0 z-20 overflow-y-auto bg-bg/95 px-3 pt-32 pb-8">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visible.map((photo) => (
              <button
                key={photo.id}
                type="button"
                className="overflow-hidden rounded-md border border-line bg-surface text-left"
                onClick={() => state.requestFocus(photo.id)}
              >
                <img src={photo.thumb} alt="" className="aspect-square w-full object-cover" loading="lazy" decoding="async" />
                <span className="block truncate px-2 py-1.5 text-xs text-muted">{formatWhen(photo.taken)}</span>
              </button>
            ))}
          </div>
          {!state.booting && !visible.length ? <EmptyFilter /> : null}
        </section>
      ) : null}

      {state.surface === "space" ? (
        <div className="absolute inset-x-0 bottom-16 z-20 px-3">
          <div className="pointer-events-none mb-1 hidden items-center justify-between text-[11px] text-muted md:flex">
            <span>
              {state.mode === "maze"
                ? "WASD walk · lamp follows your look · Q R turn · E inspect · F star"
                : walking
                  ? "WASD walk · drag or double-click to look · Q R turn · E inspect · F star"
                  : "WASD fly · drag or double-click to look · Space up · C down · E inspect · F star"}
            </span>
            <span>
              {visible.length} showing
              {state.loadedTextures ? ` · ${state.loadedTextures} sharp` : ""}
              {state.omitted ? ` · ${state.omitted} outside the maze` : ""}
            </span>
          </div>
          {visible.length ? (
            <>
              <div className="mb-2 flex items-center gap-2">
                <button type="button" className={btn} onClick={() => step(-1)} aria-label="Previous photo">
                  <ChevronLeft className="size-4" />
                </button>
                <input
                  className="h-11 min-w-0 flex-1"
                  type="range"
                  min={0}
                  max={Math.max(visible.length - 1, 0)}
                  value={Math.min(cursor, Math.max(visible.length - 1, 0))}
                  aria-label="Scrub by date"
                  onChange={(event) => {
                    const photo = visible[Number(event.target.value)];
                    if (photo) state.requestFocus(photo.id);
                  }}
                />
                <button type="button" className={btn} onClick={() => step(1)} aria-label="Next photo">
                  <ChevronRight className="size-4" />
                </button>
                <span className="hidden w-28 shrink-0 text-right text-xs text-muted sm:block">
                  {formatWhen(visible[Math.min(cursor, visible.length - 1)]!.taken)}
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {strip.map((photo, index) => {
                  const on = photo.id === (state.selectedId ?? state.aimId);
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      title={`${photo.name} · ${formatWhen(photo.taken)}`}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border ${on ? "border-brass" : "border-line"}`}
                      onClick={() => state.requestFocus(photo.id)}
                    >
                      <img
                        src={photo.thumb}
                        alt=""
                        className="h-full w-full object-cover"
                        loading={index < 8 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    </button>
                  );
                })}
              </div>
            </>
          ) : state.booting ? null : (
            <EmptyFilter />
          )}
        </div>
      ) : null}

      <div className={`${selected || state.drawerOpen || state.helpOpen ? "hidden" : "absolute bottom-[15.5rem] left-3 z-20 grid grid-cols-3 gap-1 md:hidden"}`}>
        <Hold code="KeyQ" label="Q" />
        <Hold code="KeyW" label="W" />
        <Hold code="KeyR" label="R" />
        <Hold code="KeyA" label="A" />
        <Hold code="KeyS" label="S" />
        <Hold code="KeyD" label="D" />
        <Hold code="KeyC" label="C" />
        <Hold code="Space" label="Up" />
        <button type="button" className={pad} onClick={() => state.patch({ helpOpen: true })}>
          ?
        </button>
      </div>

      {state.drawerOpen ? (
        <aside className="absolute top-0 left-0 z-40 flex h-full w-[min(100%,22rem)] flex-col gap-4 overflow-y-auto border-r border-line bg-surface/95 p-4 pt-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Library</h2>
            <button type="button" className={btn} onClick={() => state.patch({ drawerOpen: false })} aria-label="Close library">
              <X className="size-4" />
            </button>
          </div>
          <p className="text-sm text-muted">
            {visible.length} of {state.photos.length || 0} photos
            {state.runtime === "local" && state.localFolder ? ` · ${state.localFolder}` : ""}
          </p>
          {state.runtime === "local" ? (
            <form className="flex gap-1.5" onSubmit={(event) => void usePastedPath(event)}>
              <input
                ref={pathInput}
                className={field}
                value={pathDraft}
                placeholder="Paste a folder path"
                onChange={(event) => setPathDraft(event.target.value)}
              />
              <button type="submit" className={btn}>
                Use
              </button>
            </form>
          ) : null}
          <label className="relative block">
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" />
            <input
              className={`${field} pl-9`}
              value={state.query}
              placeholder="Search name, place, tag, note"
              onChange={(event) => state.patch({ query: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Sort
            <select className={field} value={state.sort} onChange={(event) => state.patch({ sort: event.target.value as typeof state.sort })}>
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
              <option value="name">Name</option>
              <option value="folder">Folder</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-muted">
              From
              <input className={field} type="date" value={state.from} onChange={(event) => state.patch({ from: event.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              To
              <input className={field} type="date" value={state.to} onChange={(event) => state.patch({ to: event.target.value })} />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={state.starredOnly} onChange={(event) => state.patch({ starredOnly: event.target.checked })} />
            Starred only
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={state.showHidden} onChange={(event) => state.patch({ showHidden: event.target.checked })} />
            Show hidden
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Gallery rooms grouped by
            <select className={field} value={state.groupBy} onChange={(event) => state.patch({ groupBy: event.target.value as typeof state.groupBy })}>
              <option value="date">Date</option>
              <option value="folder">Folder</option>
            </select>
          </label>
          {tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`${chip} ${state.tag === tag ? onBtn : ""}`}
                  onClick={() => state.patch({ tag: state.tag === tag ? null : tag })}
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : null}
          {state.albums.length ? (
            <div className="flex flex-wrap gap-1.5">
              {state.albums.map((album) => (
                <button
                  key={album}
                  type="button"
                  className={`${chip} ${state.album === album ? onBtn : ""}`}
                  onClick={() => state.patch({ album: state.album === album ? null : album })}
                >
                  <Bookmark className="size-3.5" aria-hidden />
                  {album}
                </button>
              ))}
            </div>
          ) : null}
          <label className="flex flex-col gap-1 text-xs text-muted">
            Fog {state.fog.toFixed(3)}
            <input type="range" min={0} max={0.05} step={0.001} value={state.fog} onChange={(event) => state.patch({ fog: Number(event.target.value) })} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Speed {state.speed.toFixed(2)}
            <input type="range" min={0.4} max={2.2} step={0.05} value={state.speed} onChange={(event) => state.patch({ speed: Number(event.target.value) })} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Grid columns {state.cols}
            <input type="range" min={2} max={10} step={1} value={state.cols} onChange={(event) => state.patch({ cols: Number(event.target.value) })} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Photo size {state.size.toFixed(2)}
            <input type="range" min={0.9} max={2.8} step={0.05} value={state.size} onChange={(event) => state.patch({ size: Number(event.target.value) })} />
          </label>
          <div className="flex gap-2">
            <button type="button" className={`${btn} ${state.quality === "fast" ? onBtn : ""}`} onClick={() => state.patch({ quality: "fast" })}>
              Fast textures
            </button>
            <button type="button" className={`${btn} ${state.quality === "sharp" ? onBtn : ""}`} onClick={() => state.patch({ quality: "sharp" })}>
              Sharp
            </button>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={state.autoGlide} onChange={(event) => state.patch({ autoGlide: event.target.checked })} />
            Auto-glide in fly modes
          </label>
          <div className="mt-2 flex flex-col gap-2 border-t border-line pt-4">
            <button type="button" className={btn} onClick={exportMarks}>
              <Download className="size-4" /> Export marks
            </button>
            <button type="button" className={btn} onClick={() => importInput.current?.click()}>
              <Upload className="size-4" /> Import marks
            </button>
            <button
              type="button"
              className={btn}
              disabled={!state.writable}
              title={
                state.writable
                  ? "Write DriftHall/marks.json into the opened folder"
                  : "Use Open folder and allow editing. Drag-and-drop and the classic picker stay in this browser only."
              }
              onClick={() => void saveIntoFolder()}
            >
              Save into folder
            </button>
            <p className="text-xs leading-relaxed text-muted">
              Marks are kept in this browser. Saving into a folder writes a sidecar, never the original files.
              {state.runtime === "local"
                ? " This copy reads pictures straight from the folder."
                : state.writable
                  ? ""
                  : " Drag, drop, and the basic picker cannot write back."}
            </p>
          </div>
        </aside>
      ) : null}

      {selected ? (
        <Inspector
          photo={selected}
          tagDraft={tagDraft}
          albumDraft={albumDraft}
          albums={state.albums}
          onTagDraft={setTagDraft}
          onAlbumDraft={setAlbumDraft}
          onClose={() => state.patch({ selectedId: null })}
          onStep={step}
        />
      ) : null}

      {state.helpOpen ? <Help onClose={() => state.patch({ helpOpen: false })} /> : null}

      {state.booting && state.photos.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-6">
          <p className="rounded-md border border-line bg-surface/95 px-4 py-3 font-display text-lg">Opening the demo library</p>
        </div>
      ) : null}
      {state.busy && !state.booting ? (
        <p className="pointer-events-none absolute top-28 left-1/2 z-40 -translate-x-1/2 rounded-md border border-line bg-surface/95 px-3 py-2 text-sm">
          {state.busy}
        </p>
      ) : null}
      {state.toast ? (
        <p className="absolute bottom-40 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-md border border-line bg-surface px-3 py-2 text-center text-sm shadow-lg">
          {state.toast}
        </p>
      ) : null}
      {dragOver ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/80">
          <p className="font-display text-3xl text-brass">Drop a folder of photos</p>
        </div>
      ) : null}
    </main>
  );
}

function LoadMeter() {
  const busy = useExplorer((s) => s.busy);
  const pendingDates = useExplorer((s) => s.pendingDates);
  const loaded = useExplorer((s) => s.loadedTextures);
  const count = useExplorer((s) => s.photos.length);
  const target = Math.min(12, count);
  const warming = loaded > 0 && target > 0 && loaded < target;
  const show = Boolean(busy) || pendingDates || warming;
  if (!show) return null;
  const label = busy || (pendingDates ? "Matching camera dates" : "Bringing pictures into the hall");
  const determinate = warming && !busy;
  const width = determinate ? Math.max(8, Math.round((loaded / target) * 100)) : 38;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-50 h-1 overflow-hidden bg-line/80"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={determinate ? width : undefined}
    >
      <div className={`h-full bg-tide ${determinate ? "" : "tide-slide"}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function EmptyFilter() {
  return (
    <p className="rounded-md border border-line bg-surface/90 px-3 py-2 text-sm text-muted">
      Nothing matches these filters. Clear the search, dates, or starred view.
    </p>
  );
}

function Hold({ code, label }: { code: string; label: string }) {
  return (
    <button
      type="button"
      className={pad}
      onPointerDown={(event) => {
        event.preventDefault();
        setHeld(code, true);
      }}
      onPointerUp={() => setHeld(code, false)}
      onPointerCancel={() => setHeld(code, false)}
      onPointerLeave={() => setHeld(code, false)}
    >
      {label}
    </button>
  );
}

function Inspector({
  photo,
  tagDraft,
  albumDraft,
  albums,
  onTagDraft,
  onAlbumDraft,
  onClose,
  onStep,
}: {
  photo: Photo;
  tagDraft: string;
  albumDraft: string;
  albums: string[];
  onTagDraft: (value: string) => void;
  onAlbumDraft: (value: string) => void;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const mark = useExplorer((s) => s.marks[photo.id] ?? emptyMark());
  const toggleStar = useExplorer((s) => s.toggleStar);
  const toggleHidden = useExplorer((s) => s.toggleHidden);
  const setNote = useExplorer((s) => s.setNote);
  const addTag = useExplorer((s) => s.addTag);
  const removeTag = useExplorer((s) => s.removeTag);
  const createAlbum = useExplorer((s) => s.createAlbum);
  const toggleAlbum = useExplorer((s) => s.toggleAlbum);

  return (
    <aside className="absolute inset-x-2 bottom-36 z-50 max-h-[48%] overflow-y-auto rounded-md border border-line bg-surface/95 p-3 backdrop-blur-md md:inset-x-auto md:top-28 md:right-3 md:bottom-36 md:w-80 md:max-h-none">
      <div className="mb-2 flex items-start gap-2">
        <img src={photo.thumb} alt="" className="h-16 w-16 rounded-md object-cover" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg">{photo.caption || photo.name}</h2>
          <p className="truncate text-xs text-muted">{photo.name}</p>
        </div>
        <button type="button" className={btn} onClick={onClose} aria-label="Close details">
          <X className="size-4" />
        </button>
      </div>
      <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
        <div>
          <dt>Taken</dt>
          <dd className="text-sm text-fg">{formatWhen(photo.taken)}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd className="text-sm text-fg">{formatBytes(photo.bytes)}</dd>
        </div>
        <div className="col-span-2">
          <dt>Folder</dt>
          <dd className="truncate text-sm text-fg">{photo.folder}</dd>
        </div>
      </dl>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <button type="button" className={`${btn} ${mark.starred ? onBtn : ""}`} onClick={() => toggleStar(photo.id)}>
          <Star className={`size-4 ${mark.starred ? "fill-brass" : ""}`} />
          {mark.starred ? "Starred" : "Star"}
        </button>
        <button type="button" className={btn} onClick={() => toggleHidden(photo.id)}>
          {mark.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          {mark.hidden ? "Unhide" : "Hide"}
        </button>
        <button type="button" className={btn} onClick={() => onStep(-1)} aria-label="Previous">
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" className={btn} onClick={() => onStep(1)} aria-label="Next">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <form
        className="mb-2 flex gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          addTag(photo.id, tagDraft);
          onTagDraft("");
        }}
      >
        <input className={field} value={tagDraft} placeholder="Add a tag" onChange={(event) => onTagDraft(event.target.value)} />
        <button type="submit" className={btn}>
          Add
        </button>
      </form>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {mark.tags.map((tag) => (
          <button key={tag} type="button" className={chip} onClick={() => removeTag(photo.id, tag)}>
            {tag} <X className="size-3" />
          </button>
        ))}
      </div>
      <textarea
        className={`${field} mb-3 min-h-24 py-2`}
        value={mark.note}
        placeholder="Note"
        maxLength={2000}
        onChange={(event) => setNote(photo.id, event.target.value)}
      />
      <form
        className="mb-2 flex gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          createAlbum(albumDraft);
          if (albumDraft.trim()) toggleAlbum(photo.id, albumDraft.trim().slice(0, 40));
          onAlbumDraft("");
        }}
      >
        <input className={field} value={albumDraft} placeholder="New album" onChange={(event) => onAlbumDraft(event.target.value)} />
        <button type="submit" className={btn}>
          Add
        </button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {albums.map((album) => (
          <button
            key={album}
            type="button"
            className={`${chip} ${mark.albums.includes(album) ? onBtn : ""}`}
            onClick={() => toggleAlbum(photo.id, album)}
          >
            {album}
          </button>
        ))}
      </div>
    </aside>
  );
}

function Help({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-[60] flex items-end justify-center bg-bg/70 p-3 md:items-center" role="dialog" aria-label="How to use Drift Hall">
      <div className="max-h-[80%] w-full max-w-lg overflow-y-auto rounded-md border border-line bg-surface p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display text-3xl tracking-tight">How to walk the hall</h2>
          <button type="button" className={btn} onClick={onClose} aria-label="Close help">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-fg/90">
          <p>
            Open a folder from your computer. Photos stay where they are — nothing is uploaded. On the desktop starter,
            the hall reads that folder straight from disk and remembers it next time. Dates come from the camera when
            they exist, otherwise from the file date, and they fill in while you are already walking.
          </p>
          <p>
            The rooms drift a little, like a dream: lilac and teal light, slow rings, a breath of fog. The pictures
            themselves stay as they were shot.
          </p>
          <p>
            <strong className="font-medium text-brass">Date grid</strong> lines pictures up by month.{" "}
            <strong className="font-medium text-brass">Gallery</strong> hangs them in rooms you can walk, grouped by
            year or by folder. <strong className="font-medium text-brass">Float</strong>,{" "}
            <strong className="font-medium text-brass">Tunnel</strong>, and{" "}
            <strong className="font-medium text-brass">Spiral</strong> are fly-throughs.{" "}
            <strong className="font-medium text-brass">Maze</strong> puts frames on the walls of a generated plan.
          </p>
          <p>
            WASD or arrows move. A strafes left, D right. Drag to look, or double-click to capture the mouse. Q and R
            turn. Shift sprints. In fly modes, Space rises and C or Ctrl drops. Gallery and maze keep you at eye height.
          </p>
          <p>
            Keys 1–6 switch modes. E flies to the picture under the crosshair. F stars it. [ and ] step through the
            filter. I opens the contact sheet. H is this panel.
          </p>
          <p>
            Stars, tags, notes, albums, and hiding are saved in this browser. If you open the folder with editing
            allowed, “Save into folder” writes <span className="text-brass">DriftHall/marks.json</span> beside the
            files. Originals are never rewritten. Drag-and-drop and the classic picker cannot write that file.
          </p>
          <p className="text-muted">
            HEIC is skipped. Up to 2,000 images load at once; lower the fog if a long grid disappears into the distance.
            The sample library uses Unsplash photos served as ordinary JPEGs so you can try every room before pointing
            at your own folder. The fly-throughs and walkable rooms take their cue from floating galleries and museum
            viewers — this one is built for a folder you already have.
          </p>
        </div>
      </div>
    </div>
  );
}

const btn =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border border-line bg-surface/90 px-2.5 text-sm text-fg backdrop-blur-sm hover:border-brass/70 disabled:cursor-not-allowed disabled:opacity-40";
const onBtn = "border-brass text-brass";
const field = "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm text-fg";
const chip =
  "inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-bg px-3 text-xs text-fg hover:border-brass/70";
const pad = "inline-flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface/90 text-sm";
