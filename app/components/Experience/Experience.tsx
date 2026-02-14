'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GraduationCap, Briefcase, Rocket, Globe, Users } from 'lucide-react';
import { useLanguage } from '@/app/i18n';
import styles from './Experience.module.scss';

const icons = [GraduationCap, Briefcase, Users, Rocket, Rocket, Globe, Users];
const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

export default function Experience() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const { t } = useLanguage();

  return (
    <section className={styles.experience} id="experience">
      <div className={styles.container} ref={containerRef}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>
            {t.experience.title}<span className={styles.highlight}>{t.experience.titleHighlight}</span>
          </h2>
          <p className={styles.subtitle}>
            {t.experience.subtitle}
          </p>
        </motion.div>

        <div className={styles.timeline}>
          {/* 时间轴中心线 */}
          <div className={styles.timelineLine} />

          {t.experience.items.map((exp, index) => {
            const Icon = icons[index];
            const color = colors[index];
            const isLeft = index % 2 === 0;

            return (
              <motion.div
                key={exp.year + exp.title}
                className={`${styles.timelineItem} ${isLeft ? styles.left : styles.right}`}
                initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                {/* 时间点 */}
                <div
                  className={styles.timelineDot}
                  style={{ borderColor: color }}
                >
                  <Icon size={20} style={{ color }} />
                </div>

                {/* 卡片 */}
                <div className={styles.card}>
                  <span className={styles.year} style={{ color }}>
                    {exp.year}
                  </span>
                  <h3 className={styles.cardTitle}>{exp.title}</h3>
                  <span className={styles.cardSubtitle}>{exp.subtitle}</span>
                  <p className={styles.cardDescription}>{exp.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
