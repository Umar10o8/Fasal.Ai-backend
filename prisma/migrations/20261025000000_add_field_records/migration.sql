CREATE TABLE "FieldRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "areaUnit" TEXT NOT NULL DEFAULT 'acre',
    "location" TEXT,
    "season" TEXT,
    "plantingDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FieldRecord_userId_createdAt_idx" ON "FieldRecord"("userId", "createdAt");

ALTER TABLE "FieldRecord"
ADD CONSTRAINT "FieldRecord_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
