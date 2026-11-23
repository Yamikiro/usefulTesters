# ux-testers

Summon zero-context persona agents to usability-test any web app, and watch them think aloud in a live pane.

## Install

```
/plugin install ux-testers --marketplace Yamikiro/usefulTesters
```

## Use

```
/uxtest http://localhost:3000
/uxtest http://localhost:3000 --who rosa,amara sign up and create a first project
/uxtest clear
```

Each tester is a subagent with its own system prompt (no CLAUDE.md, no project files, no conversation history). It gets only the URL and an optional goal, opens its own tab in the built-in browser, and calls `think_aloud` as it goes. The **UX testers** pane shows every thought, action, issue and the final report, per tester or all together.

## Testers

| id | who |
| --- | --- |
| rosa | 71, retired teacher, rarely uses apps |
| jay | 26, software developer, impatient power user |
| amara | 38, low vision, keyboard and screen reader user |
| diego | 19, student on a phone, distracted |
| lin | 45, small-business owner, English is a second language |

Personas live in `hooks/personas.ts`; add one there and it becomes a tester.
