import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import ArticlesList from './ArticlesList';

export const metadata: Metadata = {
  title: 'Articles | PengIP',
  description: 'Doctor personal branding, AI tools, and medical content strategy articles.',
};

function loadAllArticles() {
  try {
    const dir = path.join(process.cwd(), 'articles-data');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const articles = files.map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
      return JSON.parse(raw);
    });
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return articles;
  } catch {
    return [];
  }
}

export default function ArticlesPage() {
  const articles = loadAllArticles();
  return <ArticlesList articles={articles} />;
}
