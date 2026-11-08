#!/usr/bin/env node
// Verification harness for JJSMade. Usage is documented in ../SKILL.md.
//
// The backend always runs from a scratch copy of convex/ with a scratch home directory.
// The scratch has no .env.local of the repo and no Convex login, so the CLI cannot reach
// the cloud deployment named in the repo's .env.local.
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, cpSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const ROOT = join(tmpdir(), "jjsmade-verify");
const RUN = join(ROOT, "run");
const PROJECT = join(RUN, "project");
const HOME = join(RUN, "home");
const LOGS = join(RUN, "logs");
const STATE = join(RUN, "state.json");
const TOOLS = join(ROOT, "tools");
const CACHE = join(ROOT, "appdata");
const ARTIFACTS = join(REPO, ".verify", "artifacts");

const PORTS = { convex: 3310, site: 3311, vite: 5199, chrome: 9333 };
const CONVEX_URL = `http://127.0.0.1:${PORTS.convex}`;
const APP_URL = `http://127.0.0.1:${PORTS.vite}`;
const ADMIN_PASSWORD = "verify-password";
const PLAYWRIGHT_VERSION = "1.64.1";
const CONVEX_BIN = join(REPO, "node_modules", "convex", "bin", "main.js");
const VITE_BIN = join(REPO, "node_modules", "vite", "bin", "vite.js");
const CHROME_CANDIDATES = [
  process.env.VERIFY_CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function scratchEnv() {
  const env = {
    ...process.env,
    HOME,
    USERPROFILE: HOME,
    LOCALAPPDATA: CACHE,
    XDG_CACHE_HOME: CACHE,
    CONVEX_AGENT_MODE: "anonymous",
  };
  for (const key of ["CONVEX_DEPLOY_KEY", "CONVEX_DEPLOYMENT", "CONVEX_SELF_HOSTED_URL", "CONVEX_SELF_HOSTED_ADMIN_KEY"]) {
    delete env[key];
  }
  return env;
}

function readState() {
  return existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : null;
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function killTree(pid) {
  if (!pid || !pidAlive(pid)) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      process.kill(pid, "SIGTERM");
    }
  }
}

function startDetached(name, command, args, options) {
  const log = openSync(join(LOGS, `${name}.log`), "a");
  const child = spawn(command, args, { ...options, detached: true, stdio: ["ignore", log, log], windowsHide: true });
  child.unref();
  closeSync(log);
  return child.pid;
}

async function waitFor(label, check, timeoutMs, logFile) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 300));
  }
  const tail = logFile && existsSync(logFile) ? readFileSync(logFile, "utf8").slice(-1500) : "";
  fail(`timed out waiting for ${label}\n${tail}`);
}

async function httpOk(url) {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

function portBusy(port) {
  return fetch(`http://127.0.0.1:${port}/`).then(() => true, () => false);
}

function hashDir(dir) {
  const hash = createHash("sha256");
  const walk = (current) => {
    for (const name of readdirSync(current).sort()) {
      // `convex dev` rewrites these two in the scratch copy, so they can differ harmlessly.
      if (name === "_generated" || name === "tsconfig.json") continue;
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else hash.update(name).update(readFileSync(full));
    }
  };
  walk(dir);
  return hash.digest("hex");
}

function copyFunctions() {
  rmSync(join(PROJECT, "convex"), { recursive: true, force: true });
  cpSync(join(REPO, "convex"), join(PROJECT, "convex"), { recursive: true });
}

function convexCli(args, { allowFailure = false } = {}) {
  const result = spawnSync(process.execPath, [CONVEX_BIN, ...args], { cwd: PROJECT, env: scratchEnv(), encoding: "utf8" });
  if (result.status !== 0 && !allowFailure) fail(`convex ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result;
}

function linkNodeModules() {
  const target = join(PROJECT, "node_modules");
  if (process.platform === "win32") {
    spawnSync("cmd", ["/c", "mklink", "/J", target, join(REPO, "node_modules")], { stdio: "ignore" });
  } else {
    spawnSync("ln", ["-s", join(REPO, "node_modules"), target], { stdio: "ignore" });
  }
  if (!existsSync(join(target, "convex"))) fail(`could not link node_modules into ${PROJECT}`);
}

// Detach the link first: a recursive delete must never get a chance to walk into the repo's node_modules.
function removeRun() {
  const link = join(PROJECT, "node_modules");
  if (existsSync(link) && lstatSync(link).isSymbolicLink()) {
    if (process.platform === "win32") spawnSync("cmd", ["/c", "rmdir", link], { stdio: "ignore" });
    else unlinkSync(link);
  }
  if (existsSync(link)) fail(`refusing to delete ${RUN}: could not detach ${link}`);
  rmSync(RUN, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
}

function ensurePlaywright() {
  if (existsSync(join(TOOLS, "node_modules", "playwright-core", "package.json"))) return;
  mkdirSync(TOOLS, { recursive: true });
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["install", "--no-audit", "--no-fund", "--prefix", TOOLS, `playwright-core@${PLAYWRIGHT_VERSION}`], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) fail(`could not install playwright-core\n${result.stderr}`);
}

function logHasReady(offset) {
  const text = readFileSync(join(LOGS, "convex.log"), "utf8").slice(offset);
  return text.includes("Convex functions ready");
}

async function up() {
  const state = readState();
  if (state && Object.values(state.pids).some(pidAlive)) {
    fail("an instance from an earlier run is alive. Run `down` first, or `doctor` if it is yours.");
  }
  for (const [name, port] of Object.entries(PORTS)) {
    if (await portBusy(port)) fail(`port ${port} (${name}) is taken by a process this harness did not start. Find it and stop it yourself; \`down\` will not touch it.`);
  }
  const chrome = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!chrome) fail("no Chrome found. Set VERIFY_CHROME_PATH to a Chrome or Chromium binary.");
  ensurePlaywright();

  removeRun();
  mkdirSync(PROJECT, { recursive: true });
  mkdirSync(HOME, { recursive: true });
  mkdirSync(LOGS, { recursive: true });
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(ARTIFACTS, { recursive: true });

  copyFunctions();
  cpSync(join(REPO, "package.json"), join(PROJECT, "package.json"));
  cpSync(join(REPO, "tsconfig.json"), join(PROJECT, "tsconfig.json"));
  linkNodeModules();

  const pids = {};
  const save = () => writeFileSync(STATE, JSON.stringify({ pids, startedAt: new Date().toISOString() }, null, 2));

  // Long-running `convex dev` keeps the backend up and pushes whenever scratch convex/ changes.
  pids.convex = startDetached("convex", process.execPath, [CONVEX_BIN, "dev", "--local", "--local-cloud-port", String(PORTS.convex), "--local-site-port", String(PORTS.site)], { cwd: PROJECT, env: scratchEnv() });
  save();
  await waitFor("Convex functions ready", () => logHasReady(0), 240_000, join(LOGS, "convex.log"));

  const scratchEnvFile = readFileSync(join(PROJECT, ".env.local"), "utf8");
  if (!scratchEnvFile.includes("anonymous:") || !scratchEnvFile.includes(CONVEX_URL)) fail(`scratch .env.local does not name the local backend:\n${scratchEnvFile}`);
  convexCli(["env", "set", "ADMIN_PASSWORD", ADMIN_PASSWORD]);

  // Vite gives existing process env priority over .env.local, so the repo's cloud URL is not used.
  pids.vite = startDetached("vite", process.execPath, [VITE_BIN, "--host", "127.0.0.1", "--port", String(PORTS.vite), "--strictPort"], {
    cwd: REPO,
    env: { ...process.env, VITE_CONVEX_URL: CONVEX_URL, VITE_CONVEX_SITE_URL: `http://127.0.0.1:${PORTS.site}` },
  });
  save();
  await waitFor("Vite", () => httpOk(APP_URL), 60_000, join(LOGS, "vite.log"));

  pids.chrome = startDetached("chrome", chrome, [
    `--remote-debugging-port=${PORTS.chrome}`,
    `--user-data-dir=${join(RUN, "chrome-profile")}`,
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1440,900",
    "about:blank",
  ], { cwd: RUN });
  save();
  await waitFor("Chrome", () => httpOk(`http://127.0.0.1:${PORTS.chrome}/json/version`), 30_000, join(LOGS, "chrome.log"));

  console.log(`READY app=${APP_URL} backend=${CONVEX_URL} password=${ADMIN_PASSWORD}`);
}

async function doctor() {
  const problems = [];
  const report = (ok, label, detail = "") => {
    console.log(`${ok ? "ok  " : "BAD "} ${label}${detail ? `: ${detail}` : ""}`);
    if (!ok) problems.push(label);
  };
  const state = readState();
  report(Boolean(state), "state file", STATE);
  if (state) for (const [name, pid] of Object.entries(state.pids)) report(pidAlive(pid), `${name} process`, `pid ${pid}`);
  report(await httpOk(`${CONVEX_URL}/version`), "local Convex backend", CONVEX_URL);
  report(await httpOk(APP_URL), "Vite", APP_URL);
  report(await httpOk(`http://127.0.0.1:${PORTS.chrome}/json/version`), "Chrome debug port", String(PORTS.chrome));

  let served = "";
  try {
    served = await (await fetch(`${APP_URL}/src/main.tsx`)).text();
  } catch {
    // Reported by the check below.
  }
  report(served.includes(CONVEX_URL) && !served.includes(".convex.cloud"), "app talks to local backend, not cloud");

  if (existsSync(join(PROJECT, ".env.local"))) {
    const scratchEnvFile = readFileSync(join(PROJECT, ".env.local"), "utf8");
    report(scratchEnvFile.includes("CONVEX_DEPLOYMENT=anonymous:"), "scratch deployment is anonymous and local");
  } else {
    report(false, "scratch .env.local exists");
  }
  if (existsSync(join(PROJECT, "convex"))) {
    report(hashDir(join(REPO, "convex")) === hashDir(join(PROJECT, "convex")), "backend functions match working tree", "if BAD, run `sync`");
    const auth = convexCli(["run", "auth:validatePassword", JSON.stringify({ password: ADMIN_PASSWORD })], { allowFailure: true });
    report(auth.status === 0 && auth.stdout.includes("true"), "admin password accepted");
  }
  const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO, encoding: "utf8" }).stdout.trim();
  const dirty = spawnSync("git", ["status", "--short"], { cwd: REPO, encoding: "utf8" }).stdout.trim();
  console.log(`info build=${head}${dirty ? " + uncommitted changes" : ""}`);
  if (problems.length > 0) fail(`${problems.length} check(s) failed`);
  console.log("HEALTHY");
}

async function sync() {
  if (hashDir(join(REPO, "convex")) === hashDir(join(PROJECT, "convex"))) {
    console.log("already in sync");
    return;
  }
  const offset = readFileSync(join(LOGS, "convex.log"), "utf8").length;
  copyFunctions();
  await waitFor("Convex functions ready after sync", () => logHasReady(offset), 90_000, join(LOGS, "convex.log"));
  console.log("synced");
}

function down({ purge }) {
  const state = readState();
  if (state) for (const pid of Object.values(state.pids)) killTree(pid);
  removeRun();
  if (purge) rmSync(ROOT, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  console.log(`stopped. Evidence kept in ${ARTIFACTS}`);
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i += 1) {
    if (!args[i].startsWith("--")) fail(`unexpected argument: ${args[i]}`);
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) flags[args[i].slice(2)] = true;
    else {
      flags[args[i].slice(2)] = next;
      i += 1;
    }
  }
  return flags;
}

function locate(page, flags) {
  const within = flags.within ? page.getByRole("dialog", { name: flags.within }) : page;
  let locator;
  if (flags.role) locator = within.getByRole(flags.role, { name: flags.name, exact: flags.exact === true });
  else if (flags.label) locator = within.getByLabel(flags.label, { exact: true });
  else if (flags.placeholder) locator = within.getByPlaceholder(flags.placeholder, { exact: true });
  else if (flags.text) locator = within.getByText(flags.text, { exact: flags.exact === true });
  else fail("pass one of --role/--name, --label, --placeholder, or --text");
  return flags.nth === undefined ? locator : locator.nth(Number(flags.nth));
}

function artifactPath(path) {
  const full = resolve(ARTIFACTS, path);
  mkdirSync(dirname(full), { recursive: true });
  return full;
}

async function browser(args) {
  const [action, ...rest] = args;
  const flags = parseFlags(rest);
  const { chromium } = createRequire(join(TOOLS, "package.json"))("playwright-core");
  const connection = await chromium.connectOverCDP(`http://127.0.0.1:${PORTS.chrome}`);
  const context = connection.contexts()[0];
  const page = context.pages()[0] ?? (await context.newPage());
  page.setDefaultTimeout(Number(flags.timeout ?? 10_000));
  try {
    switch (action) {
      case "goto":
        // --route has no leading slash because Git Bash rewrites /orders into a Windows path.
        if (typeof flags.route !== "string" || flags.route.includes(":")) fail("goto needs --route without a leading slash, e.g. --route orders/new, or --route . for the dashboard");
        await page.goto(`${APP_URL}/${flags.route === "." ? "" : flags.route}`, { waitUntil: "domcontentloaded" });
        break;
      case "click":
        await locate(page, flags).first().click();
        break;
      case "fill":
        await locate(page, flags).first().fill(String(flags.value));
        break;
      case "press":
        await page.keyboard.press(flags.key);
        break;
      case "expect":
        await locate(page, flags).first().waitFor({ state: flags.absent ? "hidden" : "visible" });
        break;
      case "url": {
        // --matches tests the pathname without its leading slash, for the same Git Bash reason as --route.
        const route = (url) => new URL(url).pathname.slice(1);
        if (flags.matches) await page.waitForURL((url) => new RegExp(flags.matches).test(route(url.href)), { waitUntil: "commit" });
        console.log(route(page.url()));
        break;
      }
      case "snapshot": {
        const text = await page.locator("body").ariaSnapshot();
        writeFileSync(artifactPath(flags.path), text);
        console.log(artifactPath(flags.path));
        break;
      }
      case "screenshot": {
        // The viewport override lives only as long as this CDP session, so the window is back to 1440x900 for the next command.
        if (flags.width || flags.height) {
          await page.setViewportSize({ width: Number(flags.width ?? 1440), height: Number(flags.height ?? 900) });
          await page.waitForTimeout(400);
        }
        const hasLocator = flags.role || flags.label || flags.placeholder || flags.text;
        const target = hasLocator ? locate(page, flags).first() : page;
        await target.screenshot({ path: artifactPath(flags.path), ...(hasLocator ? {} : { fullPage: flags.full === true }) });
        console.log(artifactPath(flags.path));
        break;
      }
      default:
        fail(`unknown browser action: ${action}`);
    }
  } catch (error) {
    const shot = artifactPath(`failures/${Date.now()}.png`);
    await page.screenshot({ path: shot }).catch(() => {});
    fail(`${action} ${rest.join(" ")} at ${page.url()}\n${error.message}\nscreenshot: ${shot}`);
  } finally {
    // Closing a CDP connection detaches from Chrome and leaves the page open for the next command.
    await connection.close();
  }
  console.log(`ok ${action}`);
}

const [command, ...args] = process.argv.slice(2);
switch (command) {
  case "up":
    await up();
    break;
  case "doctor":
    await doctor();
    break;
  case "sync":
    await sync();
    break;
  case "down":
    down({ purge: args.includes("--purge") });
    break;
  case "browser":
    await browser(args);
    break;
  case "data": {
    const result = convexCli(["data", args[0], "--format", "jsonLines", "--limit", "1000"]);
    process.stdout.write(result.stdout);
    break;
  }
  case "run": {
    const result = convexCli(["run", args[0], args[1] ?? "{}"]);
    process.stdout.write(result.stdout);
    break;
  }
  default:
    fail("usage: verify.mjs up | doctor | sync | down [--purge] | browser <action> [flags] | data <table> | run <function> [json]");
}
