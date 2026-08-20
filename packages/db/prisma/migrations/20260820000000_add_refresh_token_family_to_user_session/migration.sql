-- Add family-level session revocation fields and enforce unique refresh token hashes.
ALTER TABLE "UserSession" ADD COLUMN "familyId" TEXT;
ALTER TABLE "UserSession" ADD COLUMN "isRevoked" BOOLEAN NOT NULL DEFAULT false;

UPDATE "UserSession"
SET "familyId" = "id"
WHERE "familyId" IS NULL;

ALTER TABLE "UserSession" ALTER COLUMN "familyId" SET NOT NULL;

CREATE UNIQUE INDEX "UserSession_refreshToken_key" ON "UserSession"("refreshToken");
CREATE INDEX "UserSession_familyId_idx" ON "UserSession"("familyId");
