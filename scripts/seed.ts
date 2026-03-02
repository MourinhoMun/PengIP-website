import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// 数据库文件路径
const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
console.log('📁 数据库路径:', dbPath);
console.log('📁 文件存在:', fs.existsSync(dbPath));

// 使用文件 URL 格式
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 开始初始化数据...');

  // 创建管理员账户
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  // 先检查管理员是否存在
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@pengip.com' },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@pengip.com',
        password: adminPassword,
        name: '管理员',
        role: 'admin',
        points: 9999,
      },
    });
    console.log('✅ 管理员账户已创建:', admin.email);
  } else {
    console.log('ℹ️ 管理员账户已存在:', admin.email);
  }

  // 创建示例工具
  const toolsData = [
    {
      name: '医生公众号AI长文自动生成',
      nameEn: 'AI Article Generator',
      description: '输入主题，AI自动生成专业医学科普文章',
      descriptionEn: 'Generate professional medical articles automatically',
      points: 5,
      status: 'active',
      sortOrder: 1,
    },
    {
      name: '医生幻灯片AI自动生成',
      nameEn: 'AI Slide Generator',
      description: '快速生成专业演讲PPT，省时高效',
      descriptionEn: 'Create professional presentation slides quickly',
      points: 10,
      status: 'active',
      sortOrder: 2,
    },
    {
      name: '医生诊疗视频自动剪辑',
      nameEn: 'AI Video Editor',
      description: 'AI智能剪辑，一键生成短视频',
      descriptionEn: 'Smart video editing, one-click short videos',
      points: 20,
      status: 'active',
      sortOrder: 3,
    },
    {
      name: '对比图对照研究',
      nameEn: 'Comparison Chart Tool',
      description: '自动生成专业对比图，助力学术研究',
      descriptionEn: 'Generate professional comparison charts for research',
      points: 8,
      status: 'active',
      sortOrder: 4,
    },
    {
      name: '更多工具',
      nameEn: 'More Tools',
      description: '更多AI工具正在开发中，敬请期待',
      descriptionEn: 'More AI tools coming soon, stay tuned',
      points: 0,
      status: 'coming',
      sortOrder: 99,
    },
  ];

  // 检查工具是否存在
  const existingTools = await prisma.tool.count();
  if (existingTools === 0) {
    for (const tool of toolsData) {
      await prisma.tool.create({ data: tool });
    }
    console.log('✅ 示例工具已创建:', toolsData.length, '个');
  } else {
    console.log('ℹ️ 工具已存在，跳过创建');
  }

  console.log('\n🎉 数据初始化完成！');
  console.log('\n📝 管理员登录信息:');
  console.log('   邮箱: admin@pengip.com');
  console.log('   密码: admin123');
  console.log('\n🔗 访问后台: http://localhost:3000/admin');

  // 初始化 FAQ
  const existingFAQs = await prisma.fAQ.count();
  if (existingFAQs === 0) {
    const faqData = [
      { question: '如何注册？', answer: '直接点击右上角"注册"按钮，填写邮箱和密码即可，注册后自动获得100积分。', category: 'general', sortOrder: 1 },
      { question: '积分怎么用？', answer: '每个AI工具使用时消耗积分，不同工具消耗不同，图片生成类通常10积分/次。', category: 'points', sortOrder: 2 },
      { question: '终身会员多少钱？', answer: '¥5000一次性付费，永久激活所有工具使用权，同时获得1000积分。', category: 'member', sortOrder: 3 },
      { question: '如何购买会员？', answer: '加微信 peng_ip 联系鹏哥购买。', category: 'member', sortOrder: 4 },
      { question: '工具用不了怎么办？', answer: '请检查积分是否充足，如有其他问题请加微信 peng_ip 反馈。', category: 'tools', sortOrder: 5 },
      { question: '支持哪些AI工具？', answer: '目前有：医生海报科普图文生成器、术前模拟助手、AI患者康复历程、我的明星脸、AI肖像动态化，持续更新中。', category: 'tools', sortOrder: 6 },
    ];
    for (const faq of faqData) {
      await prisma.fAQ.create({ data: faq });
    }
    console.log('✅ FAQ 初始数据已创建:', faqData.length, '条');
  } else {
    console.log('ℹ️ FAQ 已存在，跳过创建');
  }
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
