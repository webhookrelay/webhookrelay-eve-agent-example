import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";

// Tools run in the app runtime with full process.env and filesystem access —
// this is where webhook events turn into side effects. Swap the file write for
// a Slack message, a database insert, a shell command, whatever your agent
// should actually do.
export default defineTool({
  description:
    "Save a triage report for a webhook event as a markdown file. " +
    "Returns the path of the saved report.",
  inputSchema: z.object({
    slug: z
      .string()
      .regex(/^[a-z0-9-]{1,60}$/)
      .describe("Short kebab-case name for the report file"),
    markdown: z.string().min(1).describe("Full markdown body of the report"),
  }),
  async execute({ slug, markdown }) {
    const dir = process.env.REPORTS_DIR ?? "reports";
    await mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(dir, `${stamp}-${slug}.md`);
    await writeFile(file, markdown, "utf8");
    return { saved: file };
  },
});
