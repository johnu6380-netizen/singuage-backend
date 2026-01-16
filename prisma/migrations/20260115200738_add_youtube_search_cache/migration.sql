-- CreateTable
CREATE TABLE "YoutubeSearchCache" (
    "id" SERIAL NOT NULL,
    "queryHash" TEXT NOT NULL,
    "canonicalQuery" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "YoutubeSearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeSearchCache_queryHash_key" ON "YoutubeSearchCache"("queryHash");

-- CreateIndex
CREATE INDEX "YoutubeSearchCache_expiresAt_idx" ON "YoutubeSearchCache"("expiresAt");
