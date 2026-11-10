import assert from "node:assert/strict";
import test from "node:test";
import { resolveInside } from "./local-folder-plugin.mjs";

test("resolveInside keeps paths inside the chosen folder", () => {
  assert.equal(resolveInside("/tmp/photos", "a/b.jpg"), "/tmp/photos/a/b.jpg");
  assert.equal(resolveInside("/tmp/photos", "../etc/passwd"), null);
  assert.equal(resolveInside("/tmp/photos", "/etc/passwd"), null);
  assert.equal(resolveInside("/tmp/photos", "a/../../etc/passwd"), null);
  assert.equal(resolveInside("/tmp/photos", ""), null);
  assert.equal(resolveInside("/tmp/photos", "ok\0.jpg"), null);
});
