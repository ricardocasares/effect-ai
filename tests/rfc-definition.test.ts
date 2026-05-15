import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const RFC_DIR = "rfc";
const RFC_FILE_PATTERN = /^\d{4}-[a-z0-9-]+\.md$/;

const hasRequiredRfcSections = (content: string): boolean => {
  const hasValidFrontmatter = /^---\nstatus: (wip|done)\n---\n/m.test(content);
  const hasTitle = /^# .+/m.test(content);
  const hasDescriptionAfterTitle = /^# .+\n\n.+/m.test(content);
  const hasDecisionsSection = /^## Decisions$/m.test(content);
  const hasChecksSection = /^## Checks$/m.test(content);

  return (
    hasValidFrontmatter &&
    hasTitle &&
    hasDescriptionAfterTitle &&
    hasDecisionsSection &&
    hasChecksSection
  );
};

test("rfc folder exists", () => {
  expect(existsSync(RFC_DIR)).toBe(true);
});

test("rfc filenames follow the 0000-short-slug.md format", async () => {
  const files = await readdir(RFC_DIR);
  const invalid = files.filter((file) => !RFC_FILE_PATTERN.test(file));

  expect(invalid).toEqual([]);
});

test("rfc/0000-rfcs.md exists", () => {
  expect(existsSync(join(RFC_DIR, "0000-rfcs.md"))).toBe(true);
});

test("all rfc files contain mandatory sections", async () => {
  const files = (await readdir(RFC_DIR)).filter((file) => file.endsWith(".md"));
  const invalidFiles: string[] = [];

  for (const file of files) {
    const content = await readFile(join(RFC_DIR, file), "utf8");
    if (!hasRequiredRfcSections(content)) {
      invalidFiles.push(file);
    }
  }

  expect(invalidFiles).toEqual([]);
});
