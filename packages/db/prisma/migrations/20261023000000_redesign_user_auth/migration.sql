-- Thiết kế lại User / phiên đăng nhập / phân quyền (giai đoạn 1).
-- Viết tay thay cho SQL Prisma sinh ra để GIỮ dữ liệu tài khoản hiện có (mật khẩu, xác minh, quyền nhân viên).
-- Mọi phiên đăng nhập cũ bị xóa: người dùng phải đăng nhập lại.

-- ─── Enums ──────────────────────────────────────────────────────────────────────
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LOCKED', 'DELETED');
CREATE TYPE "Permission" AS ENUM ('MANAGE_ORDERS', 'UPDATE_TAILORING', 'MANAGE_INVENTORY', 'MANAGE_CONTENT', 'VIEW_REPORTS');
CREATE TYPE "SessionKind" AS ENUM ('STORE', 'ADMIN');
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');
CREATE TYPE "ApprovalAction" AS ENUM ('CANCEL_ORDER', 'REFUND', 'MANUAL_DISCOUNT', 'PRICE_OVERRIDE');

-- ─── User ───────────────────────────────────────────────────────────────────────
DROP INDEX "User_role_idx";
DROP INDEX "User_email_idx";
DROP INDEX "User_phone_idx";

ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";
ALTER TABLE "User" RENAME COLUMN "avatar" TO "avatarUrl";

ALTER TABLE "User"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "passwordChangedAt" TIMESTAMP(3),
  ADD COLUMN "birthDate" DATE,
  ADD COLUMN "genderNew" "Gender",
  ADD COLUMN "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[],
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "lockedReason" TEXT,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

UPDATE "User" SET
  "email" = lower(trim("email")),
  "emailVerifiedAt" = CASE WHEN "isEmailVerified" THEN "updatedAt" END,
  "phoneVerifiedAt" = CASE WHEN "isPhoneVerified" THEN "updatedAt" END,
  "birthDate" = "birth"::date,
  "genderNew" = CASE "gender" WHEN 0 THEN 'MALE'::"Gender" WHEN 1 THEN 'FEMALE'::"Gender" ELSE NULL END,
  "status" = CASE WHEN "isActive" THEN 'ACTIVE'::"UserStatus" ELSE 'LOCKED'::"UserStatus" END,
  "lockedAt" = CASE WHEN "isActive" THEN NULL ELSE "updatedAt" END;

-- Chuyển 5 cột boolean của StaffPermission thành mảng quyền trên User
UPDATE "User" u SET "permissions" = ARRAY_REMOVE(ARRAY[
    CASE WHEN sp."canManageOrders" THEN 'MANAGE_ORDERS'::"Permission" END,
    CASE WHEN sp."canUpdateTailoring" THEN 'UPDATE_TAILORING'::"Permission" END,
    CASE WHEN sp."canManageInventory" THEN 'MANAGE_INVENTORY'::"Permission" END,
    CASE WHEN sp."canManageContent" THEN 'MANAGE_CONTENT'::"Permission" END,
    CASE WHEN sp."canViewReports" THEN 'VIEW_REPORTS'::"Permission" END
  ], NULL)
FROM "StaffPermission" sp
WHERE sp."userId" = u."id" AND u."role" = 'STAFF';

ALTER TABLE "User"
  DROP COLUMN "isEmailVerified",
  DROP COLUMN "isPhoneVerified",
  DROP COLUMN "isActive",
  DROP COLUMN "birth",
  DROP COLUMN "gender";
ALTER TABLE "User" RENAME COLUMN "genderNew" TO "gender";

-- Email luôn chữ thường để so khớp bằng index unique (không cần ILIKE / lower())
ALTER TABLE "User" ADD CONSTRAINT "User_email_lowercase_check" CHECK ("email" = lower("email"));

CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- ─── Bảng bị bỏ ─────────────────────────────────────────────────────────────────
DROP TABLE "AuthToken";
DROP TABLE "StaffPermission";

-- ─── SocialAccount ──────────────────────────────────────────────────────────────
DROP INDEX "SocialAccount_userId_idx";
DROP INDEX "SocialAccount_provider_providerId_key";

ALTER TABLE "SocialAccount" RENAME COLUMN "providerId" TO "providerUserId";
ALTER TABLE "SocialAccount" ADD COLUMN "email" TEXT;
-- Liên kết của nhà cung cấp chưa hỗ trợ (nếu có) không chuyển được sang enum
DELETE FROM "SocialAccount" WHERE upper("provider") <> 'GOOGLE';
ALTER TABLE "SocialAccount" ALTER COLUMN "provider" TYPE "AuthProvider" USING upper("provider")::"AuthProvider";

CREATE UNIQUE INDEX "SocialAccount_provider_providerUserId_key" ON "SocialAccount"("provider", "providerUserId");
CREATE UNIQUE INDEX "SocialAccount_userId_provider_key" ON "SocialAccount"("userId", "provider");

-- ─── UserSession: xóa toàn bộ phiên cũ rồi đổi cấu trúc ─────────────────────────
DELETE FROM "UserSession";

DROP INDEX "UserSession_refreshToken_key";
DROP INDEX "UserSession_userId_idx";

ALTER TABLE "UserSession"
  DROP COLUMN "refreshToken",
  DROP COLUMN "isRevoked",
  DROP COLUMN "deviceInfo",
  ADD COLUMN "kind" "SessionKind" NOT NULL,
  ADD COLUMN "refreshTokenHash" VARCHAR(64),
  ADD COLUMN "rememberMe" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "revokedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "UserSession_refreshTokenHash_key" ON "UserSession"("refreshTokenHash");
CREATE INDEX "UserSession_userId_kind_idx" ON "UserSession"("userId", "kind");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- ─── ApprovalRequest ────────────────────────────────────────────────────────────
DROP INDEX "ApprovalRequest_status_idx";

DELETE FROM "ApprovalRequest" WHERE "actionType" NOT IN ('CANCEL_ORDER', 'REFUND', 'MANUAL_DISCOUNT', 'PRICE_OVERRIDE');
ALTER TABLE "ApprovalRequest" ALTER COLUMN "actionType" TYPE "ApprovalAction" USING "actionType"::"ApprovalAction";
ALTER TABLE "ApprovalRequest"
  ADD COLUMN "targetId" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);
UPDATE "ApprovalRequest" SET
  "targetId" = "payload"->>'orderId',
  "reviewedAt" = CASE WHEN "status" <> 'PENDING' THEN "updatedAt" END;

CREATE INDEX "ApprovalRequest_status_createdAt_idx" ON "ApprovalRequest"("status", "createdAt");
CREATE INDEX "ApprovalRequest_reviewedById_idx" ON "ApprovalRequest"("reviewedById");

-- ─── AuditLog ───────────────────────────────────────────────────────────────────
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
