-- CreateTable
CREATE TABLE "check_in_out_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "check_in_out_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "check_in_out_notifications_userId_idx" ON "check_in_out_notifications"("userId");

-- CreateIndex
CREATE INDEX "check_in_out_notifications_type_idx" ON "check_in_out_notifications"("type");

-- CreateIndex
CREATE INDEX "check_in_out_notifications_isRead_idx" ON "check_in_out_notifications"("isRead");

-- AddForeignKey
ALTER TABLE "check_in_out_notifications" ADD CONSTRAINT "check_in_out_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
