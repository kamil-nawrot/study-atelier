---
name: study-atelier-release
description: Prepare and finish a study-atelier release (milestone check, release branch, versions, changelog, release PR, tag, GitHub Release, smoke test, merge-back, milestone description, release retro). Use when the owner asks to prepare, cut or finish a release ("przygotuj wydanie 0.6.3", "dokończ wydanie").
---

# study-atelier release

The rules live in the repository; this skill only orders the work and fixes the form of what it writes. Before every run read, from `develop`:

- `docs/guidelines/git-workflow.md`, section "Releases" (and "Hotfixes" for a hotfix). When it disagrees with this skill, the guideline wins; tell the owner so the skill can be updated.
- The top two sections of `CHANGELOG.md`, to match the voice and length of the last release.

Talk to the owner in Polish; everything written to the repository, GitHub and Linear is in English. Never merge, never push to `main` or `develop`, never rebase or force-push a pushed branch.

The release has two halves, each ending with a hand-off to the owner.

## Part 1: prepare ("przygotuj wydanie X.Y.Z")

1. **Milestone check.** List the Linear issues of the project `study-atelier` and keep those of milestone `X.Y.Z`; a minor release `X.Y.0` uses the milestone named `X.Y` (for example `0.7` for `0.7.0`). Every issue must be Done or Canceled. Report open ones by key and title and stop: waiting or moving them is the owner's call. Do not count from the conversation. Then list the issues merged since the previous tag that have no milestone (for example a design and its build issue made from an idea): their branch is in `git log --first-parent v<previous>..origin/develop`; put them in the milestone, since they ship with it.
   1a. **Code review of the version.** Unless the owner says it was already done for this version, review the diff `v<previous>..origin/develop` for bugs and inefficient solutions, one reviewer per area of the code (in parallel, read-only), and verify every finding in the code yourself. Report the verified findings to the owner and propose one `Bug` issue in the milestone for the bugs and a separate issue for larger improvements; the release waits until the bugs are fixed and merged. When the version brings a new view, the review also checks its design against comparable views on `pnpm screenshot` shots (desktop and phone, saved in the repository's `tmp/` with a Windows path for the owner), and the design bugs go into the same issue.
2. **What shipped.** `git fetch --tags`, then:
   - `git log --oneline --first-parent v<previous>..origin/develop` for the merged pull requests;
   - `git diff --name-status v<previous>..origin/develop -- supabase/migrations` for the migrations; read each new migration's top-level statements (`create`, `drop`, `alter`, `grant`, `insert`, `update`, `delete`) to say whether it changes existing data and whether the previous code's calls still work.
3. **Release branch.** `pnpm worktree release/X.Y.Z` from the main checkout, then work in the worktree it prints (`../study-atelier-release-x-y-z`).
4. **Versions.** Set `"version": "X.Y.Z"` in `package.json`, `apps/web/package.json` and `packages/ui/package.json`; check all three with `grep`.
5. **Changelog.** Insert the new section above the previous one, and the link line at the end of the list of links at the bottom of the file, which runs in version order (check it, and fix an earlier link out of order), in this form:

   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD

   <One sentence: what the learner gets from this release.>

   ### Added

   - <User-facing feature, as the learner sees it, quoting UI texts in Polish.>

   ### Changed

   - <User-facing change first; internal work (library, tests, CI) last and in one line.>

   ### Fixed

   - <Bug as the learner saw it, and what happens now.>

   ### Migrations run on production

   <N> migration(s) run on production with this release and <change no existing data | what they change>: `<name>` <what it does and why the previous calls keep working>.
   ```

   - Leave out an empty section. With no migrations, the last section is replaced by the line `No migrations.` in the GitHub Release only.
   - Name issues by outcome, not by key; no links to pull requests.
   - Run `prettier --check CHANGELOG.md`.

6. **Commit and push.** One commit `chore(repo): release X.Y.Z` with the four files; push the branch. Local lint and tests are left to CI (the guideline allows it for this commit).
7. **Release pull request** to `main`, titled `chore(repo): release X.Y.Z`, no Linear issue:

   ```markdown
   ## Context

   Release X.Y.Z: <the changelog's sentence, shorter>. Every issue of the Linear milestone X.Y.Z is Done and merged into `develop` (<keys>; <canceled keys> canceled). Follows the release steps in `docs/guidelines/git-workflow.md`.

   ## Changes

   - Version `X.Y.Z` in the root, `apps/web` and `packages/ui` `package.json` files.
   - `CHANGELOG.md` section `[X.Y.Z]` with the migration note.

   ## Review focus

   - Merge with a **merge commit**, not a squash.
   - <Each migration by file name: what it creates or replaces, whether it changes data, why the previous code keeps working.>
   - <Anything the owner must do or check around the release, e.g. a secret or a scheduled job.>
   - The release changes only the versions and the changelog; lint, type check, tests and build are left to CI.

   ## Decisions

   None.

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

8. **Wait for CI** with `pnpm wait-ci <n>` (it also stops on a conflict). Report to the owner in Polish: the PR link, what the changelog says in three to five bullets, the migrations, and "zmerguj **merge commitem**". Stop.

## Part 2: finish ("zmergowałem, dokończ wydanie")

1. **Merge commit.** `git fetch`; `git log -1 --format=%P origin/main` must show two parents. A squash breaks later releases: stop and tell the owner.
2. **Production run.** Find the CI run of that commit on `main` (`gh run list --branch main`) and check that the `Web app` and `Database migrations` jobs passed. If one failed, stop and report with the log.
3. **Tag.** Lightweight tag on the merge commit: `git tag vX.Y.Z <sha> && git push origin vX.Y.Z`.
4. **GitHub Release** titled `vX.Y.Z`, notes = the changelog section without its heading line, taken from `origin/main` (no leading or trailing blank lines); append `No migrations.` when the release has none. `gh release create vX.Y.Z --title vX.Y.Z --notes-file <file> --verify-tag`; write the file in the scratchpad.
5. **Smoke test.** `curl` with a `User-Agent` on `https://studyatelier.art/`, `/sign-in`, `/terms` and `/privacy`: all 200 (`study-atelier.pages.dev` only redirects there with a 301 since 0.13.0). List for the owner the signed-in flows worth checking, taken from the release's "Added" and "Changed".
6. **Merge-back.** `pnpm worktree chore/merge-main-after-release-X.Y.Z --from origin/main`, push the branch, pull request to `develop` titled `chore(repo): merge main into develop after release X.Y.Z`:

   ```markdown
   ## Context

   Brings the release X.Y.Z back into `develop`, step 7 of the release in `docs/guidelines/git-workflow.md`.

   ## Changes

   - Version `X.Y.Z` in the three `package.json` files and the `[X.Y.Z]` section of `CHANGELOG.md`, with the release merge commit.

   ## Review focus

   - Merge with a **merge commit**, not a squash.

   ## Decisions

   None.

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

   Wait for CI with `pnpm wait-ci <n>`. Once the owner has merged both pull requests, remove the two worktrees with `pnpm worktree remove <branch>`.

7. **Milestone description** in Linear, replacing the plan with what shipped, in one paragraph: `Released YYYY-MM-DD as vX.Y.Z. <What the release brought, user-facing first, then internal work in one sentence.>`
8. **Report** in Polish, one line per step: merge commit and jobs, tag and Release link, smoke test and the flows for the owner to check, merge-back PR ("zmerguj merge commitem"), milestone. Mention scheduled jobs that start working with this release, if any.

## After the merge-back

When the owner says the merge-back is merged and asks for the retro, run the `study-atelier-session-retro` skill on the work since the previous release.
