# usefulTesters + uxtesters

Two Claude Code skills that test a web app with persona testers who drive a browser and think aloud.

| Skill | What it does |
|---|---|
| `/usefulTesters` | QA-company-style test. A lead QA maps the site and writes a test plan, persona testers use the site like honest users, and you get one closure report. |
| `/uxtesters` | Usability test. Zero-context personas try your interface and report how it felt. |

Both need the **ux-testers** plugin (its `ux-testers:*` agent types and the `think_aloud` tool). Without it the skills tell you and stop.

## Install (Windows PowerShell)

```powershell
git clone https://github.com/Yamikiro/usefulTesters
Copy-Item usefulTesters\usefulTesters, usefulTesters\uxtesters "$env:USERPROFILE\.claude\skills\" -Recurse -Force
```

No git? Click Code, then Download ZIP on this page, unzip it, and copy the `usefulTesters` and `uxtesters` folders into `%USERPROFILE%\.claude\skills\`.

macOS or Linux: copy the same two folders into `~/.claude/skills/`.

Restart Claude Code, then type `/usefulTesters` or `/uxtesters`.

Details for the QA skill are in `usefulTesters/README.md`.

## Safety

Only test sites you own or have written permission to test. The testers only do what an honest user can do in a browser. This is not a hacking or security scanner. Findings are hints that a human confirms.
