'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { BookOpen, ArrowRight, Tag } from 'lucide-react';
import styles from './Articles.module.scss';

interface Article {
  title: string;
  excerpt: string;
  tags: string[];
  slug: string;
  publishedAt: string;
  lang?: string;
}

export default function Articles({ articles }: { articles: Article[] }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section className={styles.articles} id="articles">
      <div className={styles.container} ref={containerRef}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>
            <BookOpen size={14} />
            <span>专业文章</span>
          </div>
          <h2 className={styles.title}>
            医生IP <span className={styles.highlight}>干货内容</span>
          </h2>
          <p className={styles.subtitle}>
            帮助医生打造个人品牌、提升内容影响力的实战指南
          </p>
        </motion.div>

        <div className={styles.grid}>
          {articles.map((article, index) => (
            <motion.a
              key={article.slug}
              href={`/articles/${article.slug}`}
              className={styles.card}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div className={styles.cardInner}>
                <div className={styles.tags}>
                  {article.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className={styles.tag}>
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className={styles.cardTitle}>{article.title}</h3>
                <p className={styles.cardExcerpt}>{article.excerpt}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.date}>
                    {new Date(article.publishedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className={styles.readMore}>
                    阅读全文 <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div
          className={styles.footer}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <a href="/articles" className={styles.viewAll}>
            查看全部文章 <ArrowRight size={15} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
