import { marked } from "marked";
import nunjucks from "nunjucks";
import { parseFrontmatter } from "./utils";
import { mkdir, rm, cp } from "node:fs/promises";
import { Glob } from "bun";


nunjucks.configure("templates");

async function processFile(file: string, type: "pages" | "posts") {
  try {
    console.log(`Processing ${type}/${file}...`);

    const markdown = await Bun.file(file).text();
    const { frontmatter, content: markdownContent } = parseFrontmatter(markdown);
    const htmlContent = marked(markdownContent);

    const template = type === "posts" ? "post.html" : "page.html";

    const finalHtml = nunjucks.render(template, {
      content: htmlContent,
      frontmatter,
    });

    const slug = file.replace(".md", "");

    await Bun.write(`dist/${slug}.html`, finalHtml);
  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
  }
}

async function buildContentType(type: "posts" | "pages") {
  const glob = new Glob(`content/${type}/*.md`)

  for await (const file of glob.scan()) {
    await processFile(file, type);
  }
}

async function copyAssets() {
  console.log("Copying assets...");
  try {
    await cp("public", "dist/assets", { recursive: true });
  } catch (error) {
    console.error("Error copying assets:", error);
  }
}

async function build() {
  console.log("Starting build...");

  try {
    await rm("dist", { recursive: true }).catch(() => {});
    await mkdir("dist");

    await Promise.all([
      buildContentType("pages"),
      buildContentType("posts"),
      copyAssets()
    ]);

    console.log("Build complete!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
