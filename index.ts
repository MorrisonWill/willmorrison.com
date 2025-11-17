import { marked } from "marked";
import nunjucks from "nunjucks";
import { htmlResponse, parseFrontmatter } from "./utils";
import { Glob } from "bun";

const isProduction = Bun.env.NODE_ENV === "production";

nunjucks.configure("templates", {
  noCache: !isProduction,
});

async function content(
  type: "posts" | "pages",
  slug: string,
  template: string,
) {
  // Send the pre-built HTML file in production
  if (isProduction) {
    const file = Bun.file(`./dist/content/${type}/${slug}.html`);
    return htmlResponse(await file.text());
  }

  // In development, compile the markdown on demand

  const markdown = await Bun.file(`./content/${type}/${slug}.md`).text();
  const { frontmatter, content: markdownContent } = parseFrontmatter(markdown);

  if (!markdownContent && markdownContent !== "") {
    console.error("markdownContent is undefined/null:", { markdown, frontmatter, markdownContent });
  }

  return htmlResponse(
    nunjucks.render(template, {
      content: marked(markdownContent || ""),
      frontmatter,
    }),
  );
}

async function post(slug: string): Promise<Response> {
  return content("posts", slug, "post.html");
}

async function page(slug: string): Promise<Response> {
  return content("pages", slug, "page.html");
}

async function blogList(): Promise<Response> {
  const glob = new Glob("content/posts/*.md");
  const posts = [];

  for await (const file of glob.scan()) {
    const markdown = await Bun.file(file).text();
    const { frontmatter } = parseFrontmatter(markdown);
    const slug = file.replace("content/posts/", "").replace(".md", "");

    posts.push({
      slug,
      frontmatter,
    });
  }

  posts.sort((a, b) => {
    const dateA = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0;
    const dateB = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0;
    return dateB - dateA;
  });

  return htmlResponse(
    nunjucks.render("blog.html", {
      posts,
    }),
  );
}

const server = Bun.serve({
  routes: {
    "/": async () => {
      return await page("index");
    },

    "/blog": async () => {
      return await blogList();
    },

    "/blog/:slug": async (req) => {
      return await post(req.params.slug);
    },

    "/assets/*": (req) => {
      const pathName = new URL(req.url).pathname;
      return new Response(Bun.file(`./public${pathName}`));
    },
  },
});

console.log(`Server running at localhost: ${server.port}`);
