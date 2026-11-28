// PreToolUse hook: keep shipping work off `main`.
// Blocks file-tool edits to tracked or code files on main, and `git commit` on main,
// which also catches edits made through the shell. See "Pull requests" in CLAUDE.md.
// Untracked notes outside the code folders (research, artifacts) stay writable on main.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const input = JSON.parse(await new Promise((resolve) => {
  let data = "";
  process.stdin.on("data", (chunk) => (data += chunk));
  process.stdin.on("end", () => resolve(data || "{}"));
}));

const cwd = input.cwd ?? process.cwd();
const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
const commit = (input.tool_input?.command ?? "").match(/\bgit((?:\s+-[Cc]\s+(?:"[^"]*"|'[^']*'|\S+))*)\s+commit\b/);
if (!target && !commit) process.exit(0);

const commitDir = commit?.[1].match(/-C\s+(?:"([^"]*)"|'([^']*)'|(\S+))/);
const file = target && path.resolve(cwd, target);
let dir = file ? path.dirname(file) : path.resolve(cwd, commitDir?.slice(1).find(Boolean) ?? ".");
while (!existsSync(dir) && path.dirname(dir) !== dir) dir = path.dirname(dir);

const git = (...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

let branch, prefix;
try {
  branch = git("rev-parse", "--abbrev-ref", "HEAD");
  prefix = git("rev-parse", "--show-prefix");
} catch {
  process.exit(0);
}
if (branch !== "main") process.exit(0);

const block = (what) => {
  console.error(
    `Blocked: ${what} on main. Shipping work goes on its own branch off main, ` +
      "or in a worktree for a ticket (/ticket <n>). See 'Pull requests' in CLAUDE.md."
  );
  process.exit(2);
};

if (!file) block("git commit");

const rel = prefix + path.relative(dir, file).split(path.sep).join("/");
if (!/^(src|convex|public|\.claude)\//.test(rel)) {
  try {
    git("ls-files", "--error-unmatch", "--", file);
  } catch {
    process.exit(0);
  }
}
block(`editing '${rel}'`);
