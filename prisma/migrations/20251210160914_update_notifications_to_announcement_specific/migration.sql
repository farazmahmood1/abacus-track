/*
  Warnings:

  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."notifications" DROP CONSTRAINT "notifications_recipientId_fkey";

-- DropTable
DROP TABLE "public"."notifications";

-- CreateTable
CREATE TABLE "announcement_notifications" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcement_notifications_employeeId_idx" ON "announcement_notifications"("employeeId");

-- CreateIndex
CREATE INDEX "announcement_notifications_announcementId_idx" ON "announcement_notifications"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_notifications_announcementId_employeeId_key" ON "announcement_notifications"("announcementId", "employeeId");

-- AddForeignKey
ALTER TABLE "announcement_notifications" ADD CONSTRAINT "announcement_notifications_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_notifications" ADD CONSTRAINT "announcement_notifications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
