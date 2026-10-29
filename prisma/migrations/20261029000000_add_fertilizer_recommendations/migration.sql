-- CreateTable
CREATE TABLE "FertilizerRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "recommended" TEXT NOT NULL,
    "top3" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "crop" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FertilizerRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FertilizerRecommendation_userId_createdAt_idx" ON "FertilizerRecommendation"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "FertilizerRecommendation" ADD CONSTRAINT "FertilizerRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

