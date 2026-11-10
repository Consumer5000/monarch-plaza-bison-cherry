import type { Mark } from "./types";

export type Saved = {
  version: 1;
  marks: Record<string, Mark>;
  albums: string[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("drift-hall", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("kv");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function readSaved(): Promise<Saved | null> {
  try {
    const db = await openDb();
    const value = await new Promise<Saved | undefined>((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get("library");
      req.onsuccess = () => resolve(req.result as Saved | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!value || value.version !== 1 || !value.marks || !Array.isArray(value.albums)) return null;
    return value;
  } catch {
    return null;
  }
}

export async function writeSaved(data: Saved): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(data, "library");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function kvGet(key: string): Promise<unknown> {
  try {
    const db = await openDb();
    const value = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value;
  } catch {
    return undefined;
  }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function isSaved(value: unknown): value is Saved {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<Saved>;
  return row.version === 1 && !!row.marks && typeof row.marks === "object" && Array.isArray(row.albums);
}
