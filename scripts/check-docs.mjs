import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const markdownFiles = [
  join(root, "README.md"),
  join(root, "CONTRIBUTING.md"),
  ...readdirSync(join(root, "docs"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(root, "docs", name)),
];
const broken = [];

for (const file of markdownFiles) {
  const markdown = readFileSync(file, "utf8");
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim().split(/\s+/)[0].replace(/^<|>$/g, "");
    if (!target || /^(?:https?:|mailto:|#)/.test(target)) continue;
    const path = decodeURIComponent(target.split("#")[0]);
    if (!path) continue;
    if (!existsSync(resolve(dirname(file), path))) {
      broken.push(`${file.slice(root.length + 1)} -> ${target}`);
    }
  }
}

if (broken.length) {
  console.error(`Broken local Markdown links:\n${broken.join("\n")}`);
  process.exit(1);
}
console.log(`Checked ${markdownFiles.length} Markdown files: all local links resolve.`);
