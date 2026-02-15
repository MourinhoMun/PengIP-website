-- AlterTable
ALTER TABLE "Tool" ADD COLUMN "downloadUrl" TEXT;

-- CreateTable
CREATE TABLE "ActivationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'tool_activation',
    "points" INTEGER NOT NULL DEFAULT 0,
    "toolId" TEXT,
    "userId" TEXT,
    "deviceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unused',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    CONSTRAINT "ActivationCode_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "deviceId" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "points" INTEGER NOT NULL DEFAULT 100,
    "role" TEXT NOT NULL DEFAULT 'user',
    "inviteCode" TEXT NOT NULL,
    "invitedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "createdAt", "email", "id", "inviteCode", "invitedBy", "name", "password", "phone", "points", "role", "updatedAt") SELECT "avatar", "createdAt", "email", "id", "inviteCode", "invitedBy", "name", "password", "phone", "points", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_deviceId_key" ON "User"("deviceId");
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_phone_idx" ON "User"("phone");
CREATE INDEX "User_inviteCode_idx" ON "User"("inviteCode");
CREATE INDEX "User_deviceId_idx" ON "User"("deviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ActivationCode_code_key" ON "ActivationCode"("code");

-- CreateIndex
CREATE INDEX "ActivationCode_code_idx" ON "ActivationCode"("code");

-- CreateIndex
CREATE INDEX "ActivationCode_toolId_idx" ON "ActivationCode"("toolId");

-- CreateIndex
CREATE INDEX "ActivationCode_userId_idx" ON "ActivationCode"("userId");

-- CreateIndex
CREATE INDEX "ActivationCode_status_idx" ON "ActivationCode"("status");
