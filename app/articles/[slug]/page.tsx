import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface ArticleData {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  lang: string;
  city: string;
  hospital: string;
  slug: string;
  publishedAt: string;
  url: string;
}

async function getArticle(slug: string): Promise<ArticleData | null> {
  const filePath = path.join(process.cwd(), 'articles-data', `${slug}.json`);
  if (!existsSync(filePath)) return null;
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as ArticleData;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: '文章未找到 | 鹏哥' };
  return {
    title: `${article.title} | 鹏哥`,
    description: article.excerpt,
    keywords: article.tags,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      url: article.url,
    },
    alternates: { canonical: article.url },
  };
}

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const { title, content, excerpt, tags, lang, city, hospital, publishedAt } = article;

  const cityHospital = [city, hospital].filter(Boolean).join(' · ');
  const dateFormatted = new Date(publishedAt).toLocaleDateString(
    lang === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="article-page">
      <nav className="art-nav">
        <a href="/" className="art-nav-brand">鹏<span>哥</span></a>
        <a href="/" className="art-nav-back">← 返回首页</a>
      </nav>

      <main className="art-container">
        <article>
          <header className="art-header">
            <div className="art-meta">
              <span>{dateFormatted}</span>
              {cityHospital && <span className="art-location">{cityHospital}</span>}
            </div>
            <h1>{title}</h1>
            {excerpt && <p className="art-excerpt">{excerpt}</p>}
            {tags.length > 0 && (
              <div className="art-tags">
                {tags.map(t => <span key={t} className="art-tag">{t}</span>)}
              </div>
            )}
          </header>

          <hr className="art-divider" />

          <div
            className="art-body"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>

        <footer className="art-footer">
          <a href="/" className="art-back-link">← 返回鹏哥首页</a>
        </footer>
      </main>

      <style>{`
        .article-page { min-height: 100vh; background: #f8fafc; }

        .art-nav {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .art-nav-brand { font-size: 18px; font-weight: 700; color: #1e293b; text-decoration: none; }
        .art-nav-brand span { color: #2563eb; }
        .art-nav-back { font-size: 14px; color: #64748b; text-decoration: none; }
        .art-nav-back:hover { color: #2563eb; }

        .art-container {
          max-width: 780px;
          margin: 48px auto;
          padding: 0 24px;
        }

        .art-header { margin-bottom: 32px; }
        .art-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 14px;
          color: #64748b;
          margin-bottom: 16px;
        }
        .art-location {
          background: #eff6ff;
          color: #2563eb;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 13px;
        }
        h1 {
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 800;
          line-height: 1.3;
          color: #0f172a;
          margin-bottom: 16px;
        }
        .art-excerpt {
          font-size: 16px;
          color: #475569;
          border-left: 4px solid #2563eb;
          padding: 12px 16px;
          background: #f1f5f9;
          border-radius: 0 8px 8px 0;
          margin-bottom: 8px;
        }
        .art-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 20px; }
        .art-tag {
          background: #eff6ff;
          color: #2563eb;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          border: 1px solid #bfdbfe;
        }
        .art-divider { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }

        .art-body { font-size: 16px; color: #1e293b; line-height: 1.8; }
        .art-body h2 { font-size: 22px; font-weight: 700; margin: 32px 0 12px; color: #0f172a; }
        .art-body h3 { font-size: 18px; font-weight: 600; margin: 24px 0 10px; }
        .art-body p { margin-bottom: 16px; }
        .art-body ul, .art-body ol { padding-left: 24px; margin-bottom: 16px; }
        .art-body li { margin-bottom: 6px; }
        .art-body blockquote {
          border-left: 4px solid #2563eb;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 0 8px 8px 0;
          margin: 20px 0;
          color: #475569;
        }
        .art-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
        .art-body a { color: #2563eb; }
        .art-body table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
        .art-body th, .art-body td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
        .art-body th { background: #f1f5f9; font-weight: 600; }

        .art-footer { margin-top: 56px; padding-top: 32px; border-top: 1px solid #e2e8f0; }
        .art-back-link { color: #2563eb; font-size: 14px; text-decoration: none; }
        .art-back-link:hover { text-decoration: underline; }

        @media (max-width: 640px) {
          .art-container { margin: 24px auto; padding: 0 16px; }
          h1 { font-size: 24px; }
        }
      `}</style>
    </div>
  );
}
