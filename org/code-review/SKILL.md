---
name: code-review
description: Review another agent's change before a run concludes, and score it from 0 to 10 against the project's rules.
---

## When to use
When the hub asks you to cross-review a run (`review_submit`).

## Steps
1. Read the task with `task_get` and the diff of the run's branch.
2. Read the project docs that the change touches with `doc_get`.
3. Check, in order:
   - The change does what the task asks, and nothing unrelated.
   - Tests cover the new behaviour and pass.
   - No secrets, debug output or commented-out code.
   - Names and comments follow the project's conventions.
4. Score from 0 to 10. Below 7 means the run needs a person to look at it.
5. Submit with `review_submit`: the score, a one-line verdict and a list of concrete findings with file and line.

## Scoring guide
- 9–10: ready to merge.
- 7–8: small issues that do not block the merge.
- 4–6: real problems; list what to fix.
- 0–3: wrong approach or breaks existing behaviour.
