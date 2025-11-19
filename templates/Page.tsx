import { Layout } from "./Layout";

type PageProps = {
	frontmatter: {
		title?: string;
		[key: string]: any;
	};
	content: string;
};

export function Page({ frontmatter, content }: PageProps) {
	const title = frontmatter.title || "Will Morrison";
	return (
		<Layout title={title}>
			<div className="page-content" dangerouslySetInnerHTML={{ __html: content }} />
		</Layout>
	);
}
