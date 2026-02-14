'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Presentation, Video, BarChart3, Plus, Sparkles, Lock } from 'lucide-react';
import { useLanguage } from '@/app/i18n';
import styles from './Tools.module.scss';

const icons = [FileText, Presentation, Video, BarChart3, Plus];
const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#71717a'];

export default function Tools({ tools: dbTools }: { tools?: any[] }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const { t, lang } = useLanguage();

  const displayTools = dbTools?.length ? dbTools.map((tool) => ({
    title: lang === 'en' ? (tool.nameEn || tool.name) : tool.name,
    description: lang === 'en' ? (tool.descriptionEn || tool.description) : tool.description,
    points: tool.points,
    icon: tool.icon,
    isComing: tool.status === 'coming',
  })) : t.tools.items;

  return (
    <section className={styles.tools} id="tools">
      <div className={styles.container} ref={containerRef}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>
            <Sparkles size={14} />
            <span>{t.tools.badge}</span>
          </div>
          <h2 className={styles.title}>
            {t.tools.title}<span className={styles.highlight}>{t.tools.titleHighlight}</span>
          </h2>
          <p className={styles.subtitle}>
            {t.tools.subtitle}
          </p>
        </motion.div>

        <div className={styles.grid}>
          {displayTools.map((tool: any, index: number) => {
            const Icon = icons[index % icons.length];
            const color = colors[index % colors.length];
            const isComing = tool.isComing || (tool.points === 0 && !dbTools); // Handle both DB and static logic

            return (
              <motion.div
                key={tool.title + index}
                className={`${styles.card} ${isComing ? styles.coming : ''}`}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* 积分标签 */}
                {!isComing && (
                  <div className={styles.pointsBadge}>
                    <span>{tool.points} {t.tools.points}</span>
                  </div>
                )}

                {isComing && (
                  <div className={styles.comingBadge}>
                    <span>{t.tools.comingSoon}</span>
                  </div>
                )}

                {/* 图标 */}
                <div
                  className={styles.iconWrapper}
                  style={{
                    background: isComing
                      ? 'rgba(113, 113, 122, 0.1)'
                      : `${color}15`,
                    borderColor: isComing ? 'transparent' : `${color}30`,
                  }}
                >
                  {tool.icon ? (
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>{tool.icon}</span>
                  ) : (
                    <Icon
                      size={28}
                      style={{ color: isComing ? '#71717a' : color }}
                    />
                  )}
                </div>

                {/* 内容 */}
                <h3 className={styles.cardTitle}>{tool.title}</h3>
                <p className={styles.cardDescription}>{tool.description}</p>

                {/* 按钮 */}
                {!isComing ? (
                  <button className={styles.useBtn} style={{ background: color }}>
                    <Lock size={14} />
                    {t.tools.loginToUse}
                  </button>
                ) : (
                  <button className={styles.comingBtn} disabled>
                    {t.tools.stayTuned}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* 底部提示 */}
        <motion.div
          className={styles.footer}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p>
            💡 {t.tools.footer} <strong>{t.tools.footerPoints}</strong>{t.tools.footerExtra}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
