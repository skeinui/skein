import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vite-plus/test";

const BIN = join(import.meta.dirname, "..", "index.js");
let tmp: string | undefined;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

test("npm create skein calls skein create, passing the arguments through", () => {
  tmp = mkdtempSync(join(tmpdir(), "create-skein-"));
  const out = execFileSync("node", [BIN, "my-admin", "--template", "admin", "--theme", "antd"], {
    cwd: tmp,
    encoding: "utf8",
  });
  expect(out).toContain("Created my-admin");
  const project = JSON.parse(readFileSync(join(tmp, "my-admin", ".skein.json"), "utf8"));
  expect(project).toMatchObject({ template: "admin", theme: "antd" });
  expect(existsSync(join(tmp, "my-admin", "src", "pages", "users", "index.tsx"))).toBe(true);
});
