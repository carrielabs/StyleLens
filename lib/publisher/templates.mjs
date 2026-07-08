import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

const TEMPLATE_DIRS = {
  "website-01-fui": "templates/_incoming/website-01-fui",
  "website-02-soft-surrealism": "templates/_incoming/website-02-soft-surrealism",
  "website-03-red-clay": "templates/_incoming/website-03-red-clay",
  "website-04-premium-midnight": "templates/_incoming/website-04-premium-midnight",
  "website-05-voltflow-cyber-saas": "templates/_incoming/website-05-voltflow-cyber-saas",
  "website-07-blueprint-agent-platform": "templates/_incoming/website-07-blueprint-agent-platform",
  "website-08-editorial-apple-tech": "templates/_incoming/website-08-editorial-apple-tech",
  "website-09-blue-shift-portfolio": "templates/_incoming/website-09-blue-shift-portfolio",
  fi: "templates/_incoming/website-01-fui",
  fui: "templates/_incoming/website-01-fui",
  "soft-surrealism": "templates/_incoming/website-02-soft-surrealism",
  "red-clay": "templates/_incoming/website-03-red-clay",
  "premium-midnight": "templates/_incoming/website-04-premium-midnight",
  "voltflow-cyber-saas": "templates/_incoming/website-05-voltflow-cyber-saas",
  "cyber-saas": "templates/_incoming/website-05-voltflow-cyber-saas",
  "blueprint-agent-platform": "templates/_incoming/website-07-blueprint-agent-platform",
  "blueprint-agent": "templates/_incoming/website-07-blueprint-agent-platform",
  "editorial-apple-tech": "templates/_incoming/website-08-editorial-apple-tech",
  "apple-tech": "templates/_incoming/website-08-editorial-apple-tech",
  "blue-shift-portfolio": "templates/_incoming/website-09-blue-shift-portfolio",
  "blue-shift": "templates/_incoming/website-09-blue-shift-portfolio"
};

export async function loadTemplate(templateName) {
  const relativeDir = TEMPLATE_DIRS[templateName];
  if (!relativeDir) {
    throw new Error(`找不到模板：${templateName}`);
  }

  const dir = path.join(ROOT, relativeDir);
  const [html, configText] = await Promise.all([
    readFile(path.join(dir, "template.html"), "utf8"),
    readFile(path.join(dir, "template.json"), "utf8")
  ]);

  return {
    name: templateName,
    dir,
    html,
    config: JSON.parse(configText),
    kind: relativeDir.split("/").pop().split("-")[0]
  };
}
