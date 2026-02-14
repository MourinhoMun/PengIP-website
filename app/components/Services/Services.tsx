'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Zap, Bot, ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '@/app/i18n';
import styles from './Services.module.scss';

const icons = [Users, Zap, Bot];
const colors = ['#3b82f6', '#8b5cf6', '#10b981'];
const gradients = [
  'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
  'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
];

export default function Services() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const { t } = useLanguage();

  return (
    <section className={styles.services} id="services">
      <div className={styles.container} ref={containerRef}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>
            {t.services.title}<span className={styles.highlight}>{t.services.titleHighlight}</span>
          </h2>
          <p className={styles.subtitle}>
            {t.services.subtitle}
          </p>
        </motion.div>

        <div className={styles.grid}>
          {t.services.items.map((service, index) => {
            const Icon = icons[index];
            const color = colors[index];
            const gradient = gradients[index];

            return (
              <motion.div
                key={service.title}
                className={styles.card}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                {/* 图标 */}
                <div
                  className={styles.iconWrapper}
                  style={{ background: gradient }}
                >
                  <Icon size={28} color="white" />
                </div>

                {/* 内容 */}
                <h3 className={styles.cardTitle}>{service.title}</h3>
                <p className={styles.cardDescription}>{service.description}</p>

                {/* 特性列表 */}
                <ul className={styles.features}>
                  {service.features.map((feature) => (
                    <li key={feature} className={styles.featureItem}>
                      <Check size={16} style={{ color }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* 了解更多 */}
                <a
                  href="#contact"
                  className={styles.learnMore}
                  style={{ color }}
                >
                  {t.services.learnMore}
                  <ArrowRight size={16} />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
