import { Metadata } from 'next';
import styles from './workshop.module.scss';

export const metadata: Metadata = {
  title: 'AI共创变现营（青少年）— 鹏哥',
  description: '一个月，带着孩子做出第一个可上线的AI产品/项目，并探索真实变现路径。3-6人小班，线下实战，导师全程陪伴。¥16,800/人/月。',
};

export default function AIWorkshopPage() {
  return (
    <main className={styles.page}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>青少年 AI 共创启蒙 · 可落地</div>
          <h1 className={styles.heroTitle}>AI 共创变现营</h1>
          <p className={styles.heroSubtitle}>一个月，带着孩子做出第一个可上线的 AI 产品/项目，并探索变现</p>
          <p className={styles.heroSub2}>小班制 · 3-6人 · 线下实战 · 导师全程陪伴</p>
        </div>
      </section>

      <div className={styles.container}>

        {/* 为什么选择 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🌟 为什么选择AI共创变现营？</h2>
          <div className={styles.highlightBox}>
            <div className={styles.highlightTitle}>不是"学AI"，而是"用AI解决问题并变现"</div>
            <p>我们不是教孩子当程序员，而是带着孩子做项目：从真实问题出发，用AI把想法做成可上线的产品/项目，并探索第一条变现路径。做出来一次，信心与能力就会持续增长。</p>
          </div>
          <div className={styles.cardGrid}>
            <div className={`${styles.card} ${styles.blue}`}>
              <h4>🎯 项目驱动，不是填鸭教学</h4>
              <ul>
                <li>每个孩子选择自己感兴趣的方向</li>
                <li>用AI工具把想法变成真实产品</li>
                <li>从0到1完成一个完整项目</li>
              </ul>
            </div>
            <div className={`${styles.card} ${styles.green}`}>
              <h4>🤝 小班陪伴，不是大班授课</h4>
              <ul>
                <li>3-6人小班，导师全程1对1指导</li>
                <li>尊重每个孩子的节奏和兴趣</li>
                <li>安全、包容、零压力的学习环境</li>
              </ul>
            </div>
            <div className={`${styles.card} ${styles.purple}`}>
              <h4>💡 激发内驱力，不是外部施压</h4>
              <ul>
                <li>让孩子体验"我能做到"的成就感</li>
                <li>从被动接受到主动探索</li>
                <li>找到属于自己的方向和热情</li>
              </ul>
            </div>
            <div className={`${styles.card} ${styles.amber}`}>
              <h4>🚀 面向未来的真实技能</h4>
              <ul>
                <li>AI时代最核心的能力：提问+创造</li>
                <li>项目管理、内容创作、商业思维</li>
                <li>可写入简历的真实项目经历</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 课程安排 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📅 一个月课程安排</h2>
          <div className={styles.weekList}>
            {[
              {
                cls: 'w1', goalCls: 'c1',
                title: '第1周 · 发现自己 + AI入门',
                items: [
                  '破冰活动：认识彼此，发现每个人的兴趣和特长',
                  'AI工具初体验：对话AI、AI绘画、AI写作',
                  '学会"提问的艺术"：如何让AI成为你的超级助手',
                  '选定自己的微创业方向（兴趣驱动，导师引导）',
                ],
                goal: '🎯 本周成果：确定项目方向，完成项目计划书',
              },
              {
                cls: 'w2', goalCls: 'c2',
                title: '第2周 · 动手搭建',
                items: [
                  '用AI搭建自己的网站/小程序/内容平台',
                  '学习设计思维：让作品好看又好用',
                  '品牌意识：给自己的项目起名字、做Logo',
                  '迭代优化：根据反馈不断改进',
                ],
                goal: '🎯 本周成果：项目原型上线，可以展示给别人看',
              },
              {
                cls: 'w3', goalCls: 'c3',
                title: '第3周 · 内容创作 + 推广',
                items: [
                  '用AI批量创作内容：文章、视频脚本、图片',
                  '学习推广技巧：小红书、B站、知乎实操',
                  'SEO基础：让更多人找到你的项目',
                  '数据分析：看懂数据，优化内容方向',
                ],
                goal: '🎯 本周成果：项目获得第一批真实用户/读者',
              },
              {
                cls: 'w4', goalCls: 'c4',
                title: '第4周 · 变现探索 + 毕业路演',
                items: [
                  '商业思维启蒙：如何让项目产生价值',
                  'AI自动化：让项目自己运转',
                  '制作毕业作品集和项目展示PPT',
                  '毕业路演：向家长和导师展示一个月的成果',
                ],
                goal: '🎯 本周成果：完整的创业项目 + 毕业路演',
              },
            ].map((week) => (
              <div key={week.cls} className={styles.weekBlock}>
                <div className={`${styles.weekHeader} ${styles[week.cls]}`}>{week.title}</div>
                <div className={styles.weekBody}>
                  <ul>{week.items.map(item => <li key={item}>{item}</li>)}</ul>
                  <div className={`${styles.weekGoal} ${styles[week.goalCls]}`}>{week.goal}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 孩子收获 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎁 一个月后，孩子将收获</h2>
          <div className={styles.cardGrid}>
            <div className={`${styles.card} ${styles.green}`}>
              <h4>📦 一个真实的项目作品</h4>
              <ul>
                <li>自己亲手搭建的网站或产品</li>
                <li>有真实用户访问和反馈</li>
                <li>可以写入简历和申请材料</li>
              </ul>
            </div>
            <div className={`${styles.card} ${styles.blue}`}>
              <h4>🧠 AI时代的核心能力</h4>
              <ul>
                <li>熟练使用AI工具解决实际问题</li>
                <li>学会"提问"——AI时代最重要的技能</li>
                <li>项目管理和独立解决问题的能力</li>
              </ul>
            </div>
            <div className={`${styles.card} ${styles.purple}`}>
              <h4>💪 自信心和内驱力</h4>
              <ul>
                <li>"我能做到"的真实体验</li>
                <li>从消费者变成创造者的身份转变</li>
                <li>找到自己感兴趣的方向</li>
              </ul>
            </div>
            <div className={`${styles.card} ${styles.amber}`}>
              <h4>🤝 志同道合的伙伴</h4>
              <ul>
                <li>结识同龄的创业小伙伴</li>
                <li>加入校友社群，持续交流成长</li>
                <li>导师长期关注，后续可持续指导</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 家长FAQ */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>💬 家长最关心的问题</h2>
          <div className={styles.cardGrid}>
            {[
              { q: 'Q: 孩子没有编程基础能学吗？', items: ['完全可以。我们用的是AI辅助工具，不需要写代码', '孩子只需要有想法，AI帮他实现', '导师全程陪伴，遇到困难随时帮助'] },
              { q: 'Q: 一个月真的能做出东西吗？', items: ['AI让创造的门槛大幅降低', '以前需要一个团队做几个月的事，现在一个人一周就能完成', '往期学员都在一个月内完成了自己的项目'] },
              { q: 'Q: 每天需要多长时间？', items: ['每天约4-6小时集中学习和实操', '节奏灵活，尊重孩子的状态', '不是填鸭式教学，而是项目驱动的探索'] },
              { q: 'Q: 家长能了解孩子的进展吗？', items: ['每周有家长汇报环节', '导师定期反馈孩子的状态和成长', '最后一天毕业路演，家长受邀观摩'] },
            ].map((item) => (
              <div key={item.q} className={`${styles.card} ${styles.plain}`}>
                <h4>{item.q}</h4>
                <ul>{item.items.map(s => <li key={s}>{s}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        {/* 导师 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>👨‍🏫 导师介绍</h2>
          <div className={styles.mentorCard}>
            <div className={styles.mentorAvatar}>🧑‍💻</div>
            <div>
              <div className={styles.mentorName}>Adrian Wu（鹏哥）</div>
              <div className={styles.mentorTitle}>创业导师 · AI产品与变现实战</div>
              <ul className={styles.mentorList}>
                <li>厦门大学医学院本科</li>
                <li>10+年医疗与科技行业深耕</li>
                <li>AI医疗创业联合创始人，获数千万融资</li>
                <li>海外医疗项目合伙人（4年跨国创业经验）</li>
                <li>AI工具产品化专家：从0到1做产品、做增长、做交付</li>
                <li>具备AI变现实战经验：带项目从“做出来”到“有人愿意付费”</li>
              </ul>
            </div>
          </div>
          <div className={styles.quoteBox}>
            <div className={styles.quoteTitle}>💬 教育理念</div>
            <p>"每个孩子都有创造力，只是缺少一个被看见的机会。AI降低了创造的门槛，让孩子的想法可以快速变成现实。我们要做的不是教知识，而是点燃那团火。"</p>
          </div>
        </section>

        {/* 报名须知 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📋 报名须知</h2>
          <div className={styles.infoGrid}>
            <div className={`${styles.card} ${styles.blue}`}>
              <h4>📍 基本信息</h4>
              <ul>
                <li>适合年龄：12-18岁青少年</li>
                <li>班级规模：3-6人小班</li>
                <li>课程周期：1个月（4周）</li>
                <li>上课形式：线下集中授课+实操</li>
              </ul>
            </div>
            <div className={`${styles.card} ${styles.amber}`}>
              <h4>💻 学员需自备</h4>
              <ul>
                <li>笔记本电脑一台（Windows/Mac均可）</li>
                <li>好奇心和探索欲</li>
                <li>无需任何编程或技术基础</li>
              </ul>
            </div>
          </div>
        </section>

      </div>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>给孩子一个月，收获一个全新的自己</h2>
            <p className={styles.ctaSubtitle}>用AI点燃创造力，用项目证明自己</p>
            <div className={styles.priceBox}>
              <span className={styles.priceNum}>¥16,800</span>
              <span className={styles.priceUnit}> /人/月</span>
            </div>
            <p style={{color: '#94a3b8', fontSize: '0.875rem'}}>3人成团 · 6人封顶 · 名额有限</p>
            <br />
            <a href="https://pengip.com#contact" className={styles.ctaBtn}>立即咨询报名 →</a>
            <p className={styles.ctaNote}>添加微信咨询详情，备注"AI共创变现营"：peng_ip</p>
          </div>
        </div>
      </section>

    </main>
  );
}
