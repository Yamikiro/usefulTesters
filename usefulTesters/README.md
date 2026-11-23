# usefulTesters

A Claude Code skill that runs a QA-company-style test of a web app.

A lead QA tester first maps your site and writes a test plan. You approve it. Then persona testers (each with a different job) use the site in a real browser, think aloud, and report back. You get one closure report with a ranked bug list, a test case table, what was left behind, and a "Not checked" list.

The testers only USE the site like honest people who make mistakes. No scripts, no code reading, no hacking tricks.

## Warning: only test sites you own

Only test sites you own or have written permission to test. Creating accounts, submitting forms and changing page addresses can break a site's terms of use or computer-misuse laws if you do not have permission. On a live site, prefer the browse-only mode (the skill asks you).

## What you need

- Claude Code.
- The ux-testers plugin. It provides the `ux-testers:*` agent types, the `think_aloud` tool and the testers pane. Where to get it: unsure. Check with whoever shared this folder, or look in your Claude Code plugin list.
- A web address to test (a localhost address is fine).

## Install

1. Copy this whole folder (`usefulTesters`) into your skills folder: `~/.claude/skills/` (on Windows: `%USERPROFILE%\.claude\skills\`).
2. Restart Claude Code.
3. Type `/usefulTesters <address>` or say "QA test my site".

## What is in the folder

- `SKILL.md`: the run order, safety rules and how testers are started.
- `personas.md`: the text for each tester.
- `report-template.md`: the closure report format.

## How a run goes

1. You give an address. The skill asks if you own it and whether it is a test copy or live.
2. Lead QA maps the site and proposes test cases. You approve or edit.
3. QA testers run in small groups (up to 3 at once, since they share one browser).
4. Optional: "feel" testers judge how easy the site is to use.
5. The report is saved in `qa-reports\<host>-<date>\` in your current folder. Add `qa-reports\` to `.gitignore` so it does not end up in a public repo.

## Good to know

- Do not use the site in the browser pane while a run is going. Some testers log in and out.
- Testers create test accounts with fake `@example.com` addresses. The report lists them under "Left behind" so you can delete them.
- Findings are hints. A human should confirm each one before fixing.
- A clean report is not proof that the site has no bugs.
