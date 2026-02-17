'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Bot } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/app/i18n';
import styles from './Hero.module.scss';

export default function Hero() {
  const { t, lang } = useLanguage();

  const stats = [
    { value: '10+', label: t.hero.stats.experience },
    { value: lang === 'zh' ? '百万级' : 'Million+', label: t.hero.stats.revenue },
    { value: lang === 'zh' ? '数千万' : 'Tens of M', label: t.hero.stats.tuition },
  ];

  return (
    <section className={styles.hero} id="about">
      <div className={styles.container}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 头像 */}
          <motion.div
            key="avatar"
            className={styles.avatarWrapper}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Image
              src="/avatar.png"
              alt={t.hero.name}
              width={120}
              height={120}
              className={styles.avatar}
              priority
            />
          </motion.div>

          {/* 标签 */}
          <motion.div
            key="badge"
            className={styles.badge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span>{t.hero.badge}</span>
          </motion.div>

          {/* 主标题 */}
          <motion.h1
            key="title"
            className={styles.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            {t.hero.greeting} <span className={styles.highlight}>{t.hero.name}</span>
          </motion.h1>

          <motion.h2
            key="subtitle"
            className={styles.subtitle}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {t.hero.title}
          </motion.h2>

          {/* 描述 */}
          <motion.p
            key="description"
            className={styles.description}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            {t.hero.description}
            <br />
            {t.hero.description2}
          </motion.p>

          {/* CTA 按钮 */}
          <motion.div
            key="cta"
            className={styles.ctaButtons}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <a href="#contact" className={styles.primaryBtn}>
              {t.hero.contactMe}
              <ArrowRight size={16} />
            </a>

            {/* 重点强调的按钮 - 定位到工具列表 */}
            <a href="#tools" className={styles.highlightBtn}>
              <Bot size={18} />
              {t.hero.tryAI}
            </a>

            <a href="#experience" className={styles.secondaryBtn}>
              {t.hero.myStory}
            </a>
          </motion.div>
        </motion.div>

        {/* 统计数据 */}
        <motion.div
          className={styles.stats}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className={styles.statItem}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 滚动提示 */}
      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <div className={styles.mouse}>
          <div className={styles.wheel} />
        </div>
        <span>{t.hero.scrollDown}</span>
      </motion.div>
    </section>
  );
}
