import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  FogExp2,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  NoToneMapping,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  SpotLight,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Texture,
  Timer,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { held, isTyping, replaceHeld, setHeld } from "./input";
import { buildLayout } from "./layout";
import { visiblePhotos } from "./query";
import { useExplorer } from "./store";
import type { Block, BlockColor, Layout, Mode, Photo, PhotoNode, Vec3 } from "./types";

const BLOCK_NATURAL = { wall: 0x3c3834, floor: 0x2c2824, ceiling: 0x45403b, path: 0xb7aa96 } as const;
const BLOCK_DREAM = { wall: 0x2a2144, floor: 0x140e22, ceiling: 0x221838, path: 0x5ee0d0 } as const;
const BG_NATURAL = new Color(0x161410);
const BG_DREAM = new Color(0x12081c);
const RADIUS = 0.32;
const MOVE = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "KeyC",
  "ControlLeft",
  "ControlRight",
  "ShiftLeft",
  "ShiftRight",
  "KeyQ",
  "KeyR",
]);

type Rec = {
  id: string;
  url: string;
  mesh: Mesh;
  mat: MeshBasicMaterial;
  star: Mesh;
  twin: Mesh | null;
  base: Vector3;
  normal: Vector3;
  height: number;
  phase: number;
  face: boolean;
};

type Cached = { tex: Texture; aspect: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function walkMode(mode: Mode) {
  return mode === "gallery" || mode === "maze";
}

function headingOf(yaw: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const deg = (((-yaw * 180) / Math.PI) % 360 + 360) % 360;
  return dirs[Math.round(deg / 45) % 8]!;
}

function hdr(mat: MeshBasicMaterial, r: number, g: number, b: number) {
  mat.color.r = r;
  mat.color.g = g;
  mat.color.b = b;
}

function textureSource(photo: Photo, quality: "fast" | "sharp") {
  if (!photo.localRef) return photo.url;
  const width = quality === "sharp" ? 1280 : 640;
  return `/api/local/thumb?p=${encodeURIComponent(photo.localRef)}&w=${width}&v=${Math.round(photo.mtime)}`;
}

function libraryKey(photos: Photo[], quality: string) {
  let key = quality;
  for (const photo of photos) key += `\n${photo.id}\0${photo.localRef ?? photo.url}`;
  return key;
}

export function mountWorld(canvas: HTMLCanvasElement) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch {
    useExplorer.getState().toastMessage("WebGL isn’t available in this browser.");
    return { dispose() {} };
  }
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(BG_NATURAL, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  scene.background = BG_NATURAL;
  const fog = new FogExp2(BG_NATURAL, useExplorer.getState().fog);
  scene.fog = fog;
  const camera = new PerspectiveCamera(68, 1, 0.08, 2500);
  scene.add(camera);
  const content = new Group();
  scene.add(content);
  const timer = new Timer();
  timer.connect(document);

  const hemi = new HemisphereLight(0xfff6ea, 0x4a4036, 0.95);
  scene.add(hemi);
  const keyLight = new DirectionalLight(0xfff8f0, 1.25);
  keyLight.position.set(7, 14, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 46;
  keyLight.shadow.camera.left = -14;
  keyLight.shadow.camera.right = 14;
  keyLight.shadow.camera.top = 14;
  keyLight.shadow.camera.bottom = -14;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.045;
  scene.add(keyLight);
  scene.add(keyLight.target);

  const flash = new SpotLight(0xfff4e5, 0, 26, 0.5, 0.58, 1);
  flash.position.set(0, -0.05, 0.15);
  flash.target.position.set(0, -0.15, -1);
  camera.add(flash);
  camera.add(flash.target);
  const beamMat = new MeshBasicMaterial({
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    fog: false,
  });
  hdr(beamMat, 0.55, 1.35, 1.45);
  const beam = new Mesh(new CylinderGeometry(0.07, 1.45, 8.5, 18, 1, true), beamMat);
  beam.rotation.x = Math.PI / 2;
  beam.position.z = -4.2;
  beam.raycast = () => undefined;
  camera.add(beam);

  const dustCount = 380;
  const dustOrigin = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustOrigin[i * 3] = (Math.random() - 0.5) * 24;
    dustOrigin[i * 3 + 1] = (Math.random() - 0.2) * 6.5;
    dustOrigin[i * 3 + 2] = (Math.random() - 0.5) * 24;
  }
  const dustColors = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const tide = i % 2 === 0;
    dustColors[i * 3] = tide ? 0.45 : 0.9;
    dustColors[i * 3 + 1] = tide ? 0.95 : 0.45;
    dustColors[i * 3 + 2] = tide ? 0.9 : 1;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute("position", new Float32BufferAttribute(dustCount * 3, 3));
  dustGeo.setAttribute("color", new Float32BufferAttribute(dustColors, 3));
  const dustMat = new PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
    vertexColors: true,
  });
  const dust = new Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  const starCount = 640;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const radius = 36 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    starPositions[i * 3 + 1] = Math.cos(phi) * radius * 0.55;
    starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
  }
  const starFieldGeo = new BufferGeometry();
  starFieldGeo.setAttribute("position", new Float32BufferAttribute(starPositions, 3));
  const starFieldMat = new PointsMaterial({
    color: 0xd9c8ff,
    size: 0.62,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    sizeAttenuation: true,
    fog: false,
  });
  const starField = new Points(starFieldGeo, starFieldMat);
  starField.frustumCulled = false;
  scene.add(starField);

  const dreamAnchor = new Group();
  scene.add(dreamAnchor);
  const dreamPieces: { mesh: Mesh; spin: number }[] = [];
  const dreamSpecs = [
    { radius: 11, tube: 0.03, tilt: [0.9, 0.25, 0.4] as const, spin: 0.16, color: [0.45, 1.35, 1.25] as const },
    { radius: 7.2, tube: 0.018, tilt: [0.25, 1.15, 0.55] as const, spin: -0.24, color: [1.35, 0.55, 1.55] as const },
    { radius: 15.5, tube: 0.045, tilt: [1.35, 0.15, 0.7] as const, spin: 0.07, color: [0.7, 0.85, 1.7] as const },
    { radius: 4.8, tube: 0.016, tilt: [0.55, 0.7, 1.25] as const, spin: 0.32, color: [1.15, 1.05, 1.75] as const },
  ];
  const dreamTrash: Array<() => void> = [];
  for (const spec of dreamSpecs) {
    const geo = new TorusGeometry(spec.radius, spec.tube, 10, 72);
    const mat = new MeshBasicMaterial({
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
      toneMapped: false,
    });
    hdr(mat, spec.color[0], spec.color[1], spec.color[2]);
    const mesh = new Mesh(geo, mat);
    mesh.rotation.set(spec.tilt[0], spec.tilt[1], spec.tilt[2]);
    mesh.raycast = () => undefined;
    dreamAnchor.add(mesh);
    dreamPieces.push({ mesh, spin: spec.spin });
    dreamTrash.push(() => {
      geo.dispose();
      mat.dispose();
    });
  }

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  const bloomPass = new UnrealBloomPass(new Vector2(384, 384), 0.18, 0.6, 0.92);
  const gradePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float time;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float edge = smoothstep(0.2, 0.9, length(p));
        float fringe = 0.0003 * edge;
        vec4 color;
        color.r = texture2D(tDiffuse, vUv + vec2(fringe, 0.0)).r;
        color.g = texture2D(tDiffuse, vUv).g;
        color.b = texture2D(tDiffuse, vUv - vec2(fringe, fringe * 0.4)).b;
        color.a = 1.0;
        float vignette = smoothstep(1.05, 0.45, length(p));
        color.rgb *= mix(0.86, 1.0, vignette);
        color.rgb = mix(color.rgb, color.rgb * vec3(0.92, 0.96, 1.06) + vec3(0.02, 0.0, 0.03), 0.05);
        float grain = fract(sin(dot(vUv + fract(time * 0.013), vec2(12.9898, 78.233))) * 43758.5453);
        color.rgb += (grain - 0.5) * 0.008;
        gl_FragColor = color;
      }
    `,
  });
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloomPass);
  composer.addPass(gradePass);
  composer.addPass(new OutputPass());

  const photoGeo = new PlaneGeometry(1, 1);
  const frameMat = new MeshBasicMaterial({ side: DoubleSide, toneMapped: false });
  hdr(frameMat, 0.72, 0.64, 0.82);
  const starGeo = new CircleGeometry(0.08, 16);
  const starMat = new MeshBasicMaterial({ side: DoubleSide, toneMapped: false });
  hdr(starMat, 1.55, 1.15, 2.3);
  const raycaster = new Raycaster();
  const pointer = new Vector2(0, 0);
  const look = new Vector3();
  const basisX = new Vector3();
  const basisY = new Vector3();
  const basisZ = new Vector3();
  const basis = new Matrix4();
  const up = new Vector3(0, 1, 0);

  const records = new Map<string, Rec>();
  const cache = new Map<string, Cached>();
  const pending = new Set<string>();
  let trash: Array<() => void> = [];
  let pulses: Mesh[] = [];
  let solids: Block[] = [];
  let loop: Layout["loop"] = null;
  let token = 0;
  let inflight = 0;
  let texQuality = useExplorer.getState().quality;
  let sourceKey = "";
  let fogBase = useExplorer.getState().fog;
  let layoutKey = "";
  let builtMode: Mode | null = null;
  let didBuild = false;
  let dead = false;
  let speed = 0;
  let yaw = 0;
  let pitch = 0;
  let aimWait = 0;
  let pumpWait = 0;
  let bob = 0;
  let bobAmp = 0;
  let shadowsOn = false;
  const pos = new Vector3(0, 1.62, 5);
  const vel = new Vector3();
  let tween: {
    t: number;
    from: Vector3;
    to: Vector3;
    fromYaw: number;
    toYaw: number;
    fromPitch: number;
    toPitch: number;
  } | null = null;

  function orient(obj: Object3D, normal: Vector3) {
    basisZ.copy(normal).normalize();
    basisX.crossVectors(up, basisZ);
    if (basisX.lengthSq() < 1e-6) basisX.set(1, 0, 0);
    basisX.normalize();
    basisY.crossVectors(basisZ, basisX).normalize();
    basis.makeBasis(basisX, basisY, basisZ);
    obj.quaternion.setFromRotationMatrix(basis);
  }

  function clearCache() {
    token += 1;
    inflight = 0;
    pending.clear();
    for (const entry of cache.values()) {
      entry.tex.dispose();
      const image = entry.tex.image as { close?: () => void } | undefined;
      image?.close?.();
    }
    cache.clear();
  }

  function clearContent() {
    for (const rec of records.values()) {
      rec.mat.dispose();
      rec.mesh.removeFromParent();
      rec.twin?.removeFromParent();
    }
    records.clear();
    pulses = [];
    for (const dispose of trash) dispose();
    trash = [];
    while (content.children.length) content.remove(content.children[0]!);
  }

  function applyCached(rec: Rec, cached: Cached) {
    rec.mat.map = cached.tex;
    rec.mat.color.setHex(0xffffff);
    rec.mat.needsUpdate = true;
    const width = rec.height * cached.aspect;
    rec.mesh.scale.set(width, rec.height, 1);
    if (rec.twin) rec.twin.scale.set(width, rec.height, 1);
  }

  function addLabel(text: string, position: Vec3) {
    const board = document.createElement("canvas");
    board.width = 768;
    board.height = 160;
    const ctx = board.getContext("2d");
    if (!ctx) return;
    ctx.font = "600 78px Fraunces, Georgia, serif";
    ctx.fillStyle = useExplorer.getState().stylized ? "#e7d4ff" : "#f4efe6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 384, 80);
    const tex = new CanvasTexture(board);
    tex.colorSpace = SRGBColorSpace;
    const mat = new SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
    const sprite = new Sprite(mat);
    sprite.position.set(position[0], position[1], position[2]);
    sprite.scale.set(clamp(1.6 + text.length * 0.22, 2.4, 7), 0.9, 1);
    content.add(sprite);
    trash.push(() => {
      tex.dispose();
      mat.dispose();
    });
  }

  function addPhoto(node: PhotoNode, url: string, span: number | null) {
    const mat = new MeshBasicMaterial({ color: 0x3a342c, side: DoubleSide, toneMapped: false });
    const mesh = new Mesh(photoGeo, mat);
    mesh.position.set(node.position[0], node.position[1], node.position[2]);
    mesh.scale.set(node.height, node.height, 1);
    mesh.castShadow = shadowsOn;
    const normal = new Vector3(node.normal[0], node.normal[1], node.normal[2]);
    if (!node.faceCamera) orient(mesh, normal);
    mesh.userData.id = node.id;
    const frame = new Mesh(photoGeo, frameMat);
    frame.position.set(0, 0, -0.045);
    frame.scale.set(1.12, 1.12, 1);
    frame.userData.id = node.id;
    frame.castShadow = shadowsOn;
    mesh.add(frame);
    const star = new Mesh(starGeo, starMat);
    star.position.set(0.36, 0.36, 0.05);
    star.visible = Boolean(useExplorer.getState().marks[node.id]?.starred);
    star.userData.id = node.id;
    mesh.add(star);
    content.add(mesh);
    let twin: Mesh | null = null;
    if (span) {
      twin = new Mesh(photoGeo, mat);
      twin.position.copy(mesh.position);
      twin.position.z -= span;
      twin.quaternion.copy(mesh.quaternion);
      twin.scale.copy(mesh.scale);
      twin.userData.id = node.id;
      const twinFrame = new Mesh(photoGeo, frameMat);
      twinFrame.position.set(0, 0, -0.045);
      twinFrame.scale.set(1.12, 1.12, 1);
      twin.add(twinFrame);
      content.add(twin);
    }
    const rec: Rec = {
      id: node.id,
      url,
      mesh,
      mat,
      star,
      twin,
      base: mesh.position.clone(),
      normal,
      height: node.height,
      phase: node.phase,
      face: node.faceCamera,
    };
    records.set(node.id, rec);
    const cached = cache.get(node.id);
    if (cached) applyCached(rec, cached);
  }

  function blockMaterial(color: BlockColor) {
    const stylized = useExplorer.getState().stylized;
    const palette = stylized ? BLOCK_DREAM : BLOCK_NATURAL;
    if (color === "path") {
      const mat = new MeshBasicMaterial({ toneMapped: false });
      if (stylized) hdr(mat, 0.18, 0.62, 0.55);
      else mat.color.setHex(palette.path);
      return mat;
    }
    if (color === "floor") {
      return new MeshPhongMaterial({
        color: palette.floor,
        emissive: stylized ? 0x12171d : 0x1c1916,
        emissiveIntensity: stylized ? 0.55 : 0.18,
        shininess: 28,
        specular: stylized ? 0xb29678 : 0x6e655c,
      });
    }
    return new MeshLambertMaterial({
      color: palette[color],
      emissive: palette[color],
      emissiveIntensity: stylized ? (color === "ceiling" ? 0.42 : 0.24) : 0.08,
    });
  }

  function addBlocks(blocks: Block[]) {
    const groups = new Map<string, Block[]>();
    for (const block of blocks) {
      const key = `${block.size.map((n) => n.toFixed(3)).join("x")}|${block.color}`;
      const list = groups.get(key);
      if (list) list.push(block);
      else groups.set(key, [block]);
    }
    const dummy = new Object3D();
    for (const list of groups.values()) {
      const sample = list[0]!;
      const geo = new BoxGeometry(sample.size[0], sample.size[1], sample.size[2]);
      const mat = blockMaterial(sample.color);
      const mesh = new InstancedMesh(geo, mat, list.length);
      mesh.frustumCulled = false;
      mesh.castShadow = shadowsOn && sample.color === "wall";
      mesh.receiveShadow = shadowsOn && sample.color !== "path";
      list.forEach((block, index) => {
        dummy.position.set(block.position[0], block.position[1], block.position[2]);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      content.add(mesh);
      trash.push(() => {
        geo.dispose();
        mat.dispose();
        mesh.dispose();
      });
    }
  }

  function dress(layout: Layout) {
    const mode = useExplorer.getState().mode;
    if (mode === "tunnel") {
      const geo = new TorusGeometry(5.15, 0.035, 10, 64);
      const mat = new MeshBasicMaterial({ toneMapped: false });
      if (useExplorer.getState().stylized) hdr(mat, 0.7, 1.45, 1.7);
      else mat.color.setHex(0xc8bba8);
      const zs = new Set<number>();
      for (const node of layout.nodes) {
        if (node.kind === "photo") zs.add(Math.round(node.position[2] * 10) / 10);
      }
      const span = layout.loop?.span ?? 0;
      for (const z of zs) {
        for (const extra of span ? [0, -span] : [0]) {
          const ring = new Mesh(geo, mat);
          ring.position.set(0, 0, z + extra);
          content.add(ring);
        }
      }
      trash.push(() => {
        geo.dispose();
        mat.dispose();
      });
    }
    if (mode === "spiral") {
      let minZ = 0;
      for (const node of layout.nodes) {
        if (node.kind === "photo") minZ = Math.min(minZ, node.position[2]);
      }
      const height = Math.max(4, Math.abs(minZ) + 2);
      const geo = new CylinderGeometry(0.035, 0.035, height, 8);
      const mat = new MeshBasicMaterial({ toneMapped: false });
      if (useExplorer.getState().stylized) hdr(mat, 1.2, 0.7, 1.8);
      else mat.color.setHex(0xc8bba8);
      const spine = new Mesh(geo, mat);
      spine.rotation.x = Math.PI / 2;
      spine.position.set(0, 1.62, minZ / 2);
      content.add(spine);
      pulses.push(spine);
      trash.push(() => {
        geo.dispose();
        mat.dispose();
      });
    }
  }

  function rebuild(layout: Layout, photos: Photo[]) {
    shadowsOn = photos.length > 0 && photos.length <= 140;
    renderer.shadowMap.enabled = shadowsOn;
    keyLight.castShadow = shadowsOn;
    clearContent();
    loop = layout.loop;
    const urls = new Map(photos.map((photo) => [photo.id, textureSource(photo, texQuality)]));
    for (const node of layout.nodes) {
      if (node.kind === "label") addLabel(node.text, node.position);
      else addPhoto(node, urls.get(node.id) ?? "", layout.loop?.span ?? null);
    }
    addBlocks(layout.blocks);
    dress(layout);
    solids = layout.blocks.filter((block) => block.solid);
  }

  function blocked(x: number, z: number) {
    for (const block of solids) {
      const hx = block.size[0] / 2 + RADIUS;
      const hz = block.size[2] / 2 + RADIUS;
      if (Math.abs(x - block.position[0]) < hx && Math.abs(z - block.position[2]) < hz) return true;
    }
    return false;
  }

  function resolve(x: number, z: number) {
    for (let pass = 0; pass < 3; pass++) {
      for (const block of solids) {
        const hx = block.size[0] / 2 + RADIUS;
        const hz = block.size[2] / 2 + RADIUS;
        const dx = x - block.position[0];
        const dz = z - block.position[2];
        if (Math.abs(dx) >= hx || Math.abs(dz) >= hz) continue;
        const pushX = hx - Math.abs(dx);
        const pushZ = hz - Math.abs(dz);
        if (pushX < pushZ) x += Math.sign(dx || 1) * pushX;
        else z += Math.sign(dz || 1) * pushZ;
      }
    }
    return { x, z };
  }

  function teleport(layout: Layout) {
    pos.set(layout.spawn[0], layout.spawn[1], layout.spawn[2]);
    yaw = layout.spawnYaw;
    pitch = 0;
    tween = null;
  }

  function syncScene() {
    const state = useExplorer.getState();
    const vis = visiblePhotos(state);
    const nextKey = libraryKey(state.photos, state.quality);
    if (nextKey !== sourceKey) {
      sourceKey = nextKey;
      texQuality = state.quality;
      clearCache();
    }
    fogBase = state.fog * (state.mode === "maze" ? 1.4 : state.mode === "float" ? 0.62 : 1);
    fog.density = fogBase;
    const sig = [
      state.mode,
      state.cols,
      state.size,
      state.groupBy,
      state.sort,
      state.query,
      state.starredOnly ? 1 : 0,
      state.showHidden ? 1 : 0,
      state.tag ?? "",
      state.album ?? "",
      state.from,
      state.to,
      state.stylized ? 1 : 0,
      vis.map((photo) => photo.id).join("\n"),
    ].join("|");
    if (sig !== layoutKey) {
      const modeChanged = builtMode !== state.mode;
      layoutKey = sig;
      const layout = buildLayout(vis, state.mode, state.cols, state.size, state.groupBy);
      rebuild(layout, vis);
      if (!didBuild || modeChanged || (walkMode(state.mode) && blocked(pos.x, pos.z))) teleport(layout);
      didBuild = true;
      builtMode = state.mode;
      if (state.omitted !== layout.omitted) useExplorer.getState().patch({ omitted: layout.omitted });
    } else {
      for (const rec of records.values()) {
        if (!cache.has(rec.id)) {
          rec.mat.map = null;
          rec.mat.color.setHex(0x3a342c);
          rec.mat.needsUpdate = true;
        }
      }
    }
    for (const photo of vis) {
      const rec = records.get(photo.id);
      if (rec) rec.url = textureSource(photo, texQuality);
    }
    pump();
  }

  function beginFocus(id: string) {
    const rec = records.get(id);
    if (!rec) return;
    const dist = Math.max(2.1, rec.height * 1.45);
    const target = rec.base.clone().addScaledVector(rec.normal, dist);
    if (rec.face) target.set(rec.base.x, rec.base.y, rec.base.z + dist);
    const dir = rec.base.clone().sub(target).normalize();
    const toYaw = Math.atan2(-dir.x, -dir.z);
    const toPitch = Math.asin(clamp(dir.y, -1, 1));
    tween = {
      t: 0,
      from: pos.clone(),
      to: target,
      fromYaw: yaw,
      toYaw: yaw + Math.atan2(Math.sin(toYaw - yaw), Math.cos(toYaw - yaw)),
      fromPitch: pitch,
      toPitch,
    };
  }

  async function loadOne(id: string, url: string, generation: number) {
    pending.add(id);
    inflight += 1;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("image");
      const blob = await response.blob();
      if (generation !== token || dead) return;
      const maxW = texQuality === "sharp" ? 1280 : 640;
      // ImageBitmap uploads ignore Texture.flipY, so a normal bitmap lands
      // upside down on the plane. "flipY" applies the camera's EXIF orientation
      // first, then stores the pixels the way WebGL samples them. Left and
      // right stay put.
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(blob, {
          resizeWidth: maxW,
          resizeQuality: "low",
          imageOrientation: "flipY",
        });
      } catch {
        try {
          bitmap = await createImageBitmap(blob, { imageOrientation: "flipY" });
        } catch {
          bitmap = await createImageBitmap(blob);
        }
      }
      if (generation !== token || dead) {
        bitmap.close();
        return;
      }
      const aspect = bitmap.width / Math.max(1, bitmap.height);
      const tex = new Texture(bitmap);
      tex.flipY = false;
      tex.needsUpdate = true;
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      cache.set(id, { tex, aspect });
      const rec = records.get(id);
      if (rec) applyCached(rec, { tex, aspect });
      evict();
      const count = cache.size;
      if (useExplorer.getState().loadedTextures !== count) useExplorer.getState().patch({ loadedTextures: count });
    } catch {
      /* keep the warm placeholder */
    } finally {
      pending.delete(id);
      inflight = Math.max(0, inflight - 1);
    }
  }

  function evict() {
    if (cache.size <= 72) return;
    const ranked = [...records.values()].sort(
      (a, b) => a.mesh.position.distanceToSquared(camera.position) - b.mesh.position.distanceToSquared(camera.position),
    );
    const keep = new Set(ranked.slice(0, 48).map((rec) => rec.id));
    for (const [id, entry] of cache) {
      if (keep.has(id)) continue;
      entry.tex.dispose();
      cache.delete(id);
      const rec = records.get(id);
      if (rec) {
        rec.mat.map = null;
        rec.mat.color.setHex(0x3a342c);
        rec.mat.needsUpdate = true;
      }
    }
  }

  function pump() {
    if (inflight >= 6) return;
    const ranked = [...records.values()]
      .filter((rec) => rec.url && !cache.has(rec.id) && !pending.has(rec.id))
      .sort((a, b) => a.base.distanceToSquared(pos) - b.base.distanceToSquared(pos));
    const generation = token;
    for (const rec of ranked) {
      if (inflight >= 6) break;
      void loadOne(rec.id, rec.url, generation);
    }
  }

  function hitId() {
    raycaster.setFromCamera(pointer, camera);
    const roots: Object3D[] = [];
    for (const rec of records.values()) {
      roots.push(rec.mesh);
      if (rec.twin) roots.push(rec.twin);
    }
    const hits = raycaster.intersectObjects(roots, true);
    for (const hit of hits) {
      let obj: Object3D | null = hit.object;
      while (obj) {
        const id = obj.userData.id as string | undefined;
        if (id) return id;
        obj = obj.parent;
      }
    }
    return null;
  }

  function integrate(dt: number) {
    const state = useExplorer.getState();
    if (state.surface !== "space" || state.settingsOpen || isTyping()) {
      speed = 0;
      vel.set(0, 0, 0);
      return;
    }
    if (tween) {
      vel.set(0, 0, 0);
      tween.t += dt;
      const k = clamp(tween.t / 0.7, 0, 1);
      const eased = k * k * (3 - 2 * k);
      pos.lerpVectors(tween.from, tween.to, eased);
      yaw = tween.fromYaw + (tween.toYaw - tween.fromYaw) * eased;
      pitch = tween.fromPitch + (tween.toPitch - tween.fromPitch) * eased;
      speed = (1 - eased) * 4;
      if (k >= 1) tween = null;
      return;
    }
    const fly = !walkMode(state.mode);
    const sprint = held.has("ShiftLeft") || held.has("ShiftRight") ? 1.85 : 1;
    const mag = (fly ? 3.4 : 2.15) * state.speed * sprint;
    let forward = (held.has("KeyW") || held.has("ArrowUp") ? 1 : 0) - (held.has("KeyS") || held.has("ArrowDown") ? 1 : 0);
    if (fly && state.autoGlide) forward += 1;
    const strafe = (held.has("KeyD") || held.has("ArrowRight") ? 1 : 0) - (held.has("KeyA") || held.has("ArrowLeft") ? 1 : 0);
    if (held.has("KeyQ")) yaw += 1.15 * dt;
    if (held.has("KeyR")) yaw -= 1.15 * dt;
    const cp = Math.cos(pitch);
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    let vx = 0;
    let vy = 0;
    let vz = 0;
    if (fly) {
      const rise = (held.has("Space") ? 1 : 0) - (held.has("KeyC") || held.has("ControlLeft") || held.has("ControlRight") ? 1 : 0);
      vx = (fx * cp * forward + rx * strafe) * mag;
      vy = (Math.sin(pitch) * forward + rise) * mag;
      vz = (fz * cp * forward + rz * strafe) * mag;
    } else {
      vx = (fx * forward + rx * strafe) * mag;
      vz = (fz * forward + rz * strafe) * mag;
    }
    const blend = 1 - Math.exp(-dt * 7.5);
    vel.x += (vx - vel.x) * blend;
    vel.y += (vy - vel.y) * blend;
    vel.z += (vz - vel.z) * blend;
    speed = vel.length();
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;
    pos.z += vel.z * dt;
    if (!fly) {
      const next = resolve(pos.x, pos.z);
      if (Math.abs(next.x - pos.x) > 1e-4) vel.x = 0;
      if (Math.abs(next.z - pos.z) > 1e-4) vel.z = 0;
      pos.x = next.x;
      pos.z = next.z;
      pos.y += (1.62 - pos.y) * Math.min(1, dt * 8);
    } else if (loop) {
      while (pos.z <= loop.minZ) pos.z += loop.span;
      while (pos.z > loop.minZ + loop.span) pos.z -= loop.span;
    }
  }

  function applyCamera(dt: number, elapsed: number) {
    const state = useExplorer.getState();
    const sprinting = held.has("ShiftLeft") || held.has("ShiftRight");
    const moving = speed > 0.45 && !tween;
    const walking = walkMode(state.mode);
    if (moving) bob += dt * (sprinting ? 8 : walking ? 6.2 : 1.6);
    bobAmp += (((moving ? 1 : 0) - bobAmp) * Math.min(1, dt * 4));
    const vertical = Math.sin(bob) * (walking ? 0.02 : 0.012) * bobAmp;
    const lateral = Math.cos(bob * 0.5) * (walking ? 0.012 : 0.006) * bobAmp;
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    camera.position.set(pos.x + rx * lateral, pos.y + vertical, pos.z + rz * lateral);
    const cp = Math.cos(pitch);
    look.set(
      camera.position.x - Math.sin(yaw) * cp,
      camera.position.y + Math.sin(pitch),
      camera.position.z - Math.cos(yaw) * cp,
    );
    camera.lookAt(look);
    const targetFov = sprinting && speed > 1 && !tween ? 72 : 68;
    if (Math.abs(camera.fov - targetFov) > 0.04) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 4.5);
      camera.updateProjectionMatrix();
    }

    const mode = state.mode;
    const maze = mode === "maze";
    const gallery = mode === "gallery";
    const stylized = state.stylized;
    hemi.intensity = maze ? 0.7 : 0.95;
    keyLight.intensity = maze ? 0.55 : gallery ? 1.25 : 1.15;
    flash.intensity = maze ? 7 : 0;
    flash.angle = maze ? 0.46 : 0.72;
    flash.distance = maze ? 18 : 30;
    beam.visible = maze && stylized;
    beamMat.opacity = 0.03;
    const dreamy = mode === "float" || mode === "tunnel" || mode === "spiral";
    starField.visible = stylized && dreamy;
    dreamAnchor.visible = stylized && dreamy;
    dust.visible = stylized;
    starField.position.copy(pos);
    starField.rotation.y = elapsed * 0.015;
    keyLight.position.set(pos.x + 6, pos.y + 12, pos.z + 5);
    keyLight.target.position.set(pos.x, 0.2, pos.z - 2);
    applyLook(state.glow, stylized);
  }

  function applyLook(glow: boolean, stylized: boolean) {
    const background = stylized ? BG_DREAM : BG_NATURAL;
    scene.background = background;
    fog.color.copy(background);
    renderer.setClearColor(background, 1);
    if (stylized) {
      hemi.color.setHex(0xcbb6ff);
      hemi.groundColor.setHex(0x123c3c);
      keyLight.color.setHex(0x7ef0e2);
      flash.color.setHex(0xd7c6ff);
      hdr(frameMat, 0.72, 0.64, 0.82);
      hdr(starMat, 1.2, 0.9, 1.6);
    } else {
      hemi.color.setHex(0xfff6ea);
      hemi.groundColor.setHex(0x4a4036);
      keyLight.color.setHex(0xfff8f0);
      flash.color.setHex(0xfff4e5);
      frameMat.color.setHex(0xcfc6b8);
      starMat.color.setHex(0xc6a15a);
    }
    bloomPass.enabled = glow;
    bloomPass.strength = glow ? (stylized ? 0.32 : 0.14) : 0;
    gradePass.enabled = stylized;
  }

  function updateDust(elapsed: number) {
    const attr = dustGeo.getAttribute("position");
    const array = attr.array as Float32Array;
    for (let i = 0; i < dustCount; i++) {
      const ox = dustOrigin[i * 3]!;
      const oy = dustOrigin[i * 3 + 1]!;
      const oz = dustOrigin[i * 3 + 2]!;
      array[i * 3] = pos.x + ox + Math.sin(elapsed * 0.08 + i) * 0.12;
      array[i * 3 + 1] = pos.y + oy + Math.sin(elapsed * 0.12 + ox) * 0.06;
      array[i * 3 + 2] = pos.z + oz + Math.cos(elapsed * 0.07 + i) * 0.12;
    }
    attr.needsUpdate = true;
  }

  function billboard(elapsed: number) {
    for (const rec of records.values()) {
      if (!rec.face) continue;
      rec.mesh.quaternion.copy(camera.quaternion);
      rec.mesh.position.copy(rec.base);
      rec.mesh.position.y += Math.sin(elapsed * 0.35 + rec.phase) * 0.03;
    }
    if (!useExplorer.getState().stylized) return;
    const glow = 0.94 + Math.sin(elapsed * 0.4) * 0.04;
    const tide = 0.5 + Math.sin(elapsed * 0.22) * 0.12;
    for (const mesh of pulses) {
      const mat = mesh.material as MeshBasicMaterial;
      mat.color.r = (0.55 + 0.9 * (1 - tide)) * glow;
      mat.color.g = (0.85 + 0.7 * tide) * glow;
      mat.color.b = (1.15 + 0.9 * tide) * glow;
    }
  }

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    if (width < 2 || height < 2) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.code === "Escape" && !event.repeat) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
        return;
      }
      const state = useExplorer.getState();
      if (state.settingsOpen) state.patch({ settingsOpen: false });
      else if (state.selectedId) state.patch({ selectedId: null });
      else if (state.drawerOpen) state.patch({ drawerOpen: false });
      else state.patch({ settingsOpen: true, hintOpen: false });
      return;
    }
    if (isTyping()) return;
    if (MOVE.has(event.code)) {
      event.preventDefault();
      setHeld(event.code, true);
      tween = null;
      return;
    }
    if (event.repeat) return;
    const state = useExplorer.getState();
    if (event.code === "Digit1") state.setMode("grid");
    else if (event.code === "Digit2") state.setMode("gallery");
    else if (event.code === "Digit3") state.setMode("float");
    else if (event.code === "Digit4") state.setMode("tunnel");
    else if (event.code === "Digit5") state.setMode("spiral");
    else if (event.code === "Digit6") state.setMode("maze");
    else if (event.code === "KeyH") state.patch({ hintOpen: !state.hintOpen });
    else if (event.code === "KeyI") state.setSurface(state.surface === "index" ? "space" : "index");
    else if (event.code === "KeyE") {
      const id = state.aimId ?? state.selectedId;
      if (id) state.requestFocus(id);
    } else if (event.code === "KeyF") {
      const id = state.aimId ?? state.selectedId;
      if (id) state.toggleStar(id);
    } else if (event.code === "BracketRight" || event.code === "BracketLeft") {
      const vis = visiblePhotos(state);
      if (!vis.length) return;
      const current = state.selectedId ?? state.aimId;
      let index = vis.findIndex((photo) => photo.id === current);
      if (index < 0) index = 0;
      else index = (index + (event.code === "BracketRight" ? 1 : -1) + vis.length) % vis.length;
      state.requestFocus(vis[index]!.id);
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    setHeld(event.code, false);
  }

  let dragging = false;
  let moved = 0;
  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    dragging = true;
    moved = 0;
    canvas.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent) {
    if (!dragging || document.pointerLockElement === canvas) return;
    moved += Math.abs(event.movementX) + Math.abs(event.movementY);
    yaw -= event.movementX * 0.005;
    pitch = clamp(pitch - event.movementY * 0.005, -1.15, 1.15);
    tween = null;
  }
  function onPointerUp(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    if (moved < 6) {
      const rect = canvas.getBoundingClientRect();
      const savedX = pointer.x;
      const savedY = pointer.y;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const id = hitId();
      pointer.set(savedX, savedY);
      useExplorer.getState().patch({ aimId: id, selectedId: id });
    }
  }
  function onLockMove(event: MouseEvent) {
    if (document.pointerLockElement !== canvas) return;
    yaw -= event.movementX * 0.0022;
    pitch = clamp(pitch - event.movementY * 0.0022, -1.15, 1.15);
    tween = null;
  }
  function onBlur() {
    held.clear();
  }
  function onDoubleClick() {
    void canvas.requestPointerLock();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("dblclick", onDoubleClick);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onLockMove);
  window.addEventListener("blur", onBlur);
  const observer = new ResizeObserver(() => resize());
  observer.observe(canvas);
  resize();

  const unsub = useExplorer.subscribe((state, prev) => {
    if (state.focusNonce !== prev.focusNonce && state.focusId) beginFocus(state.focusId);
    if (state.marks !== prev.marks) {
      for (const rec of records.values()) rec.star.visible = Boolean(state.marks[rec.id]?.starred);
    }
    if (
      state.photos !== prev.photos ||
      state.mode !== prev.mode ||
      state.cols !== prev.cols ||
      state.size !== prev.size ||
      state.groupBy !== prev.groupBy ||
      state.sort !== prev.sort ||
      state.query !== prev.query ||
      state.starredOnly !== prev.starredOnly ||
      state.showHidden !== prev.showHidden ||
      state.tag !== prev.tag ||
      state.album !== prev.album ||
      state.from !== prev.from ||
      state.to !== prev.to ||
      state.quality !== prev.quality ||
      state.fog !== prev.fog ||
      state.stylized !== prev.stylized
    ) {
      syncScene();
    }
  });

  const probe = {
    getYaw: () => yaw,
    getSpeed: () => speed,
    getPos: () => ({ x: pos.x, y: pos.y, z: pos.z }),
    setKeys: (codes: string[]) => {
      replaceHeld(codes);
      tween = null;
    },
    setYaw: (next: number) => {
      yaw = next;
    },
  };
  window.__controlsTest = probe;

  syncScene();
  renderer.setAnimationLoop((time) => {
    if (dead) return;
    timer.update(time);
    const dt = Math.min(timer.getDelta(), 0.05);
    const elapsed = timer.getElapsed();
    integrate(dt);
    applyCamera(dt, elapsed);
    billboard(elapsed);
    updateDust(elapsed);
    fog.density = fogBase;
    const follow = Math.min(1, dt * 0.2);
    dreamAnchor.position.x += (pos.x - dreamAnchor.position.x) * follow;
    dreamAnchor.position.z += (pos.z - dreamAnchor.position.z) * follow;
    dreamAnchor.position.y = 1.4 + Math.sin(elapsed * 0.12) * 0.06;
    for (const piece of dreamPieces) {
      piece.mesh.rotation.y += dt * piece.spin * 0.28;
      piece.mesh.rotation.x += dt * piece.spin * 0.08;
    }
    gradePass.uniforms.time!.value = elapsed;
    const lookState = useExplorer.getState();
    const heading = headingOf(yaw);
    if (heading !== useExplorer.getState().heading) useExplorer.getState().patch({ heading });
    aimWait += dt;
    if (aimWait > 0.4) {
      aimWait = 0;
      const id = hitId();
      if (id !== useExplorer.getState().aimId) useExplorer.getState().patch({ aimId: id });
    }
    pumpWait += dt;
    if (pumpWait > 0.12) {
      pumpWait = 0;
      pump();
    }
    if (lookState.glow || lookState.stylized) composer.render();
    else renderer.render(scene, camera);
  });

  return {
    dispose() {
      dead = true;
      token += 1;
      renderer.setAnimationLoop(null);
      timer.disconnect();
      unsub();
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("dblclick", onDoubleClick);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onLockMove);
      window.removeEventListener("blur", onBlur);
      clearContent();
      clearCache();
      photoGeo.dispose();
      frameMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      starFieldGeo.dispose();
      starFieldMat.dispose();
      for (const disposeDream of dreamTrash) disposeDream();
      beam.geometry.dispose();
      beamMat.dispose();
      composer.dispose();
      renderer.dispose();
      if (window.__controlsTest === probe) delete window.__controlsTest;
    },
  };
}
