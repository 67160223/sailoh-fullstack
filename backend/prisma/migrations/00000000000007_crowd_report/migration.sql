-- CreateEnum
CREATE TYPE "CrowdLevel" AS ENUM ('EMPTY', 'MODERATE', 'FULL');

-- CreateTable
CREATE TABLE "crowd_reports" (
    "id" SERIAL NOT NULL,
    "routeId" INTEGER NOT NULL,
    "userId" INTEGER,
    "level" "CrowdLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crowd_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "crowd_reports_routeId_createdAt_idx" ON "crowd_reports"("routeId", "createdAt");

ALTER TABLE "crowd_reports" ADD CONSTRAINT "crowd_reports_routeId_fkey"
    FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crowd_reports" ADD CONSTRAINT "crowd_reports_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
