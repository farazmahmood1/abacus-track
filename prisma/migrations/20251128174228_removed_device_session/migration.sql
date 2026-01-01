/*
  Warnings:

  - You are about to drop the `device_session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."device_session" DROP CONSTRAINT "device_session_userId_fkey";

-- DropTable
DROP TABLE "public"."device_session";
