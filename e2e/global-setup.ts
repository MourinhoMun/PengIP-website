/**
 * global-setup.ts
 * 在所有 E2E 测试运行前执行：向数据库写入测试用户和激活码。
 * 每次运行都会重置测试数据，保证幂等性。
 */
import { FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export const TEST_PASSWORD = 'TestPass123!';

/** 4个测试账号，每次都重置到初始状态 */
export const TEST_USERS = {
  /** 有年卡、有积分，用于主流程测试 */
  normal:  { email: 'e2e_user@test.com',  points: 500,  sub: new Date('2027-01-01') },
  /** 有年卡、零积分，用于「积分不足」测试 */
  broke:   { email: 'e2e_broke@test.com', points: 0,    sub: new Date('2027-01-01') },
  /** 无年卡、有积分，用于激活码测试 */
  nosub:   { email: 'e2e_nosub@test.com', points: 500,  sub: null },
  /** 第二个有效用户，用于跨用户隔离测试 */
  normal2: { email: 'e2e_user2@test.com', points: 300,  sub: new Date('2027-01-01') },
};

/** 3个测试激活码，每次都重新创建 */
export const TEST_CODES = {
  annual:   'E2E-TEST-ANNU-AL01', // 年卡码（未使用）
  recharge: 'E2E-TEST-RECH-500',  // 充值码 500 积分（未使用）
  used:     'E2E-TEST-USED-001',  // 已使用的年卡码
};

export default async function globalSetup(_config: FullConfig) {
  // 加载 .env，必须在 PrismaClient 初始化前执行
  dotenv.config({ path: path.resolve(__dirname, '../.env') });

  // 如果 DATABASE_URL 仍是相对路径，转为绝对路径
  if (process.env.DATABASE_URL?.startsWith('file:./')) {
    process.env.DATABASE_URL = `file:${path.resolve(__dirname, '..', process.env.DATABASE_URL.slice(7))}`;
  }

  const prisma = new PrismaClient();
  console.log('\n🔧 Setting up E2E test data...');

  const hash = bcrypt.hashSync(TEST_PASSWORD, 10); // 10 rounds 够快，测试用

  // ── 创建/重置测试用户 ──────────────────────────────────────────────────
  for (const [key, u] of Object.entries(TEST_USERS)) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email:                u.email,
        password:             hash,
        points:               u.points,
        role:                 'user',
        inviteCode:           `E2E${key.toUpperCase().slice(0, 6)}`,
        subscriptionExpiresAt: u.sub,
      },
      update: {
        password:             hash,
        points:               u.points,
        subscriptionExpiresAt: u.sub,
      },
    });
  }

  // ── 重置测试激活码（每次删除重建，避免「已使用」状态残留）───────────────
  await prisma.activationCode.deleteMany({
    where: { code: { startsWith: 'E2E-TEST-' } },
  });

  await prisma.activationCode.create({
    data: { code: TEST_CODES.annual,   type: 'annual',   points: 0,   status: 'unused' },
  });
  await prisma.activationCode.create({
    data: { code: TEST_CODES.recharge, type: 'recharge', points: 500, status: 'unused' },
  });
  await prisma.activationCode.create({
    data: { code: TEST_CODES.used,     type: 'annual',   points: 0,   status: 'used', usedCount: 1 },
  });

  await prisma.$disconnect();
  console.log('✅ E2E test data ready\n');
}
