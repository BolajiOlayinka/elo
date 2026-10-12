import { Link, useParams } from 'react-router-dom';
import { getPost } from '../data/posts.js';
import { markdownToHtml } from '../lib/markdown.js';

function previewBody(post) {
  const title = `# ${post.title || ''}`.trim();
  const body = String(post.body || '');

  if (title.length > 1 && body.startsWith(title)) {
    return body.slice(title.length).replace(/^\n+/, '');
  }

  return body;
}

export default function BlogPreview() {
  const { id } = useParams();
  const post = getPost(id);

  if (!post) {
    return (
      <section>
        <h1>Post not found</h1>
        <p className="muted">This demo post is not in local storage.</p>
        <Link className="btn ghost" to="/blog">Back to posts</Link>
      </section>
    );
  }

  return (
    <article className="blog-preview">
      <p className="back">
        <Link to="/blog">Posts</Link> / Preview
      </p>
      <div className="page-head">
        <div>
          <p className="blog-preview-kicker">
            <span className={post.status === 'published' ? 'tag ok' : 'tag'}>{post.status}</span>
            {(post.categories || []).map((category) => (
              <span key={category} className="tag">{category}</span>
            ))}
          </p>
        </div>
        <div className="page-head-actions">
          <Link className="btn ghost" to={`/blog/${post.id}/edit`}>Edit</Link>
        </div>
      </div>

      {post.headingImage ? (
        <img className="blog-preview-hero" src={post.headingImage} alt="" />
      ) : null}

      <h1>{post.title || 'Untitled'}</h1>
      {post.excerpt ? <p className="blog-preview-excerpt">{post.excerpt}</p> : null}
      <p className="blog-preview-byline">
        {post.author}
        {post.publishedAt ? ` · ${post.publishedAt}` : ` · Updated ${post.updatedAt}`}
      </p>
      {(post.tags || []).length ? (
        <p className="blog-preview-kicker">
          {(post.tags || []).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </p>
      ) : null}

      <div
        className="blog-preview-body"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(previewBody(post)) }}
      />
    </article>
  );
}
