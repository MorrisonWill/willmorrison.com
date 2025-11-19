import { Layout } from "./Layout";

type PostProps = {
	frontmatter: {
		title: string;
		date?: string;
		tags?: string[];
		[key: string]: any;
	};
	content: string;
};

export function Post({ frontmatter, content }: PostProps) {
	return (
		<Layout title={frontmatter.title}>
			<article className="post">
				<header className="post-header">
					<h1>{frontmatter.title}</h1>
					{frontmatter.date && (
						<time dateTime={frontmatter.date}>{frontmatter.date}</time>
					)}
					{frontmatter.tags && frontmatter.tags.length > 0 && (
						<div className="tags">
							{frontmatter.tags.map((tag) => (
								<span className="tag">{tag}</span>
							))}
						</div>
					)}
				</header>

				<div
					className="post-content"
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			</article>
		</Layout>
	);
}
