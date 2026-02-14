import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建 Prisma 客户端
function createPrismaClient() {
  // 数据库文件路径 - 使用根目录的 dev.db
  const dbPath = path.join(process.cwd(), 'dev.db');
  const dbUrl = `file:${dbPath}`;
  
  console.log('[DB] Connecting to database at:', dbPath);
  
  // Prisma 7: PrismaBetterSqlite3 是工厂类，传入 { url } 配置
  // 它内部会自动创建 better-sqlite3 实例
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
