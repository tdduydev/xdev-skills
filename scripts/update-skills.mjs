#!/usr/bin/env node
// Refresh library/ from the upstream commits pinned in sources.json, then validate every skill in the repo.
//
//   node scripts/update-skills.mjs                 # refresh all upstream skills, then check
//   node scripts/update-skills.mjs ui-ux-pro-max   # refresh some skills only
//   node scripts/update-skills.mjs --check         # validate only, change nothing
//
// Clones go to $XDEV_SKILLS_CACHE (default: <tmp>/xdev-skills-src/<owner>_<repo>). Needs git and Node 20+.
// Generated (Spec Kit) and own skills are never touched; see README "Updating skills".
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sources = JSON.parse(readFileSync(join(root, "sources.json"), "utf8"));
const cacheRoot = process.env.XDEV_SKILLS_CACHE ?? join(tmpdir(), "xdev-skills-src");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const only = new Set(args.filter((a) => !a.startsWith("--")));

const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** Clone (or reuse) the repo and check out exactly the pinned commit. */
function checkout(repo) {
  const { commit } = sources.repos[repo];
  const dir = join(cacheRoot, repo.replace("/", "_"));
  if (!existsSync(join(dir, ".git"))) {
    mkdirSync(dir, { recursive: true });
    git(dir, "init", "-q");
    git(dir, "remote", "add", "origin", `https://github.com/${repo}`);
  }
  if (git(dir, "rev-parse", "HEAD").slice(0, 40) !== commit || git(dir, "status", "--porcelain")) {
    git(dir, "fetch", "-q", "--depth", "1", "origin", commit);
    git(dir, "checkout", "-q", "--force", commit);
    git(dir, "clean", "-qfdx");
  }
  return dir;
}

function excluded(rel, patterns = []) {
  const parts = rel.split("/");
  return patterns.some((p) => {
    if (p.includes("*")) {
      const re = new RegExp(`^${p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
      return re.test(basename(rel));
    }
    return parts.includes(p) || rel === p || rel.startsWith(`${p}/`);
  });
}

function copyTree(from, to, patterns) {
  cpSync(from, to, {
    recursive: true,
    filter: (src) => !excluded(relative(from, src).split("\\").join("/"), patterns) || src === from,
  });
}

function sourceMd(s, repoInfo, extras) {
  const url = `https://github.com/${s.repo}/tree/${repoInfo.commit}/${s.path}`;
  const lines = [
    `# Source of \`${s.name}\``,
    "",
    "| | |",
    "|---|---|",
    `| Repository | https://github.com/${s.repo} |`,
    `| Path | \`${s.path}\` |`,
    `| Commit | \`${repoInfo.commit}\` |`,
    `| License | ${s.license} |`,
    `| Fetched | ${repoInfo.fetched} |`,
    `| Upstream | ${url} |`,
  ];
  for (const e of extras) {
    lines.push(`| Extra file | \`${e.to}\` from https://github.com/${e.repo} \`${e.path}\` @ \`${sources.repos[e.repo].commit}\` |`);
  }
  if (repoInfo.licenseNote) lines.push("", repoInfo.licenseNote);
  if (s.note) lines.push("", s.note);
  if (s.patch) lines.push("", `Local change: \`${s.patch}\` is applied on top of the upstream files.`);
  lines.push("", "Update with `node scripts/update-skills.mjs " + s.name + "` after bumping the commit in sources.json.", "");
  return lines.join("\n");
}

function refresh(s) {
  const repoInfo = sources.repos[s.repo];
  const src = checkout(s.repo);
  const dest = join(root, "library", s.name);
  rmSync(dest, { recursive: true, force: true });
  copyTree(join(src, s.path), dest, s.exclude);
  for (const f of repoInfo.licenseFiles ?? []) {
    // Keep the skill's own license file if upstream already put one in the folder.
    const target = join(dest, existsSync(join(dest, "LICENSE.txt")) ? `LICENSE-${basename(s.repo)}${f.includes(".") ? f.slice(f.indexOf(".")) : ""}` : f);
    cpSync(join(src, f), target);
  }
  // Upstream without a license file in the repo: we keep our own copy of the terms it declares (see licenses/).
  if (repoInfo.licenseCopy) cpSync(join(root, repoInfo.licenseCopy), join(dest, "LICENSE"));
  const extras = s.extra ?? [];
  for (const e of extras) {
    const extraSrc = checkout(e.repo);
    cpSync(join(extraSrc, e.path), join(dest, e.to));
    for (const f of sources.repos[e.repo].licenseFiles ?? []) cpSync(join(extraSrc, f), join(dest, `LICENSE-${basename(e.repo)}`));
  }
  if (s.patch) execFileSync("git", ["apply", "--directory", `library/${s.name}`, s.patch], { cwd: root, stdio: "inherit" });
  writeFileSync(join(dest, "SOURCE.md"), sourceMd(s, repoInfo, extras));
  console.log(`updated library/${s.name} @ ${repoInfo.commit.slice(0, 12)}`);
}

// --- checks ------------------------------------------------------------------------------------------------------

const SECRET = [/sk-ant-[A-Za-z0-9_-]{20,}/, /\bghp_[A-Za-z0-9]{30,}/, /\bAKIA[0-9A-Z]{16}\b/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
const DANGER = [/rm\s+-rf\s+(\/|~|\$HOME)(\s|$)/, /curl[^|\n]*\|\s*(sudo\s+)?(ba)?sh\b/, /git\s+push\s+--force\b[^\n]*\b(main|master)\b/];

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const out = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (kv) {
      key = kv[1];
      out[key] = kv[2].replace(/^["']|["']$/g, "");
    } else if (key && /^\s+\S/.test(line) && out[key] === "") out[key] = line.trim();
    else if (key && /^\s+\S/.test(line) && typeof out[key] === "string" && key === "description") out[key] += ` ${line.trim()}`;
  }
  return out;
}

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function skillDirs() {
  const dirs = [];
  const add = (base) => {
    if (!existsSync(base)) return;
    for (const n of readdirSync(base)) if (statSync(join(base, n)).isDirectory()) dirs.push(join(base, n));
  };
  add(join(root, "library"));
  add(join(root, "org"));
  for (const scope of ["teams", "projects"]) {
    const base = join(root, scope);
    if (existsSync(base)) for (const n of readdirSync(base)) if (statSync(join(base, n)).isDirectory()) add(join(base, n));
  }
  return dirs;
}

function check() {
  const errors = [];
  const warnings = [];
  const listed = new Set(sources.skills.map((s) => s.name));
  for (const dir of skillDirs()) {
    const name = basename(dir);
    const rel = relative(root, dir);
    const skillFile = join(dir, "SKILL.md");
    if (!existsSync(skillFile)) {
      errors.push(`${rel}: no SKILL.md`);
      continue;
    }
    const fm = frontmatter(readFileSync(skillFile, "utf8"));
    if (!fm) errors.push(`${rel}/SKILL.md: no YAML front matter`);
    else {
      if (fm.name !== name) errors.push(`${rel}/SKILL.md: name "${fm.name}" does not match folder "${name}"`);
      if (!fm.description) errors.push(`${rel}/SKILL.md: empty description`);
      else if (fm.description.length > 1024) errors.push(`${rel}/SKILL.md: description longer than 1024 characters`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) errors.push(`${rel}: invalid skill name`);
    if (rel.startsWith("library")) {
      if (!listed.has(name)) errors.push(`${rel}: not listed in sources.json`);
      if (!existsSync(join(dir, "SOURCE.md"))) errors.push(`${rel}: no SOURCE.md`);
      if (!readdirSync(dir).some((f) => /^LICEN[CS]E/i.test(f))) errors.push(`${rel}: no license file`);
    }
    for (const f of walk(dir)) {
      const buf = readFileSync(f);
      if (buf.includes(0)) continue;
      const text = buf.toString("utf8");
      for (const re of SECRET) if (re.test(text)) errors.push(`${relative(root, f)}: looks like a secret (${re})`);
      for (const re of DANGER) if (re.test(text)) warnings.push(`${relative(root, f)}: risky command (${re})`);
    }
  }
  for (const s of sources.skills) if (!existsSync(join(root, "library", s.name))) errors.push(`library/${s.name}: listed in sources.json but missing`);
  for (const w of warnings) console.warn(`warning: ${w}`);
  for (const e of errors) console.error(`error: ${e}`);
  if (errors.length) process.exit(1);
  console.log(`ok: ${skillDirs().length} skills checked`);
}

if (!checkOnly) {
  for (const s of sources.skills) {
    if (s.generated || s.own || (only.size && !only.has(s.name))) continue;
    refresh(s);
  }
}
check();
