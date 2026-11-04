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

test("skeinui runs the skein command, passing the arguments through", () => {
  expect(execFileSync("node", [BIN, "list"], { encoding: "utf8" })).toContain("Templates:");
  const help = execFileSync("node", [BIN], { encoding: "utf8" });
  expect(help.startsWith("Components: npm install @skeinui/ui @skeinui/themes")).toBe(true);
  expect(help).toContain("Usage:");

  tmp = mkdtempSync(join(tmpdir(), "skeinui-"));
  execFileSync("node", [BIN, "create", "my-app", "--theme", "heroui"], {
    cwd: tmp,
    encoding: "utf8",
  });
  const project = JSON.parse(readFileSync(join(tmp, "my-app", ".skein.json"), "utf8"));
  expect(project).toMatchObject({ template: "basic", theme: "heroui" });
  expect(existsSync(join(tmp, "my-app", "src", "pages", "home", "index.tsx"))).toBe(true);
});
