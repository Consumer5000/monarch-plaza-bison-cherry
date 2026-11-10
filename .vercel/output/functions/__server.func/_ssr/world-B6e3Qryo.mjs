import { a as isTyping, i as held, n as useExplorer, o as replaceHeld, r as visiblePhotos, s as setHeld } from "./routes-DDioHFra.mjs";
import { A as SRGBColorSpace, C as MeshPhongMaterial, D as Points, E as PlaneGeometry, F as Timer, I as TorusGeometry, L as Vector2, M as SpotLight, N as Sprite, O as PointsMaterial, P as SpriteMaterial, R as Vector3, S as MeshLambertMaterial, T as PerspectiveCamera, _ as HemisphereLight, a as ShaderPass, b as Mesh, c as BufferGeometry, d as Color, f as CylinderGeometry, g as Group, h as FogExp2, i as EffectComposer, j as Scene, k as Raycaster, l as CanvasTexture, m as Float32BufferAttribute, n as RenderPass, o as WebGLRenderer, p as DirectionalLight, r as OutputPass, s as BoxGeometry, t as UnrealBloomPass, u as CircleGeometry, v as InstancedMesh, w as Object3D, x as MeshBasicMaterial, y as Matrix4 } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/world-B6e3Qryo.js
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function hashSeed(photos) {
	let h = 2166136261;
	const sample = `${photos.length}|${photos[0]?.id ?? ""}|${photos[photos.length - 1]?.id ?? ""}`;
	for (let i = 0; i < sample.length; i++) h = Math.imul(h ^ sample.charCodeAt(i), 16777619);
	return h >>> 0;
}
function monthKey(ms) {
	const d = new Date(ms);
	if (Number.isNaN(d.getTime())) return "unknown";
	return `${d.getFullYear()}-${d.getMonth()}`;
}
function monthLabel(ms) {
	if (!ms || Number.isNaN(ms)) return "Unknown date";
	return new Intl.DateTimeFormat(void 0, {
		month: "long",
		year: "numeric"
	}).format(ms);
}
function rangeLabel(list) {
	if (!list.length) return "Gallery";
	const a = Math.min(...list.map((p) => p.taken));
	const b = Math.max(...list.map((p) => p.taken));
	const fmt = (ms) => new Intl.DateTimeFormat(void 0, {
		month: "short",
		year: "numeric"
	}).format(ms);
	const left = fmt(a);
	const right = fmt(b);
	return left === right ? left : `${left} – ${right}`;
}
function shell(spawn, spawnYaw = 0) {
	return {
		nodes: [],
		blocks: [],
		spawn,
		spawnYaw,
		loop: null,
		omitted: 0
	};
}
function layoutGrid(photos, cols, size) {
	const pitchX = size * 1.42;
	const pitchZ = size * 1.55;
	const nodes = [];
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
			if (lastKey) row += .55;
			nodes.push({
				kind: "label",
				text: monthLabel(photo.taken),
				position: [
					0,
					2.9,
					-row * pitchZ
				]
			});
			row += .48;
			lastKey = key;
		}
		const x = (col - (cols - 1) / 2) * pitchX;
		nodes.push({
			kind: "photo",
			id: photo.id,
			position: [
				x,
				1.62,
				-row * pitchZ
			],
			normal: [
				0,
				0,
				1
			],
			height: size,
			faceCamera: false,
			phase: col * .35 + row * .2
		});
		col += 1;
		if (col >= cols) {
			col = 0;
			row += 1;
		}
	}
	const depth = Math.max(row, 1) * pitchZ + 10;
	const width = Math.max(cols * pitchX + 4, 8);
	const midZ = -Math.max(row - 1, 0) * pitchZ * .5;
	return {
		nodes,
		blocks: [{
			position: [
				0,
				-.04,
				midZ
			],
			size: [
				width,
				.06,
				depth
			],
			solid: false,
			color: "floor"
		}, {
			position: [
				0,
				.01,
				midZ
			],
			size: [
				1.2,
				.025,
				depth
			],
			solid: false,
			color: "path"
		}],
		spawn: [
			0,
			1.62,
			5
		],
		spawnYaw: 0,
		loop: null,
		omitted: 0
	};
}
var ROOM = {
	len: 16,
	halfL: 8,
	halfW: 6,
	height: 4.1,
	thick: .32,
	doorW: 2.6,
	doorH: 2.75
};
function pushDoorWall(blocks, z) {
	const sideW = ROOM.halfW - ROOM.doorW / 2;
	const sideX = ROOM.doorW / 2 + sideW / 2;
	blocks.push({
		position: [
			-sideX,
			ROOM.height / 2,
			z
		],
		size: [
			sideW,
			ROOM.height,
			ROOM.thick
		],
		solid: true,
		color: "wall"
	}, {
		position: [
			sideX,
			ROOM.height / 2,
			z
		],
		size: [
			sideW,
			ROOM.height,
			ROOM.thick
		],
		solid: true,
		color: "wall"
	}, {
		position: [
			0,
			ROOM.doorH + (ROOM.height - ROOM.doorH) / 2,
			z
		],
		size: [
			ROOM.doorW,
			ROOM.height - ROOM.doorH,
			ROOM.thick
		],
		solid: false,
		color: "wall"
	});
}
function roomSlots(centerZ, withSouth) {
	const southZ = centerZ + ROOM.halfL;
	const northZ = centerZ - ROOM.halfL;
	const inset = ROOM.thick / 2 + .05;
	const margin = 1.75;
	const span = ROOM.len - margin * 2;
	const left = [];
	const right = [];
	for (let i = 0; i < 4; i++) {
		const z = southZ - margin - (i + .5) * (span / 4);
		left.push({
			position: [
				-ROOM.halfW + inset,
				1.62,
				z
			],
			normal: [
				1,
				0,
				0
			]
		});
		right.push({
			position: [
				ROOM.halfW - inset,
				1.62,
				z
			],
			normal: [
				-1,
				0,
				0
			]
		});
	}
	const north = [{
		position: [
			-3.65,
			1.62,
			northZ + inset
		],
		normal: [
			0,
			0,
			1
		]
	}, {
		position: [
			3.65,
			1.62,
			northZ + inset
		],
		normal: [
			0,
			0,
			1
		]
	}];
	const south = withSouth ? [{
		position: [
			-3.65,
			1.62,
			southZ - inset
		],
		normal: [
			0,
			0,
			-1
		]
	}, {
		position: [
			3.65,
			1.62,
			southZ - inset
		],
		normal: [
			0,
			0,
			-1
		]
	}] : [];
	const order = [];
	const n = Math.max(left.length, right.length, north.length, south.length);
	for (let i = 0; i < n; i++) {
		if (left[i]) order.push(left[i]);
		if (right[i]) order.push(right[i]);
		if (north[i]) order.push(north[i]);
		if (south[i]) order.push(south[i]);
	}
	return order;
}
function addRoomShell(blocks, centerZ, withSouth) {
	blocks.push({
		position: [
			-ROOM.halfW,
			ROOM.height / 2,
			centerZ
		],
		size: [
			ROOM.thick,
			ROOM.height,
			ROOM.len
		],
		solid: true,
		color: "wall"
	}, {
		position: [
			ROOM.halfW,
			ROOM.height / 2,
			centerZ
		],
		size: [
			ROOM.thick,
			ROOM.height,
			ROOM.len
		],
		solid: true,
		color: "wall"
	}, {
		position: [
			0,
			.04,
			centerZ
		],
		size: [
			ROOM.halfW * 2,
			.08,
			ROOM.len
		],
		solid: false,
		color: "floor"
	}, {
		position: [
			0,
			.09,
			centerZ
		],
		size: [
			1.35,
			.02,
			ROOM.len - .4
		],
		solid: false,
		color: "path"
	}, {
		position: [
			0,
			ROOM.height,
			centerZ
		],
		size: [
			ROOM.halfW * 2,
			.08,
			ROOM.len
		],
		solid: false,
		color: "ceiling"
	});
	pushDoorWall(blocks, centerZ - ROOM.halfL);
	if (withSouth) pushDoorWall(blocks, centerZ + ROOM.halfL);
}
function groupPhotos(photos, groupBy) {
	if (groupBy !== "folder") return [{
		label: "",
		photos
	}];
	const order = [];
	const map = /* @__PURE__ */ new Map();
	for (const photo of photos) {
		const key = photo.folder || "Library";
		if (!map.has(key)) {
			map.set(key, []);
			order.push(key);
		}
		map.get(key).push(photo);
	}
	return order.map((key) => ({
		label: key,
		photos: map.get(key)
	}));
}
function layoutGallery(photos, size, groupBy) {
	const height = Math.min(Math.max(size, 1.15), 2.05);
	const nodes = [];
	const blocks = [];
	const groups = groupPhotos(photos, groupBy);
	let room = 0;
	const place = (list, label) => {
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
					phase: index
				});
			});
			const text = label || rangeLabel(slice);
			nodes.push({
				kind: "label",
				text,
				position: [
					0,
					3.28,
					centerZ
				]
			});
			offset += slice.length;
			room += 1;
		}
	};
	if (groupBy === "folder") for (const group of groups) place(group.photos, group.label);
	else if (photos.length) place(photos, "");
	if (!photos.length) addRoomShell(blocks, 0, true);
	return {
		nodes,
		blocks,
		spawn: [
			0,
			1.62,
			6
		],
		spawnYaw: 0,
		loop: null,
		omitted: 0
	};
}
function layoutFloat(photos, size) {
	const rng = mulberry32(hashSeed(photos) ^ 20973);
	const span = Math.max(8, Math.sqrt(Math.max(photos.length, 1)) * 5);
	const minDist = size * 1.2;
	const placed = [];
	const nodes = [];
	for (const photo of photos) {
		let pos = [
			0,
			1.8,
			-4
		];
		for (let attempt = 0; attempt < 28; attempt++) {
			const x = (rng() - .5) * span;
			const y = .55 + rng() * Math.max(4, span * .38);
			const z = -.5 - rng() * span;
			const ok = placed.every((p) => {
				const dx = p[0] - x;
				const dy = p[1] - y;
				const dz = p[2] - z;
				return dx * dx + dy * dy + dz * dz >= minDist * minDist;
			});
			pos = [
				x,
				y,
				z
			];
			if (ok) break;
		}
		placed.push(pos);
		nodes.push({
			kind: "photo",
			id: photo.id,
			position: pos,
			normal: [
				0,
				0,
				1
			],
			height: size * (.82 + rng() * .36),
			faceCamera: true,
			phase: rng() * Math.PI * 2
		});
	}
	return {
		nodes,
		blocks: [],
		spawn: [
			0,
			2,
			6
		],
		spawnYaw: 0,
		loop: null,
		omitted: 0
	};
}
function layoutTunnel(photos, size) {
	const radius = 6.2;
	const per = 8;
	const spacing = 2.8;
	const rings = Math.max(1, Math.ceil(Math.max(photos.length, 1) / per));
	const nodes = photos.map((photo, i) => {
		const ring = Math.floor(i / per);
		const ang = i % per / per * Math.PI * 2 + ring * .18;
		const x = Math.cos(ang) * radius;
		const y = Math.sin(ang) * radius;
		const z = -ring * spacing;
		const len = Math.hypot(-x, -y, 2.2) || 1;
		return {
			kind: "photo",
			id: photo.id,
			position: [
				x,
				y,
				z
			],
			normal: [
				-x / len,
				-y / len,
				2.2 / len
			],
			height: size,
			faceCamera: false,
			phase: ang
		};
	});
	const span = rings * spacing;
	return {
		nodes,
		blocks: [],
		spawn: [
			0,
			0,
			3.2
		],
		spawnYaw: 0,
		loop: {
			minZ: 3.2 - span,
			span
		},
		omitted: 0
	};
}
function layoutSpiral(photos, size) {
	const nodes = photos.map((photo, i) => {
		const ang = i * .62;
		const x = Math.sin(ang) * 4.2;
		const z = -i * 1.25;
		const len = Math.hypot(-x, 2) || 1;
		return {
			kind: "photo",
			id: photo.id,
			position: [
				x,
				1.62,
				z
			],
			normal: [
				-x / len,
				0,
				2 / len
			],
			height: size,
			faceCamera: false,
			phase: ang
		};
	});
	const end = photos.length ? -(photos.length - 1) * 1.25 : 0;
	return {
		nodes,
		blocks: [{
			position: [
				0,
				-.02,
				end / 2
			],
			size: [
				14,
				.05,
				Math.abs(end) + 14
			],
			solid: false,
			color: "floor"
		}],
		spawn: [
			0,
			1.62,
			3
		],
		spawnYaw: 0,
		loop: null,
		omitted: 0
	};
}
function faceCount(cols, rows) {
	return ((cols - 1) * rows + cols * (rows - 1) - (cols * rows - 1)) * 2 + 2 * cols + 2 * rows;
}
function carveMaze(cols, rows, rng) {
	const north = Array.from({ length: rows }, () => Array(cols).fill(false));
	const east = Array.from({ length: rows }, () => Array(cols).fill(false));
	const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
	const stack = [[0, 0]];
	seen[0][0] = true;
	while (stack.length) {
		const [c, r] = stack[stack.length - 1];
		const options = [];
		if (r + 1 < rows && !seen[r + 1][c]) options.push({
			c,
			r: r + 1,
			dir: "N"
		});
		if (c + 1 < cols && !seen[r][c + 1]) options.push({
			c: c + 1,
			r,
			dir: "E"
		});
		if (r - 1 >= 0 && !seen[r - 1][c]) options.push({
			c,
			r: r - 1,
			dir: "S"
		});
		if (c - 1 >= 0 && !seen[r][c - 1]) options.push({
			c: c - 1,
			r,
			dir: "W"
		});
		if (!options.length) {
			stack.pop();
			continue;
		}
		const pick = options[Math.floor(rng() * options.length)];
		if (pick.dir === "N") north[r][c] = true;
		else if (pick.dir === "E") east[r][c] = true;
		else if (pick.dir === "S") north[pick.r][pick.c] = true;
		else east[pick.r][pick.c] = true;
		seen[pick.r][pick.c] = true;
		stack.push([pick.c, pick.r]);
	}
	return {
		cols,
		rows,
		north,
		east
	};
}
function layoutMaze(photos, size) {
	const cell = 4.6;
	const wallH = 3.55;
	const thick = .3;
	let side = 4;
	while (side < 20 && faceCount(side, side) * 2 < photos.length) side += 1;
	const carve = carveMaze(side, side, mulberry32(hashSeed(photos) ^ side * 997));
	const cols = side;
	const rows = side;
	const blocks = [];
	const faces = [];
	const inset = .21;
	for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
		if (c > -1 && c < cols - 1 && carve.east[r][c]) continue;
		const x = (c + .5) * cell;
		const z = -r * cell;
		blocks.push({
			position: [
				x,
				wallH / 2,
				z
			],
			size: [
				thick,
				wallH,
				cell
			],
			solid: true,
			color: "wall"
		});
		if (c === -1) faces.push({
			position: [
				x + inset,
				0,
				z
			],
			normal: [
				1,
				0,
				0
			]
		});
		else if (c === cols - 1) faces.push({
			position: [
				x - inset,
				0,
				z
			],
			normal: [
				-1,
				0,
				0
			]
		});
		else {
			faces.push({
				position: [
					x - inset,
					0,
					z
				],
				normal: [
					-1,
					0,
					0
				]
			});
			faces.push({
				position: [
					x + inset,
					0,
					z
				],
				normal: [
					1,
					0,
					0
				]
			});
		}
	}
	for (let r = -1; r < rows; r++) for (let c = 0; c < cols; c++) {
		if (r > -1 && r < rows - 1 && carve.north[r][c]) continue;
		const x = c * cell;
		const z = -(r + .5) * cell;
		blocks.push({
			position: [
				x,
				wallH / 2,
				z
			],
			size: [
				cell,
				wallH,
				thick
			],
			solid: true,
			color: "wall"
		});
		if (r === -1) faces.push({
			position: [
				x,
				0,
				z - inset
			],
			normal: [
				0,
				0,
				-1
			]
		});
		else if (r === rows - 1) faces.push({
			position: [
				x,
				0,
				z + inset
			],
			normal: [
				0,
				0,
				1
			]
		});
		else {
			faces.push({
				position: [
					x,
					0,
					z + inset
				],
				normal: [
					0,
					0,
					1
				]
			});
			faces.push({
				position: [
					x,
					0,
					z - inset
				],
				normal: [
					0,
					0,
					-1
				]
			});
		}
	}
	const cx = (cols - 1) / 2 * cell;
	const cz = -((rows - 1) / 2) * cell;
	const spanX = cols * cell + cell;
	const spanZ = rows * cell + cell;
	blocks.push({
		position: [
			cx,
			0,
			cz
		],
		size: [
			spanX,
			.08,
			spanZ
		],
		solid: false,
		color: "floor"
	}, {
		position: [
			cx,
			wallH,
			cz
		],
		size: [
			spanX,
			.08,
			spanZ
		],
		solid: false,
		color: "ceiling"
	});
	const twoRows = photos.length > faces.length;
	const cap = faces.length * (twoRows ? 2 : 1);
	const used = photos.slice(0, cap);
	const lowerH = twoRows ? 1.3 : Math.min(Math.max(size, 1.2), 1.7);
	const nodes = used.map((photo, i) => {
		const upper = twoRows && i >= faces.length;
		const face = faces[upper ? i - faces.length : i];
		const y = twoRows ? upper ? 2.55 : 1.48 : 1.62;
		return {
			kind: "photo",
			id: photo.id,
			position: [
				face.position[0],
				y,
				face.position[2]
			],
			normal: face.normal,
			height: upper ? .9 : lowerH,
			faceCamera: false,
			phase: i * .17
		};
	});
	let spawnYaw = Math.PI;
	if (carve.north[0]?.[0]) spawnYaw = 0;
	else if (carve.east[0]?.[0]) spawnYaw = -Math.PI / 2;
	return {
		nodes,
		blocks,
		spawn: [
			0,
			1.62,
			0
		],
		spawnYaw,
		loop: null,
		omitted: Math.max(0, photos.length - used.length)
	};
}
function buildLayout(photos, mode, cols, size, groupBy) {
	const columns = Math.max(2, Math.min(12, Math.round(cols) || 6));
	const photoSize = Math.max(.7, Math.min(3.2, size || 1.7));
	if (mode === "gallery") return layoutGallery(photos, photoSize, groupBy);
	if (mode === "float") return layoutFloat(photos, photoSize);
	if (mode === "tunnel") return layoutTunnel(photos, photoSize);
	if (mode === "spiral") return layoutSpiral(photos, photoSize);
	if (mode === "maze") return layoutMaze(photos, photoSize);
	if (!photos.length) return shell([
		0,
		1.62,
		5
	]);
	return layoutGrid(photos, columns, photoSize);
}
var BLOCK_COLOR = {
	wall: 2897214,
	floor: 1448737,
	ceiling: 2370612,
	path: 9070656
};
var RADIUS = .32;
var MOVE = /* @__PURE__ */ new Set([
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
	"KeyR"
]);
function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}
function walkMode(mode) {
	return mode === "gallery" || mode === "maze";
}
function headingOf(yaw) {
	const dirs = [
		"N",
		"NE",
		"E",
		"SE",
		"S",
		"SW",
		"W",
		"NW"
	];
	const deg = (-yaw * 180 / Math.PI % 360 + 360) % 360;
	return dirs[Math.round(deg / 45) % 8];
}
function hdr(mat, r, g, b) {
	mat.color.r = r;
	mat.color.g = g;
	mat.color.b = b;
}
function mountWorld(canvas) {
	let renderer;
	try {
		renderer = new WebGLRenderer({
			canvas,
			antialias: true,
			alpha: false,
			powerPreference: "high-performance"
		});
	} catch {
		useExplorer.getState().toastMessage("WebGL isn’t available in this browser.");
		return { dispose() {} };
	}
	const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
	renderer.setPixelRatio(pixelRatio);
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = 0;
	renderer.setClearColor(921876, 1);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = 2;
	const scene = new Scene();
	scene.background = new Color(921876);
	const fog = new FogExp2(921876, useExplorer.getState().fog);
	scene.fog = fog;
	const camera = new PerspectiveCamera(68, 1, .08, 2500);
	scene.add(camera);
	const content = new Group();
	scene.add(content);
	const timer = new Timer();
	timer.connect(document);
	const hemi = new HemisphereLight(13227750, 4008984, 1.7);
	scene.add(hemi);
	const keyLight = new DirectionalLight(16774370, 3.4);
	keyLight.position.set(7, 14, 5);
	keyLight.castShadow = true;
	keyLight.shadow.mapSize.set(1024, 1024);
	keyLight.shadow.camera.near = .5;
	keyLight.shadow.camera.far = 46;
	keyLight.shadow.camera.left = -14;
	keyLight.shadow.camera.right = 14;
	keyLight.shadow.camera.top = 14;
	keyLight.shadow.camera.bottom = -14;
	keyLight.shadow.bias = -5e-4;
	keyLight.shadow.normalBias = .045;
	scene.add(keyLight);
	scene.add(keyLight.target);
	const flash = new SpotLight(16770236, 0, 26, .5, .58, 1);
	flash.position.set(0, -.05, .15);
	flash.target.position.set(0, -.15, -1);
	camera.add(flash);
	camera.add(flash.target);
	const beamMat = new MeshBasicMaterial({
		transparent: true,
		opacity: .055,
		depthWrite: false,
		side: 2,
		blending: 2,
		toneMapped: false,
		fog: false
	});
	hdr(beamMat, 1.4, 1.05, .7);
	const beam = new Mesh(new CylinderGeometry(.07, 1.45, 8.5, 18, 1, true), beamMat);
	beam.rotation.x = Math.PI / 2;
	beam.position.z = -4.2;
	beam.raycast = () => void 0;
	camera.add(beam);
	const dustCount = 380;
	const dustOrigin = new Float32Array(dustCount * 3);
	for (let i = 0; i < dustCount; i++) {
		dustOrigin[i * 3] = (Math.random() - .5) * 24;
		dustOrigin[i * 3 + 1] = (Math.random() - .2) * 6.5;
		dustOrigin[i * 3 + 2] = (Math.random() - .5) * 24;
	}
	const dustGeo = new BufferGeometry();
	dustGeo.setAttribute("position", new Float32BufferAttribute(dustCount * 3, 3));
	const dustMat = new PointsMaterial({
		color: 15390906,
		size: .05,
		transparent: true,
		opacity: .5,
		depthWrite: false,
		blending: 2,
		sizeAttenuation: true
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
		starPositions[i * 3 + 1] = Math.cos(phi) * radius * .55;
		starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
	}
	const starFieldGeo = new BufferGeometry();
	starFieldGeo.setAttribute("position", new Float32BufferAttribute(starPositions, 3));
	const starFieldMat = new PointsMaterial({
		color: 16249576,
		size: .62,
		transparent: true,
		opacity: .9,
		depthWrite: false,
		sizeAttenuation: true,
		fog: false
	});
	const starField = new Points(starFieldGeo, starFieldMat);
	starField.frustumCulled = false;
	scene.add(starField);
	const composer = new EffectComposer(renderer);
	composer.setPixelRatio(pixelRatio);
	const bloomPass = new UnrealBloomPass(new Vector2(512, 512), .48, .66, 1.01);
	const gradePass = new ShaderPass({
		uniforms: {
			tDiffuse: { value: null },
			time: { value: 0 }
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
        vec4 color = texture2D(tDiffuse, vUv);
        vec2 p = vUv - 0.5;
        float vignette = smoothstep(0.95, 0.22, length(p));
        color.rgb *= mix(0.62, 1.0, vignette);
        float grain = fract(sin(dot(vUv + fract(time * 0.013), vec2(12.9898, 78.233))) * 43758.5453);
        color.rgb += (grain - 0.5) * 0.03;
        gl_FragColor = color;
      }
    `
	});
	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(bloomPass);
	composer.addPass(gradePass);
	composer.addPass(new OutputPass());
	const photoGeo = new PlaneGeometry(1, 1);
	const frameMat = new MeshBasicMaterial({
		side: 2,
		toneMapped: false
	});
	hdr(frameMat, 1.7, 1.05, .58);
	const starGeo = new CircleGeometry(.08, 16);
	const starMat = new MeshBasicMaterial({
		side: 2,
		toneMapped: false
	});
	hdr(starMat, 2.8, 1.85, .8);
	const raycaster = new Raycaster();
	const pointer = new Vector2(0, 0);
	const look = new Vector3();
	const basisX = new Vector3();
	const basisY = new Vector3();
	const basisZ = new Vector3();
	const basis = new Matrix4();
	const up = new Vector3(0, 1, 0);
	const records = /* @__PURE__ */ new Map();
	const cache = /* @__PURE__ */ new Map();
	const pending = /* @__PURE__ */ new Set();
	let trash = [];
	let pulses = [];
	let solids = [];
	let loop = null;
	let token = 0;
	let inflight = 0;
	let texQuality = useExplorer.getState().quality;
	let photoRef = useExplorer.getState().photos;
	let layoutKey = "";
	let builtMode = null;
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
	let tween = null;
	function orient(obj, normal) {
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
			entry.tex.image?.close?.();
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
		while (content.children.length) content.remove(content.children[0]);
	}
	function applyCached(rec, cached) {
		rec.mat.map = cached.tex;
		rec.mat.color.setHex(16777215);
		rec.mat.needsUpdate = true;
		const width = rec.height * cached.aspect;
		rec.mesh.scale.set(width, rec.height, 1);
		if (rec.twin) rec.twin.scale.set(width, rec.height, 1);
	}
	function addLabel(text, position) {
		const board = document.createElement("canvas");
		board.width = 768;
		board.height = 160;
		const ctx = board.getContext("2d");
		if (!ctx) return;
		ctx.font = "600 78px Fraunces, Georgia, serif";
		ctx.fillStyle = "#f0d7b4";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(text, 384, 80);
		const tex = new CanvasTexture(board);
		tex.colorSpace = SRGBColorSpace;
		const mat = new SpriteMaterial({
			map: tex,
			transparent: true,
			depthWrite: false,
			toneMapped: false
		});
		const sprite = new Sprite(mat);
		sprite.position.set(position[0], position[1], position[2]);
		sprite.scale.set(clamp(1.6 + text.length * .22, 2.4, 7), .9, 1);
		content.add(sprite);
		trash.push(() => {
			tex.dispose();
			mat.dispose();
		});
	}
	function addPhoto(node, url, span) {
		const mat = new MeshBasicMaterial({
			color: 3814444,
			side: 2,
			toneMapped: false
		});
		const mesh = new Mesh(photoGeo, mat);
		mesh.position.set(node.position[0], node.position[1], node.position[2]);
		mesh.scale.set(node.height, node.height, 1);
		mesh.castShadow = shadowsOn;
		const normal = new Vector3(node.normal[0], node.normal[1], node.normal[2]);
		if (!node.faceCamera) orient(mesh, normal);
		mesh.userData.id = node.id;
		const frame = new Mesh(photoGeo, frameMat);
		frame.position.set(0, 0, -.045);
		frame.scale.set(1.12, 1.12, 1);
		frame.userData.id = node.id;
		frame.castShadow = shadowsOn;
		mesh.add(frame);
		const star = new Mesh(starGeo, starMat);
		star.position.set(.36, .36, .05);
		star.visible = Boolean(useExplorer.getState().marks[node.id]?.starred);
		star.userData.id = node.id;
		mesh.add(star);
		content.add(mesh);
		let twin = null;
		if (span) {
			twin = new Mesh(photoGeo, mat);
			twin.position.copy(mesh.position);
			twin.position.z -= span;
			twin.quaternion.copy(mesh.quaternion);
			twin.scale.copy(mesh.scale);
			twin.userData.id = node.id;
			const twinFrame = new Mesh(photoGeo, frameMat);
			twinFrame.position.set(0, 0, -.045);
			twinFrame.scale.set(1.12, 1.12, 1);
			twin.add(twinFrame);
			content.add(twin);
		}
		const rec = {
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
			face: node.faceCamera
		};
		records.set(node.id, rec);
		const cached = cache.get(node.id);
		if (cached) applyCached(rec, cached);
	}
	function blockMaterial(color) {
		if (color === "path") {
			const mat = new MeshBasicMaterial({ toneMapped: false });
			hdr(mat, 1.75, 1.02, .46);
			return mat;
		}
		if (color === "floor") return new MeshPhongMaterial({
			color: BLOCK_COLOR.floor,
			emissive: 1185565,
			emissiveIntensity: .55,
			shininess: 48,
			specular: 11703928
		});
		return new MeshLambertMaterial({
			color: BLOCK_COLOR[color],
			emissive: BLOCK_COLOR[color],
			emissiveIntensity: color === "ceiling" ? .42 : .24
		});
	}
	function addBlocks(blocks) {
		const groups = /* @__PURE__ */ new Map();
		for (const block of blocks) {
			const key = `${block.size.map((n) => n.toFixed(3)).join("x")}|${block.color}`;
			const list = groups.get(key);
			if (list) list.push(block);
			else groups.set(key, [block]);
		}
		const dummy = new Object3D();
		for (const list of groups.values()) {
			const sample = list[0];
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
	function dress(layout) {
		const mode = useExplorer.getState().mode;
		if (mode === "tunnel") {
			const geo = new TorusGeometry(5.15, .035, 10, 64);
			const mat = new MeshBasicMaterial({ toneMapped: false });
			hdr(mat, 2.4, 1.35, .62);
			const zs = /* @__PURE__ */ new Set();
			for (const node of layout.nodes) if (node.kind === "photo") zs.add(Math.round(node.position[2] * 10) / 10);
			const span = layout.loop?.span ?? 0;
			for (const z of zs) for (const extra of span ? [0, -span] : [0]) {
				const ring = new Mesh(geo, mat);
				ring.position.set(0, 0, z + extra);
				content.add(ring);
			}
			trash.push(() => {
				geo.dispose();
				mat.dispose();
			});
		}
		if (mode === "gallery") {
			const panelGeo = new PlaneGeometry(2.6, 1.15);
			const panelMat = new MeshBasicMaterial({ toneMapped: false });
			hdr(panelMat, 3.4, 2.35, 1.45);
			const shaftGeo = new CylinderGeometry(.28, 1.05, 3.15, 14, 1, true);
			const shaftMat = new MeshBasicMaterial({
				color: 16770752,
				transparent: true,
				opacity: .09,
				depthWrite: false,
				side: 2,
				blending: 2,
				toneMapped: false
			});
			for (const block of layout.blocks) {
				if (block.color !== "floor") continue;
				const panel = new Mesh(panelGeo, panelMat);
				panel.position.set(block.position[0], 3.92, block.position[2]);
				panel.rotation.x = -Math.PI / 2;
				content.add(panel);
				pulses.push(panel);
				const shaft = new Mesh(shaftGeo, shaftMat);
				shaft.position.set(block.position[0], 2.25, block.position[2]);
				shaft.raycast = () => void 0;
				content.add(shaft);
			}
			trash.push(() => {
				panelGeo.dispose();
				panelMat.dispose();
				shaftGeo.dispose();
				shaftMat.dispose();
			});
		}
		if (mode === "spiral") {
			let minZ = 0;
			for (const node of layout.nodes) if (node.kind === "photo") minZ = Math.min(minZ, node.position[2]);
			const height = Math.max(4, Math.abs(minZ) + 2);
			const geo = new CylinderGeometry(.035, .035, height, 8);
			const mat = new MeshBasicMaterial({ toneMapped: false });
			hdr(mat, 2.2, 1.25, .55);
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
	function rebuild(layout, photos) {
		shadowsOn = photos.length > 0 && photos.length <= 140;
		renderer.shadowMap.enabled = shadowsOn;
		keyLight.castShadow = shadowsOn;
		clearContent();
		loop = layout.loop;
		const urls = new Map(photos.map((photo) => [photo.id, photo.url]));
		for (const node of layout.nodes) if (node.kind === "label") addLabel(node.text, node.position);
		else addPhoto(node, urls.get(node.id) ?? "", layout.loop?.span ?? null);
		addBlocks(layout.blocks);
		dress(layout);
		solids = layout.blocks.filter((block) => block.solid);
	}
	function blocked(x, z) {
		for (const block of solids) {
			const hx = block.size[0] / 2 + RADIUS;
			const hz = block.size[2] / 2 + RADIUS;
			if (Math.abs(x - block.position[0]) < hx && Math.abs(z - block.position[2]) < hz) return true;
		}
		return false;
	}
	function resolve(x, z) {
		for (let pass = 0; pass < 3; pass++) for (const block of solids) {
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
		return {
			x,
			z
		};
	}
	function teleport(layout) {
		pos.set(layout.spawn[0], layout.spawn[1], layout.spawn[2]);
		yaw = layout.spawnYaw;
		pitch = 0;
		tween = null;
	}
	function syncScene() {
		const state = useExplorer.getState();
		const vis = visiblePhotos(state);
		if (state.photos !== photoRef) {
			photoRef = state.photos;
			clearCache();
		}
		if (texQuality !== state.quality) {
			texQuality = state.quality;
			clearCache();
		}
		fog.density = state.fog * (state.mode === "maze" ? 1.35 : state.mode === "float" ? .72 : 1);
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
			vis.map((photo) => photo.id).join("\n")
		].join("|");
		if (sig !== layoutKey) {
			const modeChanged = builtMode !== state.mode;
			layoutKey = sig;
			const layout = buildLayout(vis, state.mode, state.cols, state.size, state.groupBy);
			rebuild(layout, vis);
			if (!didBuild || modeChanged || walkMode(state.mode) && blocked(pos.x, pos.z)) teleport(layout);
			didBuild = true;
			builtMode = state.mode;
			if (state.omitted !== layout.omitted) useExplorer.getState().patch({ omitted: layout.omitted });
		} else for (const rec of records.values()) if (!cache.has(rec.id)) {
			rec.mat.map = null;
			rec.mat.color.setHex(3814444);
			rec.mat.needsUpdate = true;
		}
		pump();
	}
	function beginFocus(id) {
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
			toPitch
		};
	}
	async function loadOne(id, url, generation) {
		pending.add(id);
		inflight += 1;
		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error("image");
			const blob = await response.blob();
			if (generation !== token || dead) return;
			const maxW = texQuality === "sharp" ? 1400 : 720;
			let bitmap;
			try {
				bitmap = await createImageBitmap(blob, {
					resizeWidth: maxW,
					resizeQuality: "medium"
				});
			} catch {
				bitmap = await createImageBitmap(blob);
			}
			if (generation !== token || dead) {
				bitmap.close();
				return;
			}
			const board = document.createElement("canvas");
			board.width = bitmap.width;
			board.height = bitmap.height;
			board.getContext("2d")?.drawImage(bitmap, 0, 0);
			const aspect = bitmap.width / Math.max(1, bitmap.height);
			bitmap.close();
			const tex = new CanvasTexture(board);
			tex.colorSpace = SRGBColorSpace;
			tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
			cache.set(id, {
				tex,
				aspect
			});
			const rec = records.get(id);
			if (rec) applyCached(rec, {
				tex,
				aspect
			});
			evict();
			const count = cache.size;
			if (useExplorer.getState().loadedTextures !== count) useExplorer.getState().patch({ loadedTextures: count });
		} catch {} finally {
			pending.delete(id);
			inflight = Math.max(0, inflight - 1);
		}
	}
	function evict() {
		if (cache.size <= 72) return;
		const ranked = [...records.values()].sort((a, b) => a.mesh.position.distanceToSquared(camera.position) - b.mesh.position.distanceToSquared(camera.position));
		const keep = new Set(ranked.slice(0, 48).map((rec) => rec.id));
		for (const [id, entry] of cache) {
			if (keep.has(id)) continue;
			entry.tex.dispose();
			cache.delete(id);
			const rec = records.get(id);
			if (rec) {
				rec.mat.map = null;
				rec.mat.color.setHex(3814444);
				rec.mat.needsUpdate = true;
			}
		}
	}
	function pump() {
		if (inflight >= 4) return;
		const ranked = [...records.values()].filter((rec) => rec.url && !cache.has(rec.id) && !pending.has(rec.id)).sort((a, b) => a.base.distanceToSquared(pos) - b.base.distanceToSquared(pos));
		const generation = token;
		for (const rec of ranked) {
			if (inflight >= 4) break;
			loadOne(rec.id, rec.url, generation);
		}
	}
	function hitId() {
		raycaster.setFromCamera(pointer, camera);
		const roots = [];
		for (const rec of records.values()) {
			roots.push(rec.mesh);
			if (rec.twin) roots.push(rec.twin);
		}
		const hits = raycaster.intersectObjects(roots, true);
		for (const hit of hits) {
			let obj = hit.object;
			while (obj) {
				const id = obj.userData.id;
				if (id) return id;
				obj = obj.parent;
			}
		}
		return null;
	}
	function integrate(dt) {
		const state = useExplorer.getState();
		if (state.surface !== "space" || state.helpOpen || isTyping()) {
			speed = 0;
			return;
		}
		if (tween) {
			tween.t += dt;
			const k = clamp(tween.t / .7, 0, 1);
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
		const mag = (fly ? 5.4 : 3.5) * state.speed * sprint;
		let forward = (held.has("KeyW") || held.has("ArrowUp") ? 1 : 0) - (held.has("KeyS") || held.has("ArrowDown") ? 1 : 0);
		if (fly && state.autoGlide) forward += 1;
		const strafe = (held.has("KeyD") || held.has("ArrowRight") ? 1 : 0) - (held.has("KeyA") || held.has("ArrowLeft") ? 1 : 0);
		if (held.has("KeyQ")) yaw += 1.7 * dt;
		if (held.has("KeyR")) yaw -= 1.7 * dt;
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
		speed = Math.hypot(vx, vy, vz);
		pos.x += vx * dt;
		pos.y += vy * dt;
		pos.z += vz * dt;
		if (!fly) {
			const next = resolve(pos.x, pos.z);
			pos.x = next.x;
			pos.z = next.z;
			pos.y += (1.62 - pos.y) * Math.min(1, dt * 8);
		} else if (loop) {
			while (pos.z <= loop.minZ) pos.z += loop.span;
			while (pos.z > loop.minZ + loop.span) pos.z -= loop.span;
		}
	}
	function applyCamera(dt, elapsed) {
		const state = useExplorer.getState();
		const sprinting = held.has("ShiftLeft") || held.has("ShiftRight");
		const moving = speed > .45 && !tween;
		const walking = walkMode(state.mode);
		if (moving) bob += dt * (sprinting ? 13 : walking ? 9.4 : 2.2);
		bobAmp += ((moving ? 1 : 0) - bobAmp) * Math.min(1, dt * 6);
		const vertical = Math.sin(bob) * (walking ? .048 : .03) * bobAmp;
		const lateral = Math.cos(bob * .5) * (walking ? .03 : .012) * bobAmp;
		const rx = Math.cos(yaw);
		const rz = -Math.sin(yaw);
		camera.position.set(pos.x + rx * lateral, pos.y + vertical, pos.z + rz * lateral);
		const cp = Math.cos(pitch);
		look.set(camera.position.x - Math.sin(yaw) * cp, camera.position.y + Math.sin(pitch), camera.position.z - Math.cos(yaw) * cp);
		camera.lookAt(look);
		const targetFov = sprinting && speed > 1 && !tween ? 76 : 68;
		if (Math.abs(camera.fov - targetFov) > .04) {
			camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 4.5);
			camera.updateProjectionMatrix();
		}
		const mode = state.mode;
		const maze = mode === "maze";
		const gallery = mode === "gallery";
		hemi.intensity = maze ? .22 : gallery ? .7 : 1.55;
		keyLight.intensity = maze ? .35 : gallery ? 1.5 : 3.1;
		flash.intensity = maze ? 42 + Math.sin(elapsed * 18) * 1.4 : gallery ? 10 : mode === "grid" ? 6 : 0;
		flash.angle = maze ? .46 : .72;
		flash.distance = maze ? 18 : 30;
		beam.visible = maze || gallery;
		beamMat.opacity = maze ? .075 : .04;
		starField.visible = mode === "float" || mode === "tunnel" || mode === "spiral";
		starField.position.copy(pos);
		keyLight.position.set(pos.x + 6, pos.y + 12, pos.z + 5);
		keyLight.target.position.set(pos.x, .2, pos.z - 2);
		bloomPass.strength = maze ? .72 : mode === "tunnel" ? .85 : gallery ? .58 : mode === "float" ? .5 : .4;
	}
	function updateDust(elapsed) {
		const attr = dustGeo.getAttribute("position");
		const array = attr.array;
		for (let i = 0; i < dustCount; i++) {
			const ox = dustOrigin[i * 3];
			const oy = dustOrigin[i * 3 + 1];
			const oz = dustOrigin[i * 3 + 2];
			array[i * 3] = pos.x + ox + Math.sin(elapsed * .17 + i) * .35;
			array[i * 3 + 1] = pos.y + oy + Math.sin(elapsed * .31 + ox) * .18;
			array[i * 3 + 2] = pos.z + oz + Math.cos(elapsed * .13 + i) * .35;
		}
		attr.needsUpdate = true;
	}
	function billboard(elapsed) {
		for (const rec of records.values()) {
			if (!rec.face) continue;
			rec.mesh.quaternion.copy(camera.quaternion);
			rec.mesh.position.copy(rec.base);
			rec.mesh.position.y += Math.sin(elapsed * .9 + rec.phase) * .12;
		}
		const glow = .82 + Math.sin(elapsed * 1.6) * .18;
		for (const mesh of pulses) {
			const mat = mesh.material;
			mat.color.r = 3.2 * glow;
			mat.color.g = 2.15 * glow;
			mat.color.b = 1.25 * glow;
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
	function onKeyDown(event) {
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
		else if (event.code === "KeyH") state.patch({ helpOpen: !state.helpOpen });
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
			state.requestFocus(vis[index].id);
		} else if (event.code === "Escape") {
			if (document.pointerLockElement) document.exitPointerLock();
			if (state.helpOpen) state.patch({ helpOpen: false });
			else if (state.drawerOpen) state.patch({ drawerOpen: false });
			else if (state.selectedId) state.patch({ selectedId: null });
			else if (state.surface === "index") state.setSurface("space");
		}
	}
	function onKeyUp(event) {
		setHeld(event.code, false);
	}
	let dragging = false;
	let moved = 0;
	function onPointerDown(event) {
		if (event.button !== 0) return;
		dragging = true;
		moved = 0;
		canvas.setPointerCapture(event.pointerId);
	}
	function onPointerMove(event) {
		if (!dragging || document.pointerLockElement === canvas) return;
		moved += Math.abs(event.movementX) + Math.abs(event.movementY);
		yaw -= event.movementX * .005;
		pitch = clamp(pitch - event.movementY * .005, -1.15, 1.15);
		tween = null;
	}
	function onPointerUp() {
		if (!dragging) return;
		dragging = false;
		if (moved < 6) {
			const id = hitId();
			useExplorer.getState().patch({
				aimId: id,
				selectedId: id
			});
		}
	}
	function onLockMove(event) {
		if (document.pointerLockElement !== canvas) return;
		yaw -= event.movementX * .0022;
		pitch = clamp(pitch - event.movementY * .0022, -1.15, 1.15);
		tween = null;
	}
	function onBlur() {
		held.clear();
	}
	function onDoubleClick() {
		canvas.requestPointerLock();
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
		if (state.marks !== prev.marks) for (const rec of records.values()) rec.star.visible = Boolean(state.marks[rec.id]?.starred);
		if (state.photos !== prev.photos || state.mode !== prev.mode || state.cols !== prev.cols || state.size !== prev.size || state.groupBy !== prev.groupBy || state.sort !== prev.sort || state.query !== prev.query || state.starredOnly !== prev.starredOnly || state.showHidden !== prev.showHidden || state.tag !== prev.tag || state.album !== prev.album || state.from !== prev.from || state.to !== prev.to || state.quality !== prev.quality || state.fog !== prev.fog) syncScene();
	});
	const probe = {
		getYaw: () => yaw,
		getSpeed: () => speed,
		getPos: () => ({
			x: pos.x,
			y: pos.y,
			z: pos.z
		}),
		setKeys: (codes) => {
			replaceHeld(codes);
			tween = null;
		},
		setYaw: (next) => {
			yaw = next;
		}
	};
	window.__controlsTest = probe;
	syncScene();
	renderer.setAnimationLoop((time) => {
		if (dead) return;
		timer.update(time);
		const dt = Math.min(timer.getDelta(), .05);
		const elapsed = timer.getElapsed();
		integrate(dt);
		applyCamera(dt, elapsed);
		billboard(elapsed);
		updateDust(elapsed);
		gradePass.uniforms.time.value = elapsed;
		const heading = headingOf(yaw);
		if (heading !== useExplorer.getState().heading) useExplorer.getState().patch({ heading });
		aimWait += dt;
		if (aimWait > .4) {
			aimWait = 0;
			const id = hitId();
			if (id !== useExplorer.getState().aimId) useExplorer.getState().patch({ aimId: id });
		}
		pumpWait += dt;
		if (pumpWait > .35) {
			pumpWait = 0;
			pump();
		}
		composer.render();
	});
	return { dispose() {
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
		beam.geometry.dispose();
		beamMat.dispose();
		composer.dispose();
		renderer.dispose();
		if (window.__controlsTest === probe) delete window.__controlsTest;
	} };
}
//#endregion
export { mountWorld };
