import { Layout } from "./Layout";

type PostPreview = {
	slug: string;
	frontmatter: {
		title: string;
		date?: string;
		tags?: string[];
		[key: string]: any;
	};
};

type BlogProps = {
	posts: PostPreview[];
};

export function Blog({ posts }: BlogProps) {
	return (
		<Layout title="Blog">
			<div className="blog-list">
				{posts.map((post) => (
					<article className="blog-post-preview">
						<h2>
							<a href={`/blog/${post.slug}`}>{post.frontmatter.title}</a>
						</h2>
						{post.frontmatter.date && (
							<time dateTime={post.frontmatter.date}>
								{post.frontmatter.date}
							</time>
						)}
						{post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
							<div className="tags">
								{post.frontmatter.tags.map((tag) => (
									<span className="tag">{tag}</span>
								))}
							</div>
						)}
					</article>
				))}
			</div>
		</Layout>
	);
}
