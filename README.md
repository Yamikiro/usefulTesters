# usefulTesters + uxtesters

Claude Code tools that test a web app with persona testers who drive a browser and think aloud.

| Install this | You get |
|---|---|
| `/plugin install usefultesters --marketplace Yamikiro/usefulTesters` | `/usefulTesters`: QA-company-style test. A lead QA maps the site and writes a test plan, persona testers use it like honest users, and you get one closure report. |
| `/plugin install uxtesters --marketplace Yamikiro/usefulTesters` | `/uxtesters`: usability test. Zero-context personas try your interface and report how it felt. |
| `/plugin install ux-testers --marketplace Yamikiro/usefulTesters` | The testers themselves: tester agents, the `think_aloud` tool, the live pane and `/uxtest`. Both skills above are set to pull this in; if a skill says the plugin is missing, run this line. |

Desktop app: + then Plugins then Add marketplace, enter `Yamikiro/usefulTesters`, then install what you want. Restart Claude Code afterwards.

Details for the QA skill: `plugins/usefulTesters/skills/usefulTesters/README.md`.

## Safety

Only test sites you own or have written permission to test. The testers only do what an honest user can do in a browser. This is not a hacking or security scanner. Findings are hints that a human confirms.
