'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { FileText, Presentation, Video, BarChart3, Plus, Sparkles, Lock, X, ArrowRight, PlayCircle } from 'lucide-react';
import { useLanguage } from '@/app/i18n';
import { useAuth } from '@/app/contexts/AuthContext';
import styles from './Tools.module.scss';

const icons = [FileText, Presentation, Video, BarChart3, Plus];
const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#71717a'];


export default function Tools({ tools: dbTools }: { tools?: any[] }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  

  const handleToolClick = async (toolUrl?: string, isExternal?: boolean) => {
    if (!user) { setShowLoginModal(true); return; }
    
    if (isExternal && toolUrl) {
      try {
        const res = await fetch('/api/v1/user/token', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const token = data.token;
          window.location.href = `${toolUrl}?token=${token}`;
        } else {
          router.push(toolUrl);
        }
      } catch {
        router.push(toolUrl);
      }
    } else {
      router.push(toolUrl || '/dashboard');
    }
  };

  const displayTools = dbTools?.length ? dbTools.map((tool) => ({
    title: lang === 'en' ? (tool.nameEn || tool.name) : tool.name,
    description: lang === 'en' ? (tool.descriptionEn || tool.description) : tool.description,
    points: tool.points,
    icon: tool.icon,
    isComing: tool.status === 'coming',
    tutorialUrl: tool.tutorialUrl || null,
    url: tool.url || null,
    isExternal: tool.isExternal || false,
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
                {/* 积分标签 + 教程链接 */}
                {!isComing && (
                  <div className={styles.topRight}>
                    {tool.tutorialUrl && (
                      <a href={tool.tutorialUrl} target="_blank" rel="noopener noreferrer" className={styles.tutorialIcon} title="查看教程" onClick={e => e.stopPropagation()}>
                        <PlayCircle size={14} />
                        <span>教程</span>
                      </a>
                    )}
                    {tool.points > 0 && (
                      <div className={styles.pointsBadge}>
                        <span>{tool.points} {t.tools.points}</span>
                      </div>
                    )}
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
                  <div className={styles.btnGroup}>
                    <button className={styles.useBtn} style={{ background: color }} onClick={() => handleToolClick(tool.url, tool.isExternal)}>
                      {user ? <ArrowRight size={14} /> : <Lock size={14} />}
                      {user ? t.tools.useTool : t.tools.loginToUse}
                    </button>
                    {tool.tutorialUrl && (
                      <a
                        href={tool.tutorialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.tutorialBtn}
                      >
                        <PlayCircle size={14} />
                        {t.tools.howToUse}
                      </a>
                    )}
                  </div>
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

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={() => setShowLoginModal(false)}>
                <X size={18} />
              </button>
              <div className={styles.modalIcon}>
                <Lock size={24} />
              </div>
              <h3 className={styles.modalTitle}>{t.tools.modalTitle}</h3>
              <p className={styles.modalDesc}>{t.tools.modalDesc}</p>
              <div className={styles.modalActions}>
                <button
                  className={styles.modalLoginBtn}
                  onClick={() => { setShowLoginModal(false); router.push('/login'); }}
                >
                  {t.tools.goLogin}
                </button>
                <button
                  className={styles.modalRegisterBtn}
                  onClick={() => { setShowLoginModal(false); router.push('/register'); }}
                >
                  {t.tools.goRegister}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
