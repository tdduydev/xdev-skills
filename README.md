# xDev Skills

Skills for [xDev Hive](https://github.com/tdduydev/xdev-hive) agents. Each skill is a `SKILL.md` file that the hub loads into an agent run (Claude Code, Codex, Gemini CLI) when the run belongs to the skill's scope.

> Status: the hub still keeps skills in its own database. Syncing with this repo is planned work, so the rules below describe the target behaviour.

## Layout

```
xdev-skills/
├─ hive.json                         # repo settings read by the hub
├─ org/                              # organization-wide skills
│  └─ <skill-name>/SKILL.md
├─ teams/                            # one folder per team slug
│  └─ <team-slug>/<skill-name>/SKILL.md
└─ projects/                         # one folder per project key
   └─ <project-key>/<skill-name>/SKILL.md
```

- A skill is a folder. The folder name is the skill name and must match `name` in its `SKILL.md`.
- A skill folder may hold extra files (scripts, templates, examples) next to `SKILL.md`. Reference them with relative paths.
- Names use lowercase letters, digits and hyphens: `db-migration`, `vn-invoice`.
- Team slugs and project keys are the same identifiers the hub uses (`thanh-toan`, `payment-api`).

## Scope and precedence

A run sees the skills of its organization, its project's owning team and its project. When two scopes define a skill with the same name, the narrower one wins:

```
projects/<key>/  >  teams/<team>/  >  org/
```

For example, `projects/payment-api/db-migration/` hides `org/db-migration/` for runs of `payment-api` only.

## SKILL.md format

YAML front matter with `name` and `description`, then Markdown instructions:

```markdown
---
name: db-migration
description: Write safe database migrations and enable row-level security on new tables.
---

## When to use
When a task adds or changes tables.

## Steps
1. ...
```

- `description` says what the skill does and when to use it. Agents use it to decide whether to load the skill, so keep it to one or two sentences.
- Write instructions as steps the agent can follow and check.
- Never put secrets, tokens or internal hostnames that must stay private in a skill. This repository is public.

## How changes flow

| Change made | What happens |
|---|---|
| Edited in the hub (Knowledge › Skills) | The hub commits to `main` as the person who edited it. |
| Proposed by an agent or a member | The hub opens a pull request. Approving the proposal in the hub merges it. |
| Pushed or merged here directly | The hub picks up the change from the push webhook. |

Every skill version in the hub maps to a commit, so history and blame live here.

## Contributing

1. Create a branch and add or edit `<scope>/<skill-name>/SKILL.md`.
2. Open a pull request. A team admin of the scope reviews it.
3. Squash-merge into `main`.

## Related

- Hub: https://github.com/tdduydev/xdev-hive
