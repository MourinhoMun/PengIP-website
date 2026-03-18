import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './brief.module.scss';
import { ENTREPRENEUR_AI_BRIEF_TEXT } from '../training-entrepreneur-ai/brief';

export const metadata: Metadata = {
  title: '企业家AI共创营（简约版）｜鹏哥',
  description: '企业家AI共创营简约版（500-600字），带着问题来，带着产品走。',
};

export default function EntrepreneurAITrainingBriefPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>简约版 · 500-600字</div>
          <h1 className={styles.title}>企业家AI共创营</h1>
          <p className={styles.subtitle}>给老板/合伙人快速扫一眼的版本（适合转发）。</p>
          <div className={styles.actions}>
            <Link className={styles.primaryBtn} href="/training-entrepreneur-ai">查看详细版 →</Link>
            <Link className={styles.secondaryBtn} href="/training">返回培训列表</Link>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.ribbon}>带着问题来 · 带着产品走</div>
            <div className={styles.content}>
              <pre className={styles.briefPre}>{ENTREPRENEUR_AI_BRIEF_TEXT}</pre>

              <div className={styles.quickGrid}>
                <div className={styles.quickItem}>
                  <div className={styles.quickK}>适合谁</div>
                  <div className={styles.quickV}>企业老板/业务负责人/合伙人，想把一个场景做成可用工具。</div>
                </div>
                <div className={styles.quickItem}>
                  <div className={styles.quickK}>交付物</div>
                  <div className={styles.quickV}>至少1个可跑原型或可复用流程 + SOP/模板 + 迭代清单。</div>
                </div>
                <div className={styles.quickItem}>
                  <div className={styles.quickK}>周期</div>
                  <div className={styles.quickV}>2天（冲刺交付）或 3天（打地基+交付）。</div>
                </div>
              </div>

              <div className={styles.footerActions}>
                <Link className={styles.footerLink} href="/training-entrepreneur-ai">去详细版（含结构、方法论、验收）</Link>
                <a className={styles.footerLink} href="https://pengip.com#contact">立即咨询（微信：peng_ip）</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
