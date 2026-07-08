import path from "node:path";

const SECTION_MATCHERS = {
  pain: ["痛点", "问题", "背景", "挑战", "为什么"],
  features: ["功能", "能力", "亮点", "特性", "解决方案", "核心"],
  flow: ["流程", "步骤", "使用", "怎么用", "链路"],
  value: ["价值", "优势", "卖点", "效果"]
};

export function buildContentFromMarkdown(raw, inputPath = "input.md") {
  const clean = raw.replace(/\r\n/g, "\n").replace(/```[\s\S]*?```/g, "");
  const lines = clean.split("\n");
  const title = findTitle(lines) || titleFromFile(inputPath);
  const paragraphs = findParagraphs(lines);
  const sections = collectSections(lines);
  const allBullets = [...sections.values()].flatMap((section) => section.items);

  const subtitle =
    paragraphs.find((item) => item !== title && item.length >= 12) ||
    allBullets[0] ||
    "";

  const painPoints = pickSectionItems(sections, SECTION_MATCHERS.pain).slice(0, 3);
  const features = (
    pickSectionItems(sections, SECTION_MATCHERS.features).length
      ? pickSectionItems(sections, SECTION_MATCHERS.features)
      : allBullets.length
        ? allBullets
        : paragraphs.slice(1)
  ).slice(0, 4);
  const flow = pickSectionItems(sections, SECTION_MATCHERS.flow).slice(0, 4);
  const values = (
    pickSectionItems(sections, SECTION_MATCHERS.value).length
      ? pickSectionItems(sections, SECTION_MATCHERS.value)
      : features
  ).slice(0, 3);

  return {
    title: shortText(title, 28),
    subtitle: shortText(subtitle, 90),
    painPoints: toTitleDesc(painPoints),
    features: toTitleDesc(features),
    flow: flow.map((item) => shortText(item, 18)),
    values: toTitleDesc(values, 70)
  };
}

function findTitle(lines) {
  const heading = lines.find((line) => /^#\s+/.test(line.trim()));
  return heading ? stripMarkdown(heading.replace(/^#\s+/, "")) : "";
}

function titleFromFile(inputPath) {
  return path.basename(inputPath, path.extname(inputPath)).replace(/[-_]+/g, " ");
}

function findParagraphs(lines) {
  return lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !/^[-*+]\s+/.test(line))
    .map(stripMarkdown);
}

function collectSections(lines) {
  const sections = new Map();
  let current = "默认";

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = trimmed.match(/^#{2,4}\s+(.+)$/);
    if (heading) {
      current = stripMarkdown(heading[1]);
      if (!sections.has(current)) sections.set(current, { items: [], paragraphs: [] });
      continue;
    }

    if (!sections.has(current)) sections.set(current, { items: [], paragraphs: [] });
    const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      sections.get(current).items.push(stripMarkdown(bullet[1]));
    } else if (trimmed && !trimmed.startsWith("#")) {
      sections.get(current).paragraphs.push(stripMarkdown(trimmed));
    }
  }

  return sections;
}

function pickSectionItems(sections, keywords) {
  const matches = [];
  for (const [heading, section] of sections.entries()) {
    if (keywords.some((keyword) => heading.includes(keyword))) {
      matches.push(...section.items, ...section.paragraphs);
    }
  }
  return matches.filter(Boolean);
}

function toTitleDesc(items, descLimit = 55) {
  return items.map((item) => {
    const [title, ...rest] = item.split(/[：:。.!！?？]/).filter(Boolean);
    const desc = rest.join("，") || item;
    return {
      title: shortText(title || item, 14),
      desc: shortText(desc, descLimit)
    };
  });
}

function stripMarkdown(text) {
  return text
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_`>]/g, "")
    .trim();
}

function shortText(text, limit) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized;
}

