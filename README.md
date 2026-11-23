# usefulTesters + uxtesters

Claude Code tools that test a web app with persona testers who drive a browser and think aloud.

| Part | What it is |
|---|---|
| `plugins/ux-testers/` | The **ux-testers plugin**: the tester agent types, the `think_aloud` tool, the live "UX testers" pane, and `/uxtest`. The two skills need it. |
| `usefulTesters/` | `/usefulTesters`: QA-company-style test. A lead QA maps the site and writes a test plan, persona testers use it like honest users, and you get one closure report. |
| `uxtesters/` | `/uxtesters`: usability test. Zero-context personas try your interface and report how it felt. |

## Install

1. **Plugin.** In Claude Code run:
   ```
   /plugin install ux-testers --marketplace Yamikiro/usefulTesters
   ```
   In the desktop app you can instead use + then Plugins then Add marketplace, enter `Yamikiro/usefulTesters`, and install ux-testers.

2. **Skills.** Copy the `usefulTesters` and `uxtesters` folders into your skills folder. Windows PowerShell:
   ```powershell
   git clone https://github.com/Yamikiro/usefulTesters
   Copy-Item usefulTesters\usefulTesters, usefulTesters\uxtesters "$env:USERPROFILE\.claude\skills\" -Recurse -Force
   ```
   No git? Click Code, then Download ZIP on this page, unzip it, and copy those two folders into `%USERPROFILE%\.claude\skills\`. On macOS or Linux the folder is `~/.claude/skills/`.

3. Restart Claude Code, then type `/usefulTesters <address>` or `/uxtesters <address>`.

Details for the QA skill are in `usefulTesters/README.md`.

## Safety

Only test sites you own or have written permission to test. The testers only do what an honest user can do in a browser. This is not a hacking or security scanner. Findings are hints that a human confirms.
