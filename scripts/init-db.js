// 初始化数据库脚本 - 创建表结构并插入管理员用户
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'dev.db');
console.log('Database path:', dbPath);

// 打开数据库（如果不存在会自动创建）
const db = new Database(dbPath);

// 启用 WAL 模式提高性能
db.pragma('journal_mode = WAL');

console.log('Creating tables...');

// 创建 User 表
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );
`);

db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`);
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");`);
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "User_inviteCode_key" ON "User"("inviteCode");`);
db.exec(`CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");`);
db.exec(`CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");`);
db.exec(`CREATE INDEX IF NOT EXISTS "User_inviteCode_idx" ON "User"("inviteCode");`);

// 创建 Tool 表
db.exec(`
  CREATE TABLE IF NOT EXISTS "Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "icon" TEXT,
    "points" INTEGER NOT NULL DEFAULT 5,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS "Tool_status_idx" ON "Tool"("status");`);

// 创建 ToolUsage 表
db.exec(`
  CREATE TABLE IF NOT EXISTS "ToolUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ToolUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ToolUsage_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS "ToolUsage_userId_idx" ON "ToolUsage"("userId");`);
db.exec(`CREATE INDEX IF NOT EXISTS "ToolUsage_toolId_idx" ON "ToolUsage"("toolId");`);

// 创建 PointTransaction 表
db.exec(`
  CREATE TABLE IF NOT EXISTS "PointTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "relatedId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS "PointTransaction_userId_idx" ON "PointTransaction"("userId");`);
db.exec(`CREATE INDEX IF NOT EXISTS "PointTransaction_type_idx" ON "PointTransaction"("type");`);

console.log('Tables created successfully!');

// 生成简单的 CUID 替代品
function generateId() {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// 检查是否已有管理员
const adminExists = db.prepare('SELECT COUNT(*) as count FROM "User" WHERE "role" = ?').get('admin');
if (adminExists.count === 0) {
  console.log('Creating admin user...');
  const hashedPassword = bcrypt.hashSync('admin123', 12);
  const adminId = generateId();
  const inviteCode = generateId();
  
  db.prepare(`
    INSERT INTO "User" ("id", "email", "phone", "password", "name", "points", "role", "inviteCode", "createdAt", "updatedAt")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(adminId, 'admin@pengip.com', '13800000000', hashedPassword, '管理员', 9999, 'admin', inviteCode);
  
  console.log('Admin user created:');
  console.log('  Email: admin@pengip.com');
  console.log('  Phone: 13800000000');
  console.log('  Password: admin123');
} else {
  console.log('Admin user already exists, skipping.');
}

// 检查是否已有工具
const toolCount = db.prepare('SELECT COUNT(*) as count FROM "Tool"').get();
if (toolCount.count === 0) {
  console.log('Creating sample tools...');
  const tools = [
    { name: '医美AI咨询助手', nameEn: 'Medical AI Consultant', description: '基于AI的医美方案智能推荐', descriptionEn: 'AI-powered medical aesthetics consultation', icon: '🤖', points: 5 },
    { name: '术后恢复指导', nameEn: 'Post-Op Recovery Guide', description: '个性化术后恢复方案生成', descriptionEn: 'Personalized post-op recovery plan', icon: '💊', points: 3 },
    { name: '医美项目对比', nameEn: 'Treatment Comparison', description: 'AI智能对比不同医美项目', descriptionEn: 'Compare different aesthetic treatments', icon: '📊', points: 5 },
    { name: '价格评估工具', nameEn: 'Price Evaluator', description: '基于大数据的医美价格合理性评估', descriptionEn: 'Data-driven price evaluation', icon: '💰', points: 3 },
    { name: 'AI面部分析', nameEn: 'AI Face Analysis', description: '上传照片获取AI面部美学分析', descriptionEn: 'Upload photos for AI facial analysis', icon: '👤', points: 10 },
  ];
  
  const insertTool = db.prepare(`
    INSERT INTO "Tool" ("id", "name", "nameEn", "description", "descriptionEn", "icon", "points", "status", "sortOrder", "createdAt", "updatedAt")
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'), datetime('now'))
  `);

  tools.forEach((tool, index) => {
    insertTool.run(generateId(), tool.name, tool.nameEn, tool.description, tool.descriptionEn, tool.icon, tool.points, index);
  });
  
  console.log(`${tools.length} tools created.`);
} else {
  console.log(`${toolCount.count} tools already exist, skipping.`);
}

// 验证数据
const userCount = db.prepare('SELECT COUNT(*) as count FROM "User"').get();
const finalToolCount = db.prepare('SELECT COUNT(*) as count FROM "Tool"').get();
console.log('\n=== Database Summary ===');
console.log(`Users: ${userCount.count}`);
console.log(`Tools: ${finalToolCount.count}`);
console.log('Database initialized successfully!');

db.close();
