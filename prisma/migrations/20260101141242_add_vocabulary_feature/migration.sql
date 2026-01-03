-- CreateTable
CREATE TABLE "vocabulary_words" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT,
    "language" TEXT NOT NULL,
    "context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'learning',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "learnedAt" TIMESTAMP(3),

    CONSTRAINT "vocabulary_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocabulary_words_userId_status_idx" ON "vocabulary_words"("userId", "status");

-- CreateIndex
CREATE INDEX "vocabulary_words_userId_language_idx" ON "vocabulary_words"("userId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_words_userId_word_language_key" ON "vocabulary_words"("userId", "word", "language");

-- AddForeignKey
ALTER TABLE "vocabulary_words" ADD CONSTRAINT "vocabulary_words_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
