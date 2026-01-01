/*
  Warnings:

  - You are about to drop the column `category` on the `important_links` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `important_links` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "important_links" DROP COLUMN "category",
DROP COLUMN "icon";
