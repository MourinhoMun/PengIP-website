import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './entrepreneur.module.scss';

export const metadata: Metadata = {
  title: '企业家AI共创营｜带着问题来，带着产品走｜鹏哥',
  description: '面向企业家的AI实战培训：围绕真实业务场景，2-3天共创一个可用的AI工具/流程，并建立长期AI实践能力。',
};

export default function EntrepreneurAITrainingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>企业家专属 · 实战共创</div>
          <h1 className={styles.title}>企业家AI共创营</h1>
          <p className={styles.subtitle}>
            带着问题来，带着产品走。你带来一个具体业务场景，我们用2天或3天把它做成可运行的原型或可复用流程，
            并交付SOP与模板，让团队能复制、能迭代。
          </p>

          <div className={styles.heroActions}>
            <a className={styles.primaryBtn} href="#contact">咨询报名</a>
            <Link className={styles.secondaryBtn} href="/training-entrepreneur-ai-brief">先看简约版（500-600字）</Link>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroCard}><div className={styles.heroVal}>2-3天</div><div className={styles.heroLabel}>短周期共创交付</div></div>
            <div className={styles.heroCard}><div className={styles.heroVal}>1个+</div><div className={styles.heroLabel}>可跑原型/可复用流程</div></div>
            <div className={styles.heroCard}><div className={styles.heroVal}>可复制</div><div className={styles.heroLabel}>SOP + 模板 + 权限设计</div></div>
            <div className={styles.heroCard}><div className={styles.heroVal}>可迭代</div><div className={styles.heroLabel}>评测方法 + 迭代清单</div></div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>典型场景（我们最常做的）</h2>
          <p className={styles.sectionSubtitle}>把“想用AI提效”落到一个可交付的场景问题，工具才能做出来。</p>
          <div className={styles.grid}>
            {[
              {
                t: '获客与内容',
                items: ['选题与内容流水线（短视频/图文/直播）', '竞品拆解与账号策略', '线索收集与分发（表单/CRM）'],
              },
              {
                t: '销售与成交',
                items: ['销售话术与异议库', '跟进提醒与总结（自动生成）', '报价/方案一键生成 + 审核点'],
              },
              {
                t: '客服与私域',
                items: ['高频问题知识库（可控口径）', '对话总结与工单自动化', '用户分层与触达策略'],
              },
              {
                t: '运营数据与报表',
                items: ['日报/周报自动生成', '核心指标看板与异常提醒', '数据口径统一与留痕'],
              },
              {
                t: '流程自动化',
                items: ['把重复流程做成SOP+自动化', '跨部门交接模板化', '权限/审批/版本管理'],
              },
              {
                t: '知识库与培训',
                items: ['公司知识库结构化', '新人训练营材料自动化', '“问答 + 证据”可追溯'],
              },
            ].map((b) => (
              <div key={b.t} className={styles.card}>
                <div className={styles.cardTitle}>{b.t}</div>
                <ul className={styles.list}>
                  {b.items.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>交付与验收（什么叫“可运行/可用”）</h2>
          <div className={styles.kpiGrid}>
            {[
              { k: '输入/输出清晰', v: '有明确输入与输出格式，并能稳定产出结果（可导出/可复用）。' },
              { k: 'SOP 可交接', v: '谁来用、怎么用、注意事项、必须人工审核点，都写清楚。' },
              { k: '可复现', v: '现场演示跑通，并交付录屏/交付包（链接/脚本/模板/流程图）。' },
              { k: '可迭代', v: '给到评测方法、失败样本记录方式与下一步迭代清单。' },
            ].map((x) => (
              <div key={x.k} className={styles.kpiItem}>
                <div className={styles.kpiKey}>{x.k}</div>
                <div className={styles.kpiVal}>{x.v}</div>
              </div>
            ))}
          </div>
          <div className={styles.noteBox}>
            我们承诺“强但有边界”：在满足基本前提（数据/权限/时间投入）的情况下，至少交付1个可跑原型或可复用流程；
            如遇客观限制无法当场上线，也会兜底交付：需求文档 + 原型/流程图 + 模板库 + 下一步迭代清单。
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>2天版 / 3天版（按需选择）</h2>
          <p className={styles.sectionSubtitle}>2天：问题明确，冲刺交付。3天：需要补底层能力、评测方法与落地路径。</p>

          <div className={styles.dual}>
            <div className={styles.dualCol}>
              <div className={styles.dualHeader}>2天版（交付冲刺）</div>
              <div className={styles.dualBody}>
                <div className={styles.day}><div className={styles.dayTitle}>Day 1 · 需求定义 + 原型</div><ul><li>需求澄清：输入/输出/约束/验收</li><li>素材准备：数据口径、权限、样本</li><li>原型搭建：先跑通，再优化</li></ul></div>
                <div className={styles.day}><div className={styles.dayTitle}>Day 2 · 验证评测 + 交付</div><ul><li>用真实数据验证，记录失败模式</li><li>SOP固化：复核点、风控、留痕</li><li>交付：原型/流程 + 录屏 + 模板 + 迭代清单</li></ul></div>
              </div>
            </div>
            <div className={styles.dualCol}>
              <div className={styles.dualHeader}>3天版（打地基 + 交付）</div>
              <div className={styles.dualBody}>
                <div className={styles.day}><div className={styles.dayTitle}>Day 1 · 能力地基</div><ul><li>提示词与工作流：可控、可复用</li><li>评测方法：质量指标、失败样本</li><li>数据与权限：合规、可追溯</li></ul></div>
                <div className={styles.day}><div className={styles.dayTitle}>Day 2 · 原型共创</div><ul><li>原型开发：工具/表单/自动化</li><li>流程化：关键节点固化</li><li>对齐团队角色与分工</li></ul></div>
                <div className={styles.day}><div className={styles.dayTitle}>Day 3 · 部署复制</div><ul><li>质量打磨：风险点与复核闸门</li><li>上线交付：文档、录屏、版本管理</li><li>复制路径：推广到团队/门店/分公司</li></ul></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta} id="contact">
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <div>
              <h2 className={styles.ctaTitle}>准备好把你的场景做成产品了吗？</h2>
              <p className={styles.ctaText}>添加微信 <strong>peng_ip</strong>，备注“企业家AI共创营”。</p>
              <div className={styles.copyBox}>
                <div className={styles.copyTitle}>咨询模板（建议复制）</div>
                <pre className={styles.copyPre}>{`备注：企业家AI共创营
行业/公司规模：___
我想解决的场景问题（越具体越好）：___
我能提供的数据/素材：___
希望做2天还是3天：___`}</pre>
              </div>
            </div>
            <div className={styles.side}>
              <div className={styles.sideTitle}>你带来场景</div>
              <div className={styles.sideText}>我们带你把它做成可运行工具，并教会你怎么继续迭代。</div>
              <Link className={styles.sideLink} href="/training-entrepreneur-ai-brief">先看简约版 →</Link>
              <Link className={styles.sideLink} href="/training">返回培训列表 →</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
