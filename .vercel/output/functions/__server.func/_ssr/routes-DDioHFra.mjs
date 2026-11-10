import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as CircleHelp, b as Building2, c as Search, d as Image, f as FolderOpen, g as Cylinder, h as Download, i as Upload, l as Orbit, m as EyeOff, n as Wind, o as Star, p as Eye, r as Waypoints, s as SlidersHorizontal, t as X, u as LayoutGrid, v as ChevronRight, x as Bookmark, y as ChevronLeft } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DDioHFra.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var held = /* @__PURE__ */ new Set();
function setHeld(code, on) {
	if (on) held.add(code);
	else held.delete(code);
}
function replaceHeld(codes) {
	held.clear();
	for (const code of codes) held.add(code);
}
function isTyping() {
	const el = document.activeElement;
	if (!el) return false;
	const tag = el.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}
var MODE_ORDER = [
	"grid",
	"gallery",
	"float",
	"tunnel",
	"spiral",
	"maze"
];
var MODE_LABEL = {
	grid: "Date grid",
	gallery: "Gallery",
	float: "Float",
	tunnel: "Tunnel",
	spiral: "Spiral",
	maze: "Maze"
};
function emptyMark() {
	return {
		starred: false,
		tags: [],
		note: "",
		hidden: false,
		albums: []
	};
}
function startOf(day) {
	if (!day) return null;
	const t = Date.parse(`${day}T00:00:00`);
	return Number.isNaN(t) ? null : t;
}
function visiblePhotos(state) {
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
		if (to != null && photo.taken >= to + 864e5) return false;
		if (q) {
			if (!`${photo.name} ${photo.folder} ${photo.caption} ${mark.note} ${mark.tags.join(" ")} ${mark.albums.join(" ")}`.toLowerCase().includes(q)) return false;
		}
		return true;
	});
	list.sort((a, b) => {
		if (state.sort === "name") return a.name.localeCompare(b.name);
		if (state.sort === "folder") return a.folder.localeCompare(b.folder) || a.taken - b.taken;
		if (state.sort === "oldest") return a.taken - b.taken || a.name.localeCompare(b.name);
		return b.taken - a.taken || a.name.localeCompare(b.name);
	});
	return list;
}
function formatWhen(ms) {
	if (!ms || Number.isNaN(ms)) return "Unknown date";
	return new Intl.DateTimeFormat(void 0, {
		year: "numeric",
		month: "short",
		day: "numeric"
	}).format(ms);
}
function formatBytes(n) {
	if (n < 1024) return `${n} B`;
	if (n < 1048576) return `${Math.round(n / 1024)} KB`;
	return `${(n / 1048576).toFixed(1)} MB`;
}
function allTags(marks) {
	const tags = /* @__PURE__ */ new Set();
	for (const mark of Object.values(marks)) for (const tag of mark.tags) tags.add(tag);
	return [...tags].sort((a, b) => a.localeCompare(b));
}
var demoPhotos = [
	{
		"file": "01.jpg",
		"taken": "2018-01-04",
		"place": "Coast road",
		"bytes": 307923
	},
	{
		"file": "02.jpg",
		"taken": "2018-04-05",
		"place": "Harbor morning",
		"bytes": 314456
	},
	{
		"file": "03.jpg",
		"taken": "2018-07-06",
		"place": "Pine ridge",
		"bytes": 219348
	},
	{
		"file": "04.jpg",
		"taken": "2018-10-07",
		"place": "Kitchen light",
		"bytes": 118396
	},
	{
		"file": "05.jpg",
		"taken": "2019-01-08",
		"place": "Night market",
		"bytes": 113499
	},
	{
		"file": "06.jpg",
		"taken": "2019-04-09",
		"place": "Desert mile",
		"bytes": 223317
	},
	{
		"file": "07.jpg",
		"taken": "2019-07-10",
		"place": "Snow field",
		"bytes": 365172
	},
	{
		"file": "08.jpg",
		"taken": "2019-10-11",
		"place": "City rain",
		"bytes": 230049
	},
	{
		"file": "09.jpg",
		"taken": "2020-01-12",
		"place": "Book stall",
		"bytes": 414063
	},
	{
		"file": "10.jpg",
		"taken": "2020-04-13",
		"place": "Canal bridge",
		"bytes": 361924
	},
	{
		"file": "11.jpg",
		"taken": "2020-07-14",
		"place": "Orchard",
		"bytes": 190395
	},
	{
		"file": "12.jpg",
		"taken": "2020-10-15",
		"place": "Diner booth",
		"bytes": 152356
	},
	{
		"file": "13.jpg",
		"taken": "2021-01-16",
		"place": "Trailhead",
		"bytes": 299607
	},
	{
		"file": "14.jpg",
		"taken": "2021-04-17",
		"place": "Workshop",
		"bytes": 236106
	},
	{
		"file": "15.jpg",
		"taken": "2021-07-18",
		"place": "River stones",
		"bytes": 140298
	},
	{
		"file": "16.jpg",
		"taken": "2021-10-19",
		"place": "Lantern street",
		"bytes": 74284
	},
	{
		"file": "17.jpg",
		"taken": "2022-01-20",
		"place": "Greenhouse",
		"bytes": 241812
	},
	{
		"file": "18.jpg",
		"taken": "2022-04-21",
		"place": "Ferry wake",
		"bytes": 304281
	},
	{
		"file": "19.jpg",
		"taken": "2022-07-22",
		"place": "Hill town",
		"bytes": 249350
	},
	{
		"file": "20.jpg",
		"taken": "2022-10-23",
		"place": "Studio wall",
		"bytes": 216082
	},
	{
		"file": "21.jpg",
		"taken": "2023-01-24",
		"place": "Wheat dusk",
		"bytes": 179746
	},
	{
		"file": "22.jpg",
		"taken": "2023-04-25",
		"place": "Pier lights",
		"bytes": 308263
	},
	{
		"file": "23.jpg",
		"taken": "2023-07-26",
		"place": "Redwoods",
		"bytes": 242807
	},
	{
		"file": "24.jpg",
		"taken": "2023-10-27",
		"place": "Courtyard",
		"bytes": 123403
	},
	{
		"file": "25.jpg",
		"taken": "2024-01-04",
		"place": "Window seat",
		"bytes": 193929
	},
	{
		"file": "26.jpg",
		"taken": "2024-04-05",
		"place": "Station platform",
		"bytes": 419772
	},
	{
		"file": "27.jpg",
		"taken": "2024-07-06",
		"place": "Lake dock",
		"bytes": 215168
	},
	{
		"file": "28.jpg",
		"taken": "2024-10-07",
		"place": "Alley neon",
		"bytes": 115118
	},
	{
		"file": "29.jpg",
		"taken": "2025-01-08",
		"place": "Meadow",
		"bytes": 427946
	},
	{
		"file": "30.jpg",
		"taken": "2025-04-09",
		"place": "Cliff path",
		"bytes": 213133
	},
	{
		"file": "31.jpg",
		"taken": "2025-07-10",
		"place": "Library stair",
		"bytes": 121435
	},
	{
		"file": "32.jpg",
		"taken": "2025-10-11",
		"place": "Blue hour",
		"bytes": 175215
	}
].map((item) => ({
	id: `demo|${item.file}`,
	name: item.file,
	folder: "Demo library",
	url: `/demo/${item.file}`,
	bytes: item.bytes,
	mtime: Date.parse(`${item.taken}T12:00:00`),
	taken: Date.parse(`${item.taken}T12:00:00`),
	caption: item.place,
	blobUrl: false
}));
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open("drift-hall", 1);
		req.onupgradeneeded = () => {
			req.result.createObjectStore("kv");
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function readSaved() {
	try {
		const db = await openDb();
		const value = await new Promise((resolve, reject) => {
			const req = db.transaction("kv", "readonly").objectStore("kv").get("library");
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
		db.close();
		if (!value || value.version !== 1 || !value.marks || !Array.isArray(value.albums)) return null;
		return value;
	} catch {
		return null;
	}
}
async function writeSaved(data) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction("kv", "readwrite");
		tx.objectStore("kv").put(data, "library");
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}
async function kvGet(key) {
	try {
		const db = await openDb();
		const value = await new Promise((resolve, reject) => {
			const req = db.transaction("kv", "readonly").objectStore("kv").get(key);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
		db.close();
		return value;
	} catch {
		return;
	}
}
async function kvSet(key, value) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction("kv", "readwrite");
		tx.objectStore("kv").put(value, key);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}
function isSaved(value) {
	if (!value || typeof value !== "object") return false;
	const row = value;
	return row.version === 1 && !!row.marks && typeof row.marks === "object" && Array.isArray(row.albums);
}
function withMark(marks, id, edit) {
	const current = marks[id] ?? emptyMark();
	return {
		...marks,
		[id]: edit(current)
	};
}
var toastTimer = 0;
var useExplorer = create((set, get) => ({
	photos: demoPhotos,
	marks: {},
	albums: [],
	mode: "grid",
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
	fog: .018,
	quality: "fast",
	autoGlide: false,
	folderName: "Demo library",
	source: "demo",
	writable: false,
	busy: "",
	toast: "",
	selectedId: null,
	aimId: null,
	heading: "N",
	omitted: 0,
	loadedTextures: 0,
	focusId: null,
	focusNonce: 0,
	helpOpen: false,
	drawerOpen: false,
	booting: true,
	setMode: (mode) => set({
		mode,
		surface: "space"
	}),
	setSurface: (surface) => set({ surface }),
	patch: (partial) => set(partial),
	toggleStar: (id) => set((state) => ({ marks: withMark(state.marks, id, (mark) => ({
		...mark,
		starred: !mark.starred
	})) })),
	toggleHidden: (id) => set((state) => ({ marks: withMark(state.marks, id, (mark) => ({
		...mark,
		hidden: !mark.hidden
	})) })),
	setNote: (id, note) => set((state) => ({ marks: withMark(state.marks, id, (mark) => ({
		...mark,
		note: note.slice(0, 2e3)
	})) })),
	addTag: (id, raw) => {
		const tag = raw.trim().slice(0, 32);
		if (!tag) return;
		set((state) => ({ marks: withMark(state.marks, id, (mark) => mark.tags.includes(tag) ? mark : {
			...mark,
			tags: [...mark.tags, tag]
		}) }));
	},
	removeTag: (id, tag) => set((state) => ({
		marks: withMark(state.marks, id, (mark) => ({
			...mark,
			tags: mark.tags.filter((item) => item !== tag)
		})),
		tag: state.tag === tag ? null : state.tag
	})),
	createAlbum: (raw) => {
		const name = raw.trim().slice(0, 40);
		if (!name) return;
		set((state) => ({ albums: state.albums.includes(name) ? state.albums : [...state.albums, name] }));
	},
	toggleAlbum: (id, album) => set((state) => ({ marks: withMark(state.marks, id, (mark) => ({
		...mark,
		albums: mark.albums.includes(album) ? mark.albums.filter((item) => item !== album) : [...mark.albums, album]
	})) })),
	requestFocus: (id) => set((state) => ({
		focusId: id,
		focusNonce: state.focusNonce + 1,
		selectedId: id,
		surface: "space"
	})),
	mergeSaved: (saved) => set((state) => ({
		marks: {
			...saved.marks,
			...state.marks
		},
		albums: [.../* @__PURE__ */ new Set([...saved.albums, ...state.albums])]
	})),
	toastMessage: (message) => {
		set({ toast: message });
		window.clearTimeout(toastTimer);
		toastTimer = window.setTimeout(() => set({ toast: "" }), 4200);
	},
	replaceLibrary: (photos, folderName, source, writable) => {
		const previous = get().photos;
		for (const photo of previous) if (photo.blobUrl) URL.revokeObjectURL(photo.url);
		set({
			photos,
			folderName,
			source,
			writable,
			selectedId: null,
			aimId: null,
			booting: false,
			busy: "",
			omitted: 0
		});
	}
}));
if (typeof window !== "undefined") {
	let timer = 0;
	useExplorer.subscribe((state, previous) => {
		if (state.marks === previous.marks && state.albums === previous.albums) return;
		window.clearTimeout(timer);
		timer = window.setTimeout(() => {
			const current = useExplorer.getState();
			writeSaved({
				version: 1,
				marks: current.marks,
				albums: current.albums
			});
		}, 400);
	});
}
var IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i;
var HEIC = /\.(heic|heif)$/i;
var currentDir = null;
function rememberDirectory(dir) {
	currentDir = dir;
}
var folders = /* @__PURE__ */ new WeakMap();
function folderOf(file) {
	const known = folders.get(file);
	if (known) return known;
	const rel = file.webkitRelativePath;
	if (rel && rel.includes("/")) {
		const parts = rel.split("/").filter(Boolean);
		return parts.length > 1 ? parts[parts.length - 2] : "Library";
	}
	return "Library";
}
async function readTaken(file) {
	try {
		const tags = await (await import("../_libs/exifr.mjs").then((n) => n.t)).parse(file, {
			pick: [
				"DateTimeOriginal",
				"CreateDate",
				"ModifyDate"
			],
			reviveValues: true
		});
		const raw = tags?.DateTimeOriginal ?? tags?.CreateDate ?? tags?.ModifyDate;
		if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.getTime();
		if (typeof raw === "string") {
			const t = Date.parse(raw);
			if (!Number.isNaN(t)) return t;
		}
	} catch {}
	return null;
}
async function photosFromFiles(files, onProgress) {
	const skippedHeic = files.filter((file) => HEIC.test(file.name)).length;
	const images = files.filter((file) => IMAGE.test(file.name) && !file.name.startsWith("."));
	const capped = images.length > 2e3;
	const queue = images.slice(0, 2e3);
	const photos = new Array(queue.length);
	let cursor = 0;
	let done = 0;
	async function worker() {
		while (cursor < queue.length) {
			const index = cursor;
			cursor += 1;
			const file = queue[index];
			const taken = await readTaken(file) ?? file.lastModified;
			photos[index] = {
				id: `${file.name}|${file.size}|${file.lastModified}`,
				name: file.name,
				folder: folderOf(file),
				url: URL.createObjectURL(file),
				bytes: file.size,
				mtime: file.lastModified,
				taken,
				caption: "",
				blobUrl: true
			};
			done += 1;
			if (done % 12 === 0 || done === queue.length) onProgress(`Reading dates ${done} of ${queue.length}`);
		}
	}
	onProgress(queue.length ? `Reading dates 0 of ${queue.length}` : "No images in that folder");
	await Promise.all(Array.from({ length: Math.min(6, Math.max(queue.length, 1)) }, () => worker()));
	return {
		photos: photos.filter(Boolean),
		skippedHeic,
		capped
	};
}
async function walkEntry(entry, folder, out) {
	if (entry.name.startsWith(".") || entry.name === "DriftHall") return;
	if (entry.isFile) {
		const file = await new Promise((resolve, reject) => {
			entry.file(resolve, reject);
		});
		folders.set(file, folder || "Library");
		out.push(file);
		return;
	}
	if (!entry.isDirectory) return;
	const reader = entry.createReader();
	const next = folder ? `${folder}` : entry.name;
	const children = [];
	for (;;) {
		const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
		if (!batch.length) break;
		children.push(...batch);
	}
	for (const child of children) {
		const childFolder = child.isFile ? next : next;
		await walkEntry(child, child.isDirectory ? child.name : childFolder, out);
	}
}
async function filesFromDataTransfer(transfer) {
	const entries = [];
	for (const item of transfer.items) {
		const entry = item.webkitGetAsEntry?.();
		if (entry) entries.push(entry);
	}
	if (!entries.length) return [...transfer.files];
	const out = [];
	for (const entry of entries) await walkEntry(entry, entry.isDirectory ? entry.name : "Library", out);
	return out;
}
async function filesFromDirectory(dir) {
	const out = [];
	async function walk(handle, folder) {
		for await (const [name, child] of handle.entries()) {
			if (name.startsWith(".") || name === "DriftHall") continue;
			if (child.kind === "file") {
				if (!IMAGE.test(name) && !HEIC.test(name)) continue;
				const file = await child.getFile();
				folders.set(file, folder || "Library");
				out.push(file);
			} else await walk(child, name);
		}
	}
	await walk(dir, dir.name);
	return out;
}
async function readFolderMarks(dir) {
	try {
		const file = await (await (await dir.getDirectoryHandle("DriftHall")).getFileHandle("marks.json")).getFile();
		const parsed = JSON.parse(await file.text());
		return isSaved(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
async function writeFolderMarks(payload) {
	if (!currentDir) throw new Error("Open a folder with the directory picker to write marks back.");
	const writable = await (await (await currentDir.getDirectoryHandle("DriftHall", { create: true })).getFileHandle("marks.json", { create: true })).createWritable();
	await writable.write(JSON.stringify(payload, null, 2));
	await writable.close();
}
function supportsDirectoryPicker() {
	return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}
async function pickDirectory() {
	if (!supportsDirectoryPicker() || !window.showDirectoryPicker) return null;
	return window.showDirectoryPicker({
		mode: "readwrite",
		id: "drift-hall"
	});
}
async function rememberDirectoryPersistent(dir) {
	rememberDirectory(dir);
	try {
		await kvSet("directory", dir);
	} catch {}
}
async function storedDirectory() {
	const value = await kvGet("directory");
	if (!value || typeof value !== "object") return null;
	const dir = value;
	if (dir.kind !== "directory") return null;
	return dir;
}
function libraryNameFromFiles(files) {
	for (const file of files) {
		const rel = file.webkitRelativePath;
		if (rel?.includes("/")) return rel.split("/").filter(Boolean)[0] || "Folder";
	}
	return "Folder";
}
async function directoryPermission(dir, mode, request) {
	try {
		const ask = request ? dir.requestPermission : dir.queryPermission;
		if (!ask) return false;
		return await ask.call(dir, { mode }) === "granted";
	} catch {
		return false;
	}
}
var MODE_ICON = {
	grid: LayoutGrid,
	gallery: Building2,
	float: Wind,
	tunnel: Cylinder,
	spiral: Orbit,
	maze: Waypoints
};
async function ingestFiles(files, folderName, writable) {
	useExplorer.getState().patch({
		busy: "Reading dates…",
		booting: useExplorer.getState().photos.length === 0
	});
	try {
		const { photos, skippedHeic, capped } = await photosFromFiles(files, (message) => {
			useExplorer.getState().patch({ busy: message });
		});
		if (!photos.length) {
			useExplorer.getState().patch({
				busy: "",
				booting: false
			});
			useExplorer.getState().toastMessage(skippedHeic ? "Those look like HEIC files. Export JPEG, PNG, or WebP — this browser cannot show HEIC." : "No JPEG, PNG, WebP, GIF, or AVIF images were found.");
			return null;
		}
		useExplorer.getState().replaceLibrary(photos, folderName, "folder", writable);
		const parts = [`${photos.length} photos`];
		if (capped) parts.push("stopped at 2,000");
		if (skippedHeic) parts.push(`skipped ${skippedHeic} HEIC`);
		return parts.join(" · ");
	} catch {
		useExplorer.getState().patch({
			busy: "",
			booting: false
		});
		useExplorer.getState().toastMessage("Could not read those photos.");
		return null;
	}
}
async function loadDirectory(dir) {
	useExplorer.getState().patch({
		busy: "Listing folder…",
		booting: useExplorer.getState().photos.length === 0
	});
	const writable = await directoryPermission(dir, "readwrite", false);
	const saved = await readFolderMarks(dir);
	if (saved) useExplorer.getState().mergeSaved(saved);
	const message = await ingestFiles(await filesFromDirectory(dir), dir.name || "Folder", writable);
	if (message && saved) return `${message} · loaded DriftHall/marks.json`;
	return message;
}
function ExplorerApp() {
	const state = useExplorer();
	const visible = visiblePhotos(state);
	const canvasRef = (0, import_react.useRef)(null);
	const folderInput = (0, import_react.useRef)(null);
	const importInput = (0, import_react.useRef)(null);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [resume, setResume] = (0, import_react.useState)(null);
	const [tagDraft, setTagDraft] = (0, import_react.useState)("");
	const [albumDraft, setAlbumDraft] = (0, import_react.useState)("");
	const dragDepth = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let handle = null;
		let cancel = false;
		import("./world-B6e3Qryo.mjs").then((mod) => {
			if (cancel) return;
			handle = mod.mountWorld(canvas);
		});
		return () => {
			cancel = true;
			handle?.dispose();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		let cancel = false;
		(async () => {
			const saved = await readSaved();
			if (cancel) return;
			if (saved) useExplorer.getState().mergeSaved(saved);
			const dir = await storedDirectory();
			if (cancel) return;
			if (dir && await directoryPermission(dir, "read", false)) {
				rememberDirectory(dir);
				try {
					const message = await loadDirectory(dir);
					if (cancel) return;
					if (message) useExplorer.getState().toastMessage(message);
					else useExplorer.getState().patch({
						booting: false,
						busy: ""
					});
					return;
				} catch {
					if (!cancel) useExplorer.getState().patch({
						booting: false,
						busy: ""
					});
				}
			} else if (dir && !cancel) setResume(dir);
			if (!cancel) useExplorer.getState().patch({
				booting: false,
				busy: ""
			});
		})();
		return () => {
			cancel = true;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const hasFiles = (event) => [...event.dataTransfer?.types ?? []].includes("Files");
		const onEnter = (event) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragDepth.current += 1;
			setDragOver(true);
		};
		const onOver = (event) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
		};
		const onLeave = () => {
			dragDepth.current = Math.max(0, dragDepth.current - 1);
			if (dragDepth.current === 0) setDragOver(false);
		};
		const onDrop = (event) => {
			event.preventDefault();
			dragDepth.current = 0;
			setDragOver(false);
			const transfer = event.dataTransfer;
			if (!transfer) return;
			(async () => {
				try {
					rememberDirectory(null);
					const files = await filesFromDataTransfer(transfer);
					const message = await ingestFiles(files, libraryNameFromFiles(files), false);
					if (message) useExplorer.getState().toastMessage(`${message} · marks stay in this browser`);
				} catch {
					useExplorer.getState().patch({
						busy: "",
						booting: false
					});
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
			if (error.name === "AbortError") return;
			useExplorer.getState().patch({
				busy: "",
				booting: false
			});
			useExplorer.getState().toastMessage("Could not open that folder.");
		}
	}
	async function resumeFolder() {
		if (!resume) return;
		if (!await directoryPermission(resume, "read", true)) {
			state.toastMessage("Permission to read that folder was denied.");
			return;
		}
		rememberDirectory(resume);
		setResume(null);
		try {
			const message = await loadDirectory(resume);
			if (message) state.toastMessage(message);
		} catch {
			state.patch({
				busy: "",
				booting: false
			});
			state.toastMessage("Could not reopen that folder.");
		}
	}
	function onClassicFolder(files) {
		const list = [...files ?? []];
		if (folderInput.current) folderInput.current.value = "";
		if (!list.length) return;
		rememberDirectory(null);
		ingestFiles(list, libraryNameFromFiles(list), false).then((message) => {
			if (message) useExplorer.getState().toastMessage(`${message} · marks stay in this browser`);
		});
	}
	function step(delta) {
		if (!visible.length) return;
		const current = state.selectedId ?? state.aimId;
		let index = visible.findIndex((photo) => photo.id === current);
		if (index < 0) index = 0;
		else index = (index + delta + visible.length) % visible.length;
		state.requestFocus(visible[index].id);
	}
	function exportMarks() {
		const payload = {
			version: 1,
			marks: state.marks,
			albums: state.albums
		};
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "drift-hall-marks.json";
		link.click();
		URL.revokeObjectURL(url);
	}
	function importMarks(file) {
		if (!file) return;
		file.text().then((text) => {
			try {
				const parsed = JSON.parse(text);
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
		try {
			await writeFolderMarks({
				version: 1,
				marks: state.marks,
				albums: state.albums
			});
			state.toastMessage("Wrote DriftHall/marks.json. The photos themselves were not modified.");
		} catch (error) {
			state.toastMessage(error instanceof Error ? error.message : "Could not write marks.");
		}
	}
	const selected = state.photos.find((photo) => photo.id === state.selectedId) ?? null;
	const aimed = state.photos.find((photo) => photo.id === state.aimId) ?? null;
	const tags = allTags(state.marks);
	const cursor = Math.max(0, visible.findIndex((photo) => photo.id === (state.selectedId ?? state.aimId)));
	const stripStart = Math.max(0, Math.min(cursor - 6, Math.max(visible.length - 16, 0)));
	const strip = visible.slice(stripStart, stripStart + 16);
	const walking = state.mode === "gallery" || state.mode === "maze";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 z-0 h-full w-full",
				"aria-label": "Photo space"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: (node) => {
					folderInput.current = node;
					node?.setAttribute("webkitdirectory", "");
					node?.setAttribute("directory", "");
				},
				className: "hidden",
				type: "file",
				multiple: true,
				onChange: (event) => onClassicFolder(event.target.files)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: importInput,
				className: "hidden",
				type: "file",
				accept: "application/json",
				onChange: (event) => {
					importMarks(event.target.files?.[0]);
					event.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "absolute inset-x-0 top-0 z-30 flex flex-col gap-2 px-3 pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xl leading-none tracking-tight",
							children: "Drift Hall"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted",
							children: state.busy ? state.busy : state.photos.length === 0 ? "Opening the demo library" : state.source === "demo" ? "Sample library · open a folder for your own" : state.folderName || "Library"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-1.5",
						children: [
							resume ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: btn,
								onClick: () => void resumeFolder(),
								children: "Resume"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: btn,
								onClick: () => void openFolder(),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {
										className: "size-4",
										"aria-hidden": true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: "Open folder"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "sm:hidden",
										children: "Open"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: btn,
								"aria-pressed": state.drawerOpen,
								onClick: () => state.patch({ drawerOpen: !state.drawerOpen }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {
									className: "size-4",
									"aria-hidden": true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden md:inline",
									children: "Library"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: btn,
								"aria-pressed": state.helpOpen,
								onClick: () => state.patch({ helpOpen: !state.helpOpen }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, {
									className: "size-4",
									"aria-hidden": true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: "Help"
								})]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex max-w-full items-center gap-1 overflow-x-auto pb-1",
					children: [
						MODE_ORDER.map((mode, index) => {
							const Icon = MODE_ICON[mode];
							const on = state.mode === mode && state.surface === "space";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								title: `${MODE_LABEL[mode]} (${index + 1})`,
								"aria-pressed": on,
								className: `${btn} shrink-0 ${on ? onBtn : ""}`,
								onClick: () => state.setMode(mode),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-4",
									"aria-hidden": true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden md:inline",
									children: MODE_LABEL[mode]
								})]
							}, mode);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `${btn} shrink-0 ${state.surface === "index" ? onBtn : ""}`,
							"aria-pressed": state.surface === "index",
							onClick: () => state.setSurface(state.surface === "index" ? "space" : "index"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
								className: "size-4",
								"aria-hidden": true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden md:inline",
								children: "Index"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-auto hidden shrink-0 items-center px-2 text-xs tracking-[0.18em] text-brass sm:flex",
							children: state.heading
						})
					]
				})]
			}),
			state.surface === "space" && !state.helpOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative size-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-0 left-1/2 h-2.5 w-px -translate-x-1/2 bg-brass shadow-[0_0_8px_#d4a574]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute bottom-0 left-1/2 h-2.5 w-px -translate-x-1/2 bg-brass shadow-[0_0_8px_#d4a574]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-1/2 left-0 h-px w-2.5 -translate-y-1/2 bg-brass shadow-[0_0_8px_#d4a574]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-1/2 right-0 h-px w-2.5 -translate-y-1/2 bg-brass shadow-[0_0_8px_#d4a574]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass" })
					]
				}), aimed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-56 truncate text-center text-xs text-fg/90",
					children: aimed.caption || aimed.name
				}) : null]
			}) : null,
			state.surface === "index" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "absolute inset-0 z-20 overflow-y-auto bg-bg/95 px-3 pt-32 pb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid max-w-6xl grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
					children: visible.map((photo) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "overflow-hidden rounded-md border border-line bg-surface text-left",
						onClick: () => state.requestFocus(photo.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: photo.url,
							alt: "",
							className: "aspect-square w-full object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate px-2 py-1.5 text-xs text-muted",
							children: formatWhen(photo.taken)
						})]
					}, photo.id))
				}), !state.booting && !visible.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyFilter, {}) : null]
			}) : null,
			state.surface === "space" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-16 z-20 px-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none mb-1 hidden items-center justify-between text-[11px] text-muted md:flex",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: state.mode === "maze" ? "WASD walk · lamp follows your look · Q R turn · E inspect · F star" : walking ? "WASD walk · drag or double-click to look · Q R turn · E inspect · F star" : "WASD fly · drag or double-click to look · Space up · C down · E inspect · F star" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						visible.length,
						" showing",
						state.loadedTextures ? ` · ${state.loadedTextures} sharp` : "",
						state.omitted ? ` · ${state.omitted} outside the maze` : ""
					] })]
				}), visible.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: btn,
							onClick: () => step(-1),
							"aria-label": "Previous photo",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "h-11 min-w-0 flex-1",
							type: "range",
							min: 0,
							max: Math.max(visible.length - 1, 0),
							value: Math.min(cursor, Math.max(visible.length - 1, 0)),
							"aria-label": "Scrub by date",
							onChange: (event) => {
								const photo = visible[Number(event.target.value)];
								if (photo) state.requestFocus(photo.id);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: btn,
							onClick: () => step(1),
							"aria-label": "Next photo",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden w-28 shrink-0 text-right text-xs text-muted sm:block",
							children: formatWhen(visible[Math.min(cursor, visible.length - 1)].taken)
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5 overflow-x-auto pb-1",
					children: strip.map((photo, index) => {
						const on = photo.id === (state.selectedId ?? state.aimId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							title: `${photo.name} · ${formatWhen(photo.taken)}`,
							className: `h-14 w-14 shrink-0 overflow-hidden rounded-md border ${on ? "border-brass" : "border-line"}`,
							onClick: () => state.requestFocus(photo.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: photo.url,
								alt: "",
								className: "h-full w-full object-cover",
								loading: index < 8 ? "eager" : "lazy"
							})
						}, photo.id);
					})
				})] }) : state.booting ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyFilter, {})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `${selected || state.drawerOpen || state.helpOpen ? "hidden" : "absolute bottom-[15.5rem] left-3 z-20 grid grid-cols-3 gap-1 md:hidden"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
						code: "KeyQ",
						label: "Q"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
						code: "KeyW",
						label: "W"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
						code: "KeyR",
						label: "R"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
						code: "KeyA",
						label: "A"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
						code: "KeyS",
						label: "S"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
						code: "KeyD",
						label: "D"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
						code: "KeyC",
						label: "C"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
						code: "Space",
						label: "Up"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: pad,
						onClick: () => state.patch({ helpOpen: true }),
						children: "?"
					})
				]
			}),
			state.drawerOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "absolute top-0 left-0 z-40 flex h-full w-[min(100%,22rem)] flex-col gap-4 overflow-y-auto border-r border-line bg-surface/95 p-4 pt-6 backdrop-blur-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "Library"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: btn,
							onClick: () => state.patch({ drawerOpen: false }),
							"aria-label": "Close library",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							visible.length,
							" of ",
							state.photos.length || 0,
							" photos"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "relative block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-3 left-3 size-4 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: `${field} pl-9`,
							value: state.query,
							placeholder: "Search name, place, tag, note",
							onChange: (event) => state.patch({ query: event.target.value })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-1 text-xs text-muted",
						children: ["Sort", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: field,
							value: state.sort,
							onChange: (event) => state.patch({ sort: event.target.value }),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "oldest",
									children: "Oldest first"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "newest",
									children: "Newest first"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "name",
									children: "Name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "folder",
									children: "Folder"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-col gap-1 text-xs text-muted",
							children: ["From", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: field,
								type: "date",
								value: state.from,
								onChange: (event) => state.patch({ from: event.target.value })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex flex-col gap-1 text-xs text-muted",
							children: ["To", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: field,
								type: "date",
								value: state.to,
								onChange: (event) => state.patch({ to: event.target.value })
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "size-4",
							checked: state.starredOnly,
							onChange: (event) => state.patch({ starredOnly: event.target.checked })
						}), "Starred only"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "size-4",
							checked: state.showHidden,
							onChange: (event) => state.patch({ showHidden: event.target.checked })
						}), "Show hidden"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-1 text-xs text-muted",
						children: ["Gallery rooms grouped by", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: field,
							value: state.groupBy,
							onChange: (event) => state.patch({ groupBy: event.target.value }),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "date",
								children: "Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "folder",
								children: "Folder"
							})]
						})]
					}),
					tags.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5",
						children: tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${chip} ${state.tag === tag ? onBtn : ""}`,
							onClick: () => state.patch({ tag: state.tag === tag ? null : tag }),
							children: tag
						}, tag))
					}) : null,
					state.albums.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5",
						children: state.albums.map((album) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `${chip} ${state.album === album ? onBtn : ""}`,
							onClick: () => state.patch({ album: state.album === album ? null : album }),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
								className: "size-3.5",
								"aria-hidden": true
							}), album]
						}, album))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-1 text-xs text-muted",
						children: [
							"Fog ",
							state.fog.toFixed(3),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: .05,
								step: .001,
								value: state.fog,
								onChange: (event) => state.patch({ fog: Number(event.target.value) })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-1 text-xs text-muted",
						children: [
							"Speed ",
							state.speed.toFixed(2),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: .4,
								max: 2.2,
								step: .05,
								value: state.speed,
								onChange: (event) => state.patch({ speed: Number(event.target.value) })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-1 text-xs text-muted",
						children: [
							"Grid columns ",
							state.cols,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 2,
								max: 10,
								step: 1,
								value: state.cols,
								onChange: (event) => state.patch({ cols: Number(event.target.value) })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-1 text-xs text-muted",
						children: [
							"Photo size ",
							state.size.toFixed(2),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: .9,
								max: 2.8,
								step: .05,
								value: state.size,
								onChange: (event) => state.patch({ size: Number(event.target.value) })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${btn} ${state.quality === "fast" ? onBtn : ""}`,
							onClick: () => state.patch({ quality: "fast" }),
							children: "Fast textures"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${btn} ${state.quality === "sharp" ? onBtn : ""}`,
							onClick: () => state.patch({ quality: "sharp" }),
							children: "Sharp"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "size-4",
							checked: state.autoGlide,
							onChange: (event) => state.patch({ autoGlide: event.target.checked })
						}), "Auto-glide in fly modes"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-col gap-2 border-t border-line pt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: btn,
								onClick: exportMarks,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " Export marks"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: btn,
								onClick: () => importInput.current?.click(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), " Import marks"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: btn,
								disabled: !state.writable,
								title: state.writable ? "Write DriftHall/marks.json into the opened folder" : "Use Open folder and allow editing. Drag-and-drop and the classic picker stay in this browser only.",
								onClick: () => void saveIntoFolder(),
								children: "Save into folder"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs leading-relaxed text-muted",
								children: ["Marks are kept in this browser. Saving into a folder writes a sidecar, never the original files.", state.writable ? "" : " Drag, drop, and the basic picker cannot write back."]
							})
						]
					})
				]
			}) : null,
			selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {
				photo: selected,
				tagDraft,
				albumDraft,
				albums: state.albums,
				onTagDraft: setTagDraft,
				onAlbumDraft: setAlbumDraft,
				onClose: () => state.patch({ selectedId: null }),
				onStep: step
			}) : null,
			state.helpOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Help, { onClose: () => state.patch({ helpOpen: false }) }) : null,
			state.booting && state.photos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md border border-line bg-surface/95 px-4 py-3 font-display text-lg",
					children: "Opening the demo library"
				})
			}) : null,
			state.busy && !state.booting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute top-28 left-1/2 z-40 -translate-x-1/2 rounded-md border border-line bg-surface/95 px-3 py-2 text-sm",
				children: state.busy
			}) : null,
			state.toast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "absolute bottom-40 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-md border border-line bg-surface px-3 py-2 text-center text-sm shadow-lg",
				children: state.toast
			}) : null,
			dragOver ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-50 flex items-center justify-center bg-bg/80",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-3xl text-brass",
					children: "Drop a folder of photos"
				})
			}) : null
		]
	});
}
function EmptyFilter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-md border border-line bg-surface/90 px-3 py-2 text-sm text-muted",
		children: "Nothing matches these filters. Clear the search, dates, or starred view."
	});
}
function Hold({ code, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: pad,
		onPointerDown: (event) => {
			event.preventDefault();
			setHeld(code, true);
		},
		onPointerUp: () => setHeld(code, false),
		onPointerCancel: () => setHeld(code, false),
		onPointerLeave: () => setHeld(code, false),
		children: label
	});
}
function Inspector({ photo, tagDraft, albumDraft, albums, onTagDraft, onAlbumDraft, onClose, onStep }) {
	const mark = useExplorer((s) => s.marks[photo.id] ?? emptyMark());
	const toggleStar = useExplorer((s) => s.toggleStar);
	const toggleHidden = useExplorer((s) => s.toggleHidden);
	const setNote = useExplorer((s) => s.setNote);
	const addTag = useExplorer((s) => s.addTag);
	const removeTag = useExplorer((s) => s.removeTag);
	const createAlbum = useExplorer((s) => s.createAlbum);
	const toggleAlbum = useExplorer((s) => s.toggleAlbum);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "absolute inset-x-2 bottom-36 z-50 max-h-[48%] overflow-y-auto rounded-md border border-line bg-surface/95 p-3 backdrop-blur-md md:inset-x-auto md:top-28 md:right-3 md:bottom-36 md:w-80 md:max-h-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-start gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: photo.url,
						alt: "",
						className: "h-16 w-16 rounded-md object-cover"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "truncate font-display text-lg",
							children: photo.caption || photo.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted",
							children: photo.name
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: btn,
						onClick: onClose,
						"aria-label": "Close details",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mb-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Taken" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "text-sm text-fg",
						children: formatWhen(photo.taken)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Size" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "text-sm text-fg",
						children: formatBytes(photo.bytes)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Folder" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "truncate text-sm text-fg",
							children: photo.folder
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex flex-wrap gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `${btn} ${mark.starred ? onBtn : ""}`,
						onClick: () => toggleStar(photo.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `size-4 ${mark.starred ? "fill-brass" : ""}` }), mark.starred ? "Starred" : "Star"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: btn,
						onClick: () => toggleHidden(photo.id),
						children: [mark.hidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }), mark.hidden ? "Unhide" : "Hide"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: btn,
						onClick: () => onStep(-1),
						"aria-label": "Previous",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: btn,
						onClick: () => onStep(1),
						"aria-label": "Next",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mb-2 flex gap-1.5",
				onSubmit: (event) => {
					event.preventDefault();
					addTag(photo.id, tagDraft);
					onTagDraft("");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: field,
					value: tagDraft,
					placeholder: "Add a tag",
					onChange: (event) => onTagDraft(event.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: btn,
					children: "Add"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-3 flex flex-wrap gap-1.5",
				children: mark.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: chip,
					onClick: () => removeTag(photo.id, tag),
					children: [
						tag,
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
					]
				}, tag))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				className: `${field} mb-3 min-h-24 py-2`,
				value: mark.note,
				placeholder: "Note",
				maxLength: 2e3,
				onChange: (event) => setNote(photo.id, event.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mb-2 flex gap-1.5",
				onSubmit: (event) => {
					event.preventDefault();
					createAlbum(albumDraft);
					if (albumDraft.trim()) toggleAlbum(photo.id, albumDraft.trim().slice(0, 40));
					onAlbumDraft("");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: field,
					value: albumDraft,
					placeholder: "New album",
					onChange: (event) => onAlbumDraft(event.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: btn,
					children: "Add"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-1.5",
				children: albums.map((album) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `${chip} ${mark.albums.includes(album) ? onBtn : ""}`,
					onClick: () => toggleAlbum(photo.id, album),
					children: album
				}, album))
			})
		]
	});
}
function Help({ onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-[60] flex items-end justify-center bg-bg/70 p-3 md:items-center",
		role: "dialog",
		"aria-label": "How to use Drift Hall",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[80%] w-full max-w-lg overflow-y-auto rounded-md border border-line bg-surface p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl tracking-tight",
					children: "How to walk the hall"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: btn,
					onClick: onClose,
					"aria-label": "Close help",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 text-sm leading-relaxed text-fg/90",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Open a folder from your computer. Photos stay on this machine — nothing is uploaded. Dates come from the camera’s EXIF when it exists, otherwise from the file date." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "font-medium text-brass",
							children: "Date grid"
						}),
						" lines pictures up by month.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "font-medium text-brass",
							children: "Gallery"
						}),
						" hangs them in rooms you can walk, grouped by year or by folder. ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "font-medium text-brass",
							children: "Float"
						}),
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "font-medium text-brass",
							children: "Tunnel"
						}),
						", and",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "font-medium text-brass",
							children: "Spiral"
						}),
						" are fly-throughs.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "font-medium text-brass",
							children: "Maze"
						}),
						" puts frames on the walls of a generated plan."
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "WASD or arrows move. A strafes left, D right. Drag to look, or double-click to capture the mouse. Q and R turn. Shift sprints. In fly modes, Space rises and C or Ctrl drops. Gallery and maze keep you at eye height." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Keys 1–6 switch modes. E flies to the picture under the crosshair. F stars it. [ and ] step through the filter. I opens the contact sheet. H is this panel." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Stars, tags, notes, albums, and hiding are saved in this browser. If you open the folder with editing allowed, “Save into folder” writes ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-brass",
							children: "DriftHall/marks.json"
						}),
						" beside the files. Originals are never rewritten. Drag-and-drop and the classic picker cannot write that file."
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted",
						children: "HEIC is skipped. Up to 2,000 images load at once; lower the fog if a long grid disappears into the distance. The sample library uses Unsplash photos served as ordinary JPEGs so you can try every room before pointing at your own folder. The fly-throughs and walkable rooms take their cue from floating galleries and museum viewers — this one is built for a folder you already have."
					})
				]
			})]
		})
	});
}
var btn = "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border border-line bg-surface/90 px-2.5 text-sm text-fg backdrop-blur-sm hover:border-brass/70 disabled:cursor-not-allowed disabled:opacity-40";
var onBtn = "border-brass text-brass";
var field = "h-11 w-full rounded-md border border-line bg-bg px-3 text-sm text-fg";
var chip = "inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-bg px-3 text-xs text-fg hover:border-brass/70";
var pad = "inline-flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface/90 text-sm";
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExplorerApp, {});
}
//#endregion
export { isTyping as a, held as i, useExplorer as n, replaceHeld as o, visiblePhotos as r, setHeld as s, routes_exports as t };
