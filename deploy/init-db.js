// 服务器数据库初始化脚本
const path = require('path');
const crypto = require('crypto');
const appDir = path.resolve(__dirname, '..');
const dbPath = path.join(appDir, 'dev.db');

let Database;
try {
  Database = require(path.join(appDir, 'node_modules', 'better-sqlite3'));
} catch {
  console.error('请先运行 npm install');
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

console.log('初始化数据库...');

// 创建表
// 表结构由 Prisma 管理 (npx prisma db push)
// 此脚本仅用于播种初始数据 (Seeding)

// 创建管理员账户
function genId() {
  return crypto.randomBytes(12).toString('hex');
}

const bcrypt = require(path.join(appDir, 'node_modules', 'bcryptjs'));

function hashPassword(pwd) {
  return bcrypt.hashSync(pwd, 12);
}

const existingAdmin = db.prepare('SELECT id FROM "User" WHERE email = ?').get('admin@pengip.com');
if (!existingAdmin) {
  const adminId = genId();
  const inviteCode = genId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO "User" (id, email, password, name, points, role, inviteCode, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(adminId, 'admin@pengip.com', hashPassword('admin123'), '管理员', 9999, 'admin', inviteCode, now, now);
  console.log('✅ 创建管理员: admin@pengip.com / admin123');
} else {
  // 如果已存在，强制更新密码以修复哈希算法不匹配的问题
  db.prepare('UPDATE "User" SET password = ? WHERE email = ?').run(hashPassword('admin123'), 'admin@pengip.com');
  console.log('✅ 更新管理员密码: admin@pengip.com / admin123');
}

// 创建示例工具
const existingTools = db.prepare('SELECT COUNT(*) as count FROM "Tool"').get();
if (existingTools.count === 0) {
  const tools = [
    { name: 'AI智能问诊助手', nameEn: 'AI Diagnosis Assistant', desc: '基于大模型的智能问诊工具', descEn: 'AI-powered smart diagnosis tool', icon: '🩺', points: 10 },
    { name: 'AI医学影像分析', nameEn: 'AI Medical Imaging', desc: '自动分析医学影像报告', descEn: 'Auto-analyze medical imaging reports', icon: '🔬', points: 15 },
    { name: 'AI病历生成器', nameEn: 'AI Medical Record Generator', desc: '智能生成规范化病历', descEn: 'Smart medical record generation', icon: '📋', points: 8 },
  ];
  for (const t of tools) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO "Tool" (id, name, nameEn, description, descriptionEn, icon, points, status, sortOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `).run(genId(), t.name, t.nameEn, t.desc, t.descEn, t.icon, t.points, 0, now, now);
  }
  console.log('✅ 创建示例工具 x3');
} else {
  console.log('⏩ 工具已存在');
}

console.log('✅ 数据库初始化完成！');
db.close();
