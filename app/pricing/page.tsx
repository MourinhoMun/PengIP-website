'use client';

import { motion } from 'framer-motion';
import { Check, Coins, MessageCircle, Zap, RefreshCw, Users, Star } from 'lucide-react';
import { Navbar, Footer } from '@/app/components';
import styles from './pricing.module.scss';

export default function PricingPage() {
  const features = [
    { icon: <Zap size={18} />, text: '全部AI工具包一年激活使用权' },
    { icon: <RefreshCw size={18} />, text: '工具持续迭代更新，始终保持最新' },
    { icon: <Star size={18} />, text: '融合鹏哥每时每刻的实战新经验' },
    { icon: <Users size={18} />, text: '专属会员交流群，获得一手资讯' },
    { icon: <Check size={18} />, text: '优先体验内测新功能' },
    { icon: <Check size={18} />, text: '专属客服支持' },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.badge}>会员权益</div>
            <h1 className={styles.heroTitle}>
              鹏哥工具箱<br />
              <span className={styles.highlight}>会员定价说明</span>
            </h1>
            <p className={styles.heroSubtitle}>
              加入年度会员，享受持续更新的 AI 效率工具，第一时间获取鹏哥最新实战经验
            </p>
          </motion.div>
        </section>

        {/* Pricing Card */}
        <section className={styles.pricingSection}>
          <div className={styles.container}>
            <motion.div
              className={styles.cardWrapper}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className={styles.card}>
                <div className={styles.cardBadge}>推荐</div>
                <div className={styles.cardHeader}>
                  <div className={styles.planName}>年度会员</div>
                  <div className={styles.priceRow}>
                    <span className={styles.currency}>¥</span>
                    <span className={styles.amount}>5,000</span>
                    <span className={styles.period}> / 年</span>
                  </div>
                  <p className={styles.priceNote}>一次付费，全年无忧</p>
                </div>

                <ul className={styles.featureList}>
                  {features.map((f, i) => (
                    <li key={i} className={styles.featureItem}>
                      <span className={styles.featureIcon}>{f.icon}</span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <a href="#join" className={styles.ctaBtn}>
                  立即联系购买
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Points System */}
        <section className={styles.pointsSection}>
          <div className={styles.container}>
            <motion.div
              className={styles.pointsBox}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.pointsIcon}>
                <Coins size={32} />
              </div>
              <h2 className={styles.sectionTitle}>积分规则</h2>
              <p className={styles.sectionSubtitle}>
                平台同时支持按量付费，通过积分灵活使用工具
              </p>
              <div className={styles.pointsGrid}>
                <div className={styles.pointCard}>
                  <div className={styles.pointValue}>10 积分</div>
                  <div className={styles.pointLabel}>= 人民币 1 元</div>
                </div>
                <div className={styles.pointCard}>
                  <div className={styles.pointValue}>100 积分</div>
                  <div className={styles.pointLabel}>注册即送</div>
                </div>
                <div className={styles.pointCard}>
                  <div className={styles.pointValue}>更多积分</div>
                  <div className={styles.pointLabel}>邀请好友可获</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How to Join */}
        <section className={styles.joinSection} id="join">
          <div className={styles.container}>
            <motion.div
              className={styles.joinBox}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className={styles.sectionTitle}>如何购买会员</h2>
              <p className={styles.sectionSubtitle}>
                添加鹏哥微信，备注「年费会员」即可咨询开通
              </p>
              <div className={styles.contactCard}>
                <div className={styles.contactIcon}>
                  <MessageCircle size={28} />
                </div>
                <div className={styles.contactInfo}>
                  <div className={styles.contactLabel}>微信号</div>
                  <div className={styles.contactValue}>peng_ip</div>
                </div>
              </div>
              <p className={styles.joinNote}>
                * 会员到期前会提醒续费，续费价格与首次相同
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
