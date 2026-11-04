import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { createProject } from "../src/commands/create.js";
import { createServer } from "../src/mcp/server.js";

let tmp: string;
let client: Client;

beforeAll(async () => {
  tmp = mkdtempSync(join(tmpdir(), "skein-mcp-"));
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer({ cwd: tmp }).connect(serverSide);
  client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientSide);
});
afterAll(async () => {
  await client.close();
  rmSync(tmp, { recursive: true, force: true });
});

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const result = (await client.callTool({ name, arguments: args })) as {
    isError?: boolean;
    content: { type: string; text: string }[];
  };
  return { error: Boolean(result.isError), text: result.content[0].text };
};

describe("skein MCP server", () => {
  test("instructions tell the agent to read the docs first, add pages with tools, check after changes", () => {
    const instructions = client.getInstructions() ?? "";
    for (const word of ["skein_docs", "skein_new_page", "skein_check"])
      expect(instructions).toContain(word);
  });

  test("lists every tool", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "skein_check",
      "skein_create_project",
      "skein_docs",
      "skein_list",
      "skein_new_module",
      "skein_new_page",
      "skein_preview",
      "skein_theme_add",
      "skein_theme_init",
      "skein_theme_use",
    ]);
  });

  test("a project's AGENTS.md names every tool (skein_preview only with the preview feature)", async () => {
    const { tools } = await client.listTools();
    const agents = (add: string[]) => {
      const dir = join(tmp, `agents-${add.join("-")}`);
      createProject({ dir, add });
      return readFileSync(join(dir, "AGENTS.md"), "utf8");
    };
    const full = agents(["mcp", "preview"]);
    for (const { name } of tools) expect(full, name).toContain(`\`${name}\``);
    expect(agents(["mcp"])).not.toContain("skein_preview");
  });

  test("skein_docs: component docs, search, list, suggestions for typos", async () => {
    const button = await call("skein_docs", { component: "Button", examples: 1 });
    expect(button.text).toContain('import { Button } from "@skeinui/ui";');
    expect(button.text.match(/## Example:/g)).toHaveLength(1);
    expect(
      JSON.parse((await call("skein_docs", { search: "date picker" })).text).map(
        (c: { name: string }) => c.name,
      ),
    ).toContain("DatePicker");
    expect((await call("skein_docs")).text).toContain("## Rules");
    const typo = await call("skein_docs", { component: "Buton" });
    expect(typo.error).toBe(true);
    expect(typo.text).toContain("did you mean: Button");
  });

  test("create a project → add a page → switch theme → check (translations and styles)", async () => {
    const created = await call("skein_create_project", {
      dir: "app",
      template: "admin",
      theme: "antd",
    });
    expect(JSON.parse(created.text).features).toContain("shell");
    const cwd = join(tmp, "app");

    const page = JSON.parse((await call("skein_new_page", { path: "orders", cwd })).text);
    expect(page.created).toContain("src/routes/_auth/orders.tsx");
    expect((await call("skein_new_page", { path: "orders", cwd })).error).toBe(true);

    expect(
      JSON.parse((await call("skein_theme_use", { theme: "heroui", cwd })).text).changed,
    ).toContain("src/settings.ts");
    expect((await call("skein_theme_use", { theme: "bootstrap", cwd })).error).toBe(true);

    const result = JSON.parse((await call("skein_check", { only: ["i18n", "style"], cwd })).text);
    expect(result).toMatchObject({ ok: true, errors: 0, ran: ["i18n", "style"] });
  });

  test("calling outside a project gives a readable error, not a crash", async () => {
    const result = await call("skein_new_page", { path: "x", cwd: tmpdir() });
    expect(result.error).toBe(true);
    expect(result.text).toContain("not inside a Skein project");
  });
});
