export type Mode = "grid" | "gallery" | "float" | "tunnel" | "spiral" | "maze";

export type SortKey = "newest" | "oldest" | "name" | "folder";

export type GroupBy = "date" | "folder";

export type Surface = "space" | "index";

export type Photo = {
  id: string;
  name: string;
  folder: string;
  url: string;
  bytes: number;
  mtime: number;
  taken: number;
  caption: string;
  blobUrl: boolean;
};

export type Mark = {
  starred: boolean;
  tags: string[];
  note: string;
  hidden: boolean;
  albums: string[];
};

export type Vec3 = [number, number, number];

export type BlockColor = "wall" | "floor" | "ceiling" | "path";

export type Block = {
  position: Vec3;
  size: Vec3;
  solid: boolean;
  color: BlockColor;
};

export type PhotoNode = {
  kind: "photo";
  id: string;
  position: Vec3;
  normal: Vec3;
  height: number;
  faceCamera: boolean;
  phase: number;
};

export type LabelNode = {
  kind: "label";
  text: string;
  position: Vec3;
};

export type LayoutNode = PhotoNode | LabelNode;

export type Layout = {
  nodes: LayoutNode[];
  blocks: Block[];
  spawn: Vec3;
  spawnYaw: number;
  loop: { minZ: number; span: number } | null;
  omitted: number;
};

export const MODE_ORDER: Mode[] = ["grid", "gallery", "float", "tunnel", "spiral", "maze"];

export const MODE_LABEL: Record<Mode, string> = {
  grid: "Date grid",
  gallery: "Gallery",
  float: "Float",
  tunnel: "Tunnel",
  spiral: "Spiral",
  maze: "Maze",
};

export function emptyMark(): Mark {
  return { starred: false, tags: [], note: "", hidden: false, albums: [] };
}
