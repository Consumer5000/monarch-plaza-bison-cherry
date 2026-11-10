export const held = new Set<string>();

export function setHeld(code: string, on: boolean) {
  if (on) held.add(code);
  else held.delete(code);
}

export function replaceHeld(codes: string[]) {
  held.clear();
  for (const code of codes) held.add(code);
}

export function isTyping() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}
