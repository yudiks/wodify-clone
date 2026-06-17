-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Submission_shareToken_key" ON "Submission"("shareToken");
