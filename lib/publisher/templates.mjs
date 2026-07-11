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
  "dashboard-01-blue-business": "templates/_incoming/dashboard-01-blue-business",
  "dashboard-02-premium-dark": "templates/_incoming/dashboard-02-premium-dark",
  "dashboard-03-lean-cyber-analytics": "templates/_incoming/dashboard-03-lean-cyber-analytics",
  "dashboard-04-premium-midnight": "templates/_incoming/dashboard-04-premium-midnight",
  "dashboard-05-premium-cyber-dark": "templates/_incoming/dashboard-05-premium-cyber-dark",
  "dashboard-06-warm-paper-analytics": "templates/_incoming/dashboard-06-warm-paper-analytics",
  "dashboard-07-dark-bento-analytics": "templates/_incoming/dashboard-07-dark-bento-analytics",
  "dashboard-08-saas-executive-analytics": "templates/_incoming/dashboard-08-saas-executive-analytics",
  "dashboard-09-editorial-corporate-analytics": "templates/_incoming/dashboard-09-editorial-corporate-analytics",
  "dashboard-10-executive-logic-report": "templates/_incoming/dashboard-10-executive-logic-report",
  "dashboard-11-saas-growth-health-report": "templates/_incoming/dashboard-11-saas-growth-health-report",
  "dashboard-12-atomic-bento-strategy-report": "templates/_incoming/dashboard-12-atomic-bento-strategy-report",
  "dashboard-13-corporate-blue-analytics-report": "templates/_incoming/dashboard-13-corporate-blue-analytics-report",
  "dashboard-14-financial-blue-analytics-report": "templates/_incoming/dashboard-14-financial-blue-analytics-report",
  "dashboard-15-consulting-data-report": "templates/_incoming/dashboard-15-consulting-data-report",
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
  "blue-shift": "templates/_incoming/website-09-blue-shift-portfolio",
  "premium-dark-dashboard": "templates/_incoming/dashboard-02-premium-dark",
  "lean-cyber-analytics": "templates/_incoming/dashboard-03-lean-cyber-analytics",
  "stayinn-premium-midnight": "templates/_incoming/dashboard-04-premium-midnight",
  "premium-midnight-dashboard": "templates/_incoming/dashboard-04-premium-midnight",
  "premium-cyber-dark": "templates/_incoming/dashboard-05-premium-cyber-dark",
  "premium-cyber-dark-dashboard": "templates/_incoming/dashboard-05-premium-cyber-dark",
  "warm-paper-analytics": "templates/_incoming/dashboard-06-warm-paper-analytics",
  "warm-paper-dashboard": "templates/_incoming/dashboard-06-warm-paper-analytics",
  "dark-bento-analytics": "templates/_incoming/dashboard-07-dark-bento-analytics",
  "dark-bento-dashboard": "templates/_incoming/dashboard-07-dark-bento-analytics",
  "saas-executive-analytics": "templates/_incoming/dashboard-08-saas-executive-analytics",
  "saas-executive-dashboard": "templates/_incoming/dashboard-08-saas-executive-analytics",
  "editorial-corporate-analytics": "templates/_incoming/dashboard-09-editorial-corporate-analytics",
  "editorial-corporate-dashboard": "templates/_incoming/dashboard-09-editorial-corporate-analytics",
  "executive-logic-report": "templates/_incoming/dashboard-10-executive-logic-report",
  "executive-logic-dashboard": "templates/_incoming/dashboard-10-executive-logic-report",
  "saas-growth-health-report": "templates/_incoming/dashboard-11-saas-growth-health-report",
  "saas-health-dashboard": "templates/_incoming/dashboard-11-saas-growth-health-report",
  "atomic-bento-strategy-report": "templates/_incoming/dashboard-12-atomic-bento-strategy-report",
  "atomic-bento-dashboard": "templates/_incoming/dashboard-12-atomic-bento-strategy-report",
  "corporate-blue-analytics-report": "templates/_incoming/dashboard-13-corporate-blue-analytics-report",
  "corporate-blue-dashboard": "templates/_incoming/dashboard-13-corporate-blue-analytics-report",
  "financial-blue-analytics-report": "templates/_incoming/dashboard-14-financial-blue-analytics-report",
  "financial-blue-dashboard": "templates/_incoming/dashboard-14-financial-blue-analytics-report",
  "consulting-data-report": "templates/_incoming/dashboard-15-consulting-data-report",
  "consulting-report-dashboard": "templates/_incoming/dashboard-15-consulting-data-report"
};

export async function loadTemplate(templateName) {
  const relativeDir = TEMPLATE_DIRS[templateName];
  if (!relativeDir) {
    throw new Error(`找不到模板：${templateName}`);
  }

  const dir = path.join(ROOT, relativeDir);
  const [html, configText] = await Promise.all([
    readTemplateAsset(relativeDir, "template.html"),
    readTemplateAsset(relativeDir, "template.json")
  ]);

  return {
    name: templateName,
    dir,
    html,
    config: JSON.parse(configText),
    kind: relativeDir.split("/").pop().split("-")[0]
  };
}

async function readTemplateAsset(relativeDir, fileName) {
  const relativePath = `${relativeDir}/${fileName}`;
  if (process.env.AHP_TEMPLATE_FORCE_REMOTE === "true") {
    return fetchTemplateAsset(relativePath);
  }

  try {
    return await readFile(path.join(ROOT, relativePath), "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return fetchTemplateAsset(relativePath, error);
  }
}

async function fetchTemplateAsset(relativePath, localError) {
  const baseUrl = normalizeBaseUrl(process.env.AHP_TEMPLATE_RAW_BASE_URL || process.env.TEMPLATE_RAW_BASE_URL);
  if (!baseUrl) {
    if (localError) throw localError;
    throw new Error("缺少远程模板地址：AHP_TEMPLATE_RAW_BASE_URL");
  }
  if (typeof fetch !== "function") throw new Error("当前 Node 环境不支持 fetch，无法从 GitHub 读取模板文件");

  const url = `${baseUrl}/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
  const headers = {};
  if (process.env.AHP_TEMPLATE_GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.AHP_TEMPLATE_GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`读取远程模板失败：${response.status} ${response.statusText} ${url}`);
  }
  return response.text();
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}
