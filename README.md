# usefulTesters

A Claude Code skill: a QA-company-style test of a web app. A lead QA maps the site and writes a test plan, persona testers use the site in a browser like honest users, and you get one closure report.

This repo holds two parts:

- `plugins/ux-testers/`: the ux-testers plugin. It adds the tester agent types, the `think_aloud` tool and the live "UX testers" pane, plus `/uxtest`.
- `usefulTesters/`: the `/usefulTesters` skill, which uses that plugin.

## Install on another PC

1. Sign in to GitHub on that PC (this repo is private): `gh auth login`.
2. In Claude Code, install the plugin with one line:
   ```
   /plugin install ux-testers --marketplace Yamikiro/usefulTesters
   ```
   In the desktop app you can instead use + → Plugins → Add marketplace, enter `Yamikiro/usefulTesters`, then install ux-testers.
3. Copy the `usefulTesters` folder into `~/.claude/skills/` (Windows: `%USERPROFILE%\.claude\skills\`).
4. Restart Claude Code, then type `/usefulTesters <address>`.

Only test sites you own or have written permission to test.
