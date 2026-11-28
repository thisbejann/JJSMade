---
name: ticket
description: Take one GitHub issue from open to a green PR in its own worktree. `/ticket <n>`, or `/ticket <n> --unattended` for scheduled runs.
disable-model-invocation: true
---

# Ticket

Arguments: `$ARGUMENTS`. The first number is the issue `<n>`. `--unattended` means nobody is at the PC.

Every step is idempotent. On a rerun, enter the existing worktree and resume at the first step whose completion criterion is unmet.

## 1. Pre-flight

```sh
gh issue view <n> --json number,title,body,state,labels,comments
gh api repos/{owner}/{repo}/issues/<n> --jq .issue_dependencies_summary.blocked_by
git worktree list
```

A ticket is **in flight** when a worktree's branch matches `fix/<m>-*` or `feat/<m>-*` and that branch has no merged or closed PR (`gh pr view <branch> --json state`).

Stop with **failed** when the issue is closed, its open-blocker count is above 0, or two tickets other than `<n>` are in flight.

Done when: the issue is open, unblocked, and at most one other ticket is in flight.

## 2. Worktree

Pick the first that applies:

1. A worktree already holds a `*/<n>-*` branch: `EnterWorktree` with its `path`, or work there if this session already is.
2. This session runs in a linked worktree (a T3 worktree thread) with an empty `git status --porcelain` and no commits ahead of `origin/main`: stay, `git reset --hard origin/main`, and `git branch -m` to the name below.
3. Otherwise: `EnterWorktree` with name `ticket-<n>`, then `git branch -m` to the name below.

The branch is `fix/<n>-<slug>` for a bug, `feat/<n>-<slug>` otherwise.

A new worktree has no `node_modules`. Run `npm ci` when it is missing. `verify-jjsmade` resolves the repo from its own path, so it serves the worktree's code, not the main checkout's.

Done when: `git branch --show-current` prints that branch, `git merge-base --is-ancestor origin/main HEAD` succeeds, and `node_modules` exists.

## 3. Build

Invoke `t3-pstack:poteto-mode` with the issue as the goal and its suggested fix or acceptance criteria as the spec. It picks the Bug fix or Feature playbook. Read `CONTEXT.md` and the ADRs that touch the area first. Send codebase searches to the `lookup` agent.

Stop that playbook at its **Opening a PR** step and come back here.

Done when: the playbook's steps up to Opening a PR are checked off, `npm test`, `npm run lint` and `npm run build:app` pass, and the change is verified on the matching surface.

### Verification

`verify-jjsmade` is headless against a throwaway local Convex backend, so it runs the same attended or `--unattended`. Never point it, or `npx convex dev`, at the cloud deployment in `.env.local`.

It runs one instance at a time on fixed ports. When `V up` reports a busy port, another ticket is verifying: do not drive or kill it. Attended, tell the user and wait. With `--unattended`, commit and push what passes without the browser, skip to step 6, and report **waiting: verify-jjsmade busy with another ticket**. Run `V down` when you finish.

## 4. Review

Run `/code-review` from `origin/main`. The spec is issue `#<n>`. Fix every finding in this thread, then rerun the checks from step 3.

Done when: the review reports no unaddressed findings.

## 5. PR

Run poteto-mode's **Opening a PR** playbook with the extras in `CLAUDE.md` under "Pull requests". The body is written with `/pr` and carries `Closes #<n>`. Then run its **Babysit** playbook in `drive` mode until checks are green.

Done when: the PR is open, linked to this thread, and every check is green.

## 6. Report

Comment on the issue with the PR link or the blocker, then end your reply with exactly one line:

- **done**: PR #<pr> green and ready to merge.
- **waiting**: what is missing, and who has to provide it.
- **failed**: the step that stopped, and why.
