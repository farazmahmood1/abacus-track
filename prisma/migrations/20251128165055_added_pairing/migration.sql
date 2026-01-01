-- AlterTable
ALTER TABLE "device_session" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '365 days';

-- CreateTable
CREATE TABLE "pairing_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pairing_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pairing_code_code_key" ON "pairing_code"("code");

-- CreateIndex
CREATE INDEX "pairing_code_code_idx" ON "pairing_code"("code");

-- CreateIndex
CREATE INDEX "pairing_code_userId_idx" ON "pairing_code"("userId");

-- AddForeignKey
ALTER TABLE "pairing_code" ADD CONSTRAINT "pairing_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
