// PreToolUse hook: refuse `gh pr create` for prototype branches.
// Prototypes and requested artifacts stay local; see "Pull requests" in CLAUDE.md.
import { execSync } from "node:child_process";

const input = JSON.parse(await new Promise((resolve) => {
  let data = "";
  process.stdin.on("data", (chunk) => (data += chunk));
  process.stdin.on("end", () => resolve(data || "{}"));
}));

const command = input.tool_input?.command ?? "";
if (!/\bgh\s+pr\s+create\b/.test(command)) process.exit(0);

const headFlag = command.match(/(?:--head|-H)[=\s]+["']?([^\s"']+)/);
let branch = headFlag?.[1];
if (!branch) {
  try {
    branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: input.cwd, encoding: "utf8" }).trim();
  } catch {
    process.exit(0);
  }
}

if (/^(proto|prototype)\//.test(branch)) {
  console.error(
    `Blocked: '${branch}' is a prototype branch. Prototypes and artifacts are not opened as PRs. ` +
      "Keep the work local and tell the user the branch name. See 'Pull requests' in CLAUDE.md."
  );
  process.exit(2);
}
