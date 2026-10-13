# xDev Skills

Skills for [xDev Hive](https://github.com/tdduydev/xdev-hive) agents. Each skill is a `SKILL.md` file that the hub loads into an agent run (Claude Code, Codex, Gemini CLI) when the run belongs to the skill's scope.

> Status: the hub still keeps skills in its own database. Syncing with this repo is planned work, so the rules below describe the target behaviour.

## Layout

```
xdev-skills/
├─ hive.json                         # repo settings read by the hub
├─ library/                          # curated skills, shipped as the hub's default skill pack (see below)
│  └─ <skill-name>/SKILL.md, LICENSE, SOURCE.md
├─ sources.json                      # upstream repo, commit and license of every library skill
├─ NOTICE.md                         # licenses and attribution
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

## Skill library

`library/` holds a curated set of skills: some written here, most copied from well-known open-source repositories
(MIT, Apache-2.0, or CC BY-SA 4.0 where marked). The hub ships this list as **Hive default skills**: every
organization sees them on the Skills page, read-only, and turns each one on or off for the organization or a project.
A few are on by default (marked ✓); the rest are there to turn on when a project needs them. Every skill on adds its
description to each run's context, so turn on what the project uses, not everything.

`library/` is outside the `org/`, `teams/`, `projects/` scopes on purpose: the hub's Git sync does not import it, so
an organization that connects this repository still controls the library with the on/off switches. To change a
library skill for one organization, copy it into `org/<name>/` (or a team or project folder); the narrower copy wins
over the default with the same name.

### UI and UX

| Skill | On | Use it when |
|---|---|---|
| `ui-ux-pro-max` | ✓ | Designing a page or component: style, palette, fonts, layout and UX rules searchable by product type and stack. |
| `web-design-guidelines` | ✓ | Reviewing UI code before finishing: 100+ accessibility, interaction, performance and copy rules (Vercel). |
| `ui-styling` | | Building with shadcn/ui and Tailwind: components, theming, dark mode, responsive layout. |
| `design-system` | | Defining design tokens (primitive → semantic → component) and component specs. |
| `frontend-design` | | Choosing a deliberate visual direction so a new UI does not look templated (Anthropic). |
| `shadcn` | | Adding, composing and fixing shadcn/ui components in a project with `components.json` (official). |
| `vercel-react-best-practices` | | Writing or reviewing React/Next.js code for performance: data fetching, bundles, re-renders. |
| `vercel-composition-patterns` | | Refactoring React components with too many boolean props into composable APIs. |

### Engineering workflow

| Skill | On | Use it when |
|---|---|---|
| `test-driven-development` | ✓ | Implementing a feature or bug fix: write the failing test first. |
| `systematic-debugging` | ✓ | A bug, failing test or odd behaviour: find the root cause before changing code. |
| `verification-before-completion` | ✓ | About to say "done": run the checks and read their output first. |
| `writing-plans` | | Turning a spec into a step-by-step implementation plan. |
| `requesting-code-review` | | Finishing a larger change and asking for a focused review. |
| `receiving-code-review` | | Acting on review comments: verify each one before changing code. |
| `brainstorming` | | Shaping an idea with a person before planning. Asks questions, so use it in chat, not unattended runs. |

### Testing

| Skill | On | Use it when |
|---|---|---|
| `webapp-testing` | | Driving a local web app with Playwright: check behaviour, take screenshots, read console logs. |

### Security

| Skill | On | Use it when |
|---|---|---|
| `differential-review` | | Security review of a diff or PR: blast radius, regressions, untested changes (Trail of Bits, CC BY-SA 4.0). |
| `sharp-edges` | | Reviewing APIs and configuration for footguns and insecure defaults (Trail of Bits, CC BY-SA 4.0). |

### Tools

| Skill | On | Use it when |
|---|---|---|
| `mcp-builder` | | Building an MCP server (TypeScript or Python) with well-designed tools. |
| `skill-creator` | | Writing or improving a skill, including evals of its trigger description. |

### AI SDLC (Spec Kit)

Generated by Spec Kit v1.1.3 for projects in Spec Kit mode; they need the project's `.specify/` folder.

| Skill | On | Use it when |
|---|---|---|
| `speckit-constitution` | | Setting the project's principles. |
| `speckit-specify` | | Writing a feature spec from a description. |
| `speckit-clarify` | | Asking up to five questions to close gaps in a spec. |
| `speckit-plan` | | Producing the technical plan and design artifacts. |
| `speckit-tasks` | | Breaking the plan into ordered tasks. |
| `speckit-analyze` | | Checking spec, plan and tasks agree. |
| `speckit-checklist` | | Generating a requirements checklist for a feature. |
| `speckit-implement` | | Carrying out `tasks.md`. |
| `speckit-converge` | | Adding tasks for work the code still lacks against the spec. |

### xDev Hive

| Skill | On | Use it when |
|---|---|---|
| `hive-run-etiquette` | ✓ | Every Hive run: read the brief, search memory, explore narrowly, commit small, report. |
| `vietnamese-ui-copy` | ✓ | Writing or reviewing Vietnamese interface text, errors and date/number/money formats. |

## Updating skills

- Upstream skills: bump `commit` and `fetched` of the repository in `sources.json`, then run
  `node scripts/update-skills.mjs [skill ...]`. It checks out that commit, replaces `library/<skill>/`, re-applies
  the files in `patches/`, writes `SOURCE.md`, then validates the whole repository. Review the diff like any other
  change, especially new scripts.
- Spec Kit skills: run the Specify CLI of the new version in a scratch folder and copy `.claude/skills/speckit-*` here
  (see their `SOURCE.md`).
- Own skills: edit them here.
- `node scripts/update-skills.mjs --check` validates without fetching: `name` matches the folder, front matter and
  description are valid, every library skill has `SOURCE.md` and a license file, and no file looks like a secret.
  Risky shell commands are printed as warnings.
- Only add skills under MIT, Apache-2.0 or BSD. CC BY / CC BY-SA text is acceptable when marked and attributed in
  `NOTICE.md`. Never add source-available or unlicensed skills.
- After merging, update the pinned copy in the hub (`packages/skill-pack` in xdev-hive, see its README).

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
