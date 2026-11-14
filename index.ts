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
const siteURL = "https://www.willmorrison.com";

async function loadStyles() {
	const [styleCSS, highlightCSS] = await Promise.all([
		Bun.file("./public/css/style.css").text(),
		Bun.file("./public/css/highlight.css").text(),
	]);
	return { styleCSS, highlightCSS };
}

const productionStyles = isProduction ? await loadStyles() : undefined;

async function styles() {
	return productionStyles ?? await loadStyles();
}

nunjucks.configure("templates", {
	noCache: !isProduction,
});

async function content(
	type: "posts" | "pages",
	slug: string,
	template: string,
	path: string,
) {
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
			canonical: siteURL + path,
			...await styles(),
		}),
	);
}

async function post(slug: string): Promise<Response> {
	return content("posts", slug, "post.html", `/blog/${slug}`);
}

async function page(slug: string, path: string): Promise<Response> {
	return content("pages", slug, "page.html", path);
}

async function listPosts() {
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

	return posts;
}

async function blogList(): Promise<Response> {
	const posts = await listPosts();

	return htmlResponse(
		nunjucks.render("blog.html", {
			posts,
			canonical: `${siteURL}/blog`,
			frontmatter: {
				description: "Blog posts by Will Morrison - Full-stack web developer",
			},
			...await styles(),
		}),
	);
}

async function japanese(): Promise<Response> {
	return page("japanese", "/japanese");
}

async function sitemap(): Promise<Response> {
	const paths = ["/", "/japanese", "/blog"];
	for (const post of await listPosts()) {
		paths.push(`/blog/${post.slug}`);
	}

	const urls = paths
		.map((path) => `  <url><loc>${siteURL}${path}</loc></url>`)
		.join("\n");

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
		{ headers: { "Content-Type": "application/xml" } },
	);
}

function robots(): Response {
	return new Response(`User-agent: *
Allow: /

Sitemap: ${siteURL}/sitemap.xml
`);
}

const server = Bun.serve({
	routes: {
		"/": async () => {
			return await page("index", "/");
		},

		"/blog": async () => {
			return await blogList();
		},

		"/japanese": async () => {
			return await japanese();
		},

		"/robots.txt": () => {
			return robots();
		},

		"/sitemap.xml": async () => {
			return await sitemap();
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

		"/.well_known/atproto-did": (_) => {
			return new Response("did:plc:2ii2drwgooqm4u7n47kkeyof");
		}
	},
});

console.log(`Server running at localhost: ${server.port}`);
