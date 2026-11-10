import manifest from "../../public/demo/manifest.json";
import type { Photo } from "./types";

type DemoItem = { file: string; taken: string; place: string; bytes: number };

export const demoPhotos: Photo[] = (manifest as DemoItem[]).map((item) => ({
  id: `demo|${item.file}`,
  name: item.file,
  folder: "Demo library",
  url: `/demo/${item.file}`,
  bytes: item.bytes,
  mtime: Date.parse(`${item.taken}T12:00:00`),
  taken: Date.parse(`${item.taken}T12:00:00`),
  caption: item.place,
  blobUrl: false,
}));
