interface FileSystemHandle {
  queryPermission?(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission?(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
}

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>;
}

interface Window {
  showDirectoryPicker?(options?: {
    mode?: "read" | "readwrite";
    id?: string;
  }): Promise<FileSystemDirectoryHandle>;
  __controlsTest?: {
    getYaw: () => number;
    getSpeed: () => number;
    getPos: () => { x: number; y: number; z: number };
    setKeys: (codes: string[]) => void;
    setYaw?: (yaw: number) => void;
  };
}
