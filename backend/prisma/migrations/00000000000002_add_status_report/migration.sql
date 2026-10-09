-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('ARRIVED', 'DELAYED', 'CROWDED', 'ON_TIME', 'NOT_COMING');

-- CreateTable
CREATE TABLE "status_reports" (
    "id" SERIAL NOT NULL,
    "routeId" INTEGER NOT NULL,
    "stopId" INTEGER NOT NULL,
    "userId" INTEGER,
    "status" "ReportStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "status_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "status_reports_routeId_createdAt_idx" ON "status_reports"("routeId", "createdAt");

ALTER TABLE "status_reports" ADD CONSTRAINT "status_reports_routeId_fkey"
    FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "status_reports" ADD CONSTRAINT "status_reports_stopId_fkey"
    FOREIGN KEY ("stopId") REFERENCES "stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "status_reports" ADD CONSTRAINT "status_reports_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
