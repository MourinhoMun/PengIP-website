'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import styles from './tutorial.module.scss';

interface Tool {
  id: string;
  name: string;
  nameEn: string | null;
  description: string;
  icon: string | null;
  tutorialUrl: string | null;
  tutorialContent: string | null;
}

export default function TutorialPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/tutorials/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setTool(data.tool))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className={styles.loadingPage}>
      <div className={styles.spinner} />
    </div>
  );

  if (notFound || !tool) return (
    <div className={styles.notFound}>
      <h2>教程不存在</h2>
      <Link href="/dashboard">返回工具列表</Link>
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeft size={18} /> 返回工具列表
        </Link>
      </header>

      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.heroIcon}>{tool.icon || '🔧'}</div>
          <div>
            <h1 className={styles.heroTitle}>{tool.name}</h1>
            <p className={styles.heroDesc}>{tool.description}</p>
          </div>
        </div>

        {tool.tutorialContent ? (
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: tool.tutorialContent }}
          />
        ) : (
          <div className={styles.noContent}>
            <BookOpen size={32} />
            <p>文字教程即将上线，敬请期待</p>
            <p className={styles.noContentSub}>如有疑问请联系鹏哥微信：<strong>Peng_IP</strong></p>
          </div>
        )}

        <div className={styles.footer}>
          <Link href="/dashboard" className={styles.backLink}>
            <ArrowLeft size={16} /> 返回工具列表
          </Link>
        </div>
      </div>
    </div>
  );
}
