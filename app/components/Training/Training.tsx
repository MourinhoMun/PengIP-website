'use client';

import { motion } from 'framer-motion';
import styles from './Training.module.scss';

const courses = [
  {
    tag: '线下集训',
    title: 'AI实战训练营',
    subtitle: '3天2夜，手把手教你用AI重构业务',
    price: '¥9,800',
    priceNote: '5人成团 · 20人封顶 · 小班精讲',
    color: '#6366f1',
    url: 'https://pengip.com/ai-training',
  },
  {
    tag: '青少年专项',
    title: 'AI共创变现营',
    subtitle: '带着孩子做出可上线AI产品，并探索真实变现',
    price: '¥16,800',
    priceNote: '小班教学 · 项目共创 · 可落地',
    color: '#f59e0b',
    url: 'https://pengip.com/ai-workshop',
  },
  {
    tag: '医生专属',
    title: '医生IP打造实战培训',
    subtitle: '从0到1打造医生个人品牌完整手册',
    price: '面议',
    priceNote: '定制化培训方案',
    color: '#10b981',
    url: 'https://pengip.com/training-doctor-ip',
  },
  {
    tag: '医生专属 · 三甲版',
    title: '严肃医学科普与合规运营训练营',
    subtitle: '手术 / 门诊 / 口播三场景 SOP（更严谨、更克制）',
    price: '查看',
    priceNote: '适合三甲/公立体系医生',
    color: '#0ea5e9',
    url: 'https://pengip.com/training-doctor-ip-senior',
  },
];

export default function Training() {
  return (
    <section className={styles.training}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>培训课程</div>
          <h2 className={styles.title}>
            线下实战 <span className={styles.highlight}>培训课程</span>
          </h2>
          <p className={styles.subtitle}>小班精讲，手把手带你落地</p>
        </motion.div>

        <div className={styles.grid}>
          {courses.map((course, i) => (
            <motion.a
              key={course.title}
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.card}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ '--accent': course.color } as React.CSSProperties}
            >
              <div className={styles.cardTag}>{course.tag}</div>
              <h3 className={styles.cardTitle}>{course.title}</h3>
              <p className={styles.cardSubtitle}>{course.subtitle}</p>
              <div className={styles.cardFooter}>
                <div className={styles.price}>{course.price}</div>
                <div className={styles.priceNote}>{course.priceNote}</div>
              </div>
              <div className={styles.arrow}>查看详情 →</div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
