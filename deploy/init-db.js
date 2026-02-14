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
db.exec(`
  CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "points" INTEGER NOT NULL DEFAULT 100,
    "role" TEXT NOT NULL DEFAULT 'user',
    "inviteCode" TEXT NOT NULL,
    "invitedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
  CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
  CREATE UNIQUE INDEX IF NOT EXISTS "User_inviteCode_key" ON "User"("inviteCode");
  CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
  CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");
  CREATE INDEX IF NOT EXISTS "User_inviteCode_idx" ON "User"("inviteCode");

  CREATE TABLE IF NOT EXISTS "Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "icon" TEXT,
    "points" INTEGER NOT NULL DEFAULT 5,
    "url" TEXT,
    "downloadUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS "Tool_status_idx" ON "Tool"("status");

  CREATE TABLE IF NOT EXISTS "ToolUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS "ToolUsage_userId_idx" ON "ToolUsage"("userId");
  CREATE INDEX IF NOT EXISTS "ToolUsage_toolId_idx" ON "ToolUsage"("toolId");

  CREATE TABLE IF NOT EXISTS "PointTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "relatedId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS "PointTransaction_userId_idx" ON "PointTransaction"("userId");
  CREATE INDEX IF NOT EXISTS "PointTransaction_type_idx" ON "PointTransaction"("type");

  CREATE TABLE IF NOT EXISTS "ActivationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unused',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "ActivationCode_code_key" ON "ActivationCode"("code");
  CREATE INDEX IF NOT EXISTS "ActivationCode_code_idx" ON "ActivationCode"("code");
  CREATE INDEX IF NOT EXISTS "ActivationCode_toolId_idx" ON "ActivationCode"("toolId");
  CREATE INDEX IF NOT EXISTS "ActivationCode_userId_idx" ON "ActivationCode"("userId");
  CREATE INDEX IF NOT EXISTS "ActivationCode_status_idx" ON "ActivationCode"("status");
`);

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
  db.prepare(`
    INSERT INTO "User" (id, email, password, name, points, role, inviteCode)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(adminId, 'admin@pengip.com', hashPassword('admin123'), '管理员', 9999, 'admin', inviteCode);
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
    db.prepare(`
      INSERT INTO "Tool" (id, name, nameEn, description, descriptionEn, icon, points, status, sortOrder)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).run(genId(), t.name, t.nameEn, t.desc, t.descEn, t.icon, t.points, 0);
  }
  console.log('✅ 创建示例工具 x3');
} else {
  console.log('⏩ 工具已存在');
}

console.log('✅ 数据库初始化完成！');
db.close();
