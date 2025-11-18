import { Glob } from "bun";
import hljs from "highlight.js";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import nunjucks from "nunjucks";
import { htmlResponse, parseFrontmatter } from "./utils";

marked.use(
	markedHighlight({
		langPrefix: "hljs language-",
		highlight(code: string, lang: string) {
			const language = hljs.getLanguage(lang) ? lang : "plaintext";
			return hljs.highlight(code, { language }).value;
		},
	}),
);

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
		console.error("markdownContent is undefined/null:", {
			markdown,
			frontmatter,
			markdownContent,
		});
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
		const dateA = a.frontmatter.date
			? new Date(a.frontmatter.date).getTime()
			: 0;
		const dateB = b.frontmatter.date
			? new Date(b.frontmatter.date).getTime()
			: 0;
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

		"/public/*": (req) => {
			// remove the leading slash
			const pathName = new URL(req.url).pathname.substring(1);
			// Strip /assets prefix to map to public directory
			return new Response(Bun.file(pathName));
		},
	},
});

console.log(`Server running at localhost: ${server.port}`);
