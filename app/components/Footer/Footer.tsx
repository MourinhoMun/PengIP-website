'use client';

import { motion } from 'framer-motion';
import { Mail, MessageCircle, ExternalLink, Heart } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/app/i18n';
import styles from './Footer.module.scss';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const quickLinks = [
    { label: t.nav.about, href: '#about' },
    { label: t.nav.experience, href: '#experience' },
    { label: t.nav.services, href: '#services' },
    { label: t.nav.tools, href: '#tools' },
  ];

  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.container}>
        {/* 顶部 CTA */}
        <motion.div
          className={styles.cta}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.ctaTitle}>
            {t.footer.ctaTitle}<span className={styles.highlight}>{t.footer.ctaTitleHighlight}</span>{t.footer.ctaTitleEnd}
          </h2>
          <p className={styles.ctaSubtitle}>
            {t.footer.ctaSubtitle}
          </p>
          <div className={styles.ctaButtons}>
            <a href="mailto:wuguopeng1989@gmail.com" className={styles.primaryBtn}>
              <Mail size={18} />
              {t.footer.sendEmail}
            </a>
            <a href="#" className={styles.secondaryBtn}>
              <MessageCircle size={18} />
              {t.footer.addWechat}: peng_ip
            </a>
          </div>
        </motion.div>

        {/* 分隔线 */}
        <div className={styles.divider} />

        {/* 底部信息 */}
        <div className={styles.bottom}>
          <div className={styles.bottomGrid}>
            {/* 品牌信息 */}
            <div className={styles.brand}>
              <a href="#" className={styles.logo}>
                <span className={styles.logoText}>{t.hero.name}</span>
              </a>
              <p className={styles.brandDescription}>
                {t.footer.brandDescription}
              </p>
            </div>

            {/* 快速链接 */}
            <div className={styles.links}>
              <h4 className={styles.linksTitle}>{t.footer.quickLinks}</h4>
              <nav className={styles.linksList}>
                {quickLinks.map((link) => (
                  <a key={link.href} href={link.href} className={styles.link}>
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* 联系方式 */}
            <div className={styles.contact}>
              <h4 className={styles.linksTitle}>{t.footer.contactInfo}</h4>
              <div className={styles.contactList}>
                <a href="mailto:wuguopeng1989@gmail.com" className={styles.contactItem}>
                  <Mail size={16} />
                  <div>
                    <span className={styles.contactLabel}>{t.footer.email}</span>
                    <span className={styles.contactValue}>wuguopeng1989@gmail.com</span>
                  </div>
                </a>
                <div className={styles.contactItem}>
                  <MessageCircle size={16} />
                  <div>
                    <span className={styles.contactLabel}>{t.footer.wechat}</span>
                    <span className={styles.contactValue}>peng_ip</span>
                  </div>
                </div>
                <a 
                  href="https://xhslink.com/m/K9WdUpXPVI" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.contactItem}
                >
                  <span className={styles.redNoteIcon}>📕</span>
                  <div>
                    <span className={styles.contactLabel}>{t.footer.redNote}</span>
                    <span className={styles.contactValue}>{t.footer.redNoteStats}</span>
                  </div>
                </a>
                <a 
                  href="https://xhslink.com/m/K9WdUpXPVI" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.redNoteLink}
                >
                  {t.footer.viewProfile}
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* 微信二维码 */}
            <div className={styles.qrcode}>
              <h4 className={styles.linksTitle}>{t.footer.scanWechat}</h4>
              <div className={styles.qrcodeBox}>
                <Image
                  src="/wechat-qr.png"
                  alt="WeChat QR Code"
                  width={140}
                  height={140}
                  className={styles.qrcodeImage}
                />
              </div>
              <p className={styles.qrcodeHint}>{t.footer.scanHint}</p>
            </div>
          </div>

          {/* 版权信息 */}
          <div className={styles.copyright}>
            <p>
              {t.footer.copyright.replace('{year}', currentYear.toString())}{' '}
              <a href="https://pengip.com" target="_blank" rel="noopener noreferrer">
                pengip.com
                <ExternalLink size={10} />
              </a>
            </p>
            <p className={styles.madeWith}>
              {t.footer.madeWith} <Heart size={12} className={styles.heart} /> {t.footer.inChina}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
