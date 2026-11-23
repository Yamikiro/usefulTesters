---
name: uxtesters
description: Usability-test a web app's interface with zero-context persona testers who drive a browser and think aloud, then report back. Use when the user types /uxtesters, or asks to UX test, usability test, user test or "use the testers / ux-testers" on an app, site, page or localhost URL, or to see how real people would experience their interface.
---

# UX test with persona testers

Needs the ux-testers plugin (it provides the `ux-testers:*` agent types, the think_aloud tool and the UX testers pane). If no `ux-testers:` agent type is available, tell the user the plugin is not installed or enabled and stop.

Testers are subagents that know nothing except what you put in their prompt. Their value is that they come in cold, so keep them cold.

## 1. Find the URL and the goal

- Get the app's URL. For a local project, use the dev server you or the user already started (a localhost URL). If none is running and the project has one, start it first. Ask only when you cannot find or start it.
- The built-in browser cannot open `file://` addresses. For a local HTML file, copy it as `index.html` into a new folder in your scratchpad, serve that folder with `python -m http.server <free port> --bind 127.0.0.1 --directory <folder>` in the background, and give testers `http://127.0.0.1:<port>/`. Check the port is free first.
- Work out what a real visitor would come to do (sign up, find a price, book something). That is the goal you give testers: a task, never a hint about how to do it.

## 2. Choose the testers (3 to 5)

Pick people from the app's real audience who will stress it in different ways. Use the built-in ones where they fit:

- `ux-testers:rosa`: 71, rarely uses apps
- `ux-testers:jay`: 26, impatient developer, power user
- `ux-testers:amara`: low vision, keyboard and screen reader only
- `ux-testers:diego`: 19, on a phone, distracted
- `ux-testers:lin`: small-business owner, English is a second language

Write the rest with `ux-testers:custom`, for example a nurse on a night shift for a rota app, or a first-time landlord for a rental app. Unless the user asks otherwise, include at least one accessibility or low-skill tester and one mobile tester.

## 3. Spawn them, all in one message, in the background

One Agent call per tester, `run_in_background: true`, `description` set to `"<Name> tests <host>"`.

- Built-in tester prompt:
  `Here is the address: <url>` then a blank line, then `What you came here to do: <goal>`.
- Custom tester prompt:
  `Who you are: <name>, <age>, <job>. <skills, device, habits, patience, why they came>.` then a blank line, then the same address and goal lines.

Never put in a prompt: what the app does, its features, page names, where the buttons are, credentials, the code, or anything from this conversation. If the app needs a login, give a test account only when the user supplied one for testing.

Spawn at most 3 at a time unless the user asks for more, because they share one browser. Tell the user that the **UX testers** pane is showing each tester's thoughts live.

## 4. Report back

When the testers have finished (their reports arrive as task notifications), write one summary:

- **Top issues**, merged across testers and ranked by severity × how many testers hit it. Name who hit each one and where.
- **What worked.**
- **One line per tester:** their verdict and their Ease score.
- **Fixes**, ordered by impact.

If a tester could not use the browser or was blocked, say so plainly rather than guessing what they would have found.
