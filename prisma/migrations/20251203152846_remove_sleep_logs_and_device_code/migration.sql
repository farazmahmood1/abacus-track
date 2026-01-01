/*
  Warnings:

  - You are about to drop the column `totalSleepTime` on the `Timesheet` table. All the data in the column will be lost.
  - You are about to drop the `SleepLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `deviceCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."SleepLog" DROP CONSTRAINT "SleepLog_timerSessionId_fkey";

-- AlterTable
ALTER TABLE "Timesheet" DROP COLUMN "totalSleepTime";

-- DropTable
DROP TABLE "public"."SleepLog";

-- DropTable
DROP TABLE "public"."deviceCode";
