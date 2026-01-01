-- CreateEnum
CREATE TYPE "LeaveNotificationType" AS ENUM ('LEAVE_APPLIED', 'LEAVE_APPROVED', 'LEAVE_REJECTED');

-- CreateTable
CREATE TABLE "leave_notifications" (
    "id" TEXT NOT NULL,
    "leaveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LeaveNotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_notifications_userId_idx" ON "leave_notifications"("userId");

-- CreateIndex
CREATE INDEX "leave_notifications_leaveId_idx" ON "leave_notifications"("leaveId");

-- AddForeignKey
ALTER TABLE "leave_notifications" ADD CONSTRAINT "leave_notifications_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "leaves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_notifications" ADD CONSTRAINT "leave_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
