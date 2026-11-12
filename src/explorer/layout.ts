import type { Block, GroupBy, Layout, Mode, Photo, Vec3 } from "./types";

type Slot = { position: Vec3; normal: Vec3 };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(photos: Photo[]) {
  let h = 2166136261;
  const sample = `${photos.length}|${photos[0]?.id ?? ""}|${photos[photos.length - 1]?.id ?? ""}`;
  for (let i = 0; i < sample.length; i++) h = Math.imul(h ^ sample.charCodeAt(i), 16777619);
  return h >>> 0;
}

function monthKey(ms: number) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function monthLabel(ms: number) {
  if (!ms || Number.isNaN(ms)) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(ms);
}

function rangeLabel(list: Photo[]) {
  if (!list.length) return "Gallery";
  const a = Math.min(...list.map((p) => p.taken));
  const b = Math.max(...list.map((p) => p.taken));
  const fmt = (ms: number) => new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(ms);
  const left = fmt(a);
  const right = fmt(b);
  return left === right ? left : `${left} – ${right}`;
}

function shell(spawn: Vec3, spawnYaw = 0): Layout {
  return { nodes: [], blocks: [], spawn, spawnYaw, loop: null, omitted: 0 };
}

function layoutGrid(photos: Photo[], cols: number, size: number): Layout {
  const pitchX = size * 1.42;
  const pitchZ = size * 1.55;
  const nodes: Layout["nodes"] = [];
  let col = 0;
  let row = 0;
  let lastKey = "";
  for (const photo of photos) {
    const key = monthKey(photo.taken);
    if (key !== lastKey) {
      if (col !== 0) {
        row += 1;
        col = 0;
      }
      if (lastKey) row += 0.55;
      nodes.push({ kind: "label", text: monthLabel(photo.taken), position: [0, 2.9, -row * pitchZ] });
      row += 0.48;
      lastKey = key;
    }
    const x = (col - (cols - 1) / 2) * pitchX;
    nodes.push({
      kind: "photo",
      id: photo.id,
      position: [x, 1.62, -row * pitchZ],
      normal: [0, 0, 1],
      height: size,
      faceCamera: false,
      phase: col * 0.35 + row * 0.2,
    });
    col += 1;
    if (col >= cols) {
      col = 0;
      row += 1;
    }
  }
  const depth = Math.max(row, 1) * pitchZ + 10;
  const width = Math.max(cols * pitchX + 4, 8);
  const midZ = -Math.max(row - 1, 0) * pitchZ * 0.5;
  const blocks: Block[] = [
    { position: [0, -0.04, midZ], size: [width, 0.06, depth], solid: false, color: "floor" },
    { position: [0, 0.01, midZ], size: [1.2, 0.025, depth], solid: false, color: "path" },
  ];
  return { nodes, blocks, spawn: [0, 1.62, 5], spawnYaw: 0, loop: null, omitted: 0 };
}

const ROOM = { len: 16, halfL: 8, halfW: 6, height: 4.1, thick: 0.32, doorW: 2.6, doorH: 2.75 };

function pushDoorWall(blocks: Block[], z: number) {
  const sideW = ROOM.halfW - ROOM.doorW / 2;
  const sideX = ROOM.doorW / 2 + sideW / 2;
  blocks.push(
    { position: [-sideX, ROOM.height / 2, z], size: [sideW, ROOM.height, ROOM.thick], solid: true, color: "wall" },
    { position: [sideX, ROOM.height / 2, z], size: [sideW, ROOM.height, ROOM.thick], solid: true, color: "wall" },
    {
      position: [0, ROOM.doorH + (ROOM.height - ROOM.doorH) / 2, z],
      size: [ROOM.doorW, ROOM.height - ROOM.doorH, ROOM.thick],
      solid: false,
      color: "wall",
    },
  );
}

function roomSlots(centerZ: number, withSouth: boolean): Slot[] {
  const southZ = centerZ + ROOM.halfL;
  const northZ = centerZ - ROOM.halfL;
  const inset = ROOM.thick / 2 + 0.05;
  const margin = 1.75;
  const span = ROOM.len - margin * 2;
  const left: Slot[] = [];
  const right: Slot[] = [];
  for (let i = 0; i < 4; i++) {
    const z = southZ - margin - (i + 0.5) * (span / 4);
    left.push({ position: [-ROOM.halfW + inset, 1.62, z], normal: [1, 0, 0] });
    right.push({ position: [ROOM.halfW - inset, 1.62, z], normal: [-1, 0, 0] });
  }
  const north: Slot[] = [
    { position: [-3.65, 1.62, northZ + inset], normal: [0, 0, 1] },
    { position: [3.65, 1.62, northZ + inset], normal: [0, 0, 1] },
  ];
  const south: Slot[] = withSouth
    ? [
        { position: [-3.65, 1.62, southZ - inset], normal: [0, 0, -1] },
        { position: [3.65, 1.62, southZ - inset], normal: [0, 0, -1] },
      ]
    : [];
  // One wall at a time, entrance to the far end, so pictures follow the walk.
  return [...left, ...right, ...north, ...south];
}

function addRoomShell(blocks: Block[], centerZ: number, withSouth: boolean) {
  blocks.push(
    { position: [-ROOM.halfW, ROOM.height / 2, centerZ], size: [ROOM.thick, ROOM.height, ROOM.len], solid: true, color: "wall" },
    { position: [ROOM.halfW, ROOM.height / 2, centerZ], size: [ROOM.thick, ROOM.height, ROOM.len], solid: true, color: "wall" },
    { position: [0, 0.04, centerZ], size: [ROOM.halfW * 2, 0.08, ROOM.len], solid: false, color: "floor" },
    { position: [0, 0.09, centerZ], size: [1.35, 0.02, ROOM.len - 0.4], solid: false, color: "path" },
    { position: [0, ROOM.height, centerZ], size: [ROOM.halfW * 2, 0.08, ROOM.len], solid: false, color: "ceiling" },
  );
  pushDoorWall(blocks, centerZ - ROOM.halfL);
  if (withSouth) pushDoorWall(blocks, centerZ + ROOM.halfL);
}

function groupPhotos(photos: Photo[], groupBy: GroupBy) {
  if (groupBy !== "folder") return [{ label: "", photos }];
  const order: string[] = [];
  const map = new Map<string, Photo[]>();
  for (const photo of photos) {
    const key = photo.folder || "Library";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(photo);
  }
  return order.map((key) => ({ label: key, photos: map.get(key)! }));
}

function layoutGallery(photos: Photo[], size: number, groupBy: GroupBy): Layout {
  const height = Math.min(Math.max(size, 1.15), 2.05);
  const nodes: Layout["nodes"] = [];
  const blocks: Block[] = [];
  const groups = groupPhotos(photos, groupBy);
  let room = 0;
  const place = (list: Photo[], label: string) => {
    let offset = 0;
    while (offset < list.length) {
      const withSouth = room === 0;
      const cap = withSouth ? 12 : 10;
      const slice = list.slice(offset, offset + cap);
      const centerZ = -room * ROOM.len;
      addRoomShell(blocks, centerZ, withSouth);
      const slots = roomSlots(centerZ, withSouth);
      slice.forEach((photo, index) => {
        const slot = slots[index];
        if (!slot) return;
        nodes.push({
          kind: "photo",
          id: photo.id,
          position: slot.position,
          normal: slot.normal,
          height,
          faceCamera: false,
          phase: index,
        });
      });
      const text = label || rangeLabel(slice);
      nodes.push({ kind: "label", text, position: [0, 3.28, centerZ] });
      offset += slice.length;
      room += 1;
    }
  };
  if (groupBy === "folder") {
    for (const group of groups) place(group.photos, group.label);
  } else if (photos.length) {
    place(photos, "");
  }
  if (!photos.length) addRoomShell(blocks, 0, true);
  return { nodes, blocks, spawn: [0, 1.62, 6], spawnYaw: 0, loop: null, omitted: 0 };
}

function layoutFloat(photos: Photo[], size: number): Layout {
  const rng = mulberry32(hashSeed(photos) ^ 0x51ed);
  const span = Math.max(8, Math.sqrt(Math.max(photos.length, 1)) * 5);
  const minDist = size * 1.2;
  const placed: Vec3[] = [];
  const nodes: Layout["nodes"] = [];
  for (const photo of photos) {
    let pos: Vec3 = [0, 1.8, -4];
    for (let attempt = 0; attempt < 28; attempt++) {
      const x = (rng() - 0.5) * span;
      const y = 0.55 + rng() * Math.max(4, span * 0.38);
      const z = -0.5 - rng() * span;
      const ok = placed.every((p) => {
        const dx = p[0] - x;
        const dy = p[1] - y;
        const dz = p[2] - z;
        return dx * dx + dy * dy + dz * dz >= minDist * minDist;
      });
      pos = [x, y, z];
      if (ok) break;
    }
    placed.push(pos);
    nodes.push({
      kind: "photo",
      id: photo.id,
      position: pos,
      normal: [0, 0, 1],
      height: size * (0.82 + rng() * 0.36),
      faceCamera: true,
      phase: rng() * Math.PI * 2,
    });
  }
  return { nodes, blocks: [], spawn: [0, 2, 6], spawnYaw: 0, loop: null, omitted: 0 };
}

function layoutTunnel(photos: Photo[], size: number): Layout {
  const radius = 6.2;
  const per = 8;
  const spacing = 2.8;
  const rings = Math.max(1, Math.ceil(Math.max(photos.length, 1) / per));
  const nodes: Layout["nodes"] = photos.map((photo, i) => {
    const ring = Math.floor(i / per);
    const slot = i % per;
    const ang = (slot / per) * Math.PI * 2 + ring * 0.18;
    const x = Math.cos(ang) * radius;
    const y = Math.sin(ang) * radius;
    const z = -ring * spacing;
    const len = Math.hypot(-x, -y, 2.2) || 1;
    return {
      kind: "photo" as const,
      id: photo.id,
      position: [x, y, z] as Vec3,
      normal: [-x / len, -y / len, 2.2 / len] as Vec3,
      height: size,
      faceCamera: false,
      phase: ang,
    };
  });
  const span = rings * spacing;
  return {
    nodes,
    blocks: [],
    spawn: [0, 0, 3.2],
    spawnYaw: 0,
    loop: { minZ: 3.2 - span, span },
    omitted: 0,
  };
}

function layoutSpiral(photos: Photo[], size: number): Layout {
  const nodes: Layout["nodes"] = photos.map((photo, i) => {
    const ang = i * 0.62;
    const x = Math.sin(ang) * 4.2;
    const z = -i * 1.25;
    const len = Math.hypot(-x, 2) || 1;
    return {
      kind: "photo" as const,
      id: photo.id,
      position: [x, 1.62, z] as Vec3,
      normal: [-x / len, 0, 2 / len] as Vec3,
      height: size,
      faceCamera: false,
      phase: ang,
    };
  });
  const end = photos.length ? -(photos.length - 1) * 1.25 : 0;
  const blocks: Block[] = [
    { position: [0, -0.02, end / 2], size: [14, 0.05, Math.abs(end) + 14], solid: false, color: "floor" },
  ];
  return { nodes, blocks, spawn: [0, 1.62, 3], spawnYaw: 0, loop: null, omitted: 0 };
}

type Carve = { cols: number; rows: number; north: boolean[][]; east: boolean[][] };

function faceCount(cols: number, rows: number) {
  const interiorSlots = (cols - 1) * rows + cols * (rows - 1);
  const interiorWalls = interiorSlots - (cols * rows - 1);
  return interiorWalls * 2 + 2 * cols + 2 * rows;
}

function carveMaze(cols: number, rows: number, rng: () => number): Carve {
  const north = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  const east = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  const seen = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  const stack: Array<[number, number]> = [[0, 0]];
  seen[0]![0] = true;
  while (stack.length) {
    const [c, r] = stack[stack.length - 1]!;
    const options: Array<{ c: number; r: number; dir: "N" | "E" | "S" | "W" }> = [];
    if (r + 1 < rows && !seen[r + 1]![c]) options.push({ c, r: r + 1, dir: "N" });
    if (c + 1 < cols && !seen[r]![c + 1]) options.push({ c: c + 1, r, dir: "E" });
    if (r - 1 >= 0 && !seen[r - 1]![c]) options.push({ c, r: r - 1, dir: "S" });
    if (c - 1 >= 0 && !seen[r]![c - 1]) options.push({ c: c - 1, r, dir: "W" });
    if (!options.length) {
      stack.pop();
      continue;
    }
    const pick = options[Math.floor(rng() * options.length)]!;
    if (pick.dir === "N") north[r]![c] = true;
    else if (pick.dir === "E") east[r]![c] = true;
    else if (pick.dir === "S") north[pick.r]![pick.c] = true;
    else east[pick.r]![pick.c] = true;
    seen[pick.r]![pick.c] = true;
    stack.push([pick.c, pick.r]);
  }
  return { cols, rows, north, east };
}

function layoutMaze(photos: Photo[], size: number): Layout {
  const cell = 4.6;
  const wallH = 3.55;
  const thick = 0.3;
  let side = 4;
  while (side < 20 && faceCount(side, side) * 2 < photos.length) side += 1;
  const carve = carveMaze(side, side, mulberry32(hashSeed(photos) ^ (side * 997)));
  const cols = side;
  const rows = side;
  const blocks: Block[] = [];
  const faces: Slot[] = [];
  const inset = thick / 2 + 0.06;

  for (let r = 0; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const open = c > -1 && c < cols - 1 && carve.east[r]![c];
      if (open) continue;
      const x = (c + 0.5) * cell;
      const z = -r * cell;
      blocks.push({ position: [x, wallH / 2, z], size: [thick, wallH, cell], solid: true, color: "wall" });
      if (c === -1) faces.push({ position: [x + inset, 0, z], normal: [1, 0, 0] });
      else if (c === cols - 1) faces.push({ position: [x - inset, 0, z], normal: [-1, 0, 0] });
      else {
        faces.push({ position: [x - inset, 0, z], normal: [-1, 0, 0] });
        faces.push({ position: [x + inset, 0, z], normal: [1, 0, 0] });
      }
    }
  }
  for (let r = -1; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const open = r > -1 && r < rows - 1 && carve.north[r]![c];
      if (open) continue;
      const x = c * cell;
      const z = -(r + 0.5) * cell;
      blocks.push({ position: [x, wallH / 2, z], size: [cell, wallH, thick], solid: true, color: "wall" });
      if (r === -1) faces.push({ position: [x, 0, z - inset], normal: [0, 0, -1] });
      else if (r === rows - 1) faces.push({ position: [x, 0, z + inset], normal: [0, 0, 1] });
      else {
        faces.push({ position: [x, 0, z + inset], normal: [0, 0, 1] });
        faces.push({ position: [x, 0, z - inset], normal: [0, 0, -1] });
      }
    }
  }

  const cx = ((cols - 1) / 2) * cell;
  const cz = -((rows - 1) / 2) * cell;
  const spanX = cols * cell + cell;
  const spanZ = rows * cell + cell;
  blocks.push(
    { position: [cx, 0, cz], size: [spanX, 0.08, spanZ], solid: false, color: "floor" },
    { position: [cx, wallH, cz], size: [spanX, 0.08, spanZ], solid: false, color: "ceiling" },
  );

  const twoRows = photos.length > faces.length;
  const cap = faces.length * (twoRows ? 2 : 1);
  const used = photos.slice(0, cap);
  const lowerH = twoRows ? 1.3 : Math.min(Math.max(size, 1.2), 1.7);
  const nodes: Layout["nodes"] = used.map((photo, i) => {
    const upper = twoRows && i >= faces.length;
    const face = faces[upper ? i - faces.length : i]!;
    const y = twoRows ? (upper ? 2.55 : 1.48) : 1.62;
    return {
      kind: "photo" as const,
      id: photo.id,
      position: [face.position[0], y, face.position[2]] as Vec3,
      normal: face.normal,
      height: upper ? 0.9 : lowerH,
      faceCamera: false,
      phase: i * 0.17,
    };
  });

  let spawnYaw = Math.PI;
  if (carve.north[0]?.[0]) spawnYaw = 0;
  else if (carve.east[0]?.[0]) spawnYaw = -Math.PI / 2;

  return {
    nodes,
    blocks,
    spawn: [0, 1.62, 0],
    spawnYaw,
    loop: null,
    omitted: Math.max(0, photos.length - used.length),
  };
}

export function buildLayout(photos: Photo[], mode: Mode, cols: number, size: number, groupBy: GroupBy): Layout {
  const columns = Math.max(2, Math.min(12, Math.round(cols) || 6));
  const photoSize = Math.max(0.7, Math.min(3.2, size || 1.7));
  if (mode === "gallery") return layoutGallery(photos, photoSize, groupBy);
  if (mode === "float") return layoutFloat(photos, photoSize);
  if (mode === "tunnel") return layoutTunnel(photos, photoSize);
  if (mode === "spiral") return layoutSpiral(photos, photoSize);
  if (mode === "maze") return layoutMaze(photos, photoSize);
  if (!photos.length) return shell([0, 1.62, 5]);
  return layoutGrid(photos, columns, photoSize);
}
