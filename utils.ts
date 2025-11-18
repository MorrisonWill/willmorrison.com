import { YAML } from "bun";

// All markdown files can contain YAML frontmatter
// The values get turned into a JS object and passed into the template
export function parseFrontmatter(markdown: string): {
	frontmatter: any;
	content: string;
} {
	const match = markdown.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)/);

	if (!match || !match[1]) {
		return { frontmatter: {}, content: markdown };
	}

	return {
		frontmatter: YAML.parse(match[1]),
		content: match[2] || "",
	};
}

export function htmlResponse(content: string) {
	return new Response(content, {
		headers: { "Content-Type": "text/html" },
	});
}
