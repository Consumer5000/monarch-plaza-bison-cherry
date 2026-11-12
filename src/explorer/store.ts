import { create } from "zustand";
import { demoPhotos } from "./demo";
import type { GroupBy, Mark, Mode, Photo, SortKey, Surface } from "./types";
import { emptyMark } from "./types";
import { writeSaved, type Saved } from "./persist";

type ExplorerState = {
  photos: Photo[];
  marks: Record<string, Mark>;
  albums: string[];
  mode: Mode;
  surface: Surface;
  sort: SortKey;
  groupBy: GroupBy;
  query: string;
  starredOnly: boolean;
  showHidden: boolean;
  tag: string | null;
  album: string | null;
  from: string;
  to: string;
  cols: number;
  size: number;
  speed: number;
  fog: number;
  quality: "fast" | "sharp";
  glow: boolean;
  stylized: boolean;
  settingsOpen: boolean;
  autoGlide: boolean;
  folderName: string;
  source: "empty" | "demo" | "folder";
  runtime: "web" | "local";
  localFolder: string;
  libraryEpoch: number;
  writable: boolean;
  busy: string;
  pendingDates: boolean;
  toast: string;
  selectedId: string | null;
  aimId: string | null;
  heading: string;
  omitted: number;
  loadedTextures: number;
  focusId: string | null;
  focusNonce: number;
  helpOpen: boolean;
  hintOpen: boolean;
  drawerOpen: boolean;
  booting: boolean;
  setMode: (mode: Mode) => void;
  setSurface: (surface: Surface) => void;
  patch: (partial: Partial<ExplorerState>) => void;
  toggleStar: (id: string) => void;
  toggleHidden: (id: string) => void;
  setNote: (id: string, note: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  createAlbum: (name: string) => void;
  toggleAlbum: (id: string, album: string) => void;
  requestFocus: (id: string) => void;
  mergeSaved: (saved: Saved) => void;
  toastMessage: (message: string) => void;
  replaceLibrary: (photos: Photo[], folderName: string, source: "demo" | "folder", writable: boolean) => void;
  applyTaken: (epoch: number, updates: Record<string, number>) => void;
};

function withMark(marks: Record<string, Mark>, id: string, edit: (mark: Mark) => Mark): Record<string, Mark> {
  const current = marks[id] ?? emptyMark();
  return { ...marks, [id]: edit(current) };
}

let toastTimer = 0;

export const useExplorer = create<ExplorerState>((set, get) => ({
  photos: demoPhotos,
  marks: {},
  albums: [],
  mode: "gallery",
  surface: "space",
  sort: "oldest",
  groupBy: "date",
  query: "",
  starredOnly: false,
  showHidden: false,
  tag: null,
  album: null,
  from: "",
  to: "",
  cols: 6,
  size: 1.7,
  speed: 1,
  fog: 0.012,
  quality: "sharp",
  glow: false,
  stylized: false,
  settingsOpen: false,
  autoGlide: false,
  folderName: "Demo library",
  source: "demo",
  runtime: "web",
  localFolder: "",
  libraryEpoch: 0,
  writable: false,
  busy: "",
  pendingDates: false,
  toast: "",
  selectedId: null,
  aimId: null,
  heading: "N",
  omitted: 0,
  loadedTextures: 0,
  focusId: null,
  focusNonce: 0,
  helpOpen: false,
  hintOpen: false,
  drawerOpen: false,
  booting: true,
  setMode: (mode) => set({ mode, surface: "space" }),
  setSurface: (surface) => set({ surface }),
  patch: (partial) => set(partial),
  toggleStar: (id) =>
    set((state) => ({
      marks: withMark(state.marks, id, (mark) => ({ ...mark, starred: !mark.starred })),
    })),
  toggleHidden: (id) =>
    set((state) => ({
      marks: withMark(state.marks, id, (mark) => ({ ...mark, hidden: !mark.hidden })),
    })),
  setNote: (id, note) =>
    set((state) => ({
      marks: withMark(state.marks, id, (mark) => ({ ...mark, note: note.slice(0, 2000) })),
    })),
  addTag: (id, raw) => {
    const tag = raw.trim().slice(0, 32);
    if (!tag) return;
    set((state) => ({
      marks: withMark(state.marks, id, (mark) =>
        mark.tags.includes(tag) ? mark : { ...mark, tags: [...mark.tags, tag] },
      ),
    }));
  },
  removeTag: (id, tag) =>
    set((state) => ({
      marks: withMark(state.marks, id, (mark) => ({ ...mark, tags: mark.tags.filter((item) => item !== tag) })),
      tag: state.tag === tag ? null : state.tag,
    })),
  createAlbum: (raw) => {
    const name = raw.trim().slice(0, 40);
    if (!name) return;
    set((state) => ({ albums: state.albums.includes(name) ? state.albums : [...state.albums, name] }));
  },
  toggleAlbum: (id, album) =>
    set((state) => ({
      marks: withMark(state.marks, id, (mark) => ({
        ...mark,
        albums: mark.albums.includes(album) ? mark.albums.filter((item) => item !== album) : [...mark.albums, album],
      })),
    })),
  requestFocus: (id) => set((state) => ({ focusId: id, focusNonce: state.focusNonce + 1, selectedId: id, surface: "space" })),
  mergeSaved: (saved) =>
    set((state) => ({
      marks: { ...saved.marks, ...state.marks },
      albums: [...new Set([...saved.albums, ...state.albums])],
    })),
  toastMessage: (message) => {
    set({ toast: message });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => set({ toast: "" }), 4200);
  },
  replaceLibrary: (photos, folderName, source, writable) => {
    const previous = get().photos;
    for (const photo of previous) {
      if (photo.blobUrl) URL.revokeObjectURL(photo.url);
    }
    set({
      photos,
      folderName,
      source,
      writable,
      selectedId: null,
      aimId: null,
      booting: false,
      busy: "",
      pendingDates: false,
      omitted: 0,
      loadedTextures: 0,
      libraryEpoch: get().libraryEpoch + 1,
    });
  },
  applyTaken: (epoch, updates) => {
    const state = get();
    if (epoch !== state.libraryEpoch) return;
    let changed = false;
    const photos = state.photos.map((photo) => {
      const taken = updates[photo.id];
      if (taken == null || taken === photo.taken) return photo;
      changed = true;
      return { ...photo, taken };
    });
    set(changed ? { photos, pendingDates: false } : { pendingDates: false });
  },
}));

const SETTINGS_KEY = "drift-hall-settings";
const MODES: Mode[] = ["grid", "gallery", "float", "tunnel", "spiral", "maze"];

function readHallSettings(): Partial<Pick<ExplorerState, "glow" | "stylized" | "mode" | "surface" | "quality">> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const row = parsed as Partial<ExplorerState>;
    const next: Partial<Pick<ExplorerState, "glow" | "stylized" | "mode" | "surface" | "quality">> = {};
    if (typeof row.glow === "boolean") next.glow = row.glow;
    if (typeof row.stylized === "boolean") next.stylized = row.stylized;
    if (row.mode && MODES.includes(row.mode)) next.mode = row.mode;
    if (row.surface === "space" || row.surface === "index") next.surface = row.surface;
    if (row.quality === "fast" || row.quality === "sharp") next.quality = row.quality;
    return next;
  } catch {
    return null;
  }
}

export function loadHallSettings() {
  const saved = readHallSettings();
  if (saved) useExplorer.setState(saved);
}

function writeHallSettings() {
  const state = useExplorer.getState();
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        glow: state.glow,
        stylized: state.stylized,
        mode: state.mode,
        surface: state.surface,
        quality: state.quality,
      }),
    );
  } catch {
    /* private mode */
  }
}

if (typeof window !== "undefined") {
  let timer = 0;
  useExplorer.subscribe((state, previous) => {
    if (state.marks === previous.marks && state.albums === previous.albums) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const current = useExplorer.getState();
      void writeSaved({ version: 1, marks: current.marks, albums: current.albums });
    }, 400);
  });
  useExplorer.subscribe((state, previous) => {
    if (
      state.glow === previous.glow &&
      state.stylized === previous.stylized &&
      state.mode === previous.mode &&
      state.surface === previous.surface &&
      state.quality === previous.quality
    ) {
      return;
    }
    writeHallSettings();
  });
}
