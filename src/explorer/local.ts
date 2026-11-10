import type { Photo } from "./types";
import { isSaved, type Saved } from "./persist";

export type LocalStatus = {
  local: true;
  folder: string | null;
  name: string;
  error?: string;
};

type ManifestPhoto = {
  id: string;
  name: string;
  folder: string;
  relative: string;
  bytes: number;
  mtime: number;
  taken: number;
};

export type LocalManifest = {
  name: string;
  folder: string;
  writable: boolean;
  skippedHeic: number;
  capped: boolean;
  photos: ManifestPhoto[];
};

function thumbUrl(relative: string, width: number, mtime: number) {
  return `/api/local/thumb?p=${encodeURIComponent(relative)}&w=${width}&v=${Math.round(mtime)}`;
}

export function photoFromLocal(item: ManifestPhoto): Photo {
  return {
    id: item.id,
    name: item.name,
    folder: item.folder,
    url: thumbUrl(item.relative, 960, item.mtime),
    thumb: thumbUrl(item.relative, 320, item.mtime),
    localRef: item.relative,
    bytes: item.bytes,
    mtime: item.mtime,
    taken: item.taken,
    caption: "",
    blobUrl: false,
  };
}

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function probeLocal(): Promise<LocalStatus | null> {
  try {
    const response = await fetch("/api/local/status");
    const body = await readJson<LocalStatus>(response);
    if (!response.ok || body?.local !== true) return null;
    return body;
  } catch {
    return null;
  }
}

export async function openLocalFolder(input: { path?: string; pick?: boolean }): Promise<LocalStatus> {
  const response = await fetch("/api/local/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson<LocalStatus>(response);
  if (!body?.local) throw new Error("The folder starter is not running.");
  if (!response.ok) throw new Error(body.error || "That folder could not be opened.");
  return body;
}

export async function fetchLocalManifest(): Promise<LocalManifest> {
  const response = await fetch("/api/local/manifest");
  const body = await readJson<LocalManifest>(response);
  if (!response.ok || !body?.photos) throw new Error("Could not read that folder.");
  return body;
}

export async function fetchLocalDates(): Promise<{ id: string; taken: number }[]> {
  const response = await fetch("/api/local/dates");
  const body = await readJson<{ updates?: { id: string; taken: number }[] }>(response);
  if (!response.ok || !body?.updates) return [];
  return body.updates;
}

export async function fetchLocalMarks(): Promise<Saved | null> {
  try {
    const response = await fetch("/api/local/marks");
    if (response.status === 404) return null;
    const body = await readJson<unknown>(response);
    return isSaved(body) ? body : null;
  } catch {
    return null;
  }
}

export async function saveLocalMarks(payload: Saved): Promise<void> {
  const response = await fetch("/api/local/marks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await readJson<{ error?: string }>(response);
    throw new Error(body?.error || "Could not write marks.");
  }
}
