/*
  Warnings:

  - You are about to drop the column `Salary` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "Salary",
ADD COLUMN     "salary" INTEGER;
