import type { Photo, SortKey } from "./types";
import { emptyMark, type Mark } from "./types";

export type FilterState = {
  photos: Photo[];
  marks: Record<string, Mark>;
  query: string;
  starredOnly: boolean;
  showHidden: boolean;
  tag: string | null;
  album: string | null;
  from: string;
  to: string;
  sort: SortKey;
};

function startOf(day: string) {
  if (!day) return null;
  const t = Date.parse(`${day}T00:00:00`);
  return Number.isNaN(t) ? null : t;
}

export function visiblePhotos(state: FilterState): Photo[] {
  const from = startOf(state.from);
  const to = startOf(state.to);
  const q = state.query.trim().toLowerCase();
  const list = state.photos.filter((photo) => {
    const mark = state.marks[photo.id] ?? emptyMark();
    if (mark.hidden && !state.showHidden) return false;
    if (state.starredOnly && !mark.starred) return false;
    if (state.tag && !mark.tags.includes(state.tag)) return false;
    if (state.album && !mark.albums.includes(state.album)) return false;
    if (from != null && photo.taken < from) return false;
    if (to != null && photo.taken >= to + 86_400_000) return false;
    if (q) {
      const hay = `${photo.name} ${photo.folder} ${photo.caption} ${mark.note} ${mark.tags.join(" ")} ${mark.albums.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  list.sort((a, b) => {
    if (state.sort === "name") return a.name.localeCompare(b.name);
    if (state.sort === "folder") {
      const folder = a.folder.localeCompare(b.folder);
      return folder || a.taken - b.taken;
    }
    if (state.sort === "oldest") return a.taken - b.taken || a.name.localeCompare(b.name);
    return b.taken - a.taken || a.name.localeCompare(b.name);
  });
  return list;
}

export function formatWhen(ms: number) {
  if (!ms || Number.isNaN(ms)) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(ms);
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function allTags(marks: Record<string, Mark>) {
  const tags = new Set<string>();
  for (const mark of Object.values(marks)) {
    for (const tag of mark.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
