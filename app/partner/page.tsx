'use client';

import { motion } from 'framer-motion';
import { Navbar, Footer } from '@/app/components';
import { Check, Users, Zap, TrendingUp, Gift, MessageCircle, Star, ChevronRight } from 'lucide-react';
import styles from './partner.module.scss';

const tools = [
  { icon: '🔬', name: 'HealVision 100天康复历程', desc: '术后恢复可视化，术前患者沟通神器' },
  { icon: '🎭', name: 'PreVSim 术前模拟助手', desc: 'AI生成术前术后对比图，提升成交率' },
  { icon: '⭐', name: 'My StarFace 明星脸', desc: '素人与明星融合，激发求美欲望' },
  { icon: '🎬', name: 'MicroMotion 肖像动态化', desc: '静态照片变动态视频，朋友圈爆款素材' },
  { icon: '📝', name: '小红书图文生成器', desc: '8种版式一键生成专业科普笔记' },
];

const tiers = [
  {
    name: '推广大使',
    condition: '累计推广 1-4 人',
    commission: '20%',
    extra: '',
    color: '#3b82f6',
    perks: ['专属推广链接', '实时推广数据', '会员群资格'],
  },
  {
    name: '城市合伙人',
    condition: '累计推广 5-19 人',
    commission: '30%',
    extra: '+ 季度奖励',
    color: '#8b5cf6',
    highlight: true,
    perks: ['专属推广链接', '实时推广数据', '会员群资格', '季度现金奖励', '优先新工具内测'],
  },
  {
    name: '战略合伙人',
    condition: '累计推广 20 人以上',
    commission: '40%',
    extra: '+ 年度分红',
    color: '#ec4899',
    perks: ['专属推广链接', '实时推广数据', '会员群资格', '季度现金奖励', '优先新工具内测', '年度分红权益', '联合品牌推广'],
  },
];

const trainingPackages = [
  {
    name: '工具入门包',
    price: '免费',
    desc: '随年卡赠送',
    items: ['5大工具使用教程', '医疗内容创作指南', '小红书运营基础课'],
    color: '#10b981',
  },
  {
    name: '医生IP孵化课',
    price: '¥2,980',
    desc: '独立付费课程',
    items: ['从0到1打造医生个人IP', '小红书算法与选题策略', '内容矩阵搭建方法论', '变现路径设计', '1对1选题诊断（1次）'],
    color: '#3b82f6',
    highlight: true,
  },
  {
    name: '诊所增长私教',
    price: '¥9,800',
    desc: '3个月陪跑',
    items: ['定制化内容策略', '每周内容审核反馈', '全工具不限量使用', '私域流量搭建指导', '月度数据复盘', '直接对接 Adrian'],
    color: '#8b5cf6',
  },
];

export default function PartnerPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>

        {/* Hero */}
        <section className={styles.hero}>
          <motion.div className={styles.heroContent} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className={styles.badge}><Star size={13} /> 合伙人计划</div>
            <h1 className={styles.heroTitle}>
              和鹏哥一起<br />
              <span className={styles.highlight}>帮医生用好 AI</span>
            </h1>
            <p className={styles.heroSubtitle}>
              中国有 400 万执业医生，90% 还没开始做内容。<br />
              你推广一个工具，就是帮一个医生打开新世界。
            </p>
            <div className={styles.heroStats}>
              <div className={styles.stat}><span className={styles.statNum}>5万+</span><span className={styles.statLabel}>小红书粉丝</span></div>
              <div className={styles.statDivider} />
              <div className={styles.stat}><span className={styles.statNum}>5款</span><span className={styles.statLabel}>专属AI工具</span></div>
              <div className={styles.statDivider} />
              <div className={styles.stat}><span className={styles.statNum}>¥5,000</span><span className={styles.statLabel}>年卡单价</span></div>
            </div>
            <a href="#join" className={styles.heroBtn}>申请成为合伙人 <ChevronRight size={16} /></a>
          </motion.div>
        </section>

        {/* 工具矩阵 */}
        <section className={styles.section}>
          <div className={styles.container}>
            <motion.div className={styles.sectionHeader} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2>你在推广什么</h2>
              <p>不是卖软件，是帮医生解决真实问题</p>
            </motion.div>
            <div className={styles.toolsGrid}>
              {tools.map((t, i) => (
                <motion.div key={i} className={styles.toolCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <span className={styles.toolIcon}>{t.icon}</span>
                  <div className={styles.toolName}>{t.name}</div>
                  <div className={styles.toolDesc}>{t.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 分销佣金 */}
        <section className={styles.sectionAlt}>
          <div className={styles.container}>
            <motion.div className={styles.sectionHeader} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2>分销佣金结构</h2>
              <p>年卡 ¥5,000，推广越多，比例越高</p>
            </motion.div>
            <div className={styles.tiersGrid}>
              {tiers.map((tier, i) => (
                <motion.div key={i} className={`${styles.tierCard} ${tier.highlight ? styles.tierHighlight : ''}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  {tier.highlight && <div className={styles.tierBadge}>最受欢迎</div>}
                  <div className={styles.tierName}>{tier.name}</div>
                  <div className={styles.tierCondition}>{tier.condition}</div>
                  <div className={styles.tierCommission} style={{ color: tier.color }}>
                    {tier.commission}
                    {tier.extra && <span className={styles.tierExtra}>{tier.extra}</span>}
                  </div>
                  <div className={styles.tierEarning}>
                    每单最高 <strong style={{ color: tier.color }}>¥{(5000 * parseInt(tier.commission) / 100).toLocaleString()}</strong>
                  </div>
                  <ul className={styles.tierPerks}>
                    {tier.perks.map((p, j) => (
                      <li key={j}><Check size={13} />{p}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <div className={styles.commissionNote}>
              <Zap size={14} /> 佣金 T+7 结算，微信直接转账，无门槛提现
            </div>
          </div>
        </section>

        {/* 培训产品 */}
        <section className={styles.section}>
          <div className={styles.container}>
            <motion.div className={styles.sectionHeader} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2>培训产品矩阵</h2>
              <p>工具是入口，培训才是真正的价值</p>
            </motion.div>
            <div className={styles.trainingGrid}>
              {trainingPackages.map((pkg, i) => (
                <motion.div key={i} className={`${styles.trainingCard} ${pkg.highlight ? styles.trainingHighlight : ''}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  {pkg.highlight && <div className={styles.trainingBadge}>核心产品</div>}
                  <div className={styles.trainingName}>{pkg.name}</div>
                  <div className={styles.trainingPrice} style={{ color: pkg.color }}>{pkg.price}</div>
                  <div className={styles.trainingDesc}>{pkg.desc}</div>
                  <ul className={styles.trainingItems}>
                    {pkg.items.map((item, j) => (
                      <li key={j}><Check size={13} />{item}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <div className={styles.trainingNote}>
              <TrendingUp size={14} /> 培训产品同样享受分销佣金，比例与年卡相同
            </div>
          </div>
        </section>

        {/* 为什么值得推 */}
        <section className={styles.sectionAlt}>
          <div className={styles.container}>
            <motion.div className={styles.sectionHeader} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2>为什么值得推</h2>
            </motion.div>
            <div className={styles.reasonsGrid}>
              {[
                { icon: '🎯', title: '精准受众', desc: '医生群体消费力强，决策理性，复购率高，一个客户可以带来多个转介绍' },
                { icon: '🔄', title: '年卡续费', desc: '工具持续更新，用户续费意愿强，你的老客户每年都能带来被动收入' },
                { icon: '📈', title: '赛道红利', desc: '医疗 IP 赛道刚刚起步，先入场的人享受最大红利，现在是最好的时机' },
                { icon: '🤝', title: '背书强', desc: '5万+小红书粉丝、真实医生用户案例，推广有信任背书，成交更容易' },
                { icon: '🛠️', title: '产品真实', desc: '工具解决真实痛点，不是噱头。用过的医生都会主动推荐给同行' },
                { icon: '💬', title: '全程支持', desc: '提供推广话术、案例素材、朋友圈文案，不需要你从零想内容' },
              ].map((r, i) => (
                <motion.div key={i} className={styles.reasonCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <span className={styles.reasonIcon}>{r.icon}</span>
                  <div className={styles.reasonTitle}>{r.title}</div>
                  <div className={styles.reasonDesc}>{r.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 适合谁 */}
        <section className={styles.section}>
          <div className={styles.container}>
            <motion.div className={styles.sectionHeader} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2>适合哪些人</h2>
            </motion.div>
            <div className={styles.whoGrid}>
              {[
                { icon: '👨‍⚕️', label: '医生本人', desc: '自用 + 推荐同行，边用边赚' },
                { icon: '🏥', label: '诊所运营', desc: '帮诊所引入工具，顺手推广' },
                { icon: '📱', label: '医疗自媒体', desc: '粉丝精准，推广转化率高' },
                { icon: '🎓', label: 'AI培训讲师', desc: '补充医疗垂直场景工具' },
                { icon: '💼', label: '医疗器械销售', desc: '增加客户粘性的附加价值' },
                { icon: '🌟', label: '医美从业者', desc: '咨询师、护士、技师均可' },
              ].map((w, i) => (
                <motion.div key={i} className={styles.whoCard} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <span className={styles.whoIcon}>{w.icon}</span>
                  <div className={styles.whoLabel}>{w.label}</div>
                  <div className={styles.whoDesc}>{w.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 城市合伙人 */}
        <section className={styles.sectionAlt}>
          <div className={styles.container}>
            <motion.div className={styles.sectionHeader} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className={styles.cityBadge}>🏙️ 城市独家</div>
              <h2>城市合伙人计划</h2>
              <p>一个城市只招一个合伙人，先到先得</p>
            </motion.div>

            <div className={styles.cityPerksGrid}>
              {[
                {
                  num: '01',
                  icon: '🌐',
                  title: '免费复刻 AI 工具网站',
                  desc: '合伙人期间，鹏哥团队为你复刻一套完整的 AI 工具社区网站，打上你的品牌，服务你的客户群体。工具持续更新，你的社区始终保持最新。',
                  tag: '收益五五分成',
                },
                {
                  num: '02',
                  icon: '🎤',
                  title: '邀请鹏哥到你的城市做培训',
                  desc: '你负责召集学员、场地协调，鹏哥负责内容交付。10人成团即可开班，培训收益与成本均五五分成，价格体系与鹏哥官方保持一致。',
                  tag: '10人成团 · 收益五五分',
                },
                {
                  num: '03',
                  icon: '💰',
                  title: '客户使用工具的持续收益',
                  desc: '你的客户每次使用工具产生的积分消耗，均与鹏哥五五分成。客户越活跃，你的被动收入越高，真正实现躺赚。',
                  tag: '持续被动收入',
                },
                {
                  num: '04',
                  icon: '🔒',
                  title: '城市独家保护',
                  desc: '每个城市只设一名合伙人，享有该城市的独家推广权益。鹏哥不会在同城再发展第二个合伙人，保护你的市场。',
                  tag: '独家区域保护',
                },
              ].map((perk, i) => (
                <motion.div key={i} className={styles.cityPerkCard} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className={styles.cityPerkNum}>{perk.num}</div>
                  <div className={styles.cityPerkIcon}>{perk.icon}</div>
                  <div className={styles.cityPerkTitle}>{perk.title}</div>
                  <div className={styles.cityPerkDesc}>{perk.desc}</div>
                  <div className={styles.cityPerkTag}>{perk.tag}</div>
                </motion.div>
              ))}
            </div>

            <motion.div className={styles.cityNote} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className={styles.cityNoteInner}>
                <span>🤝</span>
                <div>
                  <strong>合伙人门槛与细节，需要和鹏哥一对一深聊</strong>
                  <p>城市合伙人是深度合作关系，不是简单的代理。加微信备注「城市合伙人」，鹏哥会认真评估每一位申请者。</p>
                </div>
                <a href="#join" className={styles.cityNoteBtn}>立即申请</a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaSection} id="join">
          <div className={styles.container}>
            <motion.div className={styles.ctaBox} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Gift size={36} className={styles.ctaIcon} />
              <h2>现在申请，立享早鸟权益</h2>
              <p>前 50 名合伙人额外获得：专属定制推广物料 + 1次免费 IP 诊断</p>
              <div className={styles.ctaSteps}>
                <div className={styles.ctaStep}><span>1</span>添加微信 peng_ip</div>
                <ChevronRight size={16} className={styles.ctaArrow} />
                <div className={styles.ctaStep}><span>2</span>备注「合伙人申请」</div>
                <ChevronRight size={16} className={styles.ctaArrow} />
                <div className={styles.ctaStep}><span>3</span>获取专属推广链接</div>
              </div>
              <div className={styles.ctaContact}>
                <MessageCircle size={20} />
                <span>微信：<strong>peng_ip</strong></span>
              </div>
              <div className={styles.ctaNote}>
                <Users size={13} /> 合伙人名额有限，先到先得
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
