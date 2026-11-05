import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { findProjectRoot, packageBin, readProject } from "../project.js";

/**
 * `skein preview <route>`: opens a page of the app in Chrome and reports what a person would see go wrong:
 * exceptions, console errors and warnings, failed requests, a blank page, plus a screenshot an agent can look at.
 * `skein check` covers what is wrong in the code; this covers what is wrong once it runs.
 *
 * Starts the project's Vite dev server on a free port (or uses `url`), signs in through the login page when the
 * project has auth (the mock fills in the default account), then loads the route. Chrome is the one installed on
 * the machine (SKEIN_PREVIEW_CHANNEL, default chrome); playwright-core comes from the project's preview feature.
 */

export const PREVIEW_PACKAGES = ["playwright-core"];

async function loadPlaywright() {
  try {
    return await import("playwright-core");
  } catch (error) {
    if (error.code !== "ERR_MODULE_NOT_FOUND" || !error.message.includes("playwright-core"))
      throw error;
    throw new Error(
      "skein preview needs playwright-core (it drives the Chrome installed on this machine; no browser download).\n" +
        "  Create the project with --preview, or add it: npm install -D playwright-core",
    );
  }
}

const freePort = () =>
  new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });

/**
 * The command that starts the project's dev server: `vp dev` (Vite+), else `vite` for a project made before Skein
 * used Vite+. Both are Node scripts, run with this Node.
 */
function devCommand(root) {
  try {
    return [packageBin(root, "vite-plus", "vp"), "dev"];
  } catch {
    // A project on plain Vite
  }
  try {
    return [packageBin(root, "vite", "vite")];
  } catch {
    throw new Error(
      "neither vite-plus nor vite is installed in this project: run the package manager's install first",
    );
  }
}

/** The project's dev server on a free port; resolves once it answers. */
async function startDevServer(root) {
  const command = devCommand(root);
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const child = spawn(
    process.execPath,
    [...command, "--port", String(port), "--strictPort", "--host", "127.0.0.1"],
    {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BROWSER: "none" },
      // A group of its own: `vp dev` runs the server in a process of its own, which must stop with it
      detached: process.platform !== "win32",
    },
  );
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  const stop = () => {
    const { pid } = child;
    try {
      if (pid === undefined) throw new Error("not started");
      // The whole tree: the vp launcher and the dev server it started (else the server keeps running and
      // holds this process's pipes open)
      if (process.platform === "win32")
        spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
      else process.kill(-pid, "SIGTERM");
    } catch {
      child.kill();
    }
    child.stdout.destroy();
    child.stderr.destroy();
  };

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error(`the dev server exited:\n${output.trim().split("\n").slice(-10).join("\n")}`);
    try {
      const res = await fetch(url);
      if (res.ok) return { url, stop };
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  stop();
  throw new Error(`the dev server did not answer on ${url} within 60s`);
}

/**
 * A console message as the devtools would show it: `%o` / `%s` / `%d` filled in from the arguments, errors with
 * their stack, objects as JSON. `m.text()` alone is often just "%o".
 */
async function consoleText(message) {
  const args = await Promise.all(
    message.args().map((arg) =>
      arg
        .evaluate((v) => {
          if (v instanceof Error) return v.stack ?? `${v.name}: ${v.message}`;
          if (typeof v === "object" && v !== null) {
            try {
              return JSON.stringify(v);
            } catch {
              return String(v);
            }
          }
          return String(v);
        })
        .catch(() => ""),
    ),
  );
  if (args.length === 0) return message.text();
  const [first, ...rest] = args;
  if (!/%[sdifoOc]/.test(first)) return args.join(" ");
  // %c is CSS for the devtools: drop it and its argument
  const text = first.replace(/%([sdifoOc])/g, (_, f) =>
    f === "c" ? (rest.shift(), "") : (rest.shift() ?? ""),
  );
  return [text, ...rest].join(" ").trim();
}

const slug = (route) => route.replace(/^\/+|\/+$/g, "").replace(/[^\w-]+/g, "_") || "index";

/**
 * @param {{ route?: string; cwd?: string; url?: string; login?: boolean; out?: string }} options
 * `url`: a dev server that is already running (otherwise one is started and stopped again).
 * `login: false` skips signing in. `out`: where to write the screenshot (default: the system temp dir).
 */
export async function preview({ route = "/", cwd = process.cwd(), url, login = true, out } = {}) {
  const root = findProjectRoot(cwd);
  if (!root) throw new Error("not inside a Skein project (no .skein.json found here or above)");
  const project = readProject(root);
  const path = route.startsWith("/") ? route : `/${route}`;
  const { chromium } = await loadPlaywright();

  const server = url
    ? { url: url.replace(/\/+$/, ""), stop: () => {} }
    : await startDevServer(root);
  const channel = process.env.SKEIN_PREVIEW_CHANNEL ?? "chrome";
  let browser;
  try {
    browser = await chromium.launch({ channel }).catch((error) => {
      throw new Error(
        `could not start ${channel}: ${String(error.message).split("\n")[0]}\n` +
          "  Install Google Chrome, or set SKEIN_PREVIEW_CHANNEL (e.g. msedge, chromium)",
      );
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    let errors = [];
    let warnings = [];
    let failedRequests = [];
    // Console messages are formatted from their arguments in the page, so they arrive later: wait for them at the end
    const pending = [];
    page.on("pageerror", (e) => errors.push({ type: "exception", message: e.stack ?? e.message }));
    page.on("console", (m) => {
      const type = m.type();
      if (type !== "error" && type !== "warning") return;
      pending.push(
        consoleText(m).then((text) => {
          if (type === "error") errors.push({ type: "console", message: text });
          else warnings.push(text);
        }),
      );
    });
    page.on("requestfailed", (r) => {
      const failure = r.failure()?.errorText ?? "failed";
      // Requests cut off by a navigation are not failures of the page
      if (!failure.includes("ERR_ABORTED"))
        failedRequests.push({ method: r.method(), url: r.url(), error: failure });
    });
    page.on("response", (r) => {
      const request = r.request();
      const entry = { method: request.method(), url: r.url(), status: r.status() };
      if (r.status() >= 400) failedRequests.push(entry);
      // The dev server answers any unknown URL with index.html: a data request that gets HTML has no API / mock
      else if (
        ["fetch", "xhr"].includes(request.resourceType()) &&
        (r.headers()["content-type"] ?? "").includes("text/html")
      )
        failedRequests.push({
          ...entry,
          error: "answered with an HTML page: no API or mock handles this URL",
        });
    });

    const notes = [];
    let signedIn;
    if (login && project.features?.includes("auth") && !path.startsWith("/login")) {
      await page.goto(`${server.url}/login`);
      try {
        await page.locator('form button[type="submit"]').first().click({ timeout: 15_000 });
        await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 10_000 });
        signedIn = true;
      } catch {
        signedIn = false;
        notes.push(
          "Could not sign in automatically (submitting the login form did not leave /login); the page may show the login screen.",
        );
      }
      // Only what happens on the requested page counts
      await Promise.all(pending.splice(0));
      errors = [];
      warnings = [];
      failedRequests = [];
    }

    await page.goto(`${server.url}${path}`);
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(300);

    const finalUrl = page.url();
    const finalPath = new URL(finalUrl).pathname;
    if (finalPath !== path) notes.push(`Redirected from ${path} to ${finalPath}.`);
    const view = await page.evaluate(() => {
      const root = document.getElementById("root") ?? document.body;
      const text = root.innerText.trim();
      return {
        title: document.title,
        headings: [...root.querySelectorAll("h1, h2, h3")]
          .map((h) => h.textContent.trim())
          .filter(Boolean)
          .slice(0, 8),
        blank: text.length === 0 && !root.querySelector("img, svg, canvas, video, iframe"),
      };
    });

    const screenshot =
      out ?? join(tmpdir(), "skein-preview", `${slug(project.name ?? "app")}-${slug(path)}.png`);
    mkdirSync(dirname(screenshot), { recursive: true });
    await page.screenshot({ path: screenshot, fullPage: true });

    await Promise.all(pending);
    const unique = (list) => [...new Map(list.map((x) => [JSON.stringify(x), x])).values()];
    errors = unique(errors);
    failedRequests = unique(failedRequests);
    return {
      ok: errors.length === 0 && failedRequests.length === 0 && !view.blank,
      route: path,
      url: finalUrl,
      ...(signedIn !== undefined ? { signedIn } : {}),
      blank: view.blank,
      title: view.title,
      headings: view.headings,
      errors,
      warnings: [...new Set(warnings)],
      failedRequests,
      notes,
      screenshot,
    };
  } finally {
    await browser?.close();
    server.stop();
  }
}
