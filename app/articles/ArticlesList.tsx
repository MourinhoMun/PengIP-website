'use client';

import { useState } from 'react';
import { BookOpen, Tag, ArrowRight, Search, X } from 'lucide-react';
import styles from './articles.module.scss';

interface Article {
  title: string;
  excerpt: string;
  tags: string[];
  slug: string;
  publishedAt: string;
  lang?: string;
}

export default function ArticlesList({ articles }: { articles: Article[] }) {
  const [search, setSearch] = useState('');

  const filtered = articles.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.title?.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q) || a.tags?.some(t => t.toLowerCase().includes(q));
  });

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a href="/" className={styles.navBrand}>Peng<span>IP</span></a>
        <a href="/" className={styles.navBack}>← Back to Home</a>
      </nav>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.badge}>
            <BookOpen size={14} />
            <span>Articles</span>
          </div>
          <h1 className={styles.title}>Doctor IP & AI <span className={styles.highlight}>Insights</span></h1>
          <p className={styles.subtitle}>Practical guides on personal branding, content strategy, and AI tools for doctors.</p>

          <div className={styles.searchWrapper}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className={styles.searchInput}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <p className={styles.count}>{filtered.length} articles</p>

        <div className={styles.grid}>
          {filtered.map((article, i) => (
            <a key={article.slug} href={`/articles/${article.slug}`} className={styles.card} style={{ animationDelay: `${i * 0.04}s` }}>
              <div className={styles.tags}>
                {article.tags?.slice(0, 3).map(tag => (
                  <span key={tag} className={styles.tag}>
                    <Tag size={10} />{tag}
                  </span>
                ))}
              </div>
              <h2 className={styles.cardTitle}>{article.title}</h2>
              <p className={styles.cardExcerpt}>{article.excerpt}</p>
              <div className={styles.cardFooter}>
                <span className={styles.date}>
                  {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <span className={styles.readMore}>Read more <ArrowRight size={13} /></span>
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>No articles found for "{search}"</div>
        )}
      </div>
    </div>
  );
}
