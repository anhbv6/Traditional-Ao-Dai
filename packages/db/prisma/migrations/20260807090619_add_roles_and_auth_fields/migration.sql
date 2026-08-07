/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
