-- AlterTable
ALTER TABLE "TimerSession" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Timesheet" ADD COLUMN     "projectId" TEXT;

-- CreateIndex
CREATE INDEX "TimerSession_projectId_idx" ON "TimerSession"("projectId");

-- CreateIndex
CREATE INDEX "Timesheet_projectId_idx" ON "Timesheet"("projectId");

-- AddForeignKey
ALTER TABLE "TimerSession" ADD CONSTRAINT "TimerSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
