# QA closure report: <site host> (<DD MMM YYYY>)

Save as `qa-reports\<host>-<DDMMMYYYY>\report.md`. Keep `qa-reports\` out of public repos. Findings are hints that a human confirms.

## 1. Summary

- Site tested, test copy or live site, who ran (testers and models).
- Test cases: <n> run, <n> pass, <n> fail, <n> not run.
- Bugs: <n> critical, <n> high, <n> medium, <n> low, <n> info.
- Tester stopped by a safeguard (error text with `[cyber]`)? Name it and the checks that went unrun. Do not reword or retry unless the user says so.

## 2. Test case table

| ID | Tester | Result (pass / fail / not run) | Note |
|---|---|---|---|

## 3. Bugs

Rank by severity first, then by how many testers hit it. One entry per bug (merge duplicates):

- **BUG-1: <short title>**
  - Severity: critical / high / medium / low / info
  - Where: <page address or screen>
  - Steps to repeat: <numbered steps>
  - Expected: <what should happen>
  - Actual: <what happened>
  - Found by: <testers>
  - Could be misused if deployed: <one line, written by the main agent, in plain words>

Severity in plain words:
- **Critical**: a stranger can take over the app or read or change everyone's data, or the main feature is completely broken, with little effort.
- **High**: a stranger can see or do something that belongs to another user, or a main feature gives wrong results (wrong totals, lost saves).
- **Medium**: a real bug that makes things easier to abuse or leaks useful clues, or breaks a secondary feature (for example, the login message says whether an email has an account).
- **Low**: small gaps or cosmetic faults (a layout glitch, a version number shown).
- **Info**: good to know, not a bug.

Mark anything unproven "maybe" and say which step is missing.

## 4. What worked

Short list of what behaved well.

## 5. Feel-tester round (only if it was run)

One line per tester: verdict and Ease score, then the top feel issues.

## 6. Left behind (for clean-up by the site owner)

- Test account emails created (never passwords):
- Data markers used:
- Forms submitted and where:

## 7. Not checked (always include)

- Response headers, cookie flags, CORS, TLS.
- Server-side logic and real record counts.
- Brute force and rate limits.
- Load.
- Real file uploads.
- True cross-browser testing.
- Measured speed.
- A second real user and cross-account access.
- Anything behind a login without a test account.
- Plus: testers or steps that were not run, and why.

## 8. Honest limits

- Browser-only test by testers who behave like honest users.
- A clean report does not prove the site is free of bugs or safe.
- The testers' thinking pane may show what they read, so only test sites with fake data.
- Never include secret values or other people's data in this report.