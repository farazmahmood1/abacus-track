/*
  Warnings:

  - A unique constraint covering the columns `[uniqueId]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "uniqueId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_uniqueId_key" ON "user"("uniqueId");
