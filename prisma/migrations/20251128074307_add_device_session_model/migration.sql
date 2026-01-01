-- CreateTable
CREATE TABLE "device_session" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT,
    "ipAddress" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT now() + interval '365 days',

    CONSTRAINT "device_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_session_deviceId_key" ON "device_session"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "device_session_deviceToken_key" ON "device_session"("deviceToken");

-- CreateIndex
CREATE INDEX "device_session_deviceToken_idx" ON "device_session"("deviceToken");

-- CreateIndex
CREATE INDEX "device_session_userId_idx" ON "device_session"("userId");

-- AddForeignKey
ALTER TABLE "device_session" ADD CONSTRAINT "device_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
